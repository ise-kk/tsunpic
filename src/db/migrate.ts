/**
 * v0.2 までのデータ(元の写真を保存していた)を、軽い画像だけの形に変換する。
 * 起動時に1回だけ動き、終わった写真から元の写真を消す。
 */
import { processPhoto } from '../lib/image'
import { profileFor } from '../lib/sizes'
import { db } from './db'

export async function migrateLegacyPhotos(onProgress?: (done: number, total: number) => void): Promise<number> {
  const legacy = await db.photos.filter((p) => !!p.original).toArray()
  if (legacy.length === 0) return 0
  const sizes = new Map((await db.works.toArray()).map((w) => [w.id, w.size]))
  let done = 0
  for (const p of legacy) {
    const size = sizes.get(p.workId)
    try {
      if (size !== undefined && p.original) {
        const out = await processPhoto(p.original, '写真', size)
        await db.photos.update(p.id, { thumb: out.thumb, image: out.image, original: undefined })
      } else {
        // 作品が無い写真は不要なので消す
        await db.photos.delete(p.id)
      }
    } catch {
      // 変換できなかった写真も、元の写真だけは消して軽くする(縮小版は残っている)
      await db.photos.update(p.id, { original: undefined })
    }
    done++
    onProgress?.(done, legacy.length)
  }
  return done
}

/**
 * 「遠くから見て楽しむ」サイズ(64枚以上)の作品から、1枚ずつ見るための画像を消して軽くする。
 * マス目用の画像は、消す前の画像から小さな正方形に作り直す(代表色はそのまま)。
 * 起動時に動き、終わった写真には鑑賞用の画像が残らないので、2回目以降は何もしない。
 */
export async function slimFarPhotos(onProgress?: (done: number, total: number) => void): Promise<number> {
  const farWorks = new Map(
    (await db.works.toArray()).filter((w) => isFar(w.size)).map((w) => [w.id, w.size] as const),
  )
  if (farWorks.size === 0) return 0
  const targets = await db.photos.filter((p) => !!p.image && farWorks.has(p.workId)).toArray()
  let done = 0
  for (const p of targets) {
    const size = farWorks.get(p.workId)!
    try {
      const out = await processPhoto(p.image!, '写真', size)
      await db.photos.update(p.id, { thumb: out.thumb, image: undefined })
    } catch {
      // 作り直せなかったときも、鑑賞用の画像だけは消す(今の縮小版で並べられる)
      await db.photos.update(p.id, { image: undefined })
    }
    done++
    onProgress?.(done, targets.length)
  }
  return done
}

function isFar(size: number): boolean {
  try {
    return profileFor(size).group === 'far'
  } catch {
    return false
  }
}

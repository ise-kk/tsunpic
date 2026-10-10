/**
 * v0.2 までのデータ(元の写真を保存していた)を、軽い画像だけの形に変換する。
 * 起動時に1回だけ動き、終わった写真から元の写真を消す。
 */
import { processPhoto } from '../lib/image'
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

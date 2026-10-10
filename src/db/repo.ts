/**
 * 作品と写真の読み書き。画面からはここを通して保存する。
 */
import { maxPhotosFor, profileFor, SIZE_OPTIONS } from '../lib/sizes'
import { db, newId, requestPersistentStorage, type Photo, type Work } from './db'

export { SIZE_OPTIONS }

export const CORRECTION_DEFAULT = 30
export const CORRECTION_MAX = 60

export async function createWork(size: number): Promise<Work> {
  profileFor(size) // 選べないサイズならエラー
  const now = Date.now()
  const d = new Date(now)
  const work: Work = {
    id: newId(),
    title: `${d.getMonth() + 1}月${d.getDate()}日の作品`,
    size,
    correction: 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.works.add(work)
  void requestPersistentStorage()
  return work
}

export async function renameWork(id: string, title: string): Promise<void> {
  const clean = title.trim().slice(0, 40)
  if (!clean) return
  await db.works.update(id, { title: clean, updatedAt: Date.now() })
}

/** 色の補正の強さを変える(0 で補正なし) */
export async function setCorrection(id: string, value: number): Promise<void> {
  const v = Math.max(0, Math.min(CORRECTION_MAX, Math.round(value)))
  await db.works.update(id, { correction: v, updatedAt: Date.now() })
}

export type NewPhoto = Pick<Photo, 'thumb' | 'image' | 'color' | 'captured'>

export async function addPhotos(workId: string, photos: NewPhoto[]): Promise<string[]> {
  const now = Date.now()
  const ids = photos.map(() => newId())
  await db.transaction('rw', db.works, db.photos, async () => {
    const work = await db.works.get(workId)
    if (!work) throw new Error('作品が見つかりません')
    const limit = maxPhotosFor(work.size)
    const current = await db.photos.where('workId').equals(workId).count()
    if (current + photos.length > limit) {
      throw new LimitError(`この作品に入れられる写真は ${limit} 枚までです`)
    }
    await db.photos.bulkAdd(photos.map((p, i) => ({ ...p, id: ids[i]!, workId, addedAt: now + i })))
    await db.works.update(workId, { updatedAt: now })
  })
  return ids
}

export async function removePhoto(photoId: string): Promise<void> {
  const photo = await db.photos.get(photoId)
  if (!photo) return
  await db.transaction('rw', db.works, db.photos, async () => {
    await db.photos.delete(photoId)
    await db.works.update(photo.workId, { updatedAt: Date.now() })
  })
}

export async function deleteWork(workId: string): Promise<void> {
  await db.transaction('rw', db.works, db.photos, async () => {
    await db.photos.where('workId').equals(workId).delete()
    await db.works.delete(workId)
  })
}

/** この端末に保存されたすべての作品と写真を削除する */
export async function deleteAllData(): Promise<void> {
  await db.transaction('rw', db.works, db.photos, async () => {
    await db.photos.clear()
    await db.works.clear()
  })
}

export class LimitError extends Error {}

/**
 * 作品と写真の読み書き。画面からはここを通して保存する。
 */
import { db, newId, requestPersistentStorage, type Photo, type Work } from './db'

export const SIZE_OPTIONS = [3, 4, 5, 6, 8, 10] as const
/** 1作品に入れられる写真の上限(控えを含む) */
export const MAX_PHOTOS_PER_WORK = 200

export async function createWork(size: number): Promise<Work> {
  if (!SIZE_OPTIONS.includes(size as (typeof SIZE_OPTIONS)[number])) throw new Error('選べないサイズです')
  const now = Date.now()
  const d = new Date(now)
  const work: Work = {
    id: newId(),
    title: `${d.getMonth() + 1}月${d.getDate()}日の作品`,
    size,
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

export async function addPhotos(workId: string, photos: Omit<Photo, 'id' | 'workId' | 'addedAt'>[]): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.works, db.photos, async () => {
    const current = await db.photos.where('workId').equals(workId).count()
    if (current + photos.length > MAX_PHOTOS_PER_WORK) {
      throw new LimitError(`1つの作品に入れられる写真は ${MAX_PHOTOS_PER_WORK} 枚までです`)
    }
    await db.photos.bulkAdd(photos.map((p, i) => ({ ...p, id: newId(), workId, addedAt: now + i })))
    await db.works.update(workId, { updatedAt: now })
  })
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

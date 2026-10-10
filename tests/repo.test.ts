import 'fake-indexeddb/auto'
import { db } from '../src/db/db'
import { addPhotos, createWork, deleteAllData, deleteWork, MAX_PHOTOS_PER_WORK, removePhoto, renameWork } from '../src/db/repo'

const photo = () => ({
  original: new Blob(['o'], { type: 'image/jpeg' }),
  thumb: new Blob(['t'], { type: 'image/jpeg' }),
  color: { L: 50, a: 10, b: 10 },
  captured: false,
})

beforeEach(async () => {
  await deleteAllData()
})

describe('作品の保存', () => {
  it('作って、写真を入れて、外して、削除できる', async () => {
    const w = await createWork(4)
    await addPhotos(w.id, [photo(), photo(), photo()])
    expect(await db.photos.where('workId').equals(w.id).count()).toBe(3)

    const first = await db.photos.where('workId').equals(w.id).first()
    await removePhoto(first!.id)
    expect(await db.photos.where('workId').equals(w.id).count()).toBe(2)

    await deleteWork(w.id)
    expect(await db.works.get(w.id)).toBeUndefined()
    expect(await db.photos.where('workId').equals(w.id).count()).toBe(0)
  })

  it('選べないサイズは作れない', async () => {
    await expect(createWork(7)).rejects.toThrow()
  })

  it('名前は前後の空白を除き、40文字までにする', async () => {
    const w = await createWork(3)
    await renameWork(w.id, '  ' + 'あ'.repeat(50) + '  ')
    expect((await db.works.get(w.id))!.title).toBe('あ'.repeat(40))
    await renameWork(w.id, '   ')
    expect((await db.works.get(w.id))!.title).toBe('あ'.repeat(40))
  })

  it('上限を超える写真は入れられない', async () => {
    const w = await createWork(10)
    await addPhotos(w.id, Array.from({ length: MAX_PHOTOS_PER_WORK }, photo))
    await expect(addPhotos(w.id, [photo()])).rejects.toThrow(/まで/)
  })

  it('すべてのデータを削除すると何も残らない', async () => {
    const w = await createWork(3)
    await addPhotos(w.id, [photo()])
    await deleteAllData()
    expect(await db.works.count()).toBe(0)
    expect(await db.photos.count()).toBe(0)
  })
})

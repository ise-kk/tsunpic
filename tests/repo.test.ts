import 'fake-indexeddb/auto'
import { db } from '../src/db/db'
import { addPhotos, createWork, deleteAllData, deleteWork, removePhoto, renameWork, setCorrection } from '../src/db/repo'
import { maxPhotosFor } from '../src/lib/sizes'

const photo = () => ({
  thumb: new Blob(['t'], { type: 'image/jpeg' }),
  image: new Blob(['i'], { type: 'image/jpeg' }),
  color: { L: 50, a: 10, b: 10 },
  captured: false,
})

beforeEach(async () => {
  await deleteAllData()
})

describe('作品の保存', () => {
  it('作って、写真を入れて、外して、削除できる', async () => {
    const w = await createWork(4)
    const ids = await addPhotos(w.id, [photo(), photo(), photo()])
    expect(ids).toHaveLength(3)
    expect(await db.photos.where('workId').equals(w.id).count()).toBe(3)

    await removePhoto(ids[0]!)
    expect(await db.photos.where('workId').equals(w.id).count()).toBe(2)

    await deleteWork(w.id)
    expect(await db.works.get(w.id)).toBeUndefined()
    expect(await db.photos.where('workId').equals(w.id).count()).toBe(0)
  })

  it('元の写真は保存しない', async () => {
    const w = await createWork(4)
    const [id] = await addPhotos(w.id, [photo()])
    const saved = await db.photos.get(id!)
    expect(saved?.original).toBeUndefined()
  })

  it('選べないサイズは作れない', async () => {
    await expect(createWork(7)).rejects.toThrow()
  })

  it('大作サイズ(400枚・900枚)を作れる', async () => {
    expect((await createWork(20)).size).toBe(20)
    expect((await createWork(30)).size).toBe(30)
  })

  it('補正は最初 0 で、0〜60 の範囲に収める', async () => {
    const w = await createWork(6)
    expect(w.correction).toBe(0)
    await setCorrection(w.id, 30)
    expect((await db.works.get(w.id))!.correction).toBe(30)
    await setCorrection(w.id, 200)
    expect((await db.works.get(w.id))!.correction).toBe(60)
    await setCorrection(w.id, -5)
    expect((await db.works.get(w.id))!.correction).toBe(0)
  })

  it('名前は前後の空白を除き、40文字までにする', async () => {
    const w = await createWork(3)
    await renameWork(w.id, '  ' + 'あ'.repeat(50) + '  ')
    expect((await db.works.get(w.id))!.title).toBe('あ'.repeat(40))
    await renameWork(w.id, '   ')
    expect((await db.works.get(w.id))!.title).toBe('あ'.repeat(40))
  })

  it('上限(マスの数 + 控え100枚)を超える写真は入れられない', async () => {
    const w = await createWork(3)
    await addPhotos(w.id, Array.from({ length: maxPhotosFor(3) }, photo))
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

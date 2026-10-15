import 'fake-indexeddb/auto'
import { db } from '../src/db/db'
import { slimFarPhotos } from '../src/db/migrate'
import { addPhotos, createWork, deleteAllData } from '../src/db/repo'

const photo = () => ({
  thumb: new Blob(['t'], { type: 'image/jpeg' }),
  image: new Blob(['i'], { type: 'image/jpeg' }),
  color: { L: 50, a: 10, b: 10 },
  captured: false,
})

beforeEach(async () => {
  await deleteAllData()
})

describe('遠くから見るサイズの作品を軽くする', () => {
  it('遠くから見るサイズの写真からは鑑賞用の画像を消し、代表色は残す', async () => {
    const far = await createWork(20)
    const view = await createWork(4)
    const [farId] = await addPhotos(far.id, [photo()])
    const [viewId] = await addPhotos(view.id, [photo()])

    expect(await slimFarPhotos()).toBe(1)

    const slim = await db.photos.get(farId!)
    expect(slim?.image).toBeUndefined()
    expect(slim?.thumb).toBeDefined()
    expect(slim?.color).toEqual({ L: 50, a: 10, b: 10 })
    // 1枚ずつ見るサイズの写真はそのまま
    expect((await db.photos.get(viewId!))?.image).toBeDefined()
  })

  it('2回目は何もしない', async () => {
    const far = await createWork(30)
    await addPhotos(far.id, [photo(), photo()])
    expect(await slimFarPhotos()).toBe(2)
    expect(await slimFarPhotos()).toBe(0)
  })
})

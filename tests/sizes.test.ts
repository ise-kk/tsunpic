import { approxMb, maxPhotosFor, profileFor, SIZE_OPTIONS } from '../src/lib/sizes'

describe('サイズごとの保存の大きさ', () => {
  it('9枚〜900枚まで選べる', () => {
    expect(SIZE_OPTIONS).toEqual([3, 4, 5, 6, 8, 10, 20, 30])
  })
  it('大きな作品ほど1枚を軽くする', () => {
    const sizes = SIZE_OPTIONS.map(profileFor)
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]!.viewPx).toBeLessThanOrEqual(sizes[i - 1]!.viewPx)
      expect(sizes[i]!.thumbPx).toBeLessThanOrEqual(sizes[i - 1]!.thumbPx)
    }
  })
  it('900枚の作品でも保存の目安は 30MB 以下', () => {
    expect(approxMb(30)).toBeLessThan(30)
  })
  it('上限はマスの数 + 100枚', () => {
    expect(maxPhotosFor(30)).toBe(1000)
  })
  it('選べないサイズはエラー', () => {
    expect(() => profileFor(7)).toThrow()
  })
})

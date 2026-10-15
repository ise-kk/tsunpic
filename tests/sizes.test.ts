import { approxMb, exportTilePx, maxPhotosFor, profileFor, SIZE_OPTIONS, SIZE_PROFILES } from '../src/lib/sizes'

describe('サイズごとの保存の大きさ', () => {
  it('9枚〜900枚まで選べる', () => {
    expect(SIZE_OPTIONS).toEqual([3, 4, 5, 6, 8, 10, 20, 30])
  })
  it('大きな作品ほど1枚を軽くする', () => {
    const sizes = SIZE_OPTIONS.map(profileFor)
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]!.thumbPx).toBeLessThanOrEqual(sizes[i - 1]!.thumbPx)
      expect(sizes[i]!.approxKb).toBeLessThanOrEqual(sizes[i - 1]!.approxKb)
    }
  })
  it('1枚ずつ見るサイズは鑑賞用の画像を作り、遠くから見るサイズは作らない', () => {
    for (const p of SIZE_PROFILES) {
      if (p.group === 'view') expect(p.viewPx).toBeGreaterThan(p.thumbPx)
      else {
        expect(p.viewPx).toBeNull()
        expect(p.squareThumb).toBe(true)
      }
    }
  })
  it('900枚の作品でも保存の目安は 5MB 以下', () => {
    expect(approxMb(30)).toBeLessThan(5)
    expect(approxMb(20)).toBeLessThan(5)
  })
  it('書き出し画像は軽くしても 1辺 1500px 以上を保つ', () => {
    for (const p of SIZE_PROFILES.filter((x) => x.group === 'far')) {
      expect(p.size * exportTilePx(p)).toBeGreaterThanOrEqual(1500)
    }
  })
  it('上限はマスの数 + 100枚', () => {
    expect(maxPhotosFor(30)).toBe(1000)
  })
  it('選べないサイズはエラー', () => {
    expect(() => profileFor(7)).toThrow()
  })
})

import { formatEta } from '../src/components/ProgressOverlay'

describe('残り時間の表示', () => {
  it('短いときは「少し」、1分未満は10秒単位、それ以上は分単位', () => {
    expect(formatEta(5)).toBe('少し')
    expect(formatEta(42)).toBe('約50秒')
    expect(formatEta(61)).toBe('約2分')
  })
})

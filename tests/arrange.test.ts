import {
  arrange,
  chooseForGradient,
  diagonalPath,
  roughness,
  sortByGradient,
  spreadSlots,
  type Colored,
} from '../src/lib/arrange'
import { rgbToLab } from '../src/lib/color'

const item = (id: string, r: number, g: number, b: number): Colored => ({ id, color: rgbToLab({ r, g, b }) })

describe('sortByGradient', () => {
  it('色相の輪に沿って並び、写真のない色のところから始まる。無彩色は最後に明るい順', () => {
    const items = [
      item('blue', 30, 60, 230),
      item('gray', 128, 128, 128),
      item('yellow', 240, 220, 40),
      item('white', 250, 250, 250),
      item('red', 230, 30, 30),
      item('purple', 150, 50, 200),
      item('green', 40, 180, 60),
    ]
    // 緑と青の間がいちばん離れているので、青から始まって一周する
    expect(sortByGradient(items).map((x) => x.id)).toEqual(['blue', 'purple', 'red', 'yellow', 'green', 'white', 'gray'])
  })

  it('赤〜黄だけなら赤から黄へ(途中で切れない)', () => {
    const items = [item('y', 240, 230, 40), item('r', 230, 30, 30), item('o', 240, 140, 30)]
    expect(sortByGradient(items).map((x) => x.id)).toEqual(['r', 'o', 'y'])
  })

  it('元の配列は変えない', () => {
    const items = [item('b', 0, 0, 255), item('a', 255, 0, 0)]
    sortByGradient(items)
    expect(items.map((x) => x.id)).toEqual(['b', 'a'])
  })
})

describe('diagonalPath', () => {
  it('すべてのマスを1回ずつ通る', () => {
    for (const n of [1, 3, 4, 6, 10]) {
      const path = diagonalPath(n)
      expect(path).toHaveLength(n * n)
      expect(new Set(path).size).toBe(n * n)
    }
  })
  it('左上から始まり右下で終わる', () => {
    const path = diagonalPath(4)
    expect(path[0]).toBe(0)
    expect(path[path.length - 1]).toBe(15)
  })
  it('斜めの帯の順に進む(左上からの距離が減らない)', () => {
    const n = 6
    const path = diagonalPath(n)
    const band = (k: number) => Math.floor(k / n) + (k % n)
    for (let i = 1; i < path.length; i++) expect(band(path[i]!)).toBeGreaterThanOrEqual(band(path[i - 1]!))
  })
})

describe('spreadSlots', () => {
  it('空きを全体に散らす(最初と最後は必ず埋まる)', () => {
    expect(spreadSlots(3, 9)).toEqual([0, 4, 8])
    expect(spreadSlots(9, 9)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })
  it('重ならず、増え続ける', () => {
    for (let total = 1; total <= 100; total++) {
      for (let count = 1; count <= total; count++) {
        const s = spreadSlots(count, total)
        expect(s).toHaveLength(count)
        for (let i = 1; i < s.length; i++) expect(s[i]!).toBeGreaterThan(s[i - 1]!)
        expect(s[s.length - 1]!).toBeLessThan(total)
      }
    }
  })
  it('1枚だけなら真ん中', () => {
    expect(spreadSlots(1, 9)).toEqual([4])
  })
  it('0枚なら空', () => {
    expect(spreadSlots(0, 9)).toEqual([])
  })
  it('マスより多いとエラー', () => {
    expect(() => spreadSlots(10, 9)).toThrow()
  })
})

describe('chooseForGradient', () => {
  it('流れから外れる色を控えに回す', () => {
    // 赤→黄の流れの中に、ひとつだけ青が混ざっている
    const items = [
      item('r', 230, 30, 30),
      item('ro', 235, 80, 30),
      item('o', 240, 140, 30),
      item('oy', 240, 190, 30),
      item('y', 240, 230, 40),
      item('blue', 30, 60, 230),
    ]
    const { used, bench } = chooseForGradient(items, 5)
    expect(bench.map((x) => x.id)).toEqual(['blue'])
    expect(used.map((x) => x.id)).toEqual(['r', 'ro', 'o', 'oy', 'y'])
  })
  it('端にあるだけの写真は控えにしない(色の輪がそろっているときは灰色を控えにする)', () => {
    const ring = Array.from({ length: 12 }, (_, i) => {
      const h = (i / 12) * 2 * Math.PI
      return { id: `h${i}`, color: { L: 60, a: 45 * Math.cos(h), b: 45 * Math.sin(h) } }
    })
    const { bench } = chooseForGradient([...ring, item('gray', 120, 120, 120)], 12)
    expect(bench.map((x) => x.id)).toEqual(['gray'])
  })

  it('選んだ結果は元の並びよりなめらか', () => {
    const items = Array.from({ length: 30 }, (_, i) => item(`p${i}`, (i * 97) % 256, (i * 53) % 256, (i * 31) % 256))
    const { used, bench } = chooseForGradient(items, 20)
    expect(used).toHaveLength(20)
    expect(bench).toHaveLength(10)
    expect(roughness(used)).toBeLessThan(roughness(sortByGradient(items)))
  })
})

describe('arrange', () => {
  it('足りないときは空きが残り、写真はすべて入る', () => {
    const items = [item('a', 230, 30, 30), item('b', 40, 180, 60), item('c', 30, 60, 230)]
    const { grid, bench } = arrange(items, 3)
    expect(grid.filter(Boolean)).toHaveLength(3)
    expect(bench).toHaveLength(0)
    // 左上と右下は必ず埋まり、並びはグラデーションの順
    const expected = sortByGradient(items).map((x) => x.id)
    expect(grid[0]?.id).toBe(expected[0])
    expect(grid[8]?.id).toBe(expected[2])
  })
  it('多すぎるときはマスの数だけ入り、残りは控え', () => {
    const items = Array.from({ length: 12 }, (_, i) => item(`p${i}`, (i * 40) % 256, 120, 200 - i * 10))
    const { grid, bench } = arrange(items, 3)
    expect(grid.filter(Boolean)).toHaveLength(9)
    expect(bench).toHaveLength(3)
  })
  it('あとから1枚足しても、グラデーションの順番は保たれる', () => {
    const base = [item('r', 230, 30, 30), item('o', 240, 140, 30), item('g', 40, 180, 60)]
    const after = arrange([...base, item('y', 240, 230, 40)], 4)
    const path = diagonalPath(4)
    const order = path.map((k) => after.grid[k]).filter(Boolean).map((x) => x!.id)
    expect(order).toEqual(['r', 'o', 'y', 'g'])
  })
})

import { deltaE2000, dominantColor, labToRgb, rgbToLab } from '../src/lib/color'

describe('rgbToLab / labToRgb', () => {
  it('白・黒・赤の Lab が正しい', () => {
    const white = rgbToLab({ r: 255, g: 255, b: 255 })
    expect(white.L).toBeCloseTo(100, 1)
    expect(Math.abs(white.a)).toBeLessThan(0.1)
    const black = rgbToLab({ r: 0, g: 0, b: 0 })
    expect(black.L).toBeCloseTo(0, 1)
    const red = rgbToLab({ r: 255, g: 0, b: 0 })
    expect(red.L).toBeCloseTo(53.24, 1)
    expect(red.a).toBeCloseTo(80.09, 0)
    expect(red.b).toBeCloseTo(67.2, 0)
  })

  it('行って戻すと元の色になる', () => {
    for (const c of [
      { r: 12, g: 200, b: 99 },
      { r: 250, g: 128, b: 3 },
      { r: 77, g: 77, b: 200 },
    ]) {
      expect(labToRgb(rgbToLab(c))).toEqual(c)
    }
  })
})

describe('deltaE2000', () => {
  // Sharma ほか(2005)の検証用データから抜粋
  const cases: [number, number, number, number, number, number, number][] = [
    [50, 2.6772, -79.7751, 50, 0, -82.7485, 2.0425],
    [50, 3.1571, -77.2803, 50, 0, -82.7485, 2.8615],
    [50, 2.5, 0, 50, 0, -2.5, 4.3065],
    [50, 2.5, 0, 73, 25, -18, 27.1492],
    [60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644],
    [22.7233, 20.0904, -46.694, 23.0331, 14.973, -42.5619, 2.0373],
  ]
  it.each(cases)('検証データと一致する %#', (L1, a1, b1, L2, a2, b2, expected) => {
    expect(deltaE2000({ L: L1, a: a1, b: b1 }, { L: L2, a: a2, b: b2 })).toBeCloseTo(expected, 3)
  })
  it('同じ色の差は 0', () => {
    expect(deltaE2000({ L: 40, a: 10, b: -5 }, { L: 40, a: 10, b: -5 })).toBe(0)
  })
})

describe('dominantColor', () => {
  function image(w: number, h: number, fill: (x: number, y: number) => [number, number, number]) {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const [r, g, b] = fill(x, y)
        const i = (y * w + x) * 4
        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
        data[i + 3] = 255
      }
    return data
  }

  it('一色の画像はその色になる', () => {
    const lab = dominantColor(image(16, 16, () => [30, 120, 220]), 16, 16)
    const expected = rgbToLab({ r: 30, g: 120, b: 220 })
    expect(deltaE2000(lab, expected)).toBeLessThan(1)
  })

  it('同じ面積なら中心にある色を選ぶ', () => {
    // 中央の縦帯がオレンジ、左右が灰色(面積はほぼ同じ)
    const lab = dominantColor(
      image(30, 30, (x) => (x >= 8 && x < 22 ? [240, 140, 40] : [128, 128, 128])),
      30,
      30,
    )
    expect(deltaE2000(lab, rgbToLab({ r: 240, g: 140, b: 40 }))).toBeLessThan(3)
  })

  it('透明な画像でも止まらない', () => {
    const data = new Uint8ClampedArray(4 * 4 * 4) // すべて透明
    expect(dominantColor(data, 4, 4).L).toBe(50)
  })
})

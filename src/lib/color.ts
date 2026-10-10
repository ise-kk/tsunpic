/**
 * 色の計算(画面に依存しない純粋関数)
 * - sRGB ⇔ CIE Lab(人の見え方に近い色空間)
 * - CIEDE2000(人の目に近い色の差)
 * - 写真の代表色(中心を重視した k-means)
 */

export type RGB = { r: number; g: number; b: number } // 0〜255
export type Lab = { L: number; a: number; b: number }
export type LCh = { L: number; C: number; h: number } // h: 0〜360

function srgbToLinear(v: number): number {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, c)) * 255)
}

// D65 白色点
const XN = 0.95047
const YN = 1.0
const ZN = 1.08883

function fLab(t: number): number {
  return t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116
}

function fLabInv(t: number): number {
  const t3 = t * t * t
  return t3 > 216 / 24389 ? t3 : (116 * t - 16) / (24389 / 27)
}

export function rgbToLab({ r, g, b }: RGB): Lab {
  const R = srgbToLinear(r)
  const G = srgbToLinear(g)
  const B = srgbToLinear(b)
  const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175
  const Z = R * 0.0193339 + G * 0.119192 + B * 0.9503041
  const fx = fLab(X / XN)
  const fy = fLab(Y / YN)
  const fz = fLab(Z / ZN)
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

export function labToRgb({ L, a, b }: Lab): RGB {
  const fy = (L + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200
  const X = fLabInv(fx) * XN
  const Y = fLabInv(fy) * YN
  const Z = fLabInv(fz) * ZN
  const R = X * 3.2404542 + Y * -1.5371385 + Z * -0.4985314
  const G = X * -0.969266 + Y * 1.8760108 + Z * 0.041556
  const B = X * 0.0556434 + Y * -0.2040259 + Z * 1.0572252
  return { r: linearToSrgb(R), g: linearToSrgb(G), b: linearToSrgb(B) }
}

export function labToLch({ L, a, b }: Lab): LCh {
  const C = Math.hypot(a, b)
  let h = (Math.atan2(b, a) * 180) / Math.PI
  if (h < 0) h += 360
  return { L, C, h }
}

export function labToCss(lab: Lab): string {
  const { r, g, b } = labToRgb(lab)
  return `rgb(${r} ${g} ${b})`
}

/** CIEDE2000 色差(Sharma ほか 2005 の実装式) */
export function deltaE2000(x: Lab, y: Lab): number {
  const rad = Math.PI / 180
  const C1 = Math.hypot(x.a, x.b)
  const C2 = Math.hypot(y.a, y.b)
  const Cbar = (C1 + C2) / 2
  const Cbar7 = Math.pow(Cbar, 7)
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))))
  const a1 = (1 + G) * x.a
  const a2 = (1 + G) * y.a
  const C1p = Math.hypot(a1, x.b)
  const C2p = Math.hypot(a2, y.b)
  const hp = (b: number, a: number) => {
    if (a === 0 && b === 0) return 0
    const h = Math.atan2(b, a) / rad
    return h < 0 ? h + 360 : h
  }
  const h1p = hp(x.b, a1)
  const h2p = hp(y.b, a2)
  const dLp = y.L - x.L
  const dCp = C2p - C1p
  let dhp = 0
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p
    if (dhp > 180) dhp -= 360
    else if (dhp < -180) dhp += 360
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad)
  const Lbarp = (x.L + y.L) / 2
  const Cbarp = (C1p + C2p) / 2
  let hbarp = h1p + h2p
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2
    else hbarp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2
  }
  const T =
    1 -
    0.17 * Math.cos((hbarp - 30) * rad) +
    0.24 * Math.cos(2 * hbarp * rad) +
    0.32 * Math.cos((3 * hbarp + 6) * rad) -
    0.2 * Math.cos((4 * hbarp - 63) * rad)
  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2))
  const Cbarp7 = Math.pow(Cbarp, 7)
  const Rc = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)))
  const Sl = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2))
  const Sc = 1 + 0.045 * Cbarp
  const Sh = 1 + 0.015 * Cbarp * T
  const Rt = -Math.sin(2 * dTheta * rad) * Rc
  return Math.sqrt(
    Math.pow(dLp / Sl, 2) + Math.pow(dCp / Sc, 2) + Math.pow(dHp / Sh, 2) + Rt * (dCp / Sc) * (dHp / Sh),
  )
}

/**
 * 写真の代表色を求める。
 * @param data RGBA の並び(canvas の getImageData().data)
 * @param width 画像の幅(中心からの距離で重みをつけるため)
 * @param height 画像の高さ
 * @param k まとめる色の数
 */
export function dominantColor(data: ArrayLike<number>, width: number, height: number, k = 4): Lab {
  const pixels: Lab[] = []
  const weights: number[] = []
  const cx = (width - 1) / 2
  const cy = (height - 1) / 2
  const maxD = Math.hypot(cx, cy) || 1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const alpha = data[i + 3] ?? 255
      if (alpha < 128) continue
      pixels.push(rgbToLab({ r: data[i] ?? 0, g: data[i + 1] ?? 0, b: data[i + 2] ?? 0 }))
      // 中心ほど重く(端は中心の半分の重み)
      weights.push(1 - 0.5 * (Math.hypot(x - cx, y - cy) / maxD))
    }
  }
  if (pixels.length === 0) return { L: 50, a: 0, b: 0 }

  const kk = Math.min(k, pixels.length)
  // 明るさの順に並べて等間隔に選ぶ(毎回同じ結果になる初期値)
  const byL = pixels.map((p, i) => ({ p, i })).sort((u, v) => u.p.L - v.p.L)
  let centers: Lab[] = []
  for (let j = 0; j < kk; j++) {
    const pick = byL[Math.floor(((j + 0.5) / kk) * byL.length)]
    if (pick) centers.push({ ...pick.p })
  }

  const assign = new Array<number>(pixels.length).fill(0)
  for (let iter = 0; iter < 12; iter++) {
    let moved = false
    for (let i = 0; i < pixels.length; i++) {
      const p = pixels[i]!
      let best = 0
      let bestD = Infinity
      for (let j = 0; j < centers.length; j++) {
        const c = centers[j]!
        const d = (p.L - c.L) ** 2 + (p.a - c.a) ** 2 + (p.b - c.b) ** 2
        if (d < bestD) {
          bestD = d
          best = j
        }
      }
      if (assign[i] !== best) {
        assign[i] = best
        moved = true
      }
    }
    const sums = centers.map(() => ({ L: 0, a: 0, b: 0, w: 0 }))
    for (let i = 0; i < pixels.length; i++) {
      const s = sums[assign[i]!]!
      const p = pixels[i]!
      const w = weights[i]!
      s.L += p.L * w
      s.a += p.a * w
      s.b += p.b * w
      s.w += w
    }
    centers = sums.map((s, j) => (s.w > 0 ? { L: s.L / s.w, a: s.a / s.w, b: s.b / s.w } : centers[j]!))
    if (!moved && iter > 0) break
  }

  // 重みの合計が大きい色を選ぶ。鮮やかな色を少しだけ優先する
  const score = centers.map(() => 0)
  for (let i = 0; i < pixels.length; i++) score[assign[i]!]! += weights[i]!
  let bestJ = 0
  let bestScore = -Infinity
  centers.forEach((c, j) => {
    const chroma = Math.hypot(c.a, c.b)
    const s = score[j]! * (1 + Math.min(chroma, 60) / 120)
    if (s > bestScore) {
      bestScore = s
      bestJ = j
    }
  })
  return centers[bestJ]!
}

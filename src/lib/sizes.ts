/**
 * 作品のサイズごとの保存の大きさ。
 * 元の写真は保存せず、サイズに合わせて軽くした画像だけを保存する。
 */
export type SizeProfile = {
  /** 1辺のマス数 */
  size: number
  /**
   * マス目・書き出しに使う縮小版の大きさ(px)。
   * 「1枚ずつ見る」サイズでは長辺、「遠くから見る」サイズでは正方形の1辺。
   */
  thumbPx: number
  /** 縮小版を正方形に切り抜いて保存するか(マス目と同じ形なので、むだがない) */
  squareThumb: boolean
  /** 1枚ずつ見るための画像の長辺(px)。遠くから見るサイズでは作らない(null) */
  viewPx: number | null
  /** 1枚ずつ見たときのきれいさ(画面に出す説明) */
  viewLabel: string
  /** 1枚あたりの保存容量の目安(KB) */
  approxKb: number
  group: 'view' | 'far'
}

/*
 * 「遠くから見て楽しむ」サイズは、1枚ずつ大きく見ることを前提にしない。
 * 鑑賞用の画像は作らず、マス目に必要なだけの小さな正方形だけを保存する。
 * 書き出し画像の大きさ(1辺 1500〜2000px くらい)は、これまでと変わらない。
 */
export const SIZE_PROFILES: readonly SizeProfile[] = [
  { size: 3, thumbPx: 384, squareThumb: false, viewPx: 1200, viewLabel: 'とてもきれい', approxKb: 330, group: 'view' },
  { size: 4, thumbPx: 384, squareThumb: false, viewPx: 1200, viewLabel: 'とてもきれい', approxKb: 330, group: 'view' },
  { size: 5, thumbPx: 384, squareThumb: false, viewPx: 1200, viewLabel: 'とてもきれい', approxKb: 330, group: 'view' },
  { size: 6, thumbPx: 384, squareThumb: false, viewPx: 1200, viewLabel: 'とてもきれい', approxKb: 330, group: 'view' },
  { size: 8, thumbPx: 192, squareThumb: true, viewPx: null, viewLabel: 'モザイク用の小さな画像だけ', approxKb: 16, group: 'far' },
  { size: 10, thumbPx: 192, squareThumb: true, viewPx: null, viewLabel: 'モザイク用の小さな画像だけ', approxKb: 16, group: 'far' },
  { size: 20, thumbPx: 96, squareThumb: true, viewPx: null, viewLabel: 'モザイク用の小さな画像だけ', approxKb: 6, group: 'far' },
  { size: 30, thumbPx: 64, squareThumb: true, viewPx: null, viewLabel: 'モザイク用の小さな画像だけ', approxKb: 4, group: 'far' },
]

/** 書き出し画像での1マスの大きさ(px) */
export function exportTilePx(p: SizeProfile): number {
  // 正方形でない縮小版は、短い辺(4:3 の写真なら長辺の 3/4)に合わせる
  return p.squareThumb ? p.thumbPx : Math.round(p.thumbPx * 0.75)
}

export const SIZE_OPTIONS: readonly number[] = SIZE_PROFILES.map((p) => p.size)

export function profileFor(size: number): SizeProfile {
  const p = SIZE_PROFILES.find((x) => x.size === size)
  if (!p) throw new Error('選べないサイズです')
  return p
}

/** 1作品に入れられる写真の上限(マスの数 + 控え100枚) */
export function maxPhotosFor(size: number): number {
  return size * size + 100
}

/** 保存容量の目安(MB) */
export function approxMb(size: number): number {
  const p = profileFor(size)
  return (size * size * p.approxKb) / 1024
}

/**
 * 作品のサイズごとの保存の大きさ。
 * 元の写真は保存せず、サイズに合わせて軽くした画像だけを保存する。
 */
export type SizeProfile = {
  /** 1辺のマス数 */
  size: number
  /** マス目・書き出しに使う縮小版の長辺(px) */
  thumbPx: number
  /** 1枚ずつ見るための画像の長辺(px) */
  viewPx: number
  /** 1枚ずつ見たときのきれいさ(画面に出す説明) */
  viewLabel: string
  /** 1枚あたりの保存容量の目安(KB) */
  approxKb: number
  group: 'view' | 'far'
}

export const SIZE_PROFILES: readonly SizeProfile[] = [
  { size: 3, thumbPx: 384, viewPx: 1200, viewLabel: 'とてもきれい', approxKb: 330, group: 'view' },
  { size: 4, thumbPx: 384, viewPx: 1200, viewLabel: 'とてもきれい', approxKb: 330, group: 'view' },
  { size: 5, thumbPx: 384, viewPx: 1200, viewLabel: 'とてもきれい', approxKb: 330, group: 'view' },
  { size: 6, thumbPx: 384, viewPx: 1200, viewLabel: 'とてもきれい', approxKb: 330, group: 'view' },
  { size: 8, thumbPx: 256, viewPx: 800, viewLabel: 'きれい', approxKb: 150, group: 'far' },
  { size: 10, thumbPx: 256, viewPx: 800, viewLabel: 'きれい', approxKb: 150, group: 'far' },
  { size: 20, thumbPx: 128, viewPx: 400, viewLabel: 'スマホの画面くらい', approxKb: 45, group: 'far' },
  { size: 30, thumbPx: 96, viewPx: 256, viewLabel: 'サムネイルくらい', approxKb: 20, group: 'far' },
]

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

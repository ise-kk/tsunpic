/**
 * 「ならべる」の並べ方(画面に依存しない純粋関数)
 * - 写真をグラデーションの順に並べる
 * - マス目の順路(左上 → 右下へ斜めに流れる)
 * - 足りないときは、空きを全体に散らして配置
 * - 多すぎるときは、グラデーションに合う枚数を選び、残りを控えにする
 */
import { deltaE2000, labToLch, type Lab } from './color'

export type Colored = { id: string; color: Lab }

/** 彩度がこれより低い色は「白・黒・灰色」として最後にまとめる */
const NEUTRAL_CHROMA = 12

function byId(a: Colored, b: Colored): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/**
 * グラデーションの順に並べた新しい配列を返す(元の配列は変えない)。
 * 色相は輪になっているので、色がいちばん離れているところ(写真のない色)で輪を切って、
 * そこから一周する。こうすると、並びの途中で色が急に飛ばない。
 * 白・黒・灰色は最後に明るい順でまとめる。
 */
export function sortByGradient<T extends Colored>(items: readonly T[]): T[] {
  const chroma: { item: T; h: number; L: number }[] = []
  const neutral: { item: T; L: number }[] = []
  for (const item of items) {
    const { L, C, h } = labToLch(item.color)
    if (C < NEUTRAL_CHROMA) neutral.push({ item, L })
    else chroma.push({ item, h, L })
  }
  chroma.sort((a, b) => a.h - b.h || b.L - a.L || byId(a.item, b.item))
  let start = 0
  if (chroma.length > 1) {
    let widest = -1
    for (let i = 0; i < chroma.length; i++) {
      const cur = chroma[i]!.h
      const prev = chroma[(i - 1 + chroma.length) % chroma.length]!.h
      const gap = (cur - prev + 360) % 360
      if (gap > widest) {
        widest = gap
        start = i
      }
    }
  }
  const rotated = [...chroma.slice(start), ...chroma.slice(0, start)].map((x) => x.item)
  neutral.sort((a, b) => b.L - a.L || byId(a.item, b.item))
  return [...rotated, ...neutral.map((x) => x.item)]
}

/**
 * マス目の順路:左上から右下へ、斜めの帯ごとに進む(帯の中は右上から左下へ)。
 * 同じ帯には近い色が入るので、全体が斜めのグラデーションに見える。
 * @returns 順路の i 番目が、マス目のどこ(行×幅+列)にあたるか
 */
export function diagonalPath(size: number): number[] {
  const path: number[] = []
  for (let d = 0; d <= 2 * (size - 1); d++) {
    for (let r = 0; r < size; r++) {
      const c = d - r
      if (c >= 0 && c < size) path.push(r * size + c)
    }
  }
  return path
}

/**
 * count 枚を total マスの順路上に、空きが全体に散らばるように置く。
 * @returns i 番目の写真が順路の何番目に入るか(増え続ける・重ならない)
 */
export function spreadSlots(count: number, total: number): number[] {
  if (count <= 0) return []
  if (count > total) throw new Error('マスより写真が多いときは、先に控えを選んでください')
  if (count === 1) return [Math.floor((total - 1) / 2)]
  return Array.from({ length: count }, (_, i) => Math.round((i * (total - 1)) / (count - 1)))
}

/** 隣どうしの色の差の合計(小さいほどなめらか) */
export function roughness(items: readonly Colored[]): number {
  let sum = 0
  for (let i = 1; i < items.length; i++) sum += deltaE2000(items[i - 1]!.color, items[i]!.color)
  return sum
}

/**
 * 多すぎるとき:グラデーションがいちばんなめらかになるように keep 枚を選ぶ。
 * 1枚ずつ「抜くと全体がいちばんなめらかになる写真」を控えに回していく。
 */
export function chooseForGradient<T extends Colored>(items: readonly T[], keep: number): { used: T[]; bench: T[] } {
  let used = sortByGradient(items)
  const bench: T[] = []
  while (used.length > keep) {
    // 「いちばん近い隣とも色が離れている写真」= 流れから浮いている写真を控えに回す。
    // 端の写真は隣が1つだけなので、その差で判断する(端にあるだけで不利にならない)
    let worst = 0
    let worstNear = -Infinity
    let worstSum = -Infinity
    for (let i = 0; i < used.length; i++) {
      const cur = used[i]!
      const ds: number[] = []
      if (i > 0) ds.push(deltaE2000(used[i - 1]!.color, cur.color))
      if (i < used.length - 1) ds.push(deltaE2000(cur.color, used[i + 1]!.color))
      const near = ds.length ? Math.min(...ds) : 0
      const sum = ds.reduce((a, b) => a + b, 0)
      if (near > worstNear + 1e-9 || (Math.abs(near - worstNear) <= 1e-9 && sum > worstSum)) {
        worstNear = near
        worstSum = sum
        worst = i
      }
    }
    bench.push(used[worst]!)
    used = used.filter((_, i) => i !== worst)
  }
  return { used, bench }
}

export type Placement<T> = { grid: (T | null)[]; bench: T[] }

/**
 * 作品のマス目を作る。
 * @param items 作品に入っている写真(控えは含めない)
 * @param size 1辺のマス数
 */
export function arrange<T extends Colored>(items: readonly T[], size: number): Placement<T> {
  const total = size * size
  const { used, bench } = items.length > total ? chooseForGradient(items, total) : { used: sortByGradient(items), bench: [] }
  const path = diagonalPath(size)
  const slots = spreadSlots(used.length, total)
  const grid: (T | null)[] = new Array<T | null>(total).fill(null)
  used.forEach((item, i) => {
    grid[path[slots[i]!]!] = item
  })
  return { grid, bench }
}

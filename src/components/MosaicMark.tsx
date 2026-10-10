import { useMemo } from 'react'
import styles from './MosaicMark.module.css'

type Props = {
  /** 1辺のマス数 */
  size?: number
  /** 空きマスの位置(行, 列) */
  hole?: [number, number]
  /** 読み上げ用の説明。なければ飾りとして扱う */
  label?: string
}

// アイコン案Aと同じ「グラデーションのモザイク + 点線の空きマス」
export function MosaicMark({ size = 5, hole = [3, 3], label }: Props) {
  const cells = useMemo(() => buildCells(size, hole), [size, hole])
  return (
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {cells.map((c) =>
        c.empty ? (
          <span key={c.key} className={`${styles.cell} ${styles.empty}`} />
        ) : (
          <span key={c.key} className={styles.cell} style={{ background: c.color }} />
        ),
      )}
    </div>
  )
}

function buildCells(size: number, hole: [number, number]) {
  // 毎回同じ色になるよう、決まった種から乱数を作る
  let seed = 11
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const cells: { key: string; color: string; empty: boolean }[] = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const t = (r + c) / (2 * (size - 1))
      const h = 340 - t * 300 + (rand() - 0.5) * 14
      const l = 62 + (rand() - 0.5) * 12
      cells.push({
        key: `${r}-${c}`,
        color: `hsl(${h.toFixed(0)} 76% ${l.toFixed(0)}%)`,
        empty: r === hole[0] && c === hole[1],
      })
    }
  }
  return cells
}

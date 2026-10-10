import type { Photo } from '../db/db'
import { labToCss, type Lab } from '../lib/color'
import styles from './MosaicGrid.module.css'

type Props = {
  grid: (Photo | null)[]
  size: number
  urls: Map<string, string>
  onOpen: (photoId: string) => void
  /** 色の補正で寄せる先の色(マス目の順) */
  targets?: (Lab | null)[]
  /** 補正の強さ(0〜1) */
  strength?: number
  /** 直前に入った写真(枠で知らせる) */
  highlightIds?: Set<string>
}

// 作品のマス目。写真をタップすると大きく見られる
export function MosaicGrid({ grid, size, urls, onOpen, targets, strength = 0, highlightIds }: Props) {
  const gap = size >= 20 ? 0 : size >= 8 ? 1 : size >= 5 ? 2 : 3
  const big = size >= 20
  return (
    <div className={styles.frame}>
      <div
        className={styles.grid}
        data-big={big || undefined}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gap }}
      >
        {grid.map((p, i) => {
          if (!p) return <span key={`empty-${i}`} className={styles.empty} aria-hidden="true" />
          const target = targets?.[i]
          return (
            <button
              key={p.id}
              type="button"
              className={styles.tile}
              data-new={highlightIds?.has(p.id) || undefined}
              onClick={() => onOpen(p.id)}
              aria-label={`${i + 1}番目の写真を大きく見る`}
              // 大作では1マスが小さいので、Tab で1枚ずつ移動させない
              tabIndex={big ? -1 : undefined}
            >
              {urls.get(p.id) && (
                <img src={urls.get(p.id)} alt="" className={styles.img} draggable={false} loading="lazy" decoding="async" />
              )}
              {target && strength > 0 && (
                <span className={styles.tint} style={{ background: labToCss(target), opacity: strength }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

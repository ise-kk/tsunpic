import type { Photo } from '../db/db'
import styles from './MosaicGrid.module.css'

type Props = {
  grid: (Photo | null)[]
  size: number
  urls: Map<string, string>
  onOpen: (photoId: string) => void
  /** 直前に入った写真(枠で知らせる) */
  highlightIds?: Set<string>
}

// 作品のマス目。写真をタップすると大きく見られる
export function MosaicGrid({ grid, size, urls, onOpen, highlightIds }: Props) {
  const gap = size >= 8 ? 1 : size >= 5 ? 2 : 3
  return (
    <div className={styles.frame}>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gap }}>
        {grid.map((p, i) =>
          p ? (
            <button
              key={p.id}
              type="button"
              className={styles.tile}
              data-new={highlightIds?.has(p.id) || undefined}
              onClick={() => onOpen(p.id)}
              aria-label={`${i + 1}番目の写真を大きく見る`}
            >
              {urls.get(p.id) && <img src={urls.get(p.id)} alt="" className={styles.img} draggable={false} />}
            </button>
          ) : (
            <span key={`empty-${i}`} className={styles.empty} aria-hidden="true" />
          ),
        )}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { Photo } from '../db/db'
import { useBlobUrl } from '../db/hooks'
import { labToCss } from '../lib/color'
import { IconChevronLeft, IconChevronRight, IconClose } from './icons'
import styles from './Viewer.module.css'

type Props = {
  photos: Photo[]
  index: number
  benchFrom: number
  onIndex: (i: number) => void
  onClose: () => void
  onRemove: (photo: Photo) => void
}

// 1枚をじっくり見る(作品のサイズに合わせた画質で表示)
export function Viewer({ photos, index, benchFrom, onIndex, onClose, onRemove }: Props) {
  const photo = photos[index]
  const url = useBlobUrl(photo?.image ?? photo?.thumb)
  const [confirming, setConfirming] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])
  useEffect(() => setConfirming(false), [index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
      if (e.key === 'ArrowRight' && index < photos.length - 1) onIndex(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, photos.length, onClose, onIndex])

  if (!photo) return null
  const isBench = index >= benchFrom

  return (
    <div className={styles.viewer} role="dialog" aria-modal="true" aria-label="写真を大きく見る">
      <div className={styles.top}>
        <button ref={closeRef} type="button" className={styles.icon} onClick={onClose} aria-label="閉じる">
          <IconClose />
        </button>
        <div className={styles.count}>
          {isBench ? '控え ' : ''}
          {index + 1} / {photos.length}
        </div>
        <div style={{ width: 44 }} />
      </div>

      <div
        className={styles.stage}
        onTouchStart={(e) => {
          touchX.current = e.touches.length === 1 ? (e.touches[0]?.clientX ?? null) : null
        }}
        onTouchEnd={(e) => {
          const start = touchX.current
          const end = e.changedTouches[0]?.clientX
          touchX.current = null
          if (start == null || end == null) return
          const dx = end - start
          if (dx > 60 && index > 0) onIndex(index - 1)
          if (dx < -60 && index < photos.length - 1) onIndex(index + 1)
        }}
      >
        {url && <img src={url} alt={`${index + 1}枚目の写真`} className={styles.photo} />}
        {index > 0 && (
          <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => onIndex(index - 1)} aria-label="前の写真">
            <IconChevronLeft />
          </button>
        )}
        {index < photos.length - 1 && (
          <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => onIndex(index + 1)} aria-label="次の写真">
            <IconChevronRight />
          </button>
        )}
      </div>

      <div className={styles.info}>
        <span className={styles.chip} style={{ background: labToCss(photo.color) }} aria-hidden="true" />
        <span>{isBench ? 'グラデーションに合いにくいため控えにあります' : 'この写真の色でならんでいます'}</span>
      </div>

      <div className={styles.actions}>
        {confirming ? (
          <button type="button" className={`${styles.action} ${styles.danger}`} onClick={() => onRemove(photo)}>
            本当に外す(元に戻せません)
          </button>
        ) : (
          <button type="button" className={styles.action} onClick={() => setConfirming(true)}>
            この写真を外す
          </button>
        )}
      </div>
    </div>
  )
}

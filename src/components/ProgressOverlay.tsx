import styles from './ProgressOverlay.module.css'

type Props = {
  done: number
  total: number
  /** 残り時間の目安(秒)。まだ分からないときは null */
  etaSec: number | null
  onCancel: () => void
  cancelling: boolean
}

// 写真の読み込み中に出す、くるくる回る進み具合の表示
export function ProgressOverlay({ done, total, etaSec, onCancel, cancelling }: Props) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const r = 40
  const len = 2 * Math.PI * r
  return (
    <div className={styles.overlay}>
      <div className={styles.card} role="status" aria-live="polite">
        <div className={styles.ring} aria-hidden="true">
          <svg viewBox="0 0 100 100" className={styles.svg}>
            <circle cx="50" cy="50" r={r} className={styles.track} />
            <circle
              cx="50"
              cy="50"
              r={r}
              className={styles.bar}
              style={{ strokeDasharray: len, strokeDashoffset: len * (1 - done / Math.max(1, total)) }}
            />
          </svg>
          <span className={styles.spinner} />
          <span className={styles.pct}>{pct}%</span>
        </div>
        <p className={styles.count}>
          {done} / {total}枚
        </p>
        <p className={styles.sub}>{cancelling ? '止めています…' : etaSec === null ? '写真を読み込み中…' : `あと${formatEta(etaSec)}`}</p>
        <p className={styles.note}>
          読み込んだ写真から順に保存しています。途中で止めても、そこまでの写真は残ります。写真はこの端末の中だけで処理しています。
        </p>
        <button type="button" className={styles.cancel} onClick={onCancel} disabled={cancelling}>
          ここまでで止める
        </button>
      </div>
    </div>
  )
}

export function formatEta(sec: number): string {
  if (sec < 10) return '少し'
  if (sec < 60) return `約${Math.ceil(sec / 10) * 10}秒`
  return `約${Math.ceil(sec / 60)}分`
}

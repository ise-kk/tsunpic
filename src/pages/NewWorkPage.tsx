import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconClose } from '../components/icons'
import ui from '../components/ui.module.css'
import { createWork, SIZE_OPTIONS } from '../db/repo'
import styles from './NewWorkPage.module.css'

// サイズ(何枚で1枚のアートにするか)を決める
export function NewWorkPage() {
  const navigate = useNavigate()
  const [size, setSize] = useState<number>(6)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = async () => {
    setBusy(true)
    setError(null)
    try {
      const work = await createWork(size)
      navigate(`/work/${work.id}`, { replace: true })
    } catch {
      setError('作品を作れませんでした。ブラウザの保存領域がいっぱいか、プライベートブラウズの可能性があります。')
      setBusy(false)
    }
  }

  return (
    <main className={ui.page}>
      <div className={ui.topBar}>
        <Link to="/" className={ui.iconButton} aria-label="閉じる">
          <IconClose />
        </Link>
        <div className={ui.topTitle}>ならべる</div>
        <div style={{ width: 44 }} />
      </div>

      <div className={styles.lead}>
        <h1 className={styles.title}>何枚で1枚のアートにする?</h1>
        <p className={styles.text}>あとから少しずつ足していけます。足りない間も、グラデーションを保って並びます。</p>
      </div>

      <div className={styles.preview} aria-hidden="true">
        <div className={styles.previewGrid} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
          {Array.from({ length: size * size }, (_, i) => (
            <span key={i} className={styles.cell} />
          ))}
        </div>
      </div>

      <fieldset className={styles.options}>
        <legend className="visually-hidden">写真の枚数</legend>
        {SIZE_OPTIONS.map((n) => (
          <label key={n} className={styles.option} data-checked={n === size}>
            <input
              type="radio"
              name="size"
              value={n}
              checked={n === size}
              onChange={() => setSize(n)}
              className="visually-hidden"
            />
            <span className={styles.count}>{n * n}枚</span>
            <span className={styles.grid}>
              {n}×{n}
            </span>
          </label>
        ))}
      </fieldset>
      <p className={`${ui.note} ${styles.hint}`}>旅行1日分なら 25〜36枚、1年分なら 100枚がおすすめ</p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={ui.spacer} />
      <button type="button" className={ui.primary} onClick={start} disabled={busy}>
        {size * size}枚のアートをはじめる
      </button>
    </main>
  )
}

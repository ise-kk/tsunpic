import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconClose } from '../components/icons'
import ui from '../components/ui.module.css'
import { createWork } from '../db/repo'
import { approxMb, profileFor, SIZE_PROFILES, type SizeProfile } from '../lib/sizes'
import styles from './NewWorkPage.module.css'

// サイズ(何枚で1枚のアートにするか)を決める
export function NewWorkPage() {
  const navigate = useNavigate()
  const [size, setSize] = useState<number>(6)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const profile = profileFor(size)
  const mb = approxMb(size)

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

  const group = (g: SizeProfile['group'], label: string) => (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.options}>
        {SIZE_PROFILES.filter((p) => p.group === g).map(({ size: n }) => (
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
      </div>
    </fieldset>
  )

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

      {group('view', '1枚ずつ見て楽しむ')}
      {group('far', '遠くから見て楽しむ')}

      <dl className={styles.info}>
        <div>
          <dt>1枚ずつの見え方</dt>
          <dd>
            {profile.viewLabel}(長辺{profile.viewPx}px)
          </dd>
        </div>
        <div>
          <dt>保存の大きさ(目安)</dt>
          <dd>約{mb < 10 ? mb.toFixed(1) : Math.round(mb)}MB</dd>
        </div>
        <p className={ui.note}>写真はアプリの中では軽くして保存します。元の写真は、写真アプリに残っています。</p>
      </dl>

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

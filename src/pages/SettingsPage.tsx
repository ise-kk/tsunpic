import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconBack, IconLock } from '../components/icons'
import { useToast } from '../components/Toast'
import ui from '../components/ui.module.css'
import { requestPersistentStorage } from '../db/db'
import { deleteAllData } from '../db/repo'
import styles from './SettingsPage.module.css'

type StorageInfo = { usage: number; persisted: boolean }

export function SettingsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [info, setInfo] = useState<StorageInfo | null>(null)
  const [confirming, setConfirming] = useState(false)

  const refresh = async () => {
    try {
      const est = await navigator.storage?.estimate?.()
      const persisted = (await navigator.storage?.persisted?.()) ?? false
      setInfo({ usage: est?.usage ?? 0, persisted })
    } catch {
      setInfo(null)
    }
  }
  useEffect(() => {
    void refresh()
  }, [])

  return (
    <main className={ui.page}>
      <div className={ui.topBar}>
        <Link to="/" className={ui.iconButton} aria-label="ホームにもどる">
          <IconBack />
        </Link>
        <div className={ui.topTitle}>設定とデータ</div>
        <div style={{ width: 44 }} />
      </div>

      <section className={ui.card} aria-labelledby="data-title">
        <h2 id="data-title" className={styles.h2}>
          <IconLock /> 写真とデータ
        </h2>
        <p className={styles.text}>作品と写真は、この端末のブラウザの中だけに保存されています。外部には送信していません。</p>
        {info && (
          <dl className={styles.dl}>
            <dt>使用中の容量</dt>
            <dd>{formatBytes(info.usage)}</dd>
            <dt>消えにくい保存</dt>
            <dd>{info.persisted ? '有効' : '無効'}</dd>
          </dl>
        )}
        {info && !info.persisted && (
          <button
            type="button"
            className={ui.secondary}
            onClick={async () => {
              const ok = await requestPersistentStorage()
              toast(ok ? '消えにくい保存を有効にしました' : 'このブラウザでは有効にできませんでした。ホーム画面に追加すると有効になる場合があります')
              void refresh()
            }}
          >
            消えにくい保存を有効にする
          </button>
        )}
        <p className={ui.note}>ブラウザのデータを削除すると、作品も消えます。大切な作品は画像として保存してください。</p>
      </section>

      <section className={ui.card} aria-labelledby="delete-title">
        <h2 id="delete-title" className={styles.h2}>
          すべてのデータを削除
        </h2>
        <p className={styles.text}>この端末に保存された作品と写真をすべて削除します。元に戻せません。</p>
        {confirming ? (
          <div className={ui.row2}>
            <button type="button" className={ui.secondary} onClick={() => setConfirming(false)}>
              やめる
            </button>
            <button
              type="button"
              className={ui.danger}
              onClick={async () => {
                await deleteAllData()
                toast('すべてのデータを削除しました')
                navigate('/', { replace: true })
              }}
            >
              削除する
            </button>
          </div>
        ) : (
          <button type="button" className={ui.danger} onClick={() => setConfirming(true)}>
            すべてのデータを削除
          </button>
        )}
      </section>

      <nav className={styles.links} aria-label="規約など">
        <Link to="/privacy">プライバシーポリシー</Link>
        <Link to="/terms">利用規約</Link>
        <Link to="/licenses">ライセンス表示</Link>
      </nav>
      <p className={`${ui.note} ${styles.version}`}>Tsunpic {__APP_VERSION__}</p>
    </main>
  )
}

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

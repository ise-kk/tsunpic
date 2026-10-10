import { useRegisterSW } from 'virtual:pwa-register/react'
import styles from './UpdatePrompt.module.css'

// 新しいバージョンが公開されたとき、作業中に勝手に切り替えず「更新」ボタンで知らせる
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className={styles.toast} role="status">
      <p className={styles.text}>新しいバージョンがあります</p>
      <button type="button" className={styles.later} onClick={() => setNeedRefresh(false)}>
        あとで
      </button>
      <button type="button" className={styles.update} onClick={() => updateServiceWorker(true)}>
        更新
      </button>
    </div>
  )
}

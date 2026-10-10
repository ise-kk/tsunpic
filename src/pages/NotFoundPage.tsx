import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>ページが見つかりません</h1>
      <p className={styles.text}>URLが変わったか、まだ用意されていない画面です。</p>
      <Link to="/" className={styles.link}>
        ホームにもどる
      </Link>
    </main>
  )
}

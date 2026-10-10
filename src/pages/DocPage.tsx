import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconBack } from '../components/icons'
import ui from '../components/ui.module.css'
import styles from './DocPage.module.css'

// 文章のページ(プライバシーポリシー・利用規約・ライセンスなど)の共通の枠
export function DocPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <main className={ui.page}>
      <div className={ui.topBar}>
        <Link to="/settings" className={ui.iconButton} aria-label="もどる">
          <IconBack />
        </Link>
        <div className={ui.topTitle}>{title}</div>
        <div style={{ width: 44 }} />
      </div>
      <article className={styles.doc}>
        <h1 className={styles.h1}>{title}</h1>
        {updated && <p className={styles.updated}>最終更新日:{updated}</p>}
        {children}
      </article>
    </main>
  )
}

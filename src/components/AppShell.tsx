import type { ReactNode } from 'react'
import styles from './AppShell.module.css'

// スマホは画面いっぱい、PCは中央にスマホ幅で表示する外枠
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.outer}>
      <div className={styles.inner}>{children}</div>
    </div>
  )
}

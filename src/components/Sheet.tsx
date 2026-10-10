import { useEffect, useRef, type ReactNode } from 'react'
import styles from './Sheet.module.css'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

// 下から出るシート(確認やメニューに使う)。ブラウザの確認ダイアログは使わない
export function Sheet({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal?.()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className={styles.body}>
        <div className={styles.handle} aria-hidden="true" />
        <h2 className={styles.title}>{title}</h2>
        {children}
      </div>
    </dialog>
  )
}

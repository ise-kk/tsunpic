import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import styles from './Toast.module.css'

type ToastApi = (message: string) => void
const ToastContext = createContext<ToastApi>(() => {})

// 画面の下に短いお知らせを出す
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = useCallback<ToastApi>((m) => {
    setMessage(m)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(null), 4000)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {message && <div className={styles.toast}>{message}</div>}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  return useContext(ToastContext)
}

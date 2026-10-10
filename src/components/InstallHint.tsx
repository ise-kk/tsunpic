import { useEffect, useState } from 'react'
import { decideInstallGuide, type InstallGuide } from '../lib/install'
import { readFlag, writeFlag } from '../lib/storage'
import styles from './InstallHint.module.css'

const DISMISS_KEY = 'tsunpic.installHint.dismissed'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// 「ホーム画面に追加」すると、アプリのように全画面で使えることを案内する
export function InstallHint() {
  const [dismissed, setDismissed] = useState(() => readFlag(DISMISS_KEY))
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [guide, setGuide] = useState<InstallGuide>('none')

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean }
    setGuide(
      decideInstallGuide({
        userAgent: nav.userAgent,
        standalone: window.matchMedia?.('(display-mode: standalone)').matches ?? false,
        iosStandalone: nav.standalone,
        maxTouchPoints: nav.maxTouchPoints ?? 0,
        canPrompt: promptEvent !== null,
      }),
    )
  }, [promptEvent])

  if (dismissed || guide === 'installed' || guide === 'none') return null

  const close = () => {
    writeFlag(DISMISS_KEY, true)
    setDismissed(true)
  }

  const install = async () => {
    if (!promptEvent) return
    await promptEvent.prompt()
    await promptEvent.userChoice
    setPromptEvent(null)
  }

  return (
    <aside className={styles.hint} aria-label="ホーム画面に追加">
      <div className={styles.body}>
        <p className={styles.title}>ホーム画面に追加すると、アプリのように使えます</p>
        {guide === 'ios-safari' && (
          <p className={styles.text}>
            画面下の <ShareIcon /> 共有ボタン →「ホーム画面に追加」をタップしてください。
          </p>
        )}
        {guide === 'ios-other' && (
          <p className={styles.text}>iPhone では Safari で開くと、ホーム画面に追加できます。</p>
        )}
        {guide === 'prompt' && (
          <button type="button" className={styles.install} onClick={install}>
            ホーム画面に追加
          </button>
        )}
      </div>
      <button type="button" className={styles.close} onClick={close} aria-label="案内を閉じる">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
    </aside>
  )
}

function ShareIcon() {
  return (
    <svg className={styles.inlineIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-label="共有">
      <path d="M12 3v12M7 8l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v8h14v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

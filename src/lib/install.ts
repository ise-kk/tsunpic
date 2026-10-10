/**
 * 「ホーム画面に追加」の案内をどう出すかを決める。画面に依存しない純粋関数。
 */

export type InstallGuide =
  /** すでにホーム画面から開いている(案内不要) */
  | 'installed'
  /** iPhone / iPad の Safari:共有ボタンから追加する案内を出す */
  | 'ios-safari'
  /** iPhone / iPad の Safari 以外のブラウザ:Safari で開くよう案内する */
  | 'ios-other'
  /** Android / PC の Chrome など:ブラウザのインストール機能を使う */
  | 'prompt'
  /** 案内できない環境 */
  | 'none'

export type InstallEnv = {
  userAgent: string
  /** display-mode: standalone で開いているか */
  standalone: boolean
  /** iOS Safari 独自の navigator.standalone */
  iosStandalone?: boolean
  /** iPadOS は Mac と同じ UA を名乗るため、タッチ点数で見分ける */
  maxTouchPoints: number
  /** beforeinstallprompt を受け取れたか */
  canPrompt: boolean
}

export function isIOS(env: Pick<InstallEnv, 'userAgent' | 'maxTouchPoints'>): boolean {
  const ua = env.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return true
  // iPadOS 13 以降は Macintosh を名乗る
  return /Macintosh/.test(ua) && env.maxTouchPoints > 1
}

export function decideInstallGuide(env: InstallEnv): InstallGuide {
  if (env.standalone || env.iosStandalone === true) return 'installed'
  if (isIOS(env)) {
    // iOS の Chrome(CriOS)・Firefox(FxiOS)・Edge(EdgiOS)・アプリ内ブラウザなどは Safari 以外として扱う
    const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|Line\/|FBAN|FBAV|Instagram/.test(env.userAgent)
    const isSafari = /Safari\//.test(env.userAgent) && !otherBrowser
    return isSafari ? 'ios-safari' : 'ios-other'
  }
  if (env.canPrompt) return 'prompt'
  return 'none'
}

/**
 * ちょっとした設定(案内を閉じたか等)を保存する。
 * プライベートブラウズなどで保存できない環境でもアプリが止まらないようにする。
 */
export function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export function writeFlag(key: string, value: boolean): void {
  try {
    if (value) window.localStorage.setItem(key, '1')
    else window.localStorage.removeItem(key)
  } catch {
    // 保存できなくても動作は続ける
  }
}

import { decideInstallGuide, isIOS, type InstallEnv } from '../src/lib/install'

const base: InstallEnv = { userAgent: '', standalone: false, maxTouchPoints: 0, canPrompt: false }

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1',
  iphoneLine:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/14.0.0',
  ipadOS: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  android:
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
}

describe('isIOS', () => {
  it('iPhone を iOS と判定する', () => {
    expect(isIOS({ userAgent: UA.iphoneSafari, maxTouchPoints: 5 })).toBe(true)
  })
  it('Mac を名乗る iPad をタッチ点数で iOS と判定する', () => {
    expect(isIOS({ userAgent: UA.ipadOS, maxTouchPoints: 5 })).toBe(true)
  })
  it('本物の Mac は iOS ではない', () => {
    expect(isIOS({ userAgent: UA.ipadOS, maxTouchPoints: 0 })).toBe(false)
  })
})

describe('decideInstallGuide', () => {
  it('ホーム画面から開いていれば案内しない', () => {
    expect(decideInstallGuide({ ...base, userAgent: UA.android, standalone: true })).toBe('installed')
    expect(decideInstallGuide({ ...base, userAgent: UA.iphoneSafari, iosStandalone: true, maxTouchPoints: 5 })).toBe(
      'installed',
    )
  })
  it('iPhone の Safari では共有ボタンの案内', () => {
    expect(decideInstallGuide({ ...base, userAgent: UA.iphoneSafari, maxTouchPoints: 5 })).toBe('ios-safari')
  })
  it('iPhone の Chrome や LINE 内ブラウザでは Safari で開く案内', () => {
    expect(decideInstallGuide({ ...base, userAgent: UA.iphoneChrome, maxTouchPoints: 5 })).toBe('ios-other')
    expect(decideInstallGuide({ ...base, userAgent: UA.iphoneLine, maxTouchPoints: 5 })).toBe('ios-other')
  })
  it('Android はインストールの合図を受け取れたときだけボタンを出す', () => {
    expect(decideInstallGuide({ ...base, userAgent: UA.android, canPrompt: true })).toBe('prompt')
    expect(decideInstallGuide({ ...base, userAgent: UA.android, canPrompt: false })).toBe('none')
  })
})

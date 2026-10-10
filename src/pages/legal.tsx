import { DocPage } from './DocPage'
import styles from './DocPage.module.css'

const UPDATED = '2026年10月11日'
const CONTACT_URL = 'https://github.com/ise-kk/tsunpic/issues'

export function PrivacyPage() {
  return (
    <DocPage title="プライバシーポリシー" updated={UPDATED}>
      <p>
        Tsunpic(以下「本アプリ」)は、写真を並べて1枚のアートを作るウェブアプリです。本アプリは、利用者の写真や個人情報を運営者が受け取らない設計になっています。
      </p>

      <h2>1. 写真の扱い</h2>
      <ul>
        <li>本アプリが使う写真は、利用者が自分で選んだもの、または本アプリから撮影したものだけです。</li>
        <li>写真の読み込み・色の計算・並べ替え・画像の書き出しは、すべて利用者の端末の中で行います。</li>
        <li>写真を運営者のサーバーや第三者に送信することはありません。</li>
        <li>
          書き出した作品の画像は端末上で描き直して作るため、撮影場所(位置情報)などのメタデータは含まれません。
        </li>
      </ul>

      <h2>2. 端末に保存する情報</h2>
      <ul>
        <li>
          作品と写真(元の写真と表示用の縮小版、写真の代表色)は、利用者の端末のブラウザ内(IndexedDB)に保存されます。元の写真には、撮影時に記録された位置情報などが含まれる場合がありますが、端末の外には送信しません。
        </li>
        <li>案内を閉じたかどうかなどの小さな設定を、ブラウザ内(localStorage)に保存します。</li>
        <li>オフラインでも使えるように、アプリのファイルをブラウザ内に保存します。</li>
      </ul>

      <h2>3. 取得しない情報</h2>
      <ul>
        <li>アカウント登録はなく、氏名・メールアドレスなどは取得しません。</li>
        <li>アクセス解析ツール、広告、外部のスクリプトは使用していません。Cookie も使用していません。</li>
      </ul>

      <h2>4. ホスティング事業者</h2>
      <p>
        本アプリは GitHub Pages(GitHub, Inc.)で配信しています。ページを表示する際、GitHub
        が技術的な理由で接続元の IP アドレスなどを記録する場合があります。詳しくは{' '}
        <a href="https://docs.github.com/ja/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">
          GitHub のプライバシーステートメント
        </a>
        をご確認ください。
      </p>

      <h2>5. データの削除</h2>
      <p>
        「設定とデータ」の「すべてのデータを削除」から、この端末に保存された作品と写真をいつでも削除できます。ブラウザの設定からサイトのデータを削除しても消えます。
      </p>

      <h2>6. 改定</h2>
      <p>内容を変更する場合は、このページでお知らせします。重要な変更がある場合は、アプリ内でもお知らせします。</p>

      <h2>7. お問い合わせ</h2>
      <p>
        <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
          GitHub のお問い合わせページ
        </a>
        からご連絡ください。お問い合わせの内容は公開されるため、個人情報は書かないでください。
      </p>
    </DocPage>
  )
}

export function TermsPage() {
  return (
    <DocPage title="利用規約" updated={UPDATED}>
      <p>この規約は、Tsunpic(以下「本アプリ」)の利用条件を定めるものです。本アプリを利用した時点で、この規約に同意したものとみなします。</p>

      <h2>1. 写真の権利</h2>
      <ul>
        <li>利用者が本アプリで使う写真と、作成した作品の権利は、利用者(または元の権利者)に帰属します。運営者が権利を取得することはありません。</li>
        <li>他人が写っている写真や、他人が撮影・制作した写真を使う場合は、利用者の責任で、必要な許可を得てください。</li>
      </ul>

      <h2>2. 禁止事項</h2>
      <ul>
        <li>法令や公序良俗に反する目的での利用</li>
        <li>他人の著作権・肖像権・プライバシーなどの権利を侵害する利用</li>
        <li>本アプリの運営を妨げる行為、不正にアクセスする行為</li>
      </ul>

      <h2>3. データの保存について</h2>
      <p>
        作品と写真は利用者の端末のブラウザ内にだけ保存されます。ブラウザのデータ削除、端末の故障や容量不足などで失われる場合があります。大切な作品は画像として保存してください。
      </p>

      <h2>4. 免責</h2>
      <ul>
        <li>本アプリは現状のまま提供され、特定の目的に適合することや、不具合がないことを保証しません。</li>
        <li>本アプリの利用によって生じた損害について、運営者に故意または重大な過失がある場合を除き、責任を負いません。</li>
      </ul>

      <h2>5. 変更・終了</h2>
      <p>運営者は、本アプリの内容やこの規約を変更し、または提供を終了することがあります。規約を変更する場合は、このページでお知らせします。</p>

      <h2>6. 準拠法</h2>
      <p>この規約は日本法に従って解釈されます。</p>
    </DocPage>
  )
}

const LIBS: { name: string; license: string; copyright: string }[] = [
  { name: 'React / React DOM / scheduler', license: 'MIT License', copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.' },
  { name: 'React Router', license: 'MIT License', copyright: 'Copyright (c) React Training LLC 2015-2019, Copyright (c) Remix Software Inc. 2020-2021, Copyright (c) Shopify Inc. 2022-2023' },
  { name: 'cookie / set-cookie-parser(React Router が使用)', license: 'MIT License', copyright: 'Copyright (c) 2012-2014 Roman Shtylman, Copyright (c) 2015 Douglas Christopher Wilson / Copyright (c) 2015 Nathan Friedly' },
  { name: 'Dexie.js', license: 'Apache License 2.0', copyright: 'Copyright (c) 2014-2017 David Fahlander' },
  { name: 'Workbox', license: 'MIT License', copyright: 'Copyright 2018 Google LLC' },
]

export function LicensesPage() {
  return (
    <DocPage title="ライセンス表示">
      <p>本アプリは、次のフォントとオープンソースソフトウェアを利用しています。</p>

      <h2>フォント</h2>
      <div className={styles.license}>
        <p>
          <strong>Zen Kaku Gothic New</strong>
          <br />
          Copyright 2022 The Zen Project Authors (https://github.com/googlefonts/zen-kakugothic)
          <br />
          SIL Open Font License, Version 1.1(
          <a href="https://openfontlicense.org" target="_blank" rel="noopener noreferrer">
            openfontlicense.org
          </a>
          )
        </p>
      </div>

      <h2>ソフトウェア</h2>
      {LIBS.map((l) => (
        <div key={l.name} className={styles.license}>
          <p>
            <strong>{l.name}</strong>
            <br />
            {l.copyright}
            <br />
            {l.license}
          </p>
        </div>
      ))}
      <p>
        各ライセンスの全文は、
        <a href="https://opensource.org/license/mit" target="_blank" rel="noopener noreferrer">
          MIT License
        </a>
        、
        <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer">
          Apache License 2.0
        </a>
        をご覧ください。
      </p>
    </DocPage>
  )
}

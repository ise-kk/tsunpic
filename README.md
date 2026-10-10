# Tsunpic

写真を並べて、1枚のアートに。

公開ページ:https://ise-kk.github.io/tsunpic/

- スマホ:ページを開いて「ホーム画面に追加」すると、アプリのように使えます。
- 写真はこの端末の中だけで扱い、外部には送信しません。

## 開発

```bash
npm install
npm run dev      # 開発サーバー(http://localhost:5173/tsunpic/)
npm test         # テスト
npm run build    # 本番ビルド
```

main ブランチに push すると、GitHub Actions がテスト → ビルド → GitHub Pages への公開を自動で行います。

---

© 2026 ise-kk. All rights reserved.
このリポジトリのコードは閲覧のために公開していますが、利用・複製・改変・再配布の許可は与えていません。

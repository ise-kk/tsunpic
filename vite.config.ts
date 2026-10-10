/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages では https://ise-kk.github.io/tsunpic/ で公開されるため base を合わせる
const BASE = '/tsunpic/'

// 自分のドメイン以外からは何も読み込まない。写真は blob: / data: で端末内だけで扱う
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

// 開発サーバーはスタイルを直接差し込むため、CSP は本番ビルドにだけ入れる
function cspPlugin(): Plugin {
  return {
    name: 'tsunpic-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!-- Content-Security-Policy は本番ビルド時に vite.config.ts で差し込む -->',
        `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      )
    },
  }
}

export default defineConfig({
  base: BASE,
  build: {
    // 小さなファイルを data: に埋め込むと CSP に引っかかるため、すべて別ファイルとして出す
    assetsInlineLimit: 0,
  },
  plugins: [
    react(),
    cspPlugin(),
    VitePWA({
      // 新しいバージョンがあるときは、勝手に切り替えずに「更新」ボタンで知らせる
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: BASE,
        name: 'Tsunpic',
        short_name: 'Tsunpic',
        description: '写真を並べて、1枚のアートに。',
        lang: 'ja',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FBFAF7',
        theme_color: '#FBFAF7',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 日本語フォントは分割ファイルが多いので、最初にまとめて保存せず、使った分だけ保存する
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: `${BASE}index.html`,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.woff2'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})

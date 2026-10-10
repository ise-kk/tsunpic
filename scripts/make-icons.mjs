// アイコン案A(グラデーションのモザイク + 点線の空きマス)から、PWA 用のアイコンを作る。
// 使い方:npm run icons(Playwright が必要。普段は生成済みの PNG を使うので実行不要)
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const OUT = resolve(import.meta.dirname, '../public')

function cells(n) {
  let seed = 11
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const out = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const t = (r + c) / (2 * (n - 1))
      const h = 340 - t * 300 + (rand() - 0.5) * 14
      const l = 62 + (rand() - 0.5) * 12
      out.push({ r, c, color: `hsl(${h.toFixed(0)} 76% ${l.toFixed(0)}%)`, empty: r === 3 && c === 3 })
    }
  }
  return out
}

/** @param {{ size: number, pad: number, radius: number }} o */
function svg({ size, pad, radius }) {
  const n = 5
  const gap = size * 0.022
  const cell = (size - pad * 2 - gap * (n - 1)) / n
  const rx = cell * 0.2
  const rects = cells(n)
    .map(({ r, c, color, empty }) => {
      const x = pad + c * (cell + gap)
      const y = pad + r * (cell + gap)
      if (empty) {
        const sw = size * 0.012
        return `<rect x="${x + sw / 2}" y="${y + sw / 2}" width="${cell - sw}" height="${cell - sw}" rx="${rx}" fill="none" stroke="#c9c6bf" stroke-width="${sw}" stroke-dasharray="${size * 0.026} ${size * 0.02}"/>`
      }
      return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${rx}" fill="${color}"/>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#fbfaf7"/>${rects}</svg>`
}

mkdirSync(resolve(OUT, 'icons'), { recursive: true })

// favicon(角丸あり)
writeFileSync(resolve(OUT, 'favicon.svg'), svg({ size: 512, pad: 70, radius: 112 }))

// PNG は Playwright で描画する
const targets = [
  { file: 'icons/icon-192.png', size: 192, pad: 0.146, radius: 0 },
  { file: 'icons/icon-512.png', size: 512, pad: 0.146, radius: 0 },
  // maskable は端が切り取られても大丈夫なように余白を多めに
  { file: 'icons/icon-maskable-512.png', size: 512, pad: 0.22, radius: 0 },
  { file: 'apple-touch-icon.png', size: 180, pad: 0.146, radius: 0 },
]

const { chromium } = await import('playwright')
const browser = await chromium.launch()
const page = await browser.newPage()
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size })
  const markup = svg({ size: t.size, pad: t.size * t.pad, radius: t.radius })
  await page.setContent(`<html><body style="margin:0">${markup.replace('<svg ', `<svg width="${t.size}" height="${t.size}" `)}</body></html>`)
  await page.screenshot({ path: resolve(OUT, t.file), omitBackground: false })
}
await browser.close()
console.log('アイコンを作成しました')

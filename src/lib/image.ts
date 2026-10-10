/**
 * 写真の読み込みと縮小、作品画像の書き出し(ブラウザの機能を使う部分)
 * どれも端末の中だけで処理し、外部には送信しない。
 * 元の写真は保存しない。描き直した軽い画像だけを作るので、位置情報などのメタデータは含まれない。
 */
import { dominantColor, labToCss, type Lab } from './color'
import { profileFor } from './sizes'

/** 1枚あたりの上限(これより大きいファイルは受け付けない) */
export const MAX_FILE_BYTES = 50 * 1024 * 1024
const SAMPLE_SIZE = 48

export class ImageError extends Error {}

export type Processed = { thumb: Blob; image?: Blob; color: Lab }

/** 写真を読み込み、作品のサイズに合わせた軽い画像と代表色を作る */
export async function processPhoto(file: Blob, name: string, size: number): Promise<Processed> {
  if (file.type && !file.type.startsWith('image/')) {
    throw new ImageError(`${name} は写真ではないため、使えません`)
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImageError(`${name} は大きすぎます(1枚 50MB まで)`)
  }
  const img = await loadImage(file).catch(() => {
    throw new ImageError(`${name} を読み込めませんでした。この形式(HEIC など)にこのブラウザが対応していない可能性があります`)
  })
  try {
    const profile = profileFor(size)
    const thumb = await resizeToBlob(img, profile.thumbPx, 0.82)
    const image = profile.viewPx > profile.thumbPx ? await resizeToBlob(img, profile.viewPx, 0.85) : undefined

    // 色を調べる用の小さな画像(正方形に切り抜く)
    const sample = makeCanvas(SAMPLE_SIZE, SAMPLE_SIZE)
    const sctx = sample.getContext('2d', { willReadFrequently: true })
    if (!sctx) throw new ImageError('画像の処理に失敗しました')
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    sctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      SAMPLE_SIZE,
      SAMPLE_SIZE,
    )
    const { data } = sctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
    const color = dominantColor(data, SAMPLE_SIZE, SAMPLE_SIZE)
    return { thumb, image, color }
  } finally {
    URL.revokeObjectURL(img.src)
  }
}

/** 長辺を longSide 以下にして JPEG にする(描き直すのでメタデータは残らない) */
async function resizeToBlob(img: HTMLImageElement, longSide: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, longSide / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = makeCanvas(w, h)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageError('画像の処理に失敗しました')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)
  return canvasToBlob(canvas, 'image/jpeg', quality)
}

/** 画像を読み込む(写真の向きはブラウザが自動で正しく直す) */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('decode failed'))
    }
    img.src = URL.createObjectURL(blob)
  })
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new ImageError('画像の作成に失敗しました'))), type, quality)
  })
}

/**
 * 作品を1枚の画像に書き出す(メタデータなし)。
 * @param tiles マス目の順の縮小版(空きは null)
 * @param targets 色の補正で寄せる先の色(マス目の順)
 * @param strength 補正の強さ(0〜1)
 */
export async function renderMosaic(
  tiles: (Blob | null)[],
  size: number,
  targets: (Lab | null)[] = [],
  strength = 0,
): Promise<Blob> {
  const profile = profileFor(size)
  // 縮小版の短い辺に合わせる(4:3 の写真なら長辺の 3/4)
  const tilePx = Math.round(profile.thumbPx * 0.75)
  const gap = size >= 20 ? 0 : Math.max(1, Math.round(tilePx * 0.02))
  const full = size * tilePx + (size - 1) * gap
  const canvas = makeCanvas(full, full)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageError('画像の作成に失敗しました')
  ctx.fillStyle = '#FBFAF7'
  ctx.fillRect(0, 0, full, full)
  for (let i = 0; i < tiles.length; i++) {
    const blob = tiles[i]
    const x = (i % size) * (tilePx + gap)
    const y = Math.floor(i / size) * (tilePx + gap)
    if (!blob) {
      ctx.fillStyle = '#F1EEE8'
      ctx.fillRect(x, y, tilePx, tilePx)
      continue
    }
    const img = await loadImage(blob)
    try {
      // 正方形に切り抜いて描く
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, x, y, tilePx, tilePx)
    } finally {
      URL.revokeObjectURL(img.src)
    }
    const target = targets[i]
    if (target && strength > 0) {
      ctx.globalAlpha = strength
      ctx.fillStyle = labToCss(target)
      ctx.fillRect(x, y, tilePx, tilePx)
      ctx.globalAlpha = 1
    }
  }
  return canvasToBlob(canvas, 'image/jpeg', 0.92)
}

/** 共有シート(スマホ)か、ダウンロード(PC)で画像を渡す */
export async function shareOrDownload(blob: Blob, filename: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file] })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // 共有できなかったらダウンロードにする
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}

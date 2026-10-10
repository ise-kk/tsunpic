/**
 * 写真の読み込みと縮小、作品画像の書き出し(ブラウザの機能を使う部分)
 * どれも端末の中だけで処理し、外部には送信しない。
 */
import { dominantColor, type Lab } from './color'

/** 1枚あたりの上限(これより大きいファイルは受け付けない) */
export const MAX_FILE_BYTES = 50 * 1024 * 1024
const THUMB_LONG_SIDE = 512
const SAMPLE_SIZE = 48

export class ImageError extends Error {}

export type Processed = { original: Blob; thumb: Blob; color: Lab }

/** 写真を読み込み、表示用の縮小版と代表色を作る */
export async function processPhoto(file: File): Promise<Processed> {
  if (!file.type.startsWith('image/') && file.type !== '') {
    throw new ImageError(`${file.name} は写真ではないため、使えません`)
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImageError(`${file.name} は大きすぎます(1枚 50MB まで)`)
  }
  const img = await loadImage(file).catch(() => {
    throw new ImageError(`${file.name} を読み込めませんでした。この形式(HEIC など)にこのブラウザが対応していない可能性があります`)
  })
  try {
    // 縮小版:描き直すことで、撮影場所などのメタデータは含まれない
    const scale = Math.min(1, THUMB_LONG_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const tw = Math.max(1, Math.round(img.naturalWidth * scale))
    const th = Math.max(1, Math.round(img.naturalHeight * scale))
    const thumbCanvas = makeCanvas(tw, th)
    const tctx = thumbCanvas.getContext('2d')
    if (!tctx) throw new ImageError('画像の処理に失敗しました')
    tctx.drawImage(img, 0, 0, tw, th)
    const thumb = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.86)

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
    return { original: file, thumb, color }
  } finally {
    URL.revokeObjectURL(img.src)
  }
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
 */
export async function renderMosaic(tiles: (Blob | null)[], size: number, tilePx = 256): Promise<Blob> {
  const gap = Math.round(tilePx * 0.02)
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

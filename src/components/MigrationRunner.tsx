import { useEffect, useRef } from 'react'
import { migrateLegacyPhotos, slimFarPhotos } from '../db/migrate'
import { useToast } from './Toast'

// 古い形式のデータを、起動時に軽い形式へ変換する
// 1. 元の写真を保存していたデータ(v0.2)
// 2. 遠くから見るサイズなのに、1枚ずつ見るための画像を持っているデータ(v0.3)
export function MigrationRunner() {
  const toast = useToast()
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const notify = (done: number, total: number) => {
      if (done === 1) toast(`保存している写真を軽くしています(${total}枚)`)
    }
    migrateLegacyPhotos(notify)
      .then(async (a) => a + (await slimFarPhotos(notify)))
      .then((n) => {
        if (n > 0) toast(`${n}枚の写真を軽くして保存し直しました`)
      })
      .catch(() => {})
  }, [toast])
  return null
}

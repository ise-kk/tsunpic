import { useEffect, useRef } from 'react'
import { migrateLegacyPhotos } from '../db/migrate'
import { useToast } from './Toast'

// 古い形式(元の写真を保存していた)のデータを、起動時に軽い形式へ変換する
export function MigrationRunner() {
  const toast = useToast()
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    migrateLegacyPhotos((done, total) => {
      if (done === 1) toast(`保存している写真を軽くしています(${total}枚)`)
    })
      .then((n) => {
        if (n > 0) toast(`${n}枚の写真を軽くして保存し直しました`)
      })
      .catch(() => {})
  }, [toast])
  return null
}

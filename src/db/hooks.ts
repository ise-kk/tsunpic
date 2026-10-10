import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'
import type { Photo } from './db'

/** 保存データが変わるたびに自動で読み直す */
export function useLive<T>(query: () => Promise<T>, deps: unknown[]): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined)
  useEffect(() => {
    const sub = liveQuery(query).subscribe({
      next: (v) => setValue(v),
      error: (e) => console.error(e),
    })
    return () => sub.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return value
}

/** 写真の縮小版を表示用の URL にする(使わなくなったら解放する) */
export function useThumbUrls(photos: Photo[] | undefined): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(() => new Map())
  useEffect(() => {
    const next = new Map<string, string>()
    for (const p of photos ?? []) next.set(p.id, URL.createObjectURL(p.thumb))
    setUrls(next)
    return () => {
      for (const url of next.values()) URL.revokeObjectURL(url)
    }
  }, [photos])
  return urls
}

/** 1つの Blob を表示用の URL にする */
export function useBlobUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!blob) {
      setUrl(undefined)
      return
    }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

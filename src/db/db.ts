/**
 * 端末内の保存(IndexedDB)。写真はこの端末から外に出さない。
 * 元の写真は保存せず、作品のサイズに合わせて軽くした画像だけを保存する。
 */
import Dexie, { type EntityTable } from 'dexie'
import type { Lab } from '../lib/color'

export type Work = {
  id: string
  title: string
  /** 1辺のマス数(6 なら 36枚のアート) */
  size: number
  /** 色の補正の強さ(0〜60、0 は補正なし) */
  correction?: number
  createdAt: number
  updatedAt: number
}

export type Photo = {
  id: string
  workId: string
  /** マス目・書き出し用の縮小版(メタデータなし) */
  thumb: Blob
  /** 1枚ずつ見るための画像(メタデータなし)。古いデータでは無いことがある */
  image?: Blob
  /** v0.2 までの元の写真。起動時に軽い画像へ変換して消す */
  original?: Blob
  color: Lab
  /** アプリ内で撮った写真か */
  captured: boolean
  addedAt: number
}

export class TsunpicDB extends Dexie {
  works!: EntityTable<Work, 'id'>
  photos!: EntityTable<Photo, 'id'>

  constructor(name = 'tsunpic') {
    super(name)
    this.version(1).stores({
      works: 'id, updatedAt',
      photos: 'id, workId, addedAt',
    })
  }
}

export const db = new TsunpicDB()

export function newId(): string {
  return crypto.randomUUID()
}

/** ブラウザに「容量が足りなくなっても消さないで」とお願いする(断られても動作は続ける) */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

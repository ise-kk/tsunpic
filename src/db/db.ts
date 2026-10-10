/**
 * 端末内の保存(IndexedDB)。写真はこの端末から外に出さない。
 */
import Dexie, { type EntityTable } from 'dexie'
import type { Lab } from '../lib/color'

export type Work = {
  id: string
  title: string
  /** 1辺のマス数(6 なら 36枚のアート) */
  size: number
  createdAt: number
  updatedAt: number
}

export type Photo = {
  id: string
  workId: string
  /** 元の写真(画質を落とさない) */
  original: Blob
  /** 表示・書き出し用の縮小版(長辺 512px、メタデータなし) */
  thumb: Blob
  color: Lab
  /** アプリ内で撮った写真か(写真アプリへの保存をすすめるため) */
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

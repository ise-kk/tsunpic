import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { IconBack, IconCamera, IconEdit, IconMore, IconPhotos } from '../components/icons'
import { MosaicGrid } from '../components/MosaicGrid'
import { Sheet } from '../components/Sheet'
import { useToast } from '../components/Toast'
import ui from '../components/ui.module.css'
import { Viewer } from '../components/Viewer'
import { db, type Photo } from '../db/db'
import { useLive, useThumbUrls } from '../db/hooks'
import { addPhotos, deleteWork, LimitError, MAX_PHOTOS_PER_WORK, removePhoto, renameWork } from '../db/repo'
import { arrange } from '../lib/arrange'
import { ImageError, processPhoto, renderMosaic, shareOrDownload } from '../lib/image'
import styles from './WorkPage.module.css'

export function WorkPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const work = useLive(() => db.works.get(id), [id])
  const photos = useLive(() => db.photos.where('workId').equals(id).sortBy('addedAt'), [id])
  const urls = useThumbUrls(photos)

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [lastAdded, setLastAdded] = useState<Set<string>>(new Set())
  const pickRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const size = work?.size ?? 6
  const total = size * size
  const placement = useMemo(() => arrange(photos ?? [], size), [photos, size])
  const filled = placement.grid.filter(Boolean).length
  const complete = filled === total
  // 鑑賞画面で前後に送る順番:マス目の順 → 控え
  const viewList = useMemo(
    () => [...(placement.grid.filter(Boolean) as Photo[]), ...placement.bench],
    [placement],
  )

  const handleFiles = useCallback(
    async (e: ChangeEvent<HTMLInputElement>, captured: boolean) => {
      const input = e.currentTarget
      const files = Array.from(input.files ?? [])
      input.value = '' // 同じ写真をもう一度選べるようにする
      if (!work || files.length === 0) return
      const room = MAX_PHOTOS_PER_WORK - (photos?.length ?? 0)
      if (room <= 0) {
        toast(`1つの作品に入れられる写真は ${MAX_PHOTOS_PER_WORK} 枚までです`)
        return
      }
      const targets = files.slice(0, room)
      const errors: string[] = []
      const ready: { original: Blob; thumb: Blob; color: Photo['color']; captured: boolean }[] = []
      setProgress({ done: 0, total: targets.length })
      for (const [i, file] of targets.entries()) {
        try {
          const p = await processPhoto(file)
          ready.push({ ...p, captured })
        } catch (err) {
          errors.push(err instanceof ImageError ? err.message : `${file.name} を読み込めませんでした`)
        }
        setProgress({ done: i + 1, total: targets.length })
      }
      const benchBefore = placement.bench.length
      try {
        if (ready.length > 0) await addPhotos(work.id, ready)
      } catch (err) {
        setProgress(null)
        toast(
          err instanceof LimitError
            ? err.message
            : '保存できませんでした。端末の空き容量が足りない可能性があります。',
        )
        return
      }
      setProgress(null)
      const after = await db.photos.where('workId').equals(work.id).sortBy('addedAt')
      const newIds = new Set(after.slice(after.length - ready.length).map((p) => p.id))
      setLastAdded(newIds)
      window.setTimeout(() => setLastAdded(new Set()), 3000)
      const benchAfter = arrange(after, work.size).bench.length
      const parts: string[] = []
      if (ready.length > 0) parts.push(`${ready.length}枚を入れました`)
      if (benchAfter > benchBefore) parts.push(`${benchAfter - benchBefore}枚を控えに入れました`)
      if (files.length > targets.length) parts.push(`上限のため ${files.length - targets.length}枚は入れませんでした`)
      if (errors.length > 0) parts.push(`${errors.length}枚は読み込めませんでした`)
      toast(parts.join('。') || '写真を入れられませんでした')
      if (errors.length > 0) console.warn(errors)
    },
    [work, photos, placement.bench.length, toast],
  )

  const exportImage = async () => {
    if (!work) return
    setExporting(true)
    try {
      const blob = await renderMosaic(
        placement.grid.map((p) => p?.thumb ?? null),
        work.size,
      )
      const result = await shareOrDownload(blob, `${safeFileName(work.title)}.jpg`)
      if (result === 'downloaded') toast('画像を保存しました')
    } catch {
      toast('画像を作れませんでした。もう一度お試しください。')
    } finally {
      setExporting(false)
    }
  }

  if (work === undefined && photos === undefined) return <main className={ui.page} aria-busy="true" />
  if (!work) {
    return (
      <main className={ui.page}>
        <p>この作品は見つかりませんでした。</p>
        <Link to="/" className={ui.secondary}>
          ホームにもどる
        </Link>
      </main>
    )
  }

  const left = total - filled

  return (
    <main className={ui.page}>
      <div className={ui.topBar}>
        <Link to="/" className={ui.iconButton} aria-label="ホームにもどる">
          <IconBack />
        </Link>
        <button type="button" className={styles.titleButton} onClick={() => setRenameOpen(true)}>
          <span className={styles.title}>{work.title}</span>
          <span className={styles.sub}>
            {total}枚のアート <IconEdit size={12} />
          </span>
        </button>
        <button type="button" className={ui.iconButton} onClick={() => setMenuOpen(true)} aria-label="メニュー">
          <IconMore />
        </button>
      </div>

      <MosaicGrid
        grid={placement.grid}
        size={work.size}
        urls={urls}
        highlightIds={lastAdded}
        onOpen={(pid) => setViewerIndex(viewList.findIndex((p) => p.id === pid))}
      />

      <div className={styles.progressRow}>
        <div className={styles.count}>
          {filled}
          <span className={styles.countTotal}> / {total}枚</span>
        </div>
        <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={filled} aria-label="埋まったマス">
          <div className={styles.barFill} style={{ width: `${(filled / total) * 100}%` }} />
        </div>
      </div>

      <p className={styles.message}>
        {complete
          ? '完成しました。写真をタップすると1枚ずつ大きく見られます。'
          : filled === 0
            ? '写真を入れると、色のグラデーションになるように自動で並びます。'
            : `あと${left}枚で完成。写真を足すと、全体が並び直します。`}
      </p>

      {complete && (
        <div className={ui.row2}>
          <button type="button" className={ui.primary} onClick={exportImage} disabled={exporting}>
            {exporting ? '作成中…' : '画像を保存・共有'}
          </button>
          <button type="button" className={ui.secondary} onClick={() => pickRef.current?.click()}>
            写真を足す
          </button>
        </div>
      )}
      {complete && <p className={ui.note}>保存する画像には、撮影場所などの情報は含まれません。</p>}

      {!complete && (
        <div className={ui.row2}>
          <button type="button" className={ui.primary} onClick={() => pickRef.current?.click()} disabled={!!progress}>
            <IconPhotos /> 写真を選ぶ
          </button>
          <button type="button" className={ui.secondary} onClick={() => cameraRef.current?.click()} disabled={!!progress}>
            <IconCamera /> 撮る
          </button>
        </div>
      )}

      <input
        ref={pickRef}
        type="file"
        accept="image/*"
        multiple
        className={ui.hiddenInput}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => handleFiles(e, false)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={ui.hiddenInput}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => handleFiles(e, true)}
      />

      {placement.bench.length > 0 && (
        <section className={styles.bench} aria-labelledby="bench-title">
          <h2 id="bench-title" className={styles.benchTitle}>
            控え {placement.bench.length}枚
          </h2>
          <p className={ui.note}>グラデーションに合いにくい写真です。作品の写真を外すと、合うものが自動で入ります。</p>
          <div className={styles.benchList}>
            {placement.bench.map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.benchItem}
                onClick={() => setViewerIndex(viewList.findIndex((v) => v.id === p.id))}
                aria-label="控えの写真を大きく見る"
              >
                {urls.get(p.id) && <img src={urls.get(p.id)} alt="" />}
              </button>
            ))}
          </div>
        </section>
      )}

      {progress && (
        <div className={styles.overlay} role="status" aria-live="polite">
          <div className={styles.overlayCard}>
            <p>
              写真を読み込み中… {progress.done} / {progress.total}
            </p>
            <p className={ui.note}>写真はこの端末の中だけで処理しています</p>
          </div>
        </div>
      )}

      {viewerIndex !== null && viewerIndex >= 0 && (
        <Viewer
          photos={viewList}
          index={Math.min(viewerIndex, viewList.length - 1)}
          benchFrom={viewList.length - placement.bench.length}
          onIndex={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          onSaveOriginal={async (p) => {
            const r = await shareOrDownload(p.original, `photo-${p.id.slice(0, 8)}.jpg`)
            if (r === 'downloaded') toast('写真を保存しました')
          }}
          onRemove={async (p) => {
            await removePhoto(p.id)
            toast('写真を外しました')
            if (viewList.length <= 1) setViewerIndex(null)
            else setViewerIndex((i) => Math.max(0, Math.min((i ?? 0), viewList.length - 2)))
          }}
        />
      )}

      <Sheet open={menuOpen} onClose={() => { setMenuOpen(false); setConfirmDelete(false) }} title="作品のメニュー">
        <button type="button" className={ui.secondary} onClick={() => { setMenuOpen(false); setRenameOpen(true) }}>
          名前を変える
        </button>
        {confirmDelete ? (
          <button
            type="button"
            className={ui.danger}
            onClick={async () => {
              await deleteWork(work.id)
              navigate('/', { replace: true })
            }}
          >
            本当に削除する(写真もこの端末から消えます)
          </button>
        ) : (
          <button type="button" className={ui.danger} onClick={() => setConfirmDelete(true)}>
            この作品を削除
          </button>
        )}
      </Sheet>

      <RenameSheet
        open={renameOpen}
        initial={work.title}
        onClose={() => setRenameOpen(false)}
        onSave={async (t) => {
          await renameWork(work.id, t)
          setRenameOpen(false)
        }}
      />
    </main>
  )
}

function RenameSheet(props: { open: boolean; initial: string; onClose: () => void; onSave: (t: string) => void }) {
  const [value, setValue] = useState(props.initial)
  useEffect(() => {
    if (props.open) setValue(props.initial)
  }, [props.open, props.initial])
  return (
    <Sheet open={props.open} onClose={props.onClose} title="作品の名前">
      <form
        className={styles.renameForm}
        onSubmit={(e) => {
          e.preventDefault()
          props.onSave(value)
        }}
      >
        <label className="visually-hidden" htmlFor="work-title">
          作品の名前
        </label>
        <input
          id="work-title"
          className={styles.input}
          value={value}
          maxLength={40}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" className={ui.primary}>
          保存
        </button>
      </form>
    </Sheet>
  )
}

/** ファイル名に使えない文字を取り除く */
export function safeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').trim()
  return cleaned.slice(0, 40) || 'tsunpic'
}

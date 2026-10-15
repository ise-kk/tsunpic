import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { IconBack, IconCamera, IconEdit, IconMore, IconPhotos } from '../components/icons'
import { MosaicGrid } from '../components/MosaicGrid'
import { ProgressOverlay } from '../components/ProgressOverlay'
import { Sheet } from '../components/Sheet'
import { useToast } from '../components/Toast'
import ui from '../components/ui.module.css'
import { Viewer } from '../components/Viewer'
import { db, type Photo } from '../db/db'
import { useLive, useThumbUrls } from '../db/hooks'
import {
  addPhotos,
  CORRECTION_DEFAULT,
  CORRECTION_MAX,
  deleteWork,
  LimitError,
  removePhoto,
  renameWork,
  setCorrection,
  type NewPhoto,
} from '../db/repo'
import { arrange, correctionTargets } from '../lib/arrange'
import { ImageError, processPhoto, renderMosaic, shareOrDownload } from '../lib/image'
import { maxPhotosFor, profileFor } from '../lib/sizes'
import styles from './WorkPage.module.css'

/** 何枚読み込むごとに保存するか */
const SAVE_EVERY = 20

type Progress = { done: number; total: number; startedAt: number }

/** 残り時間の目安(3枚読み込むまでは出さない) */
function etaSeconds(p: Progress): number | null {
  if (p.done < 3) return null
  const per = (Date.now() - p.startedAt) / p.done / 1000
  return per * (p.total - p.done)
}

/** 読み込み中に画面が暗くならないようにする(できないブラウザでは何もしない) */
async function requestWakeLock(): Promise<{ release: () => Promise<void> } | null> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    return (await nav.wakeLock?.request('screen')) ?? null
  } catch {
    return null
  }
}

/** 遠くから見るサイズでは、鑑賞画面で小さな画像をこの大きさで見せる(1枚ずつ見るサイズでは undefined) */
function farCompactPx(size: number): number | undefined {
  const p = profileFor(size)
  return p.viewPx === null ? Math.max(p.thumbPx, 128) : undefined
}

export function WorkPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const work = useLive(() => db.works.get(id), [id])
  const photos = useLive(() => db.photos.where('workId').equals(id).sortBy('addedAt'), [id])
  const urls = useThumbUrls(photos)

  const [progress, setProgress] = useState<Progress | null>(null)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [lastAdded, setLastAdded] = useState<Set<string>>(new Set())
  /** アプリで撮った直後の写真(写真アプリへの保存をすすめる) */
  const [captured, setCaptured] = useState<File | null>(null)
  const pickRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const size = work?.size ?? 6
  const total = size * size
  const correction = work?.correction ?? 0
  const placement = useMemo(() => arrange(photos ?? [], size), [photos, size])
  const targets = useMemo(() => correctionTargets(placement.grid, size), [placement, size])
  const filled = placement.grid.filter(Boolean).length
  const complete = filled === total
  // 鑑賞画面で前後に送る順番:マス目の順 → 控え
  const viewList = useMemo(
    () => [...(placement.grid.filter(Boolean) as Photo[]), ...placement.bench],
    [placement],
  )

  const cancelRef = useRef(false)
  const [cancelling, setCancelling] = useState(false)

  const handleFiles = useCallback(
    async (e: ChangeEvent<HTMLInputElement>, isCapture: boolean) => {
      const input = e.currentTarget
      const files = Array.from(input.files ?? [])
      input.value = '' // 同じ写真をもう一度選べるようにする
      if (!work || files.length === 0) return
      const limit = maxPhotosFor(work.size)
      const room = limit - (photos?.length ?? 0)
      if (room <= 0) {
        toast(`この作品に入れられる写真は ${limit} 枚までです`)
        return
      }
      const targetFiles = files.slice(0, room)
      const errors: string[] = []
      const benchBefore = placement.bench.length
      const added: string[] = []
      let pending: NewPhoto[] = []
      let saveFailed: string | null = null
      cancelRef.current = false
      setCancelling(false)
      const startedAt = Date.now()
      setProgress({ done: 0, total: targetFiles.length, startedAt })
      const wake = await requestWakeLock()

      // 読み込んだ写真から少しずつ保存する(途中で止まっても、そこまでの写真は残る)
      const flush = async () => {
        if (pending.length === 0) return
        const batch = pending
        pending = []
        const ids = await addPhotos(work.id, batch)
        added.push(...ids)
        setLastAdded(new Set(ids))
      }

      try {
        for (const [i, file] of targetFiles.entries()) {
          if (cancelRef.current) break
          try {
            const p = await processPhoto(file, file.name, work.size)
            pending.push({ ...p, captured: isCapture })
          } catch (err) {
            errors.push(err instanceof ImageError ? err.message : `${file.name} を読み込めませんでした`)
          }
          if (pending.length >= SAVE_EVERY) await flush()
          setProgress({ done: i + 1, total: targetFiles.length, startedAt })
        }
        await flush()
      } catch (err) {
        saveFailed =
          err instanceof LimitError ? err.message : '保存できませんでした。端末の空き容量が足りない可能性があります。'
      } finally {
        void wake?.release().catch(() => {})
        setProgress(null)
        setCancelling(false)
        window.setTimeout(() => setLastAdded(new Set()), 3000)
      }

      if (saveFailed) {
        toast(saveFailed)
        return
      }
      const after = await db.photos.where('workId').equals(work.id).toArray()
      const benchAfter = arrange(after, work.size).bench.length
      const parts: string[] = []
      if (added.length > 0) parts.push(`${added.length}枚を入れました`)
      if (cancelRef.current) parts.push('途中で止めました')
      if (benchAfter > benchBefore) parts.push(`${benchAfter - benchBefore}枚を控えに入れました`)
      if (files.length > targetFiles.length) parts.push(`上限のため ${files.length - targetFiles.length}枚は入れませんでした`)
      if (errors.length > 0) parts.push(`${errors.length}枚は読み込めませんでした`)
      toast(parts.join('。') || '写真を入れられませんでした')
      if (errors.length > 0) console.warn(errors)
      // アプリで撮った写真は写真アプリに残らないので、保存をすすめる
      if (isCapture && added.length > 0 && targetFiles[0]) setCaptured(targetFiles[0])
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
        targets,
        correction / 100,
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
            {total}枚のアート{correction > 0 ? ` · 補正 ${correction}%` : ''} <IconEdit size={12} />
          </span>
        </button>
        <button type="button" className={ui.iconButton} onClick={() => setMenuOpen(true)} aria-label="作品のメニュー">
          <IconMore />
        </button>
      </div>

      <MosaicGrid
        grid={placement.grid}
        size={work.size}
        urls={urls}
        targets={targets}
        strength={correction / 100}
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
            {placement.bench.slice(0, 60).map((p) => (
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
        <ProgressOverlay
          done={progress.done}
          total={progress.total}
          etaSec={etaSeconds(progress)}
          cancelling={cancelling}
          onCancel={() => {
            cancelRef.current = true
            setCancelling(true)
          }}
        />
      )}

      {viewerIndex !== null && viewerIndex >= 0 && (
        <Viewer
          photos={viewList}
          index={Math.min(viewerIndex, viewList.length - 1)}
          benchFrom={viewList.length - placement.bench.length}
          onIndex={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          compactPx={farCompactPx(size)}
          onRemove={async (p) => {
            await removePhoto(p.id)
            toast('写真を外しました')
            if (viewList.length <= 1) setViewerIndex(null)
            else setViewerIndex((i) => Math.max(0, Math.min(i ?? 0, viewList.length - 2)))
          }}
        />
      )}

      <Sheet open={menuOpen} onClose={() => { setMenuOpen(false); setConfirmDelete(false) }} title="作品のメニュー">
        <CorrectionControl
          value={correction}
          onChange={(v) => void setCorrection(work.id, v)}
        />
        <hr className={styles.hr} />
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

      <Sheet open={captured !== null} onClose={() => setCaptured(null)} title="マスに入りました">
        <p className={styles.sheetText}>
          アプリで撮った写真は、写真アプリには残っていません。元の画質で残しておきますか?
        </p>
        <button
          type="button"
          className={ui.primary}
          onClick={async () => {
            const f = captured
            setCaptured(null)
            if (!f) return
            const r = await shareOrDownload(f, f.name || 'photo.jpg')
            if (r === 'downloaded') toast('写真を保存しました')
          }}
        >
          写真アプリにも保存
        </button>
        <button type="button" className={ui.secondary} onClick={() => setCaptured(null)}>
          保存しない
        </button>
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

/** 色の補正:スイッチを入れると 30% から始まり、強さのスライダーが出る */
function CorrectionControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const on = value > 0
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  return (
    <div className={styles.correction}>
      <div className={styles.switchRow}>
        <div>
          <div className={styles.switchLabel} id="corr-label">
            色の補正
          </div>
          <div className={ui.note}>マスの色をグラデーションに寄せる(写真そのものは変わりません)</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="corr-label"
          className={styles.switch}
          data-on={on || undefined}
          onClick={() => onChange(on ? 0 : CORRECTION_DEFAULT)}
        >
          <span className={styles.knob} />
        </button>
      </div>
      {on && (
        <div className={styles.sliderRow}>
          <div className={styles.sliderHead}>
            <label htmlFor="corr-range">強さ</label>
            <span className={styles.sliderValue}>{local}%</span>
          </div>
          <input
            id="corr-range"
            type="range"
            min={5}
            max={CORRECTION_MAX}
            step={5}
            value={local}
            className={styles.range}
            onChange={(e) => {
              const v = Number(e.target.value)
              setLocal(v)
              onChange(v)
            }}
          />
        </div>
      )}
    </div>
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

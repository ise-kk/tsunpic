import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { InstallHint } from '../components/InstallHint'
import { MosaicMark } from '../components/MosaicMark'
import ui from '../components/ui.module.css'
import { db, type Photo, type Work } from '../db/db'
import { useLive } from '../db/hooks'
import { arrange } from '../lib/arrange'
import { labToCss } from '../lib/color'
import styles from './HomePage.module.css'

export function HomePage() {
  const works = useLive(() => db.works.orderBy('updatedAt').reverse().toArray(), [])
  // 一覧では色だけを使う(写真そのものは読み込まない)
  const colors = useLive(
    async () => {
      const all = await db.photos.toArray()
      return all.map((p) => ({ id: p.id, workId: p.workId, color: p.color, addedAt: p.addedAt }))
    },
    [],
  )

  const hasWorks = (works?.length ?? 0) > 0

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <MosaicMark size={3} hole={[2, 2]} />
          </span>
          <h1 className={styles.brandName}>Tsunpic</h1>
        </div>
        <Link to="/settings" className={styles.settingsLink}>
          設定とデータ
        </Link>
      </header>

      <InstallHint />

      {works && !hasWorks && (
        <section className={styles.empty} aria-labelledby="empty-title">
          <div className={styles.emptyArt}>
            <MosaicMark label="一部が空いたモザイクのイラスト" />
          </div>
          <h2 id="empty-title" className={styles.emptyTitle}>
            まだ作品がありません
          </h2>
          <p className={styles.emptyText}>
            旅行の写真などを選ぶと、色のグラデーションになるように並べて、1枚のアートに仕上げます。
          </p>
        </section>
      )}

      {hasWorks && (
        <section className={styles.works} aria-labelledby="works-title">
          <h2 id="works-title" className={styles.sectionTitle}>
            作品
          </h2>
          {works!.map((w) => (
            <WorkCard key={w.id} work={w} photos={(colors ?? []).filter((c) => c.workId === w.id)} />
          ))}
        </section>
      )}

      <section className={styles.modes} aria-label="モードをえらぶ">
        <Link to="/new" className={styles.modeCard}>
          <span className={styles.modeTitle}>ならべる</span>
          <span className={styles.modeText}>好きな写真を、きれいなグラデーションに</span>
          <span className={styles.go}>はじめる</span>
        </Link>
        <div className={styles.modeCard} aria-disabled="true">
          <span className={styles.modeTitle}>つくる</span>
          <span className={styles.modeText}>作りたい絵のために、写真を集める</span>
          <span className={styles.soon}>準備中</span>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>写真はこの端末の中だけで扱います。外部に送信されることはありません。</p>
        <nav className={styles.footLinks} aria-label="規約など">
          <Link to="/privacy">プライバシー</Link>
          <Link to="/terms">利用規約</Link>
        </nav>
      </footer>
    </main>
  )
}

type ColorOnly = Pick<Photo, 'id' | 'workId' | 'color' | 'addedAt'>

function WorkCard({ work, photos }: { work: Work; photos: ColorOnly[] }) {
  const { grid } = useMemo(() => arrange(photos, work.size), [photos, work.size])
  const filled = grid.filter(Boolean).length
  const total = work.size * work.size
  return (
    <Link to={`/work/${work.id}`} className={styles.workCard}>
      <div className={styles.workMini} style={{ gridTemplateColumns: `repeat(${work.size}, minmax(0, 1fr))` }} aria-hidden="true">
        {grid.map((p, i) => (
          <span key={p?.id ?? `e${i}`} className={styles.miniCell} style={p ? { background: labToCss(p.color) } : undefined} />
        ))}
      </div>
      <div className={styles.workInfo}>
        <span className={styles.workTitle}>{work.title}</span>
        <span className={ui.note}>{filled === total ? '完成' : `${filled} / ${total}枚`}</span>
        <span className={styles.workBar}>
          <span style={{ width: `${(filled / total) * 100}%` }} />
        </span>
      </div>
    </Link>
  )
}

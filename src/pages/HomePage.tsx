import { InstallHint } from '../components/InstallHint'
import { MosaicMark } from '../components/MosaicMark'
import styles from './HomePage.module.css'

export function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <MosaicMark size={3} hole={[2, 2]} />
          </span>
          <h1 className={styles.brandName}>Tsunpic</h1>
        </div>
      </header>

      <InstallHint />

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

      <section className={styles.modes} aria-label="モードをえらぶ">
        <button type="button" className={styles.modeCard} disabled aria-describedby="narabe-soon">
          <span className={styles.modeTitle}>ならべる</span>
          <span className={styles.modeText}>好きな写真を、きれいなグラデーションに</span>
          <span id="narabe-soon" className={styles.soon}>
            準備中
          </span>
        </button>
        <button type="button" className={styles.modeCard} disabled aria-describedby="tsukuru-soon">
          <span className={styles.modeTitle}>つくる</span>
          <span className={styles.modeText}>作りたい絵のために、写真を集める</span>
          <span id="tsukuru-soon" className={styles.soon}>
            準備中
          </span>
        </button>
      </section>

      <footer className={styles.footer}>
        <p>写真はこの端末の中だけで扱います。外部に送信されることはありません。</p>
      </footer>
    </main>
  )
}

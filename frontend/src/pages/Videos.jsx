import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPosts } from '../api'
import NavHeader from '../components/NavHeader'

export default function Videos() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPosts(null, null, 'video').then(setPosts).catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const pinned = posts.find(p => p.is_pinned)
  const feed = posts.filter(p => !p.is_pinned)

  return (
    <div style={styles.page}>
      <NavHeader />
      <div className="page-body" style={styles.body}>
        <p style={styles.sectionLabel}>videos</p>

        {loading ? (
          <p style={styles.muted}>loading...</p>
        ) : posts.length === 0 ? (
          <p style={styles.muted}>no videos yet.</p>
        ) : (
          <div style={styles.grid}>
            {pinned && <VideoCard post={pinned} navigate={navigate} pinned />}
            {feed.map(p => <VideoCard key={p.id} post={p} navigate={navigate} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function VideoCard({ post, navigate, pinned }) {
  return (
    <div style={{ ...styles.card, ...(pinned ? styles.pinnedCard : {}) }} onClick={() => navigate(`/post/${post.id}`)}>
      <div style={styles.thumbWrap}>
        {post.thumbnail_path ? (
          <img src={`/uploads/${post.thumbnail_path}`} alt={post.title} style={styles.thumb} />
        ) : (
          <div style={styles.thumbPlaceholder}>▶</div>
        )}
        {post.media_type === 'video' && <span style={styles.playOverlay}>▶</span>}
        {pinned && <span style={styles.pinnedBadge}>📌</span>}
      </div>
      <div style={styles.cardMeta}>
        <span style={styles.cardTitle}>{post.title}</span>
        <span style={styles.cardDate}>
          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  body: { maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' },
  sectionLabel: { color: 'var(--accent)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 },
  muted: { color: 'var(--text-muted)', fontSize: '13px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' },
  card: { cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' },
  pinnedCard: { border: '1px solid var(--accent)', borderRadius: '6px', padding: '8px' },
  thumbWrap: { position: 'relative', aspectRatio: '16/9', background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden' },
  thumb: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  thumbPlaceholder: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', fontSize: '28px',
  },
  playOverlay: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.85)', fontSize: '32px', pointerEvents: 'none',
    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
  },
  pinnedBadge: { position: 'absolute', top: '6px', left: '6px', fontSize: '13px' },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '4px' },
  cardTitle: { fontSize: '14px', fontWeight: 'bold', lineHeight: '1.3' },
  cardDate: { fontSize: '12px', color: 'var(--text-muted)' },
}

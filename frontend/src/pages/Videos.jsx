import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPosts } from '../api'
import { usePlayer } from '../context/PlayerContext'

export default function Videos() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const { loadPost, currentPost } = usePlayer()

  useEffect(() => {
    listPosts(null, null, 'video').then(setPosts).catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const pinned = posts.find(p => p.is_pinned)
  const feed = posts.filter(p => !p.is_pinned)

  function handlePlay(post) {
    loadPost(post, posts)
  }

  return (
    <div className="page-body" style={styles.body}>
      <p style={styles.sectionLabel}>videos</p>

      {loading ? (
        <p style={styles.muted}>loading...</p>
      ) : posts.length === 0 ? (
        <p style={styles.muted}>no videos yet.</p>
      ) : (
        <div style={styles.grid}>
          {pinned && (
            <VideoCard
              post={pinned}
              onPlay={handlePlay}
              onView={() => navigate(`/post/${pinned.id}`)}
              nowPlaying={currentPost?.id === pinned.id}
              pinned
            />
          )}
          {feed.map(p => (
            <VideoCard
              key={p.id}
              post={p}
              onPlay={handlePlay}
              onView={() => navigate(`/post/${p.id}`)}
              nowPlaying={currentPost?.id === p.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function VideoCard({ post, onPlay, onView, nowPlaying, pinned }) {
  return (
    <div style={{ ...styles.card, ...(nowPlaying ? styles.nowPlayingCard : pinned ? styles.pinnedCard : {}) }}>
      <div style={styles.thumbWrap} onClick={() => onPlay(post)}>
        {post.thumbnail_path ? (
          <img src={`/uploads/${post.thumbnail_path}`} alt={post.title} style={styles.thumb} />
        ) : (
          <div style={styles.thumbPlaceholder}>▶</div>
        )}
        <span style={{ ...styles.overlay, ...(nowPlaying ? styles.overlayPlaying : {}) }}>
          {nowPlaying ? '♪' : '▶'}
        </span>
        {pinned && <span style={styles.pinnedBadge}>📌</span>}
      </div>
      <div style={styles.cardMeta}>
        <span style={{ ...styles.cardTitle, ...(nowPlaying ? { color: 'var(--accent)' } : {}) }}>
          {post.title}
        </span>
        <div style={styles.cardFooter}>
          <span style={styles.cardDate}>
            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span style={styles.viewLink} onClick={onView}>view →</span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  body: { maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' },
  sectionLabel: { color: 'var(--accent)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 },
  muted: { color: 'var(--text-muted)', fontSize: '13px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' },
  card: { display: 'flex', flexDirection: 'column', gap: '8px' },
  pinnedCard: { border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' },
  nowPlayingCard: { border: '1px solid var(--accent)', borderRadius: '6px', padding: '8px' },
  thumbWrap: {
    position: 'relative', aspectRatio: '16/9', background: 'var(--surface)',
    borderRadius: '4px', overflow: 'hidden', cursor: 'pointer',
  },
  thumb: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  thumbPlaceholder: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', fontSize: '28px',
  },
  overlay: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.7)', fontSize: '28px', pointerEvents: 'none',
  },
  overlayPlaying: { color: 'var(--accent)' },
  pinnedBadge: { position: 'absolute', top: '6px', left: '6px', fontSize: '13px' },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '4px' },
  cardTitle: { fontSize: '14px', fontWeight: 'bold', lineHeight: '1.3' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: '12px', color: 'var(--text-muted)' },
  viewLink: { fontSize: '12px', color: 'var(--accent)', cursor: 'pointer' },
}

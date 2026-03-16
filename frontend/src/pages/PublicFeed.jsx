import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicFeed } from '../api'
import NavHeader from '../components/NavHeader'

function PostCard({ post, navigate, pinned }) {
  return (
    <div
      style={{ ...styles.card, ...(pinned ? styles.pinnedCard : {}) }}
      onClick={() => navigate(`/post/${post.id}`)}
    >
      {pinned && <span style={styles.pinnedBadge}>📌 pinned</span>}
      <div style={styles.cardInner}>
        {post.thumbnail_path && (
          <img
            src={`/uploads/${post.thumbnail_path}`}
            alt={post.title}
            style={styles.thumb}
          />
        )}
        {!post.thumbnail_path && post.media_type === 'video' && (
          <div style={styles.thumbPlaceholder}>▶</div>
        )}
        <div style={styles.cardMeta}>
          <span style={styles.cardTitle}>{post.title}</span>
          <span style={styles.cardByline}>
            <span style={styles.username}>@{post.user.username}</span>
            {post.user.title && (
              <span style={styles.titleBadge}> ✦ {post.user.title}</span>
            )}
          </span>
          {post.description && (
            <span style={styles.cardDesc}>
              {post.description.length > 100
                ? post.description.slice(0, 100) + '…'
                : post.description}
            </span>
          )}
          <span style={styles.cardDate}>
            {new Date(post.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PublicFeed() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicFeed()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const pinned = posts.find((p) => p.is_pinned)
  const feed = posts.filter((p) => !p.is_pinned)

  return (
    <div style={styles.page}>
      <NavHeader />
      <div className="page-body" style={styles.body}>
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>wicky.tv</h1>
          <p style={styles.heroSub}>doom-maxxing 24/7</p>
          <div style={styles.heroActions}>
            <button style={styles.loginBtn} onClick={() => navigate('/login')}>
              log in
            </button>
            <span style={styles.requestLink} onClick={() => navigate('/login')}>
              request an invite
            </span>
          </div>
        </div>

        {loading ? (
          <p style={styles.muted}>loading...</p>
        ) : posts.length === 0 ? (
          <p style={styles.muted}>nothing here yet.</p>
        ) : (
          <div style={styles.feed}>
            {pinned && (
              <PostCard post={pinned} navigate={navigate} pinned />
            )}
            {feed.map((p) => (
              <PostCard key={p.id} post={p} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  body: {
    maxWidth: '600px', width: '100%', margin: '0 auto',
    display: 'flex', flexDirection: 'column', gap: '24px',
  },
  hero: {
    borderBottom: '1px solid var(--border)',
    paddingBottom: '24px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  heroTitle: {
    fontSize: '28px', margin: 0, color: 'var(--accent)',
  },
  heroSub: {
    color: 'var(--text-muted)', fontSize: '14px', margin: 0,
  },
  heroActions: {
    display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px',
  },
  loginBtn: {
    background: 'var(--accent)', color: '#000', border: 'none',
    borderRadius: '4px', padding: '7px 20px', cursor: 'pointer',
    fontSize: '13px', fontWeight: 'bold',
  },
  requestLink: {
    color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
    textDecoration: 'underline',
  },
  muted: { color: 'var(--text-muted)', fontSize: '13px' },
  feed: { display: 'flex', flexDirection: 'column', gap: '2px' },
  card: {
    borderBottom: '1px solid var(--border)',
    padding: '14px 0', cursor: 'pointer',
  },
  pinnedCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '14px',
    marginBottom: '8px',
  },
  pinnedBadge: {
    fontSize: '11px', color: 'var(--text-muted)',
    display: 'block', marginBottom: '8px',
  },
  cardInner: {
    display: 'flex', gap: '14px', alignItems: 'flex-start',
  },
  thumb: {
    width: '72px', height: '72px', objectFit: 'cover',
    borderRadius: '4px', flexShrink: 0,
    border: '1px solid var(--border)',
  },
  thumbPlaceholder: {
    width: '72px', height: '72px', background: 'var(--surface)',
    borderRadius: '4px', flexShrink: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', fontSize: '20px',
    border: '1px solid var(--border)',
  },
  cardMeta: {
    display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0,
  },
  cardTitle: {
    fontSize: '15px', fontWeight: 'bold',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardByline: { fontSize: '13px' },
  username: { color: 'var(--accent)' },
  titleBadge: { color: 'var(--title, #00e8c8)' },
  cardDesc: {
    fontSize: '13px', color: 'var(--text-muted)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardDate: { fontSize: '12px', color: 'var(--text-muted)' },
}

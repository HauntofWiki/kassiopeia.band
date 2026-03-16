import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFeed } from '../api'
import { useAuth } from '../App'
import NavHeader from '../components/NavHeader'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('new')

  useEffect(() => {
    getFeed(sort).then(setPosts).catch(() => {}).finally(() => setLoading(false))
    const id = setInterval(() => { getFeed(sort).then(setPosts).catch(() => {}) }, 10000)
    return () => clearInterval(id)
  }, [sort])

  return (
    <div style={styles.page}>
      <NavHeader />

      <div className="page-body" style={styles.body}>
        <p style={styles.welcome}>hey, {user?.display_name || user?.username}.</p>
        <div style={styles.feedHeader}>
          <p style={styles.feedLabel}>morioh</p>
          <div style={styles.sortToggle}>
            <span
              style={{ ...styles.sortBtn, ...(sort === 'new' ? styles.sortBtnActive : {}) }}
              onClick={() => setSort('new')}
            >new</span>
            <span
              style={{ ...styles.sortBtn, ...(sort === 'active' ? styles.sortBtnActive : {}) }}
              onClick={() => setSort('active')}
            >active</span>
          </div>
        </div>

        {loading ? (
          <p style={styles.muted}>loading...</p>
        ) : posts.length === 0 ? (
          <p style={styles.muted}>nothing here yet. invite some people.</p>
        ) : (
          <div style={styles.feed}>
            {posts.map(post => {
              const isReply = !!post.parent_post_id
              const threadId = isReply ? post.parent_post_id : post.id
              const displayTitle = post.title
                || (post.description ? post.description.slice(0, 60) + (post.description.length > 60 ? '…' : '') : null)
                || '(reply)'
              return (
                <div
                  key={post.id}
                  style={styles.card}
                  onClick={() => navigate(`/post/${threadId}`)}
                >
                  {post.thumbnail_path ? (
                    <div style={styles.videoThumbWrap}>
                      <img src={`/uploads/${post.thumbnail_path}`} alt={displayTitle} style={styles.cardImg} />
                      {post.media_type === 'video' && <span style={styles.playOverlay}>▶</span>}
                    </div>
                  ) : post.media_path ? (
                    <img
                      src={`/uploads/${post.media_path}`}
                      alt={displayTitle}
                      style={styles.cardImg}
                    />
                  ) : post.media_type === 'video' ? (
                    <div style={styles.videoThumb}>
                      <span style={styles.playIcon}>▶</span>
                    </div>
                  ) : (
                    <div style={styles.textThumb}>↩</div>
                  )}
                  <div style={styles.cardMeta}>
                    {isReply && post.parent_preview && (
                      <span style={styles.replyContext}>
                        ↩ in{' '}
                        <span
                          style={styles.replyContextLink}
                          onClick={e => { e.stopPropagation(); navigate(`/post/${post.parent_preview.id}`) }}
                        >
                          {post.parent_preview.title || `@${post.parent_preview.user.username}'s post`}
                        </span>
                      </span>
                    )}
                    <span style={styles.cardTitle}>{displayTitle}</span>
                    <span style={styles.cardBy}>
                      <span
                        style={styles.cardUsername}
                        onClick={e => { e.stopPropagation(); navigate(`/@${post.user.username}`) }}
                      >
                        @{post.user.username}
                      </span>
                      {post.user.title && (
                        <span style={styles.titleBadge}>✦ {post.user.title}</span>
                      )}
                      <span style={styles.muted}>
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  body: {
    maxWidth: '600px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  welcome: {
    fontSize: '22px',
    margin: 0,
  },
  feedHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '4px',
    marginBottom: '16px',
  },
  feedLabel: {
    color: 'var(--accent)',
    fontSize: '13px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    margin: 0,
  },
  sortToggle: {
    display: 'flex',
    gap: '4px',
  },
  sortBtn: {
    fontSize: '12px',
    padding: '3px 10px',
    borderRadius: '3px',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    userSelect: 'none',
  },
  sortBtnActive: {
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
  },
  muted: {
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  card: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
  },
  cardImg: {
    width: '72px',
    height: '72px',
    objectFit: 'cover',
    borderRadius: '3px',
    flexShrink: 0,
    background: 'var(--surface)',
  },
  videoThumbWrap: {
    position: 'relative',
    width: '72px',
    height: '72px',
    flexShrink: 0,
  },
  playOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--accent)',
    fontSize: '22px',
    pointerEvents: 'none',
  },
  videoThumb: {
    width: '72px',
    height: '72px',
    flexShrink: 0,
    background: 'var(--surface)',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: 'var(--accent)',
    fontSize: '22px',
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: '15px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  cardBy: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  cardUsername: {
    color: 'var(--accent)',
    fontSize: '13px',
    cursor: 'pointer',
  },
  textThumb: {
    width: '72px',
    height: '72px',
    flexShrink: 0,
    background: 'var(--surface)',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '22px',
  },
  replyContext: {
    color: 'var(--text-muted)',
    fontSize: '11px',
  },
  replyContextLink: {
    color: 'var(--accent)',
    cursor: 'pointer',
  },
  titleBadge: {
    color: 'var(--title, #00e8c8)',
    fontSize: '12px',
  },
}

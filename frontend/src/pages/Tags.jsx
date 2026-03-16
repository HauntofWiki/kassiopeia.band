import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listPostsByTag } from '../api'
import NavHeader from '../components/NavHeader'

export default function Tags() {
  const { tag } = useParams()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listPostsByTag(tag)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tag])

  return (
    <div style={styles.page}>
      <NavHeader />

      <div className="page-body" style={styles.body}>
        <p style={styles.tagLabel}>{tag}</p>

        {loading ? (
          <p style={styles.muted}>loading...</p>
        ) : posts.length === 0 ? (
          <p style={styles.muted}>nothing on relay {tag}.</p>
        ) : (
          <div style={styles.feed}>
            {posts.map(post => (
              <div
                key={post.id}
                style={styles.card}
                onClick={() => post.parent_post_id
                  ? navigate(`/post/${post.parent_post_id}?highlight=${post.id}`)
                  : navigate(`/post/${post.id}`)
                }
              >
                {post.media_type === 'video' ? (
                  <div style={styles.videoThumb}>
                    <span style={styles.playIcon}>▶</span>
                  </div>
                ) : post.media_path ? (
                  <img
                    src={`/uploads/${post.thumbnail_path || post.media_path}`}
                    alt={post.title}
                    style={styles.cardImg}
                  />
                ) : (
                  <div style={styles.noMedia}>
                    <span style={styles.noMediaIcon}>✦</span>
                  </div>
                )}
                <div style={styles.cardMeta}>
                  <span style={styles.cardTitle}>{post.title}</span>
                  <span style={styles.cardBy}>
                    <span
                      style={styles.cardUsername}
                      onClick={e => { e.stopPropagation(); navigate(`/@${post.user.username}`) }}
                    >
                      @{post.user.username}
                    </span>
                    <span style={styles.muted}>
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </span>
                </div>
              </div>
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
    maxWidth: '600px', width: '100%',
    margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px',
  },
  tagLabel: {
    color: 'var(--accent)', fontSize: '13px', letterSpacing: '0.1em',
    textTransform: 'uppercase', marginBottom: '16px',
  },
  muted: { color: 'var(--text-muted)', fontSize: '13px' },
  feed: { display: 'flex', flexDirection: 'column', gap: '2px' },
  card: {
    display: 'flex', gap: '14px', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer',
  },
  cardImg: {
    width: '72px', height: '72px', objectFit: 'cover',
    borderRadius: '3px', flexShrink: 0, background: 'var(--surface)',
  },
  videoThumb: {
    width: '72px', height: '72px', flexShrink: 0,
    background: 'var(--surface)', borderRadius: '3px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { color: 'var(--accent)', fontSize: '22px' },
  noMedia: {
    width: '72px', height: '72px', flexShrink: 0,
    background: 'var(--surface)', borderRadius: '3px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  noMediaIcon: { color: 'var(--text-muted)', fontSize: '18px' },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 },
  cardTitle: { fontSize: '15px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  cardBy: { display: 'flex', gap: '10px', alignItems: 'center' },
  cardUsername: { color: 'var(--accent)', fontSize: '13px', cursor: 'pointer' },
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPosts } from '../api'

export default function Blog() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPosts(null, null, 'blog').then(setPosts).catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-body" style={styles.body}>
        <p style={styles.sectionLabel}>blog</p>

        {loading ? (
          <p style={styles.muted}>loading...</p>
        ) : posts.length === 0 ? (
          <p style={styles.muted}>no posts yet.</p>
        ) : (
          <div style={styles.feed}>
            {posts.map(p => (
              <div key={p.id} style={styles.card} onClick={() => navigate(`/post/${p.id}`)}>
                <div style={styles.cardMain}>
                  <span style={styles.cardTitle}>{p.title}</span>
                  {p.description && (
                    <span style={styles.cardExcerpt}>
                      {p.description.length > 160 ? p.description.slice(0, 160) + '…' : p.description}
                    </span>
                  )}
                  <span style={styles.cardMeta}>
                    <span style={styles.cardAuthor}>@{p.user.username}</span>
                    <span style={styles.muted}>
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </span>
                </div>
                {p.thumbnail_path && (
                  <img src={`/uploads/${p.thumbnail_path}`} alt={p.title} style={styles.thumb} />
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  body: { maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' },
  sectionLabel: { color: 'var(--accent)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 },
  muted: { color: 'var(--text-muted)', fontSize: '13px' },
  feed: { display: 'flex', flexDirection: 'column' },
  card: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
    padding: '20px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer',
  },
  cardMain: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 },
  cardTitle: { fontSize: '17px', fontWeight: 'bold', lineHeight: '1.3' },
  cardExcerpt: { fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' },
  cardMeta: { display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' },
  cardAuthor: { color: 'var(--accent)', fontSize: '13px' },
  thumb: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 },
}

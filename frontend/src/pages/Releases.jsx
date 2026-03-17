import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPosts } from '../api'

export default function Releases() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPosts(null, null, 'release').then(setPosts).catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-body" style={styles.body}>
        <p style={styles.sectionLabel}>releases</p>

        {loading ? (
          <p style={styles.muted}>loading...</p>
        ) : posts.length === 0 ? (
          <p style={styles.muted}>no releases yet.</p>
        ) : (
          <div style={styles.grid}>
            {posts.map(p => (
              <div key={p.id} style={styles.card} onClick={() => navigate(`/post/${p.id}`)}>
                <div style={styles.artWrap}>
                  {p.thumbnail_path ? (
                    <img src={`/uploads/${p.thumbnail_path}`} alt={p.title} style={styles.art} />
                  ) : (
                    <div style={styles.artPlaceholder}>♪</div>
                  )}
                </div>
                <div style={styles.cardMeta}>
                  <span style={styles.cardTitle}>{p.title}</span>
                  {p.music_album && <span style={styles.cardSub}>{p.music_album}</span>}
                  <span style={styles.cardDate}>
                    {new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </span>
                </div>
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' },
  card: { cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' },
  artWrap: { aspectRatio: '1', background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' },
  art: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  artPlaceholder: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', fontSize: '36px',
  },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: '2px' },
  cardTitle: { fontSize: '14px', fontWeight: 'bold', lineHeight: '1.3' },
  cardSub: { fontSize: '12px', color: 'var(--text-muted)' },
  cardDate: { fontSize: '12px', color: 'var(--text-muted)' },
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPosts } from '../api'
import { usePageMeta } from '../utils/usePageMeta'

const TYPE_ICON = {
  news: '/news.svg',
  blog: '/blog.svg',
  show: '/show.svg',
}

export default function Feed() {
  usePageMeta('feed')
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listPosts(null, null, 'news'),
      listPosts(null, null, 'blog'),
      listPosts(null, null, 'show'),
    ]).then(([news, blog, shows]) => {
      const all = [...news, ...blog, ...shows]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setPosts(all)
    }).catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-body" style={styles.body}>
      <p style={styles.sectionLabel}>feed</p>

      {loading ? (
        <p style={styles.muted}>loading...</p>
      ) : posts.length === 0 ? (
        <p style={styles.muted}>nothing yet.</p>
      ) : (
        <div style={styles.list}>
          {posts.map(p => (
            <div key={p.id} style={styles.item} onClick={() => navigate(`/post/${p.id}`)}>
              {p.thumbnail_path && (
                <img src={p.thumbnail_url} alt={p.title} style={styles.thumb} />
              )}
              <div style={styles.meta}>
                <div style={styles.topRow}>
                  {TYPE_ICON[p.type] && <img src={TYPE_ICON[p.type]} alt={p.type} style={styles.typeIcon} />}
                  <span style={styles.date}>
                    {new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <a
                    href="https://fm.kass.fm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="listen-inline"
                    aria-label="Listen on fm.kass.fm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img src="/radio.svg" alt="" />
                    <span>Listen on fm.kass.fm</span>
                  </a>
                </div>
                <span style={styles.title}>{p.title}</span>
                {p.description && <p style={styles.desc}>{p.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  body: { maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' },
  sectionLabel: { color: 'var(--accent)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 },
  muted: { color: 'var(--text-muted)', fontSize: '13px' },
  list: { display: 'flex', flexDirection: 'column', gap: '1px' },
  item: {
    display: 'flex', gap: '16px', alignItems: 'flex-start',
    padding: '14px 0', borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
  },
  thumb: { width: '72px', height: '72px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 },
  meta: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 },
  topRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  typeIcon: { width: '14px', height: '14px', flexShrink: 0 },
  date: { fontSize: '12px', color: 'var(--text-muted)' },
  title: { fontSize: '15px', lineHeight: '1.3' },
  desc: { fontSize: '13px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
}

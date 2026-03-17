import { useEffect, useState } from 'react'
import { listPosts } from '../api'

export default function Shows() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPosts(null, null, 'show').then(setPosts).catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const upcoming = posts.filter(p => p.show_date && p.show_date >= today)
    .sort((a, b) => a.show_date.localeCompare(b.show_date))
  const past = posts.filter(p => !p.show_date || p.show_date < today)
    .sort((a, b) => b.show_date?.localeCompare(a.show_date))

  return (
    <div className="page-body" style={styles.body}>
        <p style={styles.sectionLabel}>shows</p>

        {loading ? (
          <p style={styles.muted}>loading...</p>
        ) : posts.length === 0 ? (
          <p style={styles.muted}>no shows yet.</p>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div style={styles.section}>
                <p style={styles.subLabel}>upcoming</p>
                {upcoming.map(p => <ShowRow key={p.id} post={p} upcoming />)}
              </div>
            )}
            {past.length > 0 && (
              <div style={styles.section}>
                <p style={styles.subLabel}>past</p>
                {past.map(p => <ShowRow key={p.id} post={p} />)}
              </div>
            )}
          </>
        )}
    </div>
  )
}

function ShowRow({ post, upcoming }) {
  const date = post.show_date
    ? new Date(post.show_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div style={{ ...styles.row, ...(upcoming ? styles.rowUpcoming : {}) }}>
      <div style={styles.dateCol}>
        {date ? <span style={upcoming ? styles.dateUpcoming : styles.datePast}>{date}</span> : <span style={styles.datePast}>TBA</span>}
      </div>
      <div style={styles.infoCol}>
        <span style={styles.title}>{post.title}</span>
        {post.show_venue && <span style={styles.venue}>{post.show_venue}</span>}
        {post.description && <span style={styles.desc}>{post.description}</span>}
      </div>
      {post.show_ticket_url && (
        <a
          href={post.show_ticket_url}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.ticketLink}
          onClick={e => e.stopPropagation()}
        >
          tickets →
        </a>
      )}
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  body: { maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' },
  sectionLabel: { color: 'var(--accent)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 },
  subLabel: { color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px 0' },
  muted: { color: 'var(--text-muted)', fontSize: '13px' },
  section: { display: 'flex', flexDirection: 'column' },
  row: {
    display: 'flex', gap: '20px', alignItems: 'flex-start',
    padding: '16px 0', borderBottom: '1px solid var(--border)',
  },
  rowUpcoming: { borderLeft: '2px solid var(--accent)', paddingLeft: '12px' },
  dateCol: { width: '160px', flexShrink: 0 },
  dateUpcoming: { fontSize: '13px', color: 'var(--accent)', fontWeight: 'bold' },
  datePast: { fontSize: '13px', color: 'var(--text-muted)' },
  infoCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 },
  title: { fontSize: '15px', fontWeight: 'bold' },
  venue: { fontSize: '13px', color: 'var(--text-muted)' },
  desc: { fontSize: '13px', color: 'var(--text-muted)' },
  ticketLink: {
    color: 'var(--accent)', fontSize: '13px', textDecoration: 'none',
    flexShrink: 0, paddingTop: '2px',
  },
}

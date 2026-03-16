import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTags } from '../api'
import NavHeader from '../components/NavHeader'

const WINDOWS = [
  { label: '1h', value: 'hour' },
  { label: '24h', value: 'day' },
  { label: 'all', value: null },
]

export default function TagsIndex() {
  const navigate = useNavigate()
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [window, setWindow] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getTags(window)
      .then(setTags)
      .catch(() => setTags([]))
      .finally(() => setLoading(false))
  }, [window])

  const filtered = search.trim() ? tags.filter(t => t.tag.includes(search.toLowerCase().trim())) : tags
  const max = filtered[0]?.count || 1

  return (
    <div style={styles.page}>
      <NavHeader />

      <div className="page-body" style={styles.body}>
        <div style={styles.labelRow}>
          <p style={styles.pageLabel}>relays</p>
          <div style={styles.toggle}>
            {WINDOWS.map(w => (
              <span
                key={String(w.value)}
                style={window === w.value ? styles.toggleActive : styles.toggleOption}
                onClick={() => setWindow(w.value)}
              >
                {w.label}
              </span>
            ))}
          </div>
        </div>

        <input
          style={styles.search}
          placeholder="filter relays..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <p style={styles.muted}>loading...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.muted}>no tags found.</p>
        ) : (
          <div style={styles.list}>
            {filtered.map(({ tag, count }) => (
              <div
                key={tag}
                style={styles.row}
                onClick={() => navigate(`/tags/${encodeURIComponent(tag)}`)}
              >
                <div style={styles.barWrap}>
                  <div style={{ ...styles.bar, width: `${(count / max) * 100}%` }} />
                </div>
                <span style={styles.tagName}>{tag}</span>
                <span style={styles.count}>{count}</span>
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
  labelRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px',
  },
  pageLabel: {
    color: 'var(--accent)', fontSize: '13px', letterSpacing: '0.1em',
    textTransform: 'uppercase', margin: 0,
  },
  toggle: { display: 'flex', gap: '4px' },
  toggleOption: {
    padding: '3px 10px', borderRadius: '3px', fontSize: '12px',
    color: 'var(--text-muted)', cursor: 'pointer',
    border: '1px solid var(--border)',
  },
  toggleActive: {
    padding: '3px 10px', borderRadius: '3px', fontSize: '12px',
    color: 'var(--accent)', cursor: 'pointer',
    border: '1px solid var(--accent)',
  },
  muted: { color: 'var(--text-muted)', fontSize: '13px' },
  search: { width: '100%', boxSizing: 'border-box', marginBottom: '8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '2px' },
  row: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 0', borderBottom: '1px solid var(--border)',
    cursor: 'pointer', position: 'relative',
  },
  barWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '2px',
    background: 'var(--border)',
  },
  bar: {
    height: '100%', background: 'var(--accent)', opacity: 0.4,
    transition: 'width 0.3s',
  },
  tagName: { fontSize: '15px', flex: 1 },
  count: { color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 },
}

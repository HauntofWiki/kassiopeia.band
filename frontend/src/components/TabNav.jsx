import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { label: 'music', path: '/' },
  { label: 'blog', path: '/blog' },
  { label: 'shows', path: '/shows' },
  { label: 'releases', path: '/releases' },
  { label: 'about', path: '/about' },
]

export default function TabNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <div style={styles.tabNav}>
      {TABS.map(({ label, path }) => (
        <button
          key={path}
          style={{ ...styles.tab, ...(isActive(path) ? styles.tabActive : {}) }}
          onClick={() => navigate(path)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

const styles = {
  tabNav: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  tab: {
    flex: 1,
    padding: '11px 0',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '13px',
    letterSpacing: '0.05em',
    borderRadius: 0,
  },
  tabActive: {
    color: 'var(--accent)',
    borderBottom: '2px solid var(--accent)',
  },
}

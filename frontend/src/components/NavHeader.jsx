import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../api'
import { useAuth } from '../App'

const NAV_SECTIONS = [
  { label: 'videos', path: '/' },
  { label: 'blog', path: '/blog' },
  { label: 'shows', path: '/shows' },
  { label: 'releases', path: '/releases' },
]

export default function NavHeader() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    setUser(null)
    navigate('/')
  }

  const go = (path) => { navigate(path); setMenuOpen(false) }
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <>
      <div style={styles.header}>
        <span style={styles.logo} onClick={() => go('/')}>kassiopeia</span>

        <div style={styles.centerNav} className="nav-full">
          {NAV_SECTIONS.map(({ label, path }) => (
            <span
              key={path}
              style={{ ...styles.navLink, ...(isActive(path) ? styles.navLinkActive : {}) }}
              onClick={() => go(path)}
            >
              {label}
            </span>
          ))}
        </div>

        <div style={styles.rightGroup}>
          <div className="nav-full" style={styles.rightLinks}>
            {user && (user.role === 'admin' || user.role === 'contributor') && (
              <span style={styles.newBtn} onClick={() => go('/new')}>+</span>
            )}
            {user ? (
              <>
                <span style={styles.navLink} onClick={() => go('/settings')}>settings</span>
                <span style={styles.navLink} onClick={handleLogout}>log out</span>
                {user.role === 'admin' && (
                  <span style={styles.navLink} onClick={() => go('/admin')}>admin</span>
                )}
              </>
            ) : (
              <>
                <span style={styles.navLink} onClick={() => go('/login')}>log in</span>
                <span style={styles.navLink} onClick={() => go('/signup')}>sign up</span>
              </>
            )}
          </div>
          <button className="hamburger-btn" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? '✕' : '≡'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-nav-menu">
          {NAV_SECTIONS.map(({ label, path }) => (
            <span key={path} className="mobile-nav-menu-item" onClick={() => go(path)}>{label}</span>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'contributor') && (
                <span className="mobile-nav-menu-item" onClick={() => go('/new')}>+ new post</span>
              )}
              <span className="mobile-nav-menu-item" onClick={() => go('/settings')}>settings</span>
              <span className="mobile-nav-menu-item" onClick={handleLogout}>log out</span>
              {user.role === 'admin' && (
                <span className="mobile-nav-menu-item" onClick={() => go('/admin')}>admin</span>
              )}
            </>
          ) : (
            <>
              <span className="mobile-nav-menu-item" onClick={() => go('/login')}>log in</span>
              <span className="mobile-nav-menu-item" onClick={() => go('/signup')}>sign up</span>
            </>
          )}
        </div>
      )}
    </>
  )
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 24px',
    borderBottom: '1px solid var(--border)',
  },
  logo: {
    color: 'var(--accent)',
    fontSize: '18px',
    cursor: 'pointer',
    fontStyle: 'italic',
    flexShrink: 0,
  },
  centerNav: {
    display: 'flex',
    gap: '24px',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  navLink: {
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '14px',
  },
  navLinkActive: {
    color: 'var(--accent)',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0,
  },
  rightLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  newBtn: {
    color: 'var(--accent)',
    fontSize: '22px',
    cursor: 'pointer',
    lineHeight: 1,
  },
}

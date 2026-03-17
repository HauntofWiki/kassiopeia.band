import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../api'
import { useAuth } from '../App'

export default function NavHeader() {
  const { user, setUser, setNewPostOpen, setSettingsOpen } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    setUser(null)
    navigate('/')
  }

  const go = (path) => { navigate(path); setMenuOpen(false) }

  return (
    <>
      <div style={styles.header}>
        <span style={styles.logo} onClick={() => go('/')}>kassiopeia</span>

        <div className="nav-full" style={styles.rightLinks}>
          {user && (user.role === 'admin' || user.role === 'contributor') && (
            <span style={styles.newBtn} onClick={() => setNewPostOpen(true)}>+</span>
          )}
          {user ? (
            <>
              <span style={styles.navLink} onClick={() => setSettingsOpen(true)}>settings</span>
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

      {menuOpen && (
        <div className="mobile-nav-menu">
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'contributor') && (
                <span className="mobile-nav-menu-item" onClick={() => setNewPostOpen(true)}>+ new post</span>
              )}
              <span className="mobile-nav-menu-item" onClick={() => setSettingsOpen(true)}>settings</span>
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
    padding: '10px 24px',
    borderBottom: '1px solid var(--border)',
  },
  logo: {
    color: 'var(--accent)',
    fontSize: '18px',
    cursor: 'pointer',
    fontStyle: 'italic',
  },
  rightLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navLink: {
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '14px',
  },
  newBtn: {
    color: 'var(--accent)',
    fontSize: '22px',
    cursor: 'pointer',
    lineHeight: 1,
  },
}

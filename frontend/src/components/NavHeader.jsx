import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../api'
import { useAuth } from '../App'

export default function NavHeader() {
  const { user, setUser } = useAuth()
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
        <div style={styles.rightGroup}>
          <div className="nav-full">
            <span style={styles.navLink} onClick={() => go('/')}>home</span>
            <span style={styles.navLink} onClick={() => go('/home')}>videos</span>
            <span style={styles.navLink} onClick={() => go('/tags')}>tags</span>
            {user && (user.role === 'admin' || user.role === 'contributor') && (
              <span style={styles.newBtn} onClick={() => go('/new')}>+</span>
            )}
            {user ? (
              <>
                <span style={styles.navLink} onClick={() => go(`/@${user.username}`)}>@{user.username}</span>
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
          <span className="mobile-nav-menu-item" onClick={() => go('/')}>home</span>
          <span className="mobile-nav-menu-item" onClick={() => go('/home')}>videos</span>
          <span className="mobile-nav-menu-item" onClick={() => go('/tags')}>tags</span>
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'contributor') && (
                <span className="mobile-nav-menu-item" onClick={() => go('/new')}>+ new post</span>
              )}
              <span className="mobile-nav-menu-item" onClick={() => go(`/@${user.username}`)}>@{user.username}</span>
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
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
  },
  logo: {
    color: 'var(--accent)',
    fontSize: '18px',
    cursor: 'pointer',
    fontStyle: 'italic',
  },
  navLink: {
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  newBtn: {
    color: 'var(--accent)',
    fontSize: '24px',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 4px',
  },
}

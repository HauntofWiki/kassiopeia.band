import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dismissNotification, getNotifications, logout, markAllRead } from '../api'
import { useAuth } from '../App'

export default function NavHeader() {
  const { user, setUser, setNewPostOpen, setSettingsOpen } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const notifRef = useRef(null)

  const unread = notifs.filter(n => !n.is_read).length

  useEffect(() => {
    if (!user) return
    const load = () => getNotifications().then(setNotifs).catch(() => {})
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [user])

  useEffect(() => {
    if (!notifOpen) return
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  async function handleLogout() {
    await logout()
    setUser(null)
    navigate('/')
  }

  const go = (path) => { navigate(path); setMenuOpen(false) }

  return (
    <>
      <div style={styles.header}>
        <div />
        <img src="/kasslogo.png" alt="Kassiopeia" style={styles.logo} onClick={() => go('/')} />

        <div style={styles.rightSlot}>
          <div className="nav-full" style={styles.rightLinks}>
            {user && (user.role === 'admin' || user.role === 'contributor') && (
              <span style={styles.newBtn} onClick={() => setNewPostOpen(true)}>+</span>
            )}
            {user && (
              <div style={styles.bellWrap} ref={notifRef}>
                <span style={styles.bell} onClick={() => {
                  setNotifOpen(o => !o)
                  if (!notifOpen && unread > 0) {
                    markAllRead().then(() => setNotifs(ns => ns.map(n => ({ ...n, is_read: true }))))
                  }
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style={styles.bellSvg}>
                    <path d="M320 64C302.3 64 288 78.3 288 96L288 99.2C215 114 160 178.6 160 256L160 277.7C160 325.8 143.6 372.5 113.6 410.1L103.8 422.3C98.7 428.6 96 436.4 96 444.5C96 464.1 111.9 480 131.5 480L508.4 480C528 480 543.9 464.1 543.9 444.5C543.9 436.4 541.2 428.6 536.1 422.3L526.3 410.1C496.4 372.5 480 325.8 480 277.7L480 256C480 178.6 425 114 352 99.2L352 96C352 78.3 337.7 64 320 64zM258 528C265.1 555.6 290.2 576 320 576C349.8 576 374.9 555.6 382 528L258 528z"/>
                  </svg>
                  {unread > 0 && <span style={styles.badge}>{unread}</span>}
                </span>
                {notifOpen && (
                  <div style={styles.dropdown}>
                    {notifs.length === 0 ? (
                      <div style={styles.notifEmpty}>no notifications</div>
                    ) : notifs.map(n => (
                      <div
                        key={n.id}
                        style={{ ...styles.notifItem, ...(n.is_read ? {} : styles.notifUnread) }}
                        onClick={() => {
                          setNotifOpen(false)
                          const dest = n.parent_post_id
                            ? `/post/${n.parent_post_id}?highlight=${n.post_id}`
                            : `/post/${n.post_id}`
                          go(dest)
                        }}
                      >
                        <span style={styles.notifText}>
                          {n.type === 'reply'
                            ? `@${n.from_username} replied to "${n.parent_post_title || 'a post'}"`
                            : `@${n.from_username} quoted you`}
                        </span>
                        <span style={styles.notifDismiss} onClick={e => {
                          e.stopPropagation()
                          dismissNotification(n.id)
                          setNotifs(ns => ns.filter(x => x.id !== n.id))
                        }}>✕</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {user ? (
              <>
                <span style={styles.navLink} onClick={() => setSettingsOpen(true)}>@{user.username}</span>
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
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'contributor') && (
                <span className="mobile-nav-menu-item" onClick={() => setNewPostOpen(true)}>+ new post</span>
              )}
              <span className="mobile-nav-menu-item" onClick={() => { setMenuOpen(false); setNotifOpen(true) }}>
                notifications {unread > 0 && `(${unread})`}
              </span>
              <span className="mobile-nav-menu-item" onClick={() => setSettingsOpen(true)}>@{user.username}</span>
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
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    padding: '10px 24px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
  },
  logo: {
    height: '100px',
    width: 'auto',
    cursor: 'pointer',
    justifySelf: 'center',
    margin: '-18px 0',
  },
  rightSlot: {
    justifySelf: 'end',
    display: 'flex',
    alignItems: 'center',
  },
  rightLinks: {
    alignItems: 'center',
    gap: '16px',
  },
  navLink: {
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '14px',
  },
  bellWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  bell: { cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' },
  bellSvg: { width: '18px', height: '18px', fill: 'var(--accent)', display: 'block' },
  badge: {
    position: 'absolute', top: '-6px', right: '-8px',
    background: 'var(--error)', color: '#fff', borderRadius: '10px',
    fontSize: '10px', padding: '1px 4px', lineHeight: 1.4, fontWeight: 'bold',
  },
  dropdown: {
    position: 'absolute', right: 0, top: 'calc(100% + 10px)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '6px', minWidth: '280px', maxWidth: '340px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 100,
    maxHeight: '400px', overflowY: 'auto',
  },
  notifEmpty: { padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' },
  notifItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
    fontSize: '13px',
  },
  notifUnread: { background: 'rgba(0,232,200,0.06)' },
  notifText: { flex: 1, lineHeight: 1.4 },
  notifDismiss: { color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', flexShrink: 0, padding: '2px 4px' },
  newBtn: {
    color: 'var(--accent)',
    fontSize: '22px',
    cursor: 'pointer',
    lineHeight: 1,
  },
}

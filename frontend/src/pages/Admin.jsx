import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteUser, listAdminUsers, setUserRole } from '../api'

export default function Admin() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    listAdminUsers().then(setMembers).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  async function handleRoleToggle(username, currentRole) {
    const newRole = currentRole === 'contributor' ? 'user' : 'contributor'
    try {
      await setUserRole(username, newRole)
      setMembers(prev => prev.map(u => u.username === username ? { ...u, role: newRole } : u))
    } catch (e) { setError(e.message) }
  }

  async function handleDeleteUser(username) {
    try {
      await deleteUser(username)
      setMembers(prev => prev.filter(u => u.username !== username))
    } catch (e) { setError(e.message) }
    setConfirmDelete(null)
  }

  return (
    <div className="page-body" style={styles.body}>
        <p style={styles.pageLabel}>admin</p>

        {error && <p className="error">{error}</p>}

        <p style={styles.muted}>members</p>

        {loading ? <p style={styles.muted}>loading...</p>
          : members.length === 0 ? <p style={styles.muted}>no members yet.</p>
          : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>username</th>
                  <th style={styles.th}>display name</th>
                  <th style={styles.th}>role</th>
                  <th style={styles.th}>joined</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {members.map(u => (
                  <tr key={u.username} style={styles.row}>
                    <td style={styles.td}>
                      <span style={styles.link} onClick={() => navigate(`/@${u.username}`)}>@{u.username}</span>
                    </td>
                    <td style={styles.td}>{u.display_name || '—'}</td>
                    <td style={styles.td}>
                      <span
                        style={u.role === 'contributor' ? styles.roleContributor : styles.roleUser}
                        onClick={() => handleRoleToggle(u.username, u.role)}
                        title="click to toggle contributor"
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={styles.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      {confirmDelete === u.username ? (
                        <>
                          <span style={styles.danger} onClick={() => handleDeleteUser(u.username)}>confirm</span>
                          {' · '}
                          <span style={styles.action} onClick={() => setConfirmDelete(null)}>cancel</span>
                        </>
                      ) : (
                        <span style={styles.danger} onClick={() => setConfirmDelete(u.username)}>delete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  body: {
    padding: '40px 24px', maxWidth: '700px',
    width: '100%', margin: '0 auto',
    display: 'flex', flexDirection: 'column', gap: '24px',
  },
  pageLabel: {
    color: 'var(--accent)', fontSize: '13px', letterSpacing: '0.1em',
    textTransform: 'uppercase', margin: 0,
  },
  muted: { color: 'var(--text-muted)', fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', color: 'var(--text-muted)', fontWeight: 'normal',
    paddingBottom: '10px', borderBottom: '1px solid var(--border)', fontSize: '13px',
  },
  row: { borderBottom: '1px solid var(--border)' },
  td: { padding: '10px 0', fontSize: '14px' },
  link: { color: 'var(--accent)', cursor: 'pointer' },
  roleContributor: { color: 'var(--accent)', cursor: 'pointer', fontSize: '12px' },
  roleUser: { color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' },
  action: { color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' },
  danger: { color: 'var(--error)', cursor: 'pointer', fontSize: '12px' },
}

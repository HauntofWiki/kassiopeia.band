import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLink, deleteLink, getAllLinks, updateLink, createAdminUser, deleteUser, listAdminUsers, setUserRole } from '../api'

const emptyLink = { label: '', url: '', icon: '', sort_order: 100, is_active: true }

export default function Admin() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [links, setLinks] = useState([])
  const [editingLink, setEditingLink] = useState(null)
  const [newLink, setNewLink] = useState(null)
  const [newUser, setNewUser] = useState(null)

  async function handleCreateUser(data) {
    try {
      const result = await createAdminUser(data)
      setMembers(prev => [...prev, { username: result.username, role: result.role, display_name: result.username, created_at: new Date().toISOString() }])
      setNewUser(null)
    } catch (e) { setError(e.message) }
  }

  useEffect(() => {
    getAllLinks().then(setLinks).catch(() => {})
  }, [])

  async function handleSaveLink(id, data) {
    try {
      const updated = await updateLink(id, data)
      setLinks(prev => prev.map(l => l.id === id ? updated : l))
      setEditingLink(null)
    } catch (e) { setError(e.message) }
  }

  async function handleCreateLink(data) {
    try {
      const created = await createLink(data)
      setLinks(prev => [...prev, created].sort((a, b) => a.sort_order - b.sort_order))
      setNewLink(null)
    } catch (e) { setError(e.message) }
  }

  async function handleDeleteLink(id) {
    try {
      await deleteLink(id)
      setLinks(prev => prev.filter(l => l.id !== id))
    } catch (e) { setError(e.message) }
  }

  async function handleToggleActive(link) {
    try {
      const updated = await updateLink(link.id, { ...link, is_active: !link.is_active })
      setLinks(prev => prev.map(l => l.id === link.id ? updated : l))
    } catch (e) { setError(e.message) }
  }

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
        {newUser ? (
          <div style={styles.newUserForm}>
            <input style={styles.input} placeholder="username" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} />
            <input style={styles.input} placeholder="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
            <input style={styles.input} placeholder="password" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
            <select style={styles.input} value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
              <option value="user">user</option>
              <option value="contributor">contributor</option>
              <option value="admin">admin</option>
            </select>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={styles.action} onClick={() => handleCreateUser(newUser)}>create</span>
              <span style={styles.action} onClick={() => setNewUser(null)}>cancel</span>
            </div>
          </div>
        ) : (
          <span style={styles.action} onClick={() => setNewUser({ username: '', email: '', password: '', role: 'contributor' })}>+ create account</span>
        )}

        <p style={styles.muted}>social links</p>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>icon</th>
              <th style={styles.th}>label</th>
              <th style={styles.th}>url</th>
              <th style={styles.th}>order</th>
              <th style={styles.th}>active</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {links.map(link => editingLink?.id === link.id ? (
              <LinkEditRow key={link.id} data={editingLink} onChange={setEditingLink}
                onSave={() => handleSaveLink(link.id, editingLink)}
                onCancel={() => setEditingLink(null)} />
            ) : (
              <tr key={link.id} style={styles.row}>
                <td style={styles.td}><img src={`/${link.icon}.svg`} style={{ width: 20, height: 20 }} alt={link.icon} /></td>
                <td style={styles.td}>{link.label}</td>
                <td style={{ ...styles.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</td>
                <td style={styles.td}>{link.sort_order}</td>
                <td style={styles.td}>
                  <span style={link.is_active ? styles.roleContributor : styles.roleUser}
                    onClick={() => handleToggleActive(link)}>
                    {link.is_active ? 'on' : 'off'}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.action} onClick={() => setEditingLink({ ...link })}>edit</span>
                  {' · '}
                  <span style={styles.danger} onClick={() => handleDeleteLink(link.id)}>delete</span>
                </td>
              </tr>
            ))}
            {newLink && (
              <LinkEditRow data={newLink} onChange={setNewLink}
                onSave={() => handleCreateLink(newLink)}
                onCancel={() => setNewLink(null)} />
            )}
          </tbody>
        </table>
        {!newLink && (
          <span style={styles.action} onClick={() => setNewLink({ ...emptyLink })}>+ add link</span>
        )}
    </div>
  )
}

function LinkEditRow({ data, onChange, onSave, onCancel }) {
  const f = (field) => (e) => onChange(prev => ({ ...prev, [field]: e.target.value }))
  return (
    <tr style={styles.row}>
      <td style={styles.td}><input style={styles.input} value={data.icon} onChange={f('icon')} placeholder="spotify" /></td>
      <td style={styles.td}><input style={styles.input} value={data.label} onChange={f('label')} placeholder="Spotify" /></td>
      <td style={styles.td}><input style={styles.input} value={data.url} onChange={f('url')} placeholder="https://..." /></td>
      <td style={styles.td}><input style={{ ...styles.input, width: 50 }} type="number" value={data.sort_order} onChange={f('sort_order')} /></td>
      <td style={styles.td}></td>
      <td style={styles.td}>
        <span style={styles.action} onClick={onSave}>save</span>
        {' · '}
        <span style={styles.action} onClick={onCancel}>cancel</span>
      </td>
    </tr>
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
  input: { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '12px', padding: '4px 6px', borderRadius: '3px', width: '100%' },
  newUserForm: { display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300 },
}

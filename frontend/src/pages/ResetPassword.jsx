import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('passwords do not match'); return }
    setError(null)
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.box}>
          <p style={styles.muted}>invalid reset link.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.topLeft}>
        <span style={styles.logo} onClick={() => navigate('/')}>wicky.tv</span>
      </div>
      <div style={styles.box}>
        <h1 style={styles.title}>new password</h1>
        {done ? (
          <>
            <p style={styles.muted}>password updated.</p>
            <p style={styles.footer}>
              <span style={styles.link} onClick={() => navigate('/login')}>log in</span>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label>new password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div style={styles.field}>
              <label>confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'saving...' : 'set password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  topLeft: { position: 'absolute', top: '16px', left: '24px' },
  logo: { color: 'var(--accent)', fontSize: '18px', cursor: 'pointer' },
  box: { width: '100%', maxWidth: '360px', padding: '40px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' },
  title: { fontSize: '20px', marginBottom: '28px', color: 'var(--accent)' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
  footer: { marginTop: '20px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' },
  link: { color: 'var(--accent)', cursor: 'pointer' },
}

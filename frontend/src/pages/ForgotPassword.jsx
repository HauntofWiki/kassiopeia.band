import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { forgotPassword } from '../api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await forgotPassword(email)
    } catch {}
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.topLeft}>
        <span style={styles.logo} onClick={() => navigate('/')}>wicky.tv</span>
      </div>
      <div style={styles.box}>
        <h1 style={styles.title}>reset password</h1>
        {sent ? (
          <p style={styles.muted}>
            if that email is registered, you'll get a reset link shortly.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label>email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'sending...' : 'send reset link'}
            </button>
          </form>
        )}
        <p style={styles.footer}>
          <span style={styles.link} onClick={() => navigate('/login')}>back to login</span>
        </p>
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
  muted: { color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' },
  footer: { marginTop: '20px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' },
  link: { color: 'var(--accent)', cursor: 'pointer' },
}

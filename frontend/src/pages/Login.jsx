import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../App'

export default function Login() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await login(username, password)
      setUser(user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <h1 style={styles.title}>kassiopeia</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label>username or email</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div style={styles.field}>
            <label>password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'logging in...' : 'log in'}
          </button>
        </form>
        <p style={styles.footer}>
          no account? <Link to="/signup">sign up</Link>
        </p>
        <p style={styles.footer}>
          <Link to="/forgot-password" style={{ color: 'var(--text-muted)' }}>forgot password?</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: '100%',
    maxWidth: '360px',
    padding: '40px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
  },
  title: {
    fontSize: '24px',
    marginBottom: '28px',
    color: 'var(--accent)',
    fontStyle: 'italic',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  footer: {
    marginTop: '20px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    fontSize: '13px',
  },
}

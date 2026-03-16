import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, requestAccess } from '../api'

import { useAuth } from '../App'

export default function Login() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const [requesting, setRequesting] = useState(false)
  const [reqEmail, setReqEmail] = useState('')
  const [reqMessage, setReqMessage] = useState('')
  const [reqSent, setReqSent] = useState(false)
  const [reqLoading, setReqLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await login(username, password)
      setUser(user)
      navigate('/home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRequest(e) {
    e.preventDefault()
    setReqLoading(true)
    try {
      await requestAccess(reqEmail, reqMessage || undefined)
      setReqSent(true)
    } catch {
      setReqSent(true) // show same message regardless
    } finally {
      setReqLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.topLeft}>
        <span style={styles.logo} onClick={() => navigate('/')}>wicky.tv</span>
      </div>
      <div style={styles.box}>
        <h1 style={styles.title}>wicky.tv</h1>
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
          have an invite? <Link to="/signup">sign up</Link>
        </p>
        <p style={styles.footer}>
          <Link to="/forgot-password" style={{ color: 'var(--text-muted)' }}>forgot password?</Link>
        </p>
        <p style={styles.footer}>
          no invite?{' '}
          <span style={styles.requestLink} onClick={() => setRequesting(r => !r)}>
            request access
          </span>
        </p>
        {requesting && (
          reqSent ? (
            <p style={{ ...styles.footer, marginTop: '12px' }}>request sent.</p>
          ) : (
            <form onSubmit={handleRequest} style={styles.requestForm}>
              <input
                type="email"
                placeholder="your email"
                value={reqEmail}
                onChange={e => setReqEmail(e.target.value)}
                required
              />
              <textarea
                placeholder="anything you want to say (optional)"
                value={reqMessage}
                onChange={e => setReqMessage(e.target.value)}
                rows={2}
                style={styles.requestTextarea}
              />
              <button type="submit" disabled={reqLoading}>
                {reqLoading ? 'sending…' : 'send request'}
              </button>
            </form>
          )
        )}
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
    position: 'relative',
  },
  topLeft: {
    position: 'absolute',
    top: '16px',
    left: '24px',
  },
  logo: {
    color: 'var(--accent)',
    fontSize: '18px',
    cursor: 'pointer',
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
  requestLink: {
    color: 'var(--accent)',
    cursor: 'pointer',
  },
  requestForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '16px',
  },
  requestTextarea: {
    resize: 'vertical',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
}

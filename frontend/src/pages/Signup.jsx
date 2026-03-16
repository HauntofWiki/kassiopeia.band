import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api'
import { useAuth } from '../App'

export default function Signup() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const user = await signup(form.username, form.email, form.password)
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
        <p style={styles.subtitle}>create your account</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { name: 'username', label: 'username' },
            { name: 'email', label: 'email', type: 'email' },
            { name: 'password', label: 'password', type: 'password' },
            { name: 'confirm', label: 'confirm password', type: 'password' },
          ].map(({ name, label, type = 'text' }) => (
            <div key={name} style={styles.field}>
              <label>{label}</label>
              <input
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                required
                maxLength={name === 'username' ? 32 : undefined}
              />
            </div>
          ))}
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'creating account...' : 'sign up'}
          </button>
        </form>
        <p style={styles.footer}>
          already have an account? <Link to="/login">log in</Link>
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
    color: 'var(--accent)',
    fontStyle: 'italic',
  },
  subtitle: {
    color: 'var(--text-muted)',
    marginBottom: '28px',
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
  },
}

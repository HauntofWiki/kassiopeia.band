import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword, updateProfile, uploadAvatar } from '../api'
import { useAuth } from '../App'
import NavHeader from '../components/NavHeader'

export default function Settings() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [displayName, setDisplayName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPwForm, setShowPwForm] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '')
      setTitle(user.title || '')
      setBio(user.bio || '')
      setIsPublic(user.is_public || false)
    }
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await updateProfile(displayName.trim() || null, title.trim() || null, bio || null, isPublic)
      setUser((prev) => ({ ...prev, display_name: updated.display_name, title: updated.title, bio: updated.bio, is_public: updated.is_public }))
      setSuccess('Profile saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    setSuccess('')
    try {
      const result = await uploadAvatar(file)
      setUser((prev) => ({ ...prev, profile_picture: result.profile_picture }))
      setSuccess('Avatar updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return }
    setPwSaving(true)
    try {
      await changePassword(pwForm.current, pwForm.next)
      setPwSuccess('Password updated.')
      setPwForm({ current: '', next: '', confirm: '' })
      setShowPwForm(false)
    } catch (err) {
      setPwError(err.message)
    } finally {
      setPwSaving(false)
    }
  }

  const bioHtml = bio ? DOMPurify.sanitize(marked.parse(bio)) : null

  return (
    <div style={styles.page}>
      <NavHeader />
      <div className="page-body" style={styles.body}>
        <h1 style={styles.title}>config</h1>

        <section style={styles.section}>
          <div style={styles.sectionLabel}>account</div>
          <div style={styles.accountRow}>
            <span style={styles.accountItem}><span style={styles.accountKey}>username</span> @{user?.username}</span>
            <span style={styles.accountItem}><span style={styles.accountKey}>email</span> {user?.email}</span>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionLabel}>avatar</div>
          <div style={styles.avatarRow}>
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="avatar" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {(user?.display_name || user?.username || '?')[0].toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={styles.secondaryBtn}
            >
              {uploading ? 'uploading…' : 'change photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
        </section>

        <form onSubmit={handleSave} style={styles.form}>
          <section style={styles.section}>
            <label style={styles.sectionLabel}>display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user?.username}
              maxLength={100}
            />
          </section>

          <section style={styles.section}>
            <label style={styles.sectionLabel}>designation</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="wicky.tv enjoyer"
              maxLength={64}
            />
            <span style={styles.titlePreview}>
              <span style={styles.previewUsername}>@{user?.username}</span>
              {title.trim() && <span style={styles.titleSep}> ✦ {title.trim()}</span>}
            </span>
          </section>

          <section style={styles.section}>
            <div style={styles.bioLabelRow}>
              <label style={styles.sectionLabel}>bio</label>
              <span
                style={styles.previewToggle}
                onClick={() => setPreview((p) => !p)}
              >
                {preview ? 'edit' : 'preview'}
              </span>
            </div>
            {preview ? (
              <div style={styles.bioPreview}>
                {bioHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: bioHtml }} />
                ) : (
                  <span style={styles.muted}>nothing to preview</span>
                )}
              </div>
            ) : (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="tell people a bit about yourself (markdown supported)"
                rows={5}
              />
            )}
          </section>

          <section style={styles.section}>
            <label style={styles.checkRow}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                style={{ width: 'auto', flexShrink: 0 }}
              />
              <span>
                <span>show on public feed</span>
                <span style={styles.checkHint}> — your posts appear on the landing page</span>
              </span>
            </label>
          </section>

          {error && <p className="error">{error}</p>}
          {success && <p style={styles.successMsg}>{success}</p>}

          <div style={styles.actions}>
            <button type="submit" disabled={saving}>
              {saving ? 'saving…' : 'save changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/@${user?.username}`)}
              style={styles.secondaryBtn}
            >
              view profile
            </button>
          </div>
        </form>

        <section style={styles.section}>
          <div style={styles.sectionLabel}>password</div>
          {pwSuccess && <p style={styles.successMsg}>{pwSuccess}</p>}
          {!showPwForm ? (
            <span style={styles.toggle} onClick={() => setShowPwForm(true)}>change password</span>
          ) : (
            <form onSubmit={handleChangePassword} style={styles.form}>
              <input type="password" placeholder="current password" value={pwForm.current}
                onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} required />
              <input type="password" placeholder="new password" value={pwForm.next}
                onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} required />
              <input type="password" placeholder="confirm new password" value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required />
              {pwError && <p className="error">{pwError}</p>}
              <div style={styles.actions}>
                <button type="submit" disabled={pwSaving}>{pwSaving ? 'saving…' : 'update password'}</button>
                <button type="button" style={styles.secondaryBtn} onClick={() => { setShowPwForm(false); setPwError(''); setPwForm({ current: '', next: '', confirm: '' }) }}>cancel</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  body: {
    maxWidth: '540px',
    width: '100%',
    margin: '0 auto',
  },
  title: {
    fontSize: '20px',
    marginBottom: '32px',
    color: 'var(--accent)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  },
  sectionLabel: {
    color: 'var(--text-muted)',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--border)',
  },
  avatarPlaceholder: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '2px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    color: 'var(--text-muted)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  bioLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewToggle: {
    color: 'var(--accent)',
    cursor: 'pointer',
    fontSize: '12px',
  },
  bioPreview: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '10px 12px',
    minHeight: '100px',
    lineHeight: '1.6',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginTop: '8px',
  },
  secondaryBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  },
  successMsg: {
    color: '#4caf50',
    fontSize: '13px',
    marginBottom: '8px',
  },
  toggle: {
    color: 'var(--accent)',
    cursor: 'pointer',
    fontSize: '13px',
  },
  muted: {
    color: 'var(--text-muted)',
  },
  accountRow: {
    display: 'flex', flexDirection: 'column', gap: '6px',
  },
  accountItem: {
    fontSize: '13px', color: 'var(--text)',
  },
  accountKey: {
    color: 'var(--text-muted)', marginRight: '8px',
  },
  checkRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    cursor: 'pointer', fontSize: '13px', alignSelf: 'flex-start',
  },
  checkHint: {
    color: 'var(--text-muted)', fontSize: '12px',
  },
  titlePreview: {
    fontSize: '14px',
  },
  previewUsername: {
    color: 'var(--accent)',
    fontWeight: 'bold',
  },
  titleSep: {
    color: 'var(--title)',
  },
}

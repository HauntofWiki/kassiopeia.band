import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPost, updatePost } from '../api'
import { useAuth } from '../App'
import NavHeader from '../components/NavHeader'

export default function EditPost() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [musicSong, setMusicSong] = useState('')
  const [musicArtist, setMusicArtist] = useState('')
  const [musicAlbum, setMusicAlbum] = useState('')
  const [tags, setTags] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getPost(id).then((post) => {
      if (post.user.username !== user?.username) {
        navigate(`/post/${id}`)
        return
      }
      setTitle(post.title)
      setDescription(post.description || '')
      setMusicSong(post.music_song || '')
      setMusicArtist(post.music_artist || '')
      setMusicAlbum(post.music_album || '')
      setTags(post.tags || '')
      if (post.music_song || post.music_artist || post.music_album) setShowMusic(true)
      setLoaded(true)
    }).catch(() => navigate('/home'))
  }, [id, user])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('title is required')

    const form = new FormData()
    form.append('title', title.trim())
    form.append('description', description.trim())
    form.append('music_song', musicSong.trim())
    form.append('music_artist', musicArtist.trim())
    form.append('music_album', musicAlbum.trim())
    form.append('tags', tags.trim())

    setSubmitting(true)
    try {
      await updatePost(id, form)
      navigate(`/post/${id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!loaded) return null

  return (
    <div style={styles.page}>
      <NavHeader />

      <div style={styles.body}>
        <h2 style={styles.pageTitle}>edit post</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>title</label>
            <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} maxLength={255} />
          </div>

          <div style={styles.field}>
            <div style={styles.labelRow}>
              <label style={styles.label}>description</label>
              <span style={styles.toggle} onClick={() => setShowPreview(p => !p)}>
                {showPreview ? 'edit' : 'preview'}
              </span>
            </div>
            {showPreview ? (
              <div
                style={styles.preview}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(description || '*nothing yet*')),
                }}
              />
            ) : (
              <textarea
                style={styles.textarea}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="markdown supported"
                rows={5}
              />
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>relays</label>
            <input
              style={styles.input}
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="comma-separated"
            />
          </div>

          <div style={styles.field}>
            <span style={styles.toggle} onClick={() => setShowMusic(m => !m)}>
              {showMusic ? '— hide music info' : '+ music info'}
            </span>
            {showMusic && (
              <div style={styles.musicFields}>
                <input style={styles.input} value={musicSong} onChange={e => setMusicSong(e.target.value)} placeholder="song" maxLength={255} />
                <input style={styles.input} value={musicArtist} onChange={e => setMusicArtist(e.target.value)} placeholder="artist" maxLength={255} />
                <input style={styles.input} value={musicAlbum} onChange={e => setMusicAlbum(e.target.value)} placeholder="album" maxLength={255} />
              </div>
            )}
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.actions}>
            <button type="submit" style={styles.btn} disabled={submitting}>
              {submitting ? 'saving...' : 'save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', borderBottom: '1px solid var(--border)',
  },
  logo: { color: 'var(--accent)', fontSize: '18px', cursor: 'pointer' },
  nav: { display: 'flex', gap: '20px' },
  navLink: { color: 'var(--text-muted)', cursor: 'pointer' },
  body: {
    padding: '40px 24px', maxWidth: '600px', width: '100%',
    margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px',
  },
  pageTitle: { color: 'var(--accent)', fontSize: '20px', fontWeight: 'normal', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'var(--text-muted)', fontSize: '13px', letterSpacing: '0.05em' },
  toggle: { color: 'var(--accent)', fontSize: '13px', cursor: 'pointer' },
  input: { width: '100%', boxSizing: 'border-box' },
  textarea: {
    width: '100%', boxSizing: 'border-box', resize: 'vertical',
    fontFamily: 'inherit', fontSize: '14px', background: 'var(--surface)',
    color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', padding: '8px',
  },
  preview: {
    minHeight: '80px', padding: '8px', border: '1px solid var(--border)',
    borderRadius: '4px', fontSize: '14px', lineHeight: '1.6',
  },
  musicFields: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' },
  error: { color: 'var(--error)', fontSize: '14px', margin: 0 },
  actions: { display: 'flex', gap: '12px' },
  btn: {
    padding: '10px 28px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px',
  },
}

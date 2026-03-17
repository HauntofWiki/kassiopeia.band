import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPost, updatePost } from '../api'
import { useAuth } from '../App'

const TYPE_ROUTES = { video: '/', blog: '/blog', show: '/shows', release: '/releases' }

export default function EditPost({ onClose, onSaved }) {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [body, setBody] = useState('')
  const [musicSong, setMusicSong] = useState('')
  const [musicArtist, setMusicArtist] = useState('')
  const [musicAlbum, setMusicAlbum] = useState('')
  const [tags, setTags] = useState('')
  const [showDate, setShowDate] = useState('')
  const [showVenue, setShowVenue] = useState('')
  const [showTicketUrl, setShowTicketUrl] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [sortOrder, setSortOrder] = useState(1000)
  const [showBodyPreview, setShowBodyPreview] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getPost(id).then((p) => {
      if (p.user.username !== user?.username && user?.role !== 'admin') {
        navigate(`/post/${id}`)
        return
      }
      setPost(p)
      setTitle(p.title || '')
      setDescription(p.description || '')
      setBody(p.body || '')
      setMusicSong(p.music_song || '')
      setMusicArtist(p.music_artist || '')
      setMusicAlbum(p.music_album || '')
      setTags(p.tags || '')
      setShowDate(p.show_date || '')
      setShowVenue(p.show_venue || '')
      setShowTicketUrl(p.show_ticket_url || '')
      setIsPublished(p.is_published || false)
      setSortOrder(p.sort_order ?? 1000)
      if (p.music_song || p.music_artist || p.music_album) setShowMusic(true)
      setLoaded(true)
    }).catch(() => navigate('/'))
  }, [id, user])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('title is required')

    const form = new FormData()
    form.append('title', title.trim())
    form.append('is_published', isPublished)
    if (description.trim()) form.append('description', description.trim())
    if (body.trim()) form.append('body', body.trim())
    if (tags.trim()) form.append('tags', tags.trim())
    if (musicSong.trim()) form.append('music_song', musicSong.trim())
    if (musicArtist.trim()) form.append('music_artist', musicArtist.trim())
    if (musicAlbum.trim()) form.append('music_album', musicAlbum.trim())
    if (showDate) form.append('show_date', showDate)
    if (showVenue.trim()) form.append('show_venue', showVenue.trim())
    if (showTicketUrl.trim()) form.append('show_ticket_url', showTicketUrl.trim())
    form.append('sort_order', sortOrder)

    setSubmitting(true)
    try {
      const updated = await updatePost(id, form)
      if (onSaved) onSaved(updated)
      else navigate(`/post/${id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!loaded) return null

  const type = post?.type

  const form = (
    <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>title</label>
          <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} maxLength={255} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>description</label>
          <textarea
            style={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="short description"
            rows={2}
          />
        </div>

        {(type === 'blog' || type === 'release') && (
          <div style={styles.field}>
            <div style={styles.labelRow}>
              <label style={styles.label}>body (markdown)</label>
              <span style={styles.toggle} onClick={() => setShowBodyPreview(p => !p)}>
                {showBodyPreview ? 'edit' : 'preview'}
              </span>
            </div>
            {showBodyPreview ? (
              <div
                style={styles.preview}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(body || '*nothing yet*')) }}
              />
            ) : (
              <textarea
                style={{ ...styles.textarea, minHeight: '160px' }}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="markdown supported"
                rows={8}
              />
            )}
          </div>
        )}

        {type === 'show' && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>date</label>
              <input style={styles.input} type="date" value={showDate} onChange={e => setShowDate(e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>venue</label>
              <input style={styles.input} value={showVenue} onChange={e => setShowVenue(e.target.value)} placeholder="venue name, city" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>ticket url</label>
              <input style={styles.input} value={showTicketUrl} onChange={e => setShowTicketUrl(e.target.value)} placeholder="https://..." />
            </div>
          </>
        )}

        <div style={styles.field}>
          <label style={styles.label}>tags</label>
          <input style={styles.input} value={tags} onChange={e => setTags(e.target.value)} placeholder="comma-separated" />
        </div>

        {(type === 'video' || type === 'release') && (
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
        )}

        {user?.role === 'admin' && (
          <div style={styles.field}>
            <label style={styles.label}>sort order</label>
            <input style={{ ...styles.input, width: '120px' }} type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.actions}>
          <button type="submit" style={styles.btn} disabled={submitting}>
            {submitting ? 'saving...' : 'save changes'}
          </button>
          <label style={styles.publishToggle}>
            <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
            published
          </label>
          <button type="button" style={styles.btnCancel} onClick={() => onClose ? onClose() : navigate(`/post/${id}`)}>
            cancel
          </button>
        </div>
      </form>
  )

  if (onClose) {
    return (
      <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <span style={styles.modalTitle}>edit post</span>
            <span style={styles.closeBtn} onClick={onClose}>✕</span>
          </div>
          {form}
        </div>
      </div>
    )
  }

  return (
    <div className="page-body" style={styles.body}>
      <h2 style={styles.pageTitle}>edit post</h2>
      {form}
    </div>
  )
}

const styles = {
  body: { maxWidth: '600px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' },
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
  actions: { display: 'flex', gap: '16px', alignItems: 'center' },
  btn: {
    padding: '10px 28px', background: 'var(--accent)', color: '#000',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px',
  },
  publishToggle: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' },
  btnCancel: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: '24px',
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '6px', width: '100%', maxWidth: '600px', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px',
    overflowY: 'auto',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: 'var(--accent)', fontSize: '18px' },
  closeBtn: { color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 },
}

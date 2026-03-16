import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPost } from '../api'
import { useAuth } from '../App'
import NavHeader from '../components/NavHeader'

export default function NewPost() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [musicSong, setMusicSong] = useState('')
  const [musicArtist, setMusicArtist] = useState('')
  const [musicAlbum, setMusicAlbum] = useState('')
  const [tags, setTags] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fileInputRef = useRef()

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('title is required')
    if (!mediaFile) return setError('media is required')

    const form = new FormData()
    form.append('title', title.trim())
    if (description.trim()) form.append('description', description.trim())
    if (musicSong.trim()) form.append('music_song', musicSong.trim())
    if (musicArtist.trim()) form.append('music_artist', musicArtist.trim())
    if (musicAlbum.trim()) form.append('music_album', musicAlbum.trim())
    if (tags.trim()) form.append('tags', tags.trim())
    form.append('media', mediaFile)

    setSubmitting(true)
    try {
      const post = await createPost(form)
      navigate(`/@${user.username}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.page}>
      <NavHeader />

      <div className="page-body" style={styles.body}>
        <h2 style={styles.pageTitle}>new post</h2>

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Media picker */}
          <div
            style={{ ...styles.mediaDrop, ...(mediaPreview ? styles.mediaDropFilled : {}) }}
            onClick={() => fileInputRef.current.click()}
          >
            {mediaPreview ? (
              mediaType === 'video' ? (
                <video src={mediaPreview} style={styles.mediaPreview} controls />
              ) : (
                <img src={mediaPreview} alt="preview" style={styles.mediaPreview} />
              )
            ) : (
              <span style={styles.mediaDropLabel}>click to add photo or video</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,video/mp4,video/quicktime"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* Title */}
          <div style={styles.field}>
            <label style={styles.label}>title</label>
            <input
              style={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={255}
              placeholder="what's this?"
            />
          </div>

          {/* Description */}
          <div style={styles.field}>
            <div style={styles.labelRow}>
              <label style={styles.label}>description</label>
              <span
                style={styles.toggle}
                onClick={() => setShowPreview(p => !p)}
              >
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

          {/* Relays */}
          <div style={styles.field}>
            <label style={styles.label}>relays</label>
            <input
              style={styles.input}
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="comma-separated, e.g. life,photos,friends"
            />
          </div>

          {/* Music toggle */}
          <div style={styles.field}>
            <span style={styles.toggle} onClick={() => setShowMusic(m => !m)}>
              {showMusic ? '— hide music info' : '+ add music info'}
            </span>
            {showMusic && (
              <div style={styles.musicFields}>
                <input
                  style={styles.input}
                  value={musicSong}
                  onChange={e => setMusicSong(e.target.value)}
                  placeholder="song"
                  maxLength={255}
                />
                <input
                  style={styles.input}
                  value={musicArtist}
                  onChange={e => setMusicArtist(e.target.value)}
                  placeholder="artist"
                  maxLength={255}
                />
                <input
                  style={styles.input}
                  value={musicAlbum}
                  onChange={e => setMusicAlbum(e.target.value)}
                  placeholder="album"
                  maxLength={255}
                />
              </div>
            )}
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.actions}>
            <button type="submit" style={styles.btn} disabled={submitting}>
              {submitting ? 'posting...' : 'post it'}
            </button>
            <button
              type="button"
              style={styles.btnCancel}
              onClick={() => navigate('/home')}
            >
              cancel
            </button>
          </div>
        </form>
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
    maxWidth: '600px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  pageTitle: {
    color: 'var(--accent)',
    fontSize: '20px',
    fontWeight: 'normal',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  mediaDrop: {
    border: '2px dashed var(--border)',
    borderRadius: '4px',
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  mediaDropFilled: {
    border: '2px solid var(--border)',
    cursor: 'pointer',
  },
  mediaDropLabel: {
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  mediaPreview: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    display: 'block',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    letterSpacing: '0.05em',
  },
  toggle: {
    color: 'var(--accent)',
    fontSize: '13px',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
    fontSize: '14px',
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '8px',
  },
  preview: {
    minHeight: '80px',
    padding: '8px',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  musicFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
  },
  error: {
    color: 'var(--error)',
    fontSize: '14px',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  btn: {
    padding: '10px 28px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  btnCancel: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '10px 0',
  },
}

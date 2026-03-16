import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createPost, deletePost, getPost, listReplies, pinPost, unpinPost, updatePost } from '../api'
import { useAuth } from '../App'
import NavHeader from '../components/NavHeader'

// ── Compose modal (used for both new replies and editing) ────────────────────

function ComposeModal({ postId, quotedPost, editingPost, onClose, onPosted, onEdited }) {
  const isEdit = !!editingPost

  const [description, setDescription] = useState(editingPost?.description || '')
  const [musicSong, setMusicSong] = useState(editingPost?.music_song || '')
  const [musicArtist, setMusicArtist] = useState(editingPost?.music_artist || '')
  const [musicAlbum, setMusicAlbum] = useState(editingPost?.music_album || '')
  const [tags, setTags] = useState(editingPost?.tags || '')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [showMusic, setShowMusic] = useState(
    !!(editingPost?.music_song || editingPost?.music_artist || editingPost?.music_album)
  )
  const [postToFeed, setPostToFeed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) { setFile(null); setPreview(null); return }
    setFile(f)
    setPreview({ url: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' : 'image' })
  }

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview.url)
    setFile(null); setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      const form = new FormData()
      if (description.trim()) form.append('description', description.trim())
      if (musicSong.trim()) form.append('music_song', musicSong.trim())
      if (musicArtist.trim()) form.append('music_artist', musicArtist.trim())
      if (musicAlbum.trim()) form.append('music_album', musicAlbum.trim())
      if (tags.trim()) form.append('tags', tags.trim())

      let result
      if (isEdit) {
        result = await updatePost(editingPost.id, form)
        if (preview) URL.revokeObjectURL(preview.url)
        onEdited(result)
      } else {
        form.append('parent_post_id', postId)
        if (quotedPost) form.append('quoted_post_id', quotedPost.id)
        if (file) form.append('media', file)
        if (postToFeed) form.append('show_in_feed', 'true')
        result = await createPost(form)
        if (preview) URL.revokeObjectURL(preview.url)
        onPosted(result)
      }
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const canSubmit = description.trim() || file || musicSong.trim() || musicArtist.trim() || musicAlbum.trim()

  return (
    <div className="modal-overlay" style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet" style={styles.modal}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>{isEdit ? 'edit reply' : 'reply'}</span>
          <span style={styles.closeBtn} onClick={onClose}>✕</span>
        </div>

        {quotedPost && (
          <div style={styles.quotedBlock}>
            <span style={styles.quotedAuthor}>@{quotedPost.user.username}</span>
            {quotedPost.description && (
              <span style={styles.quotedBody}>
                {quotedPost.description.length > 120
                  ? quotedPost.description.slice(0, 120) + '…'
                  : quotedPost.description}
              </span>
            )}
            {!quotedPost.description && quotedPost.media_path && (
              <span style={styles.muted}>[media]</span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.composeForm}>
          {/* Media — only for new replies, not edits */}
          {!isEdit && (
            <>
              {preview ? (
                <div style={styles.previewWrap}>
                  {preview.type === 'video'
                    ? <video src={preview.url} style={styles.previewMedia} controls />
                    : <img src={preview.url} style={styles.previewMedia} alt="" />}
                  <span style={styles.clearFile} onClick={clearFile}>remove</span>
                </div>
              ) : (
                <label style={styles.mediaPicker}>
                  + attach photo or video
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,video/mp4,video/quicktime"
                    style={{ display: 'none' }}
                    onChange={handleFile}
                  />
                </label>
              )}
            </>
          )}

          <textarea
            ref={textareaRef}
            style={styles.textarea}
            placeholder="say something…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />

          <div style={styles.tagsRow}>
            <input
              style={styles.tagsInput}
              placeholder="tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <span style={styles.toggle} onClick={() => setShowMusic(m => !m)}>
            {showMusic ? '— hide music' : '+ music'}
          </span>
          {showMusic && (
            <div style={styles.musicFields}>
              <input style={styles.musicInput} placeholder="song" value={musicSong} onChange={(e) => setMusicSong(e.target.value)} maxLength={255} />
              <input style={styles.musicInput} placeholder="artist" value={musicArtist} onChange={(e) => setMusicArtist(e.target.value)} maxLength={255} />
              <input style={styles.musicInput} placeholder="album" value={musicAlbum} onChange={(e) => setMusicAlbum(e.target.value)} maxLength={255} />
            </div>
          )}

          {error && <span style={styles.errorText}>{error}</span>}

          <div style={styles.composeActions}>
            {!isEdit && (
              <label style={styles.feedToggle}>
                <input
                  type="checkbox"
                  checked={postToFeed}
                  onChange={(e) => setPostToFeed(e.target.checked)}
                  style={{ marginRight: '6px' }}
                />
                post to feed
              </label>
            )}
            <button
              type="submit"
              style={{ ...styles.btn, marginLeft: 'auto', opacity: (!canSubmit || submitting) ? 0.5 : 1 }}
              disabled={submitting || !canSubmit}
            >
              {submitting ? (isEdit ? 'saving…' : 'posting…') : (isEdit ? 'save' : 'post')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Reply card (same shape as the post above) ────────────────────────────────

function ReplyCard({ reply, replyById, user, onQuote, onEdit, onDelete, navigate, highlight }) {
  const isOwn = user?.username === reply.user.username
  const bodyHtml = reply.description
    ? DOMPurify.sanitize(marked.parse(reply.description))
    : null
  const quoted = reply.quoted_post_id ? replyById[reply.quoted_post_id] : null
  const hasMusic = reply.music_song || reply.music_artist || reply.music_album

  return (
    <div id={`reply-${reply.id}`} style={{ ...styles.reply, ...(highlight ? styles.replyHighlight : {}) }}>
      {quoted && (
        <div style={styles.quotedBlock}>
          <span style={styles.quotedAuthor}>@{quoted.user.username}</span>
          {quoted.description && (
            <span style={styles.quotedBody}>
              {quoted.description.length > 120 ? quoted.description.slice(0, 120) + '…' : quoted.description}
            </span>
          )}
          {!quoted.description && quoted.media_path && <span style={styles.muted}>[media]</span>}
        </div>
      )}

      {reply.media_path && (
        <div style={styles.replyMediaWrap}>
          {reply.media_type === 'video'
            ? <video src={`/uploads/${reply.media_path}`} controls style={styles.replyMedia} />
            : <img src={`/uploads/${reply.media_path}`} alt="" style={styles.replyMedia} />}
        </div>
      )}

      {bodyHtml && (
        <div style={styles.replyBody} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      )}

      {reply.tags && (
        <div style={styles.tags}>
          {reply.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
            <span key={tag} style={styles.tag} onClick={() => navigate(`/tags/${encodeURIComponent(tag)}`)}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {hasMusic && (
        <div style={styles.music}>
          <span style={styles.musicIcon}>♪</span>
          <span>{[reply.music_song, reply.music_artist, reply.music_album].filter(Boolean).join(' — ')}</span>
        </div>
      )}

      <div style={styles.replyMeta}>
        <span style={styles.replyAuthor} onClick={() => navigate(`/@${reply.user.username}`)}>
          @{reply.user.username}
        </span>
        {reply.user.title && (
          <span style={styles.titleBadge}>
            <span style={styles.titleSep}>✦</span> {reply.user.title}
          </span>
        )}
        <span style={styles.muted}>
          {new Date(reply.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {reply.is_edited && ' · edited'}
        </span>
        {user && <span style={styles.actionLink} onClick={() => onQuote(reply)}>quote</span>}
        {isOwn && <span style={styles.actionLink} onClick={() => onEdit(reply)}>edit</span>}
        {(isOwn || user?.is_admin) && <span style={styles.actionDanger} onClick={() => onDelete(reply.id)}>delete</span>}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Post() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [replies, setReplies] = useState([])
  const [composing, setComposing] = useState(false)
  const [quotedPost, setQuotedPost] = useState(null)
  const [editingPost, setEditingPost] = useState(null)

  const didScrollRef = useRef(false)

  useEffect(() => {
    didScrollRef.current = false
    getPost(id).then(setPost).catch(() => setError('Post not found'))

    const loadReplies = (scroll) => listReplies(id).then(replies => {
      setReplies(replies)
      if (scroll && highlightId && !didScrollRef.current) {
        didScrollRef.current = true
        setTimeout(() => {
          const el = document.getElementById(`reply-${highlightId}`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    }).catch(() => {})

    loadReplies(true)
    const pollId = setInterval(() => loadReplies(false), 10000)
    return () => clearInterval(pollId)
  }, [id])

  async function handlePin() {
    try {
      const updated = post.is_pinned ? await unpinPost(id) : await pinPost(id)
      setPost(updated)
    } catch (err) { setError(err.message) }
  }

  async function handleDeletePost() {
    try {
      await deletePost(id)
      navigate(`/@${post.user.username}`)
    } catch (err) { setError(err.message) }
  }

  async function handleDeleteReply(replyId) {
    try {
      await deletePost(replyId)
      setReplies((prev) => prev.filter((r) => r.id !== replyId))
    } catch (err) { setError(err.message) }
  }

  function openReply() { setQuotedPost(null); setEditingPost(null); setComposing(true) }
  function openQuote(reply) { setQuotedPost(reply); setEditingPost(null); setComposing(true) }
  function openEdit(reply) { setEditingPost(reply); setQuotedPost(null); setComposing(true) }

  function handlePosted(reply) {
    setReplies((prev) => [...prev, reply])
    setComposing(false); setQuotedPost(null)
  }

  function handleEdited(updated) {
    setReplies((prev) => prev.map((r) => r.id === updated.id ? updated : r))
    setComposing(false); setEditingPost(null)
  }

  if (error) return (
    <div style={styles.page}>
      <NavHeader />
      <div style={styles.body}><p style={styles.muted}>{error}</p></div>
    </div>
  )

  if (!post) return null

  const isOwn = user?.username === post.user.username
  const descHtml = post.description ? DOMPurify.sanitize(marked.parse(post.description)) : null
  const hasMusic = post.music_song || post.music_artist || post.music_album
  const replyById = Object.fromEntries(replies.map((r) => [r.id, r]))

  return (
    <div style={styles.page}>
      <NavHeader />
      <div className="page-body" style={styles.body}>

        {/* Post media */}
        <div style={styles.mediaWrap}>
          {post.media_type === 'video'
            ? <video src={`/uploads/${post.media_path}`} controls style={styles.media} />
            : <img src={`/uploads/${post.media_path}`} alt={post.title} style={styles.media} />}
        </div>

        {/* Post meta */}
        <div style={styles.meta}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>{post.title}</h1>
            {(isOwn || user?.is_admin) && (
              <div style={styles.actions}>
                {isOwn && <span style={styles.actionLink} onClick={() => navigate(`/post/${id}/edit`)}>edit</span>}
                {user?.is_admin && !post.parent_post_id && (
                  <span style={styles.actionLink} onClick={handlePin}>
                    {post.is_pinned ? 'unpin' : 'pin'}
                  </span>
                )}
                {(isOwn || user?.is_admin) && (
                  confirmDelete ? (
                    <>
                      <span style={styles.actionDanger} onClick={handleDeletePost}>confirm delete</span>
                      <span style={styles.actionLink} onClick={() => setConfirmDelete(false)}>cancel</span>
                    </>
                  ) : (
                    <span style={styles.actionDanger} onClick={() => setConfirmDelete(true)}>delete</span>
                  )
                )}
              </div>
            )}
          </div>

          <div style={styles.byline}>
            <span style={styles.username} onClick={() => navigate(`/@${post.user.username}`)}>
              @{post.user.username}
            </span>
            {post.user.title && (
              <span style={styles.titleBadge}>
                <span style={styles.titleSep}>✦</span> {post.user.title}
              </span>
            )}
            <span style={styles.muted}>
              {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {post.is_edited && ' · edited'}
            </span>
          </div>

          {post.tags && (
            <div style={styles.tags}>
              {post.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                <span key={tag} style={styles.tag} onClick={() => navigate(`/tags/${encodeURIComponent(tag)}`)}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {hasMusic && (
            <div style={styles.music}>
              <span style={styles.musicIcon}>♪</span>
              <span>{[post.music_song, post.music_artist, post.music_album].filter(Boolean).join(' — ')}</span>
            </div>
          )}

          {descHtml && (
            <div style={styles.description} dangerouslySetInnerHTML={{ __html: descHtml }} />
          )}
        </div>

        {/* Thread */}
        <div style={styles.thread}>
          <div style={styles.threadBar}>
            <span style={styles.threadLabel}>
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </span>
            {user ? (
              <button style={styles.replyBtn} onClick={openReply}>+ reply</button>
            ) : (
              <span style={styles.muted}>
                <span style={styles.actionLink} onClick={() => navigate('/login')}>log in</span>
                {' '}to reply
              </span>
            )}
          </div>

          {replies.map((r) => (
            <ReplyCard
              key={r.id}
              reply={r}
              replyById={replyById}
              user={user}
              onQuote={openQuote}
              onEdit={openEdit}
              onDelete={handleDeleteReply}
              navigate={navigate}
              highlight={highlightId && String(r.id) === highlightId}
            />
          ))}
        </div>

      </div>

      {composing && (
        <ComposeModal
          postId={id}
          quotedPost={quotedPost}
          editingPost={editingPost}
          onClose={() => { setComposing(false); setQuotedPost(null); setEditingPost(null) }}
          onPosted={handlePosted}
          onEdited={handleEdited}
        />
      )}
    </div>
  )
}


const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  body: {
    maxWidth: '800px', width: '100%', margin: '0 auto',
    display: 'flex', flexDirection: 'column', gap: '24px',
  },
  mediaWrap: {
    background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden',
    display: 'flex', justifyContent: 'center',
  },
  media: { width: '100%', maxHeight: '600px', objectFit: 'contain', display: 'block' },
  meta: { display: 'flex', flexDirection: 'column', gap: '10px' },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' },
  title: { fontSize: '22px', fontWeight: 'bold', margin: 0 },
  actions: { display: 'flex', gap: '14px', flexShrink: 0, paddingTop: '4px' },
  actionLink: { color: 'var(--accent)', cursor: 'pointer', fontSize: '13px' },
  actionDanger: { color: 'var(--error)', cursor: 'pointer', fontSize: '13px' },
  byline: { display: 'flex', gap: '12px', alignItems: 'center' },
  username: { color: 'var(--accent)', cursor: 'pointer', fontSize: '14px' },
  muted: { color: 'var(--text-muted)', fontSize: '13px' },
  tags: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  tag: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '3px', padding: '2px 8px', fontSize: '12px', color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  music: {
    display: 'flex', gap: '8px', alignItems: 'center',
    color: 'var(--text-muted)', fontSize: '13px',
    borderLeft: '2px solid var(--accent)', paddingLeft: '10px',
  },
  musicIcon: { color: 'var(--accent)' },
  description: { lineHeight: '1.7', marginTop: '4px' },

  // Thread
  thread: { display: 'flex', flexDirection: 'column', gap: '20px' },
  threadBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderTop: '1px solid var(--border)', paddingTop: '16px',
  },
  threadLabel: { color: 'var(--text-muted)', fontSize: '13px' },
  replyBtn: {
    background: 'transparent', border: '1px solid var(--accent)',
    color: 'var(--accent)', borderRadius: '4px', padding: '5px 14px',
    cursor: 'pointer', fontSize: '13px',
  },
  reply: {
    display: 'flex', flexDirection: 'column', gap: '8px',
    paddingBottom: '20px', borderBottom: '1px solid var(--border)',
  },
  replyHighlight: {
    background: 'var(--surface)',
    borderLeft: '2px solid var(--accent)',
    paddingLeft: '12px',
    borderRadius: '2px',
  },
  replyMeta: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
  replyAuthor: { color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  titleBadge: { color: 'var(--title, #00e8c8)', fontSize: '13px' },
  titleSep: { color: 'var(--title, #00e8c8)' },
  replyBody: { lineHeight: '1.6', fontSize: '14px' },
  replyMediaWrap: { borderRadius: '4px', overflow: 'hidden', maxWidth: '500px' },
  replyMedia: { width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' },
  quotedBlock: {
    background: 'var(--surface)', borderLeft: '3px solid var(--border)',
    padding: '8px 12px', borderRadius: '3px', fontSize: '13px',
    display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'baseline',
  },
  quotedAuthor: { color: 'var(--accent)', fontWeight: 'bold', flexShrink: 0 },
  quotedBody: { color: 'var(--text-muted)', fontStyle: 'italic' },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: '24px',
  },
  modal: {
    background: 'var(--bg, #111)', border: '1px solid var(--border)',
    borderRadius: '6px', width: '100%', maxWidth: '560px', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px',
    overflowY: 'auto',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: '16px', fontWeight: 'bold' },
  closeBtn: { color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' },
  composeForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  mediaPicker: {
    border: '2px dashed var(--border)', borderRadius: '4px',
    padding: '20px', textAlign: 'center', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: '13px',
  },
  previewWrap: {
    position: 'relative', borderRadius: '4px', overflow: 'hidden', background: 'var(--surface)',
  },
  previewMedia: { width: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block' },
  clearFile: {
    position: 'absolute', top: '8px', right: '8px',
    background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '3px',
    padding: '3px 8px', fontSize: '12px', cursor: 'pointer',
  },
  textarea: {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '4px', color: 'inherit', fontFamily: 'inherit', fontSize: '14px',
    padding: '10px 12px', resize: 'vertical', boxSizing: 'border-box',
  },
  tagsRow: {},
  tagsInput: {
    width: '100%', boxSizing: 'border-box', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '4px',
    color: 'inherit', fontFamily: 'inherit', fontSize: '13px', padding: '7px 10px',
  },
  toggle: { color: 'var(--accent)', cursor: 'pointer', fontSize: '13px' },
  musicFields: { display: 'flex', flexDirection: 'column', gap: '8px' },
  musicInput: {
    width: '100%', boxSizing: 'border-box', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '4px',
    color: 'inherit', fontFamily: 'inherit', fontSize: '13px', padding: '7px 10px',
  },
  composeActions: { display: 'flex', alignItems: 'center' },
  feedToggle: { color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' },
  btn: {
    background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '4px',
    padding: '6px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
  },
  errorText: { color: 'var(--error)', fontSize: '13px' },
}

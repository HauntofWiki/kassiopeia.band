import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'

export default function Player() {
  const {
    currentPost, isPlaying, nowPlayingView,
    setIsPlaying, videoRef, next, prev,
    exitNowPlaying, playlist, loadPost, setNowPlayingView,
  } = usePlayer()
  const location = useLocation()
  const navigate = useNavigate()

  const isVideo = currentPost?.media_type === 'video'
  const mediaSrc = isVideo && currentPost?.media_path ? `/uploads/${currentPost.media_path}` : null
  const thumbnail = currentPost?.thumbnail_path ? `/uploads/${currentPost.thumbnail_path}` : null

  // Auto-collapse to mini when navigating away from music tab
  useEffect(() => {
    if (location.pathname !== '/' && nowPlayingView) {
      exitNowPlaying()
    }
  }, [location.pathname])

  // Load new source when currentPost changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (mediaSrc) {
      video.src = mediaSrc
      video.load()
      video.play().catch(() => {})
    } else {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [currentPost?.id])

  // Sync play/pause
  useEffect(() => {
    const video = videoRef.current
    if (!video || !mediaSrc) return
    if (isPlaying) video.play().catch(() => {})
    else video.pause()
  }, [isPlaying])

  const upNext = playlist.filter(p => p.id !== currentPost?.id)

  function expandPlayer() {
    navigate('/')
    setNowPlayingView(true)
  }

  return (
    <>
      {/* Overlay — always contains the video element so it stays in DOM */}
      <div style={{ ...styles.overlay, ...(nowPlayingView ? styles.overlayVisible : styles.overlayHidden) }}>
        {nowPlayingView && (
          <div style={styles.overlayHeader}>
            <button style={styles.backBtn} onClick={exitNowPlaying}>←</button>
            <span style={styles.overlayHeaderTitle}>{currentPost?.title || ''}</span>
          </div>
        )}

        {/* Video wrapper — maxHeight:0 collapses visually but audio keeps playing */}
        <div style={nowPlayingView ? {} : { maxHeight: 0, overflow: 'hidden' }}>
          <div style={nowPlayingView ? styles.overlayInner : {}}>
          <video
            ref={videoRef}
            style={styles.videoEl}
            onEnded={next}
            playsInline
          />
          </div>
        </div>

        {nowPlayingView && currentPost && (
          <div style={styles.overlayContent}>
            <div style={styles.nowPlayingMeta}>
              <p style={styles.nowPlayingTitle}>{currentPost.title}</p>
              {currentPost.description && (
                <p style={styles.nowPlayingDesc}>{currentPost.description}</p>
              )}
              <div style={styles.overlayControls}>
                <button style={styles.ctrlBtn} onClick={prev}>‹‹</button>
                <button style={styles.ctrlBtn} onClick={() => setIsPlaying(p => !p)}>
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button style={styles.ctrlBtn} onClick={next}>››</button>
              </div>
            </div>

            {upNext.length > 0 && (
              <div style={styles.upNextSection}>
                <p style={styles.upNextLabel}>up next</p>
                {upNext.map(p => (
                  <div key={p.id} style={styles.upNextItem} onClick={() => loadPost(p, playlist)}>
                    <div style={styles.upNextThumb}>
                      {p.thumbnail_path
                        ? <img src={`/uploads/${p.thumbnail_path}`} alt={p.title} style={styles.upNextThumbImg} />
                        : <div style={styles.upNextThumbPlaceholder}>▶</div>
                      }
                    </div>
                    <span style={styles.upNextItemTitle}>{p.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mini bar — shown when something is playing but not in overlay mode */}
      {currentPost && !nowPlayingView && (
        <div style={styles.miniBar}>
          <div style={styles.miniLeft} onClick={expandPlayer}>
            {thumbnail
              ? <img src={thumbnail} alt="" style={styles.miniThumb} />
              : <div style={styles.miniThumbPlaceholder}>♪</div>
            }
            <span style={styles.miniTitle}>{currentPost.title}</span>
          </div>
          <div style={styles.miniControls}>
            <button style={styles.ctrlBtn} onClick={prev}>‹‹</button>
            <button style={styles.ctrlBtn} onClick={() => setIsPlaying(p => !p)}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button style={styles.ctrlBtn} onClick={next}>››</button>
            <button style={styles.ctrlBtn} onClick={expandPlayer} title="expand">∧</button>
          </div>
        </div>
      )}
    </>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    left: 0,
    right: 0,
    zIndex: 50,
    background: 'var(--bg)',
  },
  overlayVisible: {
    top: 0,
    bottom: 0,
    overflowY: 'auto',
  },
  overlayHidden: {
    top: 0,
  },
  overlayHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    background: 'var(--bg)',
    zIndex: 1,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  overlayHeaderTitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    flex: 1,
  },
  videoEl: {
    width: '100%',
    display: 'block',
    background: '#000',
    maxHeight: '65vh',
    objectFit: 'contain',
  },
  overlayInner: {
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
  },
  overlayContent: {
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  nowPlayingMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  nowPlayingTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
    color: 'var(--text)',
  },
  nowPlayingDesc: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: '1.5',
  },
  overlayControls: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  upNextSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  upNextLabel: {
    fontSize: '12px',
    color: 'var(--accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    margin: 0,
  },
  upNextItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  upNextThumb: {
    width: '80px',
    aspectRatio: '16/9',
    background: 'var(--surface)',
    borderRadius: '3px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  upNextThumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  upNextThumbPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '16px',
  },
  upNextItemTitle: {
    fontSize: '13px',
    color: 'var(--text)',
    lineHeight: '1.3',
  },
  miniBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: '56px',
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    gap: '12px',
  },
  miniLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    overflow: 'hidden',
    flex: 1,
    cursor: 'pointer',
  },
  miniThumb: {
    width: '40px',
    height: '40px',
    objectFit: 'cover',
    borderRadius: '3px',
    flexShrink: 0,
  },
  miniThumbPlaceholder: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    borderRadius: '3px',
    flexShrink: 0,
    color: 'var(--text-muted)',
    fontSize: '16px',
  },
  miniTitle: {
    fontSize: '13px',
    color: 'var(--text)',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  miniControls: {
    display: 'flex',
    gap: '4px',
    flexShrink: 0,
  },
  ctrlBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
}

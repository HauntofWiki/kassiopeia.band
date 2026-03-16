import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { followUser, getProfile, listPosts, unfollowUser } from '../api'
import { useAuth } from '../App'
import NavHeader from '../components/NavHeader'

export default function Profile() {
  const { username: rawUsername } = useParams()
  const username = rawUsername?.replace(/^@/, '')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')
  const [followLoading, setFollowLoading] = useState(false)
  const [view, setView] = useState('grid')

  useEffect(() => {
    getProfile(username)
      .then(setProfile)
      .catch(() => setError('User not found'))
    listPosts(username).then(setPosts).catch(() => {})
  }, [username])

  if (error) {
    return (
      <div style={styles.page}>
        <NavHeader />
        <div className="page-body" style={styles.body}>
          <p style={styles.muted}>{error}</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const isOwn = user?.username === profile.username

  async function handleFollow() {
    setFollowLoading(true)
    try {
      if (profile.is_following) {
        await unfollowUser(profile.username)
        setProfile(p => ({ ...p, is_following: false, follower_count: p.follower_count - 1 }))
      } else {
        await followUser(profile.username)
        setProfile(p => ({ ...p, is_following: true, follower_count: p.follower_count + 1 }))
      }
    } catch (err) {
      // ignore
    } finally {
      setFollowLoading(false)
    }
  }
  const bioHtml = profile.bio
    ? DOMPurify.sanitize(marked.parse(profile.bio))
    : null

  return (
    <div style={styles.page}>
      <NavHeader />
      <div className="page-body" style={styles.body}>
        <div style={styles.profileHeader}>
          <div style={styles.avatarWrap}>
            {profile.profile_picture ? (
              <img src={profile.profile_picture} alt="avatar" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {(profile.display_name || profile.username)[0].toUpperCase()}
              </div>
            )}
          </div>
          <div style={styles.profileInfo}>
            <div style={styles.displayName}>
              {profile.display_name || profile.username}
            </div>
            {profile.title && (
              <div style={styles.profileTitle}>{profile.title}</div>
            )}
            <div style={styles.usernameRow}>
              <span style={styles.muted}>@{profile.username}</span>
              {isOwn && (
                <span style={styles.editLink} onClick={() => navigate('/settings')}>
                  edit profile
                </span>
              )}
              {!isOwn && user && !profile.is_admin && (
                <span
                  style={profile.is_following ? styles.unfollowBtn : styles.followBtn}
                  onClick={followLoading ? undefined : handleFollow}
                >
                  {followLoading ? '...' : profile.is_following ? 'unfollow' : 'follow'}
                </span>
              )}
            </div>
            <div style={styles.followCounts}>
              <span style={styles.muted}><b style={styles.countNum}>{profile.follower_count}</b> followers</span>
              <span style={styles.muted}><b style={styles.countNum}>{profile.following_count}</b> following</span>
            </div>
            {profile.created_at && (
              <div style={styles.muted}>
                joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            )}
            {bioHtml && (
              <div
                style={styles.bio}
                dangerouslySetInnerHTML={{ __html: bioHtml }}
              />
            )}
          </div>
        </div>
        <div style={styles.gridSection}>
          <div style={styles.viewToggleRow}>
            <span
              style={view === 'grid' ? styles.toggleActive : styles.toggleOption}
              onClick={() => setView('grid')}
            >⊞ grid</span>
            <span
              style={view === 'feed' ? styles.toggleActive : styles.toggleOption}
              onClick={() => setView('feed')}
            >☰ feed</span>
          </div>

          {posts.length === 0 ? (
            <p style={styles.muted}>no posts yet.</p>
          ) : view === 'grid' ? (
            <div style={styles.grid}>
              {posts.map(post => (
                <div
                  key={post.id}
                  style={styles.gridItem}
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  {post.thumbnail_path ? (
                    <div style={styles.videoThumbWrap}>
                      <img src={`/uploads/${post.thumbnail_path}`} alt={post.title} style={styles.gridImg} />
                      {post.media_type === 'video' && <span style={styles.gridPlayOverlay}>▶</span>}
                    </div>
                  ) : post.media_type === 'video' ? (
                    <div style={styles.videoThumb}>
                      <span style={styles.playIcon}>▶</span>
                      <span style={styles.gridItemTitle}>{post.title}</span>
                    </div>
                  ) : (
                    <img
                      src={`/uploads/${post.media_path}`}
                      alt={post.title}
                      style={styles.gridImg}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.feedList}>
              {posts.map(post => (
                <div key={post.id} style={styles.feedCard} onClick={() => navigate(`/post/${post.id}`)}>
                  {post.thumbnail_path ? (
                    <div style={styles.feedThumbWrap}>
                      <img src={`/uploads/${post.thumbnail_path}`} alt={post.title} style={styles.feedThumbImg} />
                      {post.media_type === 'video' && <span style={styles.feedPlayOverlay}>▶</span>}
                    </div>
                  ) : post.media_type === 'video' ? (
                    <div style={styles.feedThumb}>
                      <span style={styles.feedPlayIcon}>▶</span>
                    </div>
                  ) : (
                    <img
                      src={`/uploads/${post.media_path}`}
                      alt={post.title}
                      style={styles.feedThumbImg}
                    />
                  )}
                  <div style={styles.feedMeta}>
                    <span style={styles.feedTitle}>{post.title}</span>
                    {post.description && (
                      <span style={styles.feedDesc}>
                        {post.description.length > 80 ? post.description.slice(0, 80) + '…' : post.description}
                      </span>
                    )}
                    <span style={styles.muted}>
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto',
  },
  profileHeader: {
    display: 'flex',
    gap: '28px',
    alignItems: 'flex-start',
    marginBottom: '40px',
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatar: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--border)',
  },
  avatarPlaceholder: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '2px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    color: 'var(--text-muted)',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  displayName: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  usernameRow: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: '15px',
    color: 'var(--text)',
    fontWeight: 'bold',
  },
  editLink: {
    color: 'var(--accent)',
    cursor: 'pointer',
    fontSize: '13px',
  },
  followBtn: {
    color: 'var(--accent)',
    cursor: 'pointer',
    fontSize: '13px',
    border: '1px solid var(--accent)',
    borderRadius: '3px',
    padding: '2px 10px',
  },
  unfollowBtn: {
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '13px',
    border: '1px solid var(--border)',
    borderRadius: '3px',
    padding: '2px 10px',
  },
  followCounts: {
    display: 'flex',
    gap: '16px',
  },
  countNum: {
    color: 'var(--text)',
    fontWeight: 'bold',
  },
  muted: {
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  bio: {
    marginTop: '8px',
    lineHeight: '1.6',
  },
  gridSection: {
    borderTop: '1px solid var(--border)',
    paddingTop: '24px',
  },
  viewToggleRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '16px',
  },
  toggleOption: {
    padding: '3px 10px', borderRadius: '3px', fontSize: '12px',
    color: 'var(--text-muted)', cursor: 'pointer',
    border: '1px solid var(--border)',
  },
  toggleActive: {
    padding: '3px 10px', borderRadius: '3px', fontSize: '12px',
    color: 'var(--accent)', cursor: 'pointer',
    border: '1px solid var(--accent)',
  },
  feedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  feedCard: {
    display: 'flex', gap: '14px', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer',
  },
  feedThumbWrap: {
    position: 'relative', width: '72px', height: '72px', flexShrink: 0,
  },
  feedPlayOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent)', fontSize: '22px', pointerEvents: 'none',
  },
  feedThumb: {
    width: '72px', height: '72px', flexShrink: 0,
    background: 'var(--surface)', borderRadius: '3px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  feedThumbImg: {
    width: '72px', height: '72px', objectFit: 'cover',
    borderRadius: '3px', flexShrink: 0, display: 'block',
  },
  feedPlayIcon: { color: 'var(--accent)', fontSize: '22px' },
  feedMeta: {
    display: 'flex', flexDirection: 'column', gap: '4px',
    flex: 1, minWidth: 0,
  },
  feedTitle: {
    fontSize: '15px', overflow: 'hidden',
    whiteSpace: 'nowrap', textOverflow: 'ellipsis',
  },
  feedDesc: {
    color: 'var(--text-muted)', fontSize: '12px',
    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '4px',
  },
  gridItem: {
    aspectRatio: '1',
    overflow: 'hidden',
    cursor: 'pointer',
    background: 'var(--surface)',
    position: 'relative',
  },
  gridImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  videoThumbWrap: {
    position: 'relative', width: '100%', height: '100%',
  },
  gridPlayOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent)', fontSize: '28px', pointerEvents: 'none',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px',
    boxSizing: 'border-box',
  },
  playIcon: {
    color: 'var(--accent)',
    fontSize: '28px',
  },
  gridItemTitle: {
    color: 'var(--text-muted)',
    fontSize: '11px',
    textAlign: 'center',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
}

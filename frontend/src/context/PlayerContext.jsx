import { createContext, useContext, useRef, useState } from 'react'
import { trackPlay, trackSkip } from '../analytics'

const PlayerContext = createContext(null)

export function usePlayer() {
  return useContext(PlayerContext)
}

export function PlayerProvider({ children }) {
  const [currentPost, setCurrentPost] = useState(null)
  const [playlist, setPlaylist] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [nowPlayingView, setNowPlayingView] = useState(false)
  const videoRef = useRef(null)

  function loadPost(post, posts = []) {
    setCurrentPost(post)
    if (posts.length) setPlaylist(posts)
    setIsPlaying(true)
    setNowPlayingView(true)
    trackPlay(post)
  }

  function exitNowPlaying() {
    setNowPlayingView(false)
  }

  // opts.auto marks an auto-advance (e.g. onEnded) so it isn't double-counted
  // as a skip on top of the "complete" event already fired for that transition.
  function next(opts = {}) {
    if (!currentPost || !playlist.length) return
    const idx = playlist.findIndex(p => p.id === currentPost.id)
    const nextPost = playlist[(idx + 1) % playlist.length]
    setCurrentPost(nextPost)
    setIsPlaying(true)
    if (!opts.auto) trackSkip('next', nextPost)
  }

  function prev() {
    if (!currentPost || !playlist.length) return
    const idx = playlist.findIndex(p => p.id === currentPost.id)
    const prevPost = playlist[(idx - 1 + playlist.length) % playlist.length]
    setCurrentPost(prevPost)
    setIsPlaying(true)
    trackSkip('prev', prevPost)
  }

  return (
    <PlayerContext.Provider value={{
      currentPost, playlist, isPlaying, nowPlayingView,
      setIsPlaying, setNowPlayingView,
      loadPost, next, prev, videoRef, exitNowPlaying,
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

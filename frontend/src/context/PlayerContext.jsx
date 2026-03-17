import { createContext, useContext, useRef, useState } from 'react'

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
  }

  function exitNowPlaying() {
    setNowPlayingView(false)
  }

  function next() {
    if (!currentPost || !playlist.length) return
    const idx = playlist.findIndex(p => p.id === currentPost.id)
    if (idx >= 0 && idx < playlist.length - 1) {
      setCurrentPost(playlist[idx + 1])
      setIsPlaying(true)
    }
  }

  function prev() {
    if (!currentPost || !playlist.length) return
    const idx = playlist.findIndex(p => p.id === currentPost.id)
    if (idx > 0) {
      setCurrentPost(playlist[idx - 1])
      setIsPlaying(true)
    }
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

import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getMe } from './api'
import NavHeader from './components/NavHeader'
import Player from './components/Player'
import SocialBar from './components/SocialBar'
import TabNav from './components/TabNav'
import { PlayerProvider, usePlayer } from './context/PlayerContext'
import About from './pages/About'
import Feed from './pages/Feed'
import Admin from './pages/Admin'
import Blog from './pages/Blog'
import EditPost from './pages/EditPost'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Login from './pages/Login'
import NewPost from './pages/NewPost'
import Post from './pages/Post'
import Releases from './pages/Releases'
import Settings from './pages/Settings'
import Shows from './pages/Shows'
import Signup from './pages/Signup'
import Tags from './pages/Tags'
import TagsIndex from './pages/TagsIndex'
import Videos from './pages/Videos'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'admin' ? children : <Navigate to="/" replace />
}

function AppContent() {
  const { currentPost, nowPlayingView } = usePlayer()
  const hasMiniBar = currentPost && !nowPlayingView

  return (
    <div style={{ minHeight: '100vh' }}>
      <NavHeader />
      <SocialBar />
      <div style={{ ...styles.column, paddingBottom: hasMiniBar ? '56px' : 0 }}>
        <TabNav />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/feed" element={<Feed />} />
            <Route path="/" element={<Videos />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/shows" element={<Shows />} />
            <Route path="/releases" element={<Releases />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/post/:id" element={<Post />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/tags" element={<TagsIndex />} />
            <Route path="/tags/:tag" element={<Tags />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>

      <Player />
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newPostOpen, setNewPostOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading, setNewPostOpen, setSettingsOpen }}>
      <PlayerProvider>
        <BrowserRouter>
          <AppContent />

          {newPostOpen && user && (user.role === 'admin' || user.role === 'contributor') && (
            <NewPost onClose={() => setNewPostOpen(false)} />
          )}
          {settingsOpen && user && (
            <Settings onClose={() => setSettingsOpen(false)} />
          )}
        </BrowserRouter>
      </PlayerProvider>
    </AuthContext.Provider>
  )
}

const styles = {
  column: {
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'calc(100vh - 41px)',
    background: 'var(--bg)',
  },
}

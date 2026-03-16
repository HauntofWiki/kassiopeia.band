import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getMe } from './api'
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

function ContributorRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return (user.role === 'admin' || user.role === 'contributor') ? children : <Navigate to="/" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'admin' ? children : <Navigate to="/" replace />
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Videos />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/releases" element={<Releases />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/new" element={<ContributorRoute><NewPost /></ContributorRoute>} />
          <Route path="/post/:id" element={<Post />} />
          <Route path="/post/:id/edit" element={<ContributorRoute><EditPost /></ContributorRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/tags" element={<TagsIndex />} />
          <Route path="/tags/:tag" element={<Tags />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

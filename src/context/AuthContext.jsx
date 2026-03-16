import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

// ─── Axios defaults ───────────────────────────────────
axios.defaults.baseURL       = '/api'
axios.defaults.withCredentials = true  // always send cookies

// ─── Auto-refresh interceptor ─────────────────────────
// When any request fails with TOKEN_EXPIRED (403):
//   1. Call /auth/refresh — server sets new cookies
//   2. Retry the original request automatically
//   3. If refresh also fails — dispatch 'auth:logout' to clear state
//
// A queue prevents multiple simultaneous refresh calls
// when several requests expire at the same time.
let isRefreshing = false
let queue        = []        // [ { resolve, reject } ]

const flushQueue = (error) => {
  queue.forEach(p => error ? p.reject(error) : p.resolve())
  queue = []
}

axios.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    if (
      err.response?.status === 403 &&
      err.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retried
    ) {
      original._retried = true

      if (isRefreshing) {
        // Another refresh is already in flight — queue this request
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        })
          .then(() => axios(original))
          .catch(e => Promise.reject(e))
      }

      isRefreshing = true
      try {
        await axios.post('/auth/refresh')   // sets new cookies silently
        flushQueue(null)
        return axios(original)              // retry with new access token
      } catch (refreshErr) {
        flushQueue(refreshErr)
        window.dispatchEvent(new Event('auth:logout'))  // session truly expired
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

// ─── Provider ─────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — verify session by calling /me
  // If the access token cookie is valid, returns the user
  // If expired, the interceptor above calls /refresh first
  useEffect(() => {
    axios.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // Forced logout when refresh token also expires
  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { email, password })
    setUser(res.data.user)
    return res.data
  }

  const register = async (name, email, password) => {
    const res = await axios.post('/auth/register', { name, email, password })
    setUser(res.data.user)
    return res.data
  }

  const logout = async () => {
    try { await axios.post('/auth/logout') } catch (_) {}
    setUser(null)
  }

  const changePassword = async (currentPassword, newPassword) => {
    const res = await axios.post('/auth/change-password', { currentPassword, newPassword })
    // Refresh user state so mustChangePassword clears
    setUser(prev => prev ? { ...prev, mustChangePassword: false } : null)
    return res.data
  }

  const updateUser = (updates) =>
    setUser(prev => prev ? { ...prev, ...updates } : null)

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register, logout, changePassword, updateUser,
      mustChangePassword: user?.mustChangePassword || false,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
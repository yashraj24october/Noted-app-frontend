import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { NotesProvider }     from './context/NotesContext.jsx'
import { NotebooksProvider } from './context/NotebooksContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import AuthPage from './pages/AuthPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import SharedNotePage from './pages/SharedNotePage.jsx'

function Loader() {
  const { isDark } = useTheme()
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg-canvas)',gap:16 }}>
      <div style={{ width:44,height:44,borderRadius:12,background:'#1a1c23',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>📝</div>
      <div style={{ display:'flex',gap:6 }}>
        <span className="w-1.5 h-1.5 rounded-full animate-dot1" style={{ background:'var(--text-tertiary)' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-dot2" style={{ background:'var(--text-tertiary)' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-dot3" style={{ background:'var(--text-tertiary)' }} />
      </div>
      <span style={{ fontFamily:"'DM Mono',monospace",fontSize:12,color:'var(--text-tertiary)' }}>loading noted...</span>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return user ? children : <Navigate to="/auth" replace />
}

// Redirects already-logged-in users away from /auth → homepage
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return user ? <Navigate to="/" replace /> : children
}

function ToastConfig() {
  const { isDark } = useTheme()
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: isDark ? '#2a2d3e' : '#1a1c23',
          color: '#e8e8f0',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          fontSize: '13px',
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        },
        success: { iconTheme: { primary: '#56c47a', secondary: isDark ? '#2a2d3e' : '#1a1c23' } },
        error:   { iconTheme: { primary: '#f07070', secondary: isDark ? '#2a2d3e' : '#1a1c23' } },
      }}
    />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public shared note — no auth required */}
            <Route path="/share/:token" element={<SharedNotePage />} />

            <Route path="/auth" element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            } />

            <Route path="/*" element={
              <PrivateRoute>
                <NotesProvider>
                  <NotebooksProvider>
                    <DashboardPage />
                  </NotebooksProvider>
                </NotesProvider>
              </PrivateRoute>
            } />
          </Routes>
          <ToastConfig />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
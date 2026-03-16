import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import toast from 'react-hot-toast'

function LoadingDots() {
  return (
    <span className="flex gap-1.5 items-center">
      <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-dot1" />
      <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-dot2" />
      <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-dot3" />
    </span>
  )
}

function Field({ label, type = 'text', placeholder, value, onChange, required, minLength }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:5 }}>
        {label}
      </label>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={onChange} required={required} minLength={minLength}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:'100%', background:'var(--bg-input)',
          border:`1px solid ${focused?'var(--accent)':'var(--border-md)'}`,
          borderRadius:9, padding:'10px 14px', fontSize:14,
          color:'var(--text-primary)', outline:'none', transition:'all 0.18s',
          boxShadow: focused ? '0 0 0 3px var(--accent-light)' : 'none',
        }}
      />
    </div>
  )
}

/* ─── Forgot Password screen ────────────────────────────── */
function ForgotPasswordScreen({ onBack }) {
  const ownerEmail = import.meta.env.VITE_OWNER_EMAIL || 'the app admin'

  return (
    <div style={{ textAlign:'center' }}>
      {/* Icon */}
      <div style={{ width:52, height:52, borderRadius:14, background:'var(--accent-light)', border:'1px solid var(--border-soft)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 16px' }}>
        🔑
      </div>

      <h2 style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:21, color:'var(--text-primary)', marginBottom:6 }}>
        Forgot your password?
      </h2>
      <p style={{ fontSize:13.5, color:'var(--text-secondary)', lineHeight:1.7, marginBottom:20 }}>
        Password resets are handled by the app admin. Contact them and they'll set a temporary password for you.
      </p>

      {/* Contact card */}
      <div style={{
        padding:'14px 18px', borderRadius:12,
        background:'var(--bg-input)', border:'1px solid var(--border-soft)',
        marginBottom:22, textAlign:'left',
      }}>
        <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--text-tertiary)', marginBottom:10 }}>
          Contact admin
        </p>
        <a
          href={`mailto:${ownerEmail}`}
          style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}
        >
          <div style={{ width:34, height:34, borderRadius:9, background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
            ✉️
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:500, color:'var(--accent)', marginBottom:1 }}>
              {ownerEmail}
            </p>
            <p style={{ fontSize:11.5, color:'var(--text-tertiary)' }}>
              Send an email requesting a password reset
            </p>
          </div>
        </a>
      </div>

      {/* What happens next info */}
      <div style={{ textAlign:'left', padding:'12px 14px', borderRadius:10, background:'var(--bg-input)', border:'1px solid var(--border-soft)', marginBottom:22 }}>
        <p style={{ fontSize:11.5, fontWeight:600, color:'var(--text-secondary)', marginBottom:8 }}>What happens next:</p>
        {[
          'Admin sets a temporary password for your account',
          'You log in with the temporary password',
          'You\'ll be asked to set a new password immediately',
        ].map((step, i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:i < 2 ? 7 : 0 }}>
            <span style={{ width:18, height:18, borderRadius:'50%', background:'var(--accent-light)', color:'var(--accent)', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
              {i+1}
            </span>
            <p style={{ fontSize:12.5, color:'var(--text-secondary)', lineHeight:1.5 }}>{step}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        style={{ width:'100%', padding:'10px', borderRadius:9, border:'1px solid var(--border-soft)', background:'var(--bg-input)', color:'var(--text-secondary)', cursor:'pointer', fontSize:13, fontWeight:500, transition:'all 0.18s' }}
        onMouseEnter={e => { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background='var(--bg-input)'; e.currentTarget.style.color='var(--text-secondary)' }}
      >
        ← Back to sign in
      </button>
    </div>
  )
}

/* ─── Force Change Password screen ─────────────────────── */
function ForceChangePasswordScreen() {
  const { changePassword, logout } = useAuth()
  const [form,    setForm]    = useState({ current: '', newPass: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPass.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (form.newPass !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.current === form.newPass) { toast.error('New password must be different from current'); return }
    setLoading(true)
    try {
      await changePassword(form.current, form.newPass)
      toast.success('Password updated! Welcome to Noted 🎉')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally { setLoading(false) }
  }

  return (
    <div>
      {/* Warning banner */}
      <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(212,137,26,0.1)', border:'1px solid rgba(212,137,26,0.25)', marginBottom:20, display:'flex', alignItems:'flex-start', gap:10 }}>
        <span style={{ fontSize:18, flexShrink:0 }}>⚠️</span>
        <div>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--warning)', marginBottom:2 }}>Password reset required</p>
          <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>Your password was reset by the admin. Please set a new password to continue.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Field label="Temporary password" type="password" placeholder="Enter the password given by admin" value={form.current} onChange={set('current')} required />
        <Field label="New password" type="password" placeholder="Minimum 6 characters" value={form.newPass} onChange={set('newPass')} required minLength={6} />
        <Field label="Confirm new password" type="password" placeholder="Type new password again" value={form.confirm} onChange={set('confirm')} required />

        <button
          type="submit"
          disabled={loading}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            marginTop:4, padding:'11px',
            background:'var(--accent)', color:'#fff', border:'none',
            borderRadius:9, fontSize:14, fontWeight:500,
            cursor:loading?'not-allowed':'pointer',
            opacity:loading?0.75:1, boxShadow:'var(--shadow-accent)', transition:'all 0.18s',
          }}
        >
          {loading ? <LoadingDots /> : '🔒 Set new password & continue'}
        </button>
      </form>

      <button
        onClick={logout}
        style={{ width:'100%', marginTop:12, padding:'9px', borderRadius:9, border:'none', background:'transparent', color:'var(--text-tertiary)', cursor:'pointer', fontSize:12.5, transition:'all 0.18s' }}
      >
        Sign out instead
      </button>
    </div>
  )
}

/* ─── Main AuthPage ─────────────────────────────────────── */
export default function AuthPage() {
  const [mode,    setMode]    = useState('login')  // login | register | forgot
  const [form,    setForm]    = useState({ name:'', email:'', password:'' })
  const [loading, setLoading] = useState(false)

  const { login, register, user, mustChangePassword } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const switchMode = (m) => { setMode(m); setForm({ name:'', email:'', password:'' }) }

  // If logged in but must change password — show force change screen
  if (user && mustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden" style={{ background:'var(--bg-canvas)' }}>
        <div className="w-full max-w-[420px] rounded-2xl p-10 animate-slide-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border-soft)', boxShadow:'var(--shadow-xl)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:24 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'#1a1c23', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📝</div>
            <span style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:28, color:'var(--text-primary)' }}>Noted</span>
          </div>
          <ForceChangePasswordScreen />
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await login(form.email, form.password)
        if (res.user?.mustChangePassword) return  // will re-render with ForceChange screen
        toast.success('Welcome back!')
        navigate('/')
      } else {
        await register(form.name, form.email, form.password)
        toast.success("Account created — let's get to work!")
        navigate('/')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden" style={{ background:'var(--bg-canvas)' }}>
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity:0.04, backgroundImage:'radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)', backgroundSize:'28px 28px' }} />

      <div className="relative w-full max-w-[420px] rounded-2xl p-10 animate-slide-up" style={{ background:'var(--bg-card)', border:'1px solid var(--border-soft)', boxShadow:'var(--shadow-xl)' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:28 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:'#1a1c23', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📝</div>
          <span style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:28, color:'var(--text-primary)' }}>Noted</span>
        </div>

        {/* Forgot password screen */}
        {mode === 'forgot' ? (
          <ForgotPasswordScreen onBack={() => switchMode('login')} />
        ) : (
          <>
            <h1 style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:23, textAlign:'center', color:'var(--text-primary)', marginBottom:5 }}>
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </h1>
            <p style={{ fontSize:13.5, textAlign:'center', color:'var(--text-tertiary)', marginBottom:26 }}>
              {mode === 'login' ? 'Sign in to your workspace' : 'Create your note-taking workspace'}
            </p>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {mode === 'register' && (
                <Field label="Full name" placeholder="Your name" value={form.name} onChange={set('name')} required />
              )}
              <Field label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              <Field label="Password" type="password" placeholder="Minimum 6 characters" value={form.password} onChange={set('password')} required minLength={6} />

              {/* Forgot password link — only on login */}
              {mode === 'login' && (
                <div style={{ textAlign:'right', marginTop:-6 }}>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:12.5, color:'var(--accent)', fontWeight:500, padding:0 }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', marginTop:4, padding:'11px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:500, cursor:loading?'not-allowed':'pointer', opacity:loading?0.75:1, boxShadow:'var(--shadow-accent)', transition:'all 0.18s' }}
              >
                {loading ? <LoadingDots /> : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p style={{ textAlign:'center', fontSize:13, color:'var(--text-tertiary)', marginTop:20 }}>
              {mode === 'login' ? (
                <>Don't have an account?{' '}
                  <button onClick={() => switchMode('register')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent)', fontWeight:500, fontSize:13 }}>Sign up free</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => switchMode('login')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent)', fontWeight:500, fontSize:13 }}>Sign in</button>
                </>
              )}
            </p>
          </>
        )}

        {/* ── Built by ── */}
        <div style={{ marginTop:28, paddingTop:18, borderTop:'1px solid var(--border-soft)', textAlign:'center' }}>
          <p style={{ fontSize:11.5, color:'var(--text-tertiary)', letterSpacing:'0.2px' }}>
            Built with{' '}
            <span style={{ color:'#e05555', fontSize:13 }}>❤️</span>
            {' '}by{' '}
            <span style={{
              fontFamily:"'Instrument Serif',serif",
              fontStyle:'italic',
              fontSize:13.5,
              background:'linear-gradient(135deg, var(--accent), #9464dc)',
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
              fontWeight:600,
            }}>
              <Link to="https://www.linkedin.com/in/yash-raj-8a758323b/" target="_blank" style={{ textDecoration:'none', color:'inherit' }}>
              Yash Raj
              </Link>
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
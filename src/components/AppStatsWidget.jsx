import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext.jsx'

/* ─── Count-up ─────────────────────────────────────────── */
function CountUp({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null), prev = useRef(0)
  useEffect(() => {
    if (value == null) return
    const from = prev.current, to = Number(value), t0 = performance.now()
    cancelAnimationFrame(raf.current)
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (to - from) * e))
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else { prev.current = to; setDisplay(to) }
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value])
  return <span>{display.toLocaleString()}</span>
}

/* ─── Time helper ──────────────────────────────────────── */
const timeSince = (date) => {
  if (!date) return 'Never'
  const diff = Date.now() - new Date(date)
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
}

const isActiveToday = (date) => {
  if (!date) return false
  const d = new Date(date), now = new Date()
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth()    === now.getMonth()    &&
         d.getDate()     === now.getDate()
}

/* ─── Custom dark sort dropdown ────────────────────────── */
const SORT_OPTIONS = [
  { value:'joinedAt',    label:'Newest first' },
  { value:'lastActive',  label:'Last active'  },
  { value:'notes',       label:'Most notes'   },
]

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = SORT_OPTIONS.find(o => o.value === value)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:8,
          background:'rgba(255,255,255,0.07)',
          border:`1px solid ${open ? 'rgba(124,140,232,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius:9, padding:'8px 12px',
          fontSize:12.5, color:'rgba(255,255,255,0.7)',
          cursor:'pointer', whiteSpace:'nowrap',
          transition:'all 0.15s',
        }}
      >
        {current?.label}
        <span style={{ fontSize:9, opacity:0.5, transform:open?'rotate(180deg)':'rotate(0deg)', transition:'transform 0.18s', display:'inline-block' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', right:0,
          background:'#252838', border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:9, overflow:'hidden', zIndex:99999,
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)', minWidth:'100%',
          animation:'fadeIn 0.12s ease',
        }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                width:'100%', display:'block', padding:'9px 16px',
                border:'none', background: opt.value === value ? 'rgba(92,106,196,0.2)' : 'transparent',
                color: opt.value === value ? '#7c8ce8' : 'rgba(255,255,255,0.65)',
                fontSize:12.5, textAlign:'left', cursor:'pointer',
                transition:'background 0.12s',
                fontWeight: opt.value === value ? 600 : 400,
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background='rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background='transparent' }}
            >
              {opt.value === value && <span style={{ marginRight:6, fontSize:10 }}>✓</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Reset Password Modal ─────────────────────────────── */
function ResetPasswordModal({ user, adminToken, onClose, onDone }) {
  const [newPassword, setNewPassword] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [done,        setDone]        = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80) }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) { toast.error('At least 6 characters'); return }
    setLoading(true)
    try {
      await axios.post('/users/reset-password',
        { userId: user._id, newPassword },
        { headers: { 'x-admin-token': adminToken } }
      )
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed')
    } finally { setLoading(false) }
  }

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center p-5 animate-fade-in"
      style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-slide-up"
        style={{ width:340, background:'#1e2030', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, padding:'24px', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        {!done ? (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#5c6ac4,#7c8ce8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{user.name}</p>
                <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.4)', fontFamily:"'DM Mono',monospace" }}>{user.email}</p>
              </div>
            </div>

            <div style={{ padding:'10px 12px', borderRadius:9, background:'rgba(212,137,26,0.1)', border:'1px solid rgba(212,137,26,0.2)', marginBottom:18 }}>
              <p style={{ fontSize:12.5, color:'#e8a040', lineHeight:1.5 }}>
                ⚠️ User will be forced to change this password on next login.
              </p>
            </div>

            <form onSubmit={handleReset}>
              <label style={{ display:'block', fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>
                Temporary password
              </label>
              <input
                ref={inputRef}
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:9, padding:'10px 14px', fontSize:14, color:'#fff', outline:'none', marginBottom:16, fontFamily:"'DM Mono',monospace" }}
                onFocus={e => e.target.style.borderColor = 'rgba(124,140,232,0.5)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={onClose} style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13 }}>Cancel</button>
                <button
                  type="submit"
                  disabled={loading || newPassword.length < 6}
                  style={{ flex:2, padding:'9px', borderRadius:8, border:'none', background: loading || newPassword.length < 6 ? 'rgba(240,112,112,0.3)' : 'var(--danger)', color:'#fff', cursor: loading || newPassword.length < 6 ? 'not-allowed':'pointer', fontSize:13, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                >
                  {loading ? <><span style={{ width:8,height:8,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',animation:'spin 0.7s linear infinite',display:'inline-block' }}/>Resetting...</> : '🔑 Reset Password'}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Success state */
          <div style={{ textAlign:'center', padding:'8px 0' }}>
            <div style={{ fontSize:40, marginBottom:14 }}>✅</div>
            <p style={{ fontSize:16, fontWeight:600, color:'#fff', marginBottom:6 }}>Password Reset!</p>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.6, marginBottom:6 }}>
              <strong style={{ color:'rgba(255,255,255,0.8)' }}>{user.name}</strong>'s password has been reset.
            </p>
            <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.4)', lineHeight:1.6, marginBottom:20 }}>
              They'll be asked to set a new password on their next login.
            </p>
            <div style={{ padding:'10px 14px', borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', marginBottom:18, fontFamily:"'DM Mono',monospace" }}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>Temp password to share:</p>
              <p style={{ fontSize:15, color:'#fff', fontWeight:600, letterSpacing:1 }}>{newPassword}</p>
            </div>
            <button
              onClick={() => { onDone(); onClose() }}
              style={{ width:'100%', padding:'10px', borderRadius:9, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:500, boxShadow:'var(--shadow-accent)' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )
}
function UsersListModal({ adminToken, onClose, onTokenExpired }) {
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [sort,        setSort]        = useState('joinedAt')
  const [resetTarget, setResetTarget] = useState(null)  // user to reset password for
  const searchRef = useRef(null)

  useEffect(() => {
    axios.get('/users/all-users', {
      headers: { 'x-admin-token': adminToken }
    })
      .then(res => setUsers(res.data.data))
      .catch(err => {
        const code = err.response?.data?.code
        if (code === 'ADMIN_TOKEN_INVALID' || code === 'ADMIN_TOKEN_MISSING') onTokenExpired()
      })
      .finally(() => setLoading(false))
    setTimeout(() => searchRef.current?.focus(), 120)
  }, [])

  const filtered = users
    .filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'notes')      return b.notes - a.notes
      if (sort === 'lastActive') return new Date(b.lastActive || 0) - new Date(a.lastActive || 0)
      return new Date(b.joinedAt) - new Date(a.joinedAt)
    })

  const activeToday = users.filter(u => isActiveToday(u.lastActive)).length

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 animate-fade-in"
      style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-slide-up flex flex-col"
        style={{
          width: '100%', maxWidth: 620,
          maxHeight: '85vh',
          background: '#1a1c28',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ padding:'18px 22px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <h2 style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:3 }}>
                👥 All Users
              </h2>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontFamily:"'DM Mono',monospace" }}>
                  {users.length} total
                </span>
                {activeToday > 0 && (
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'rgba(86,196,122,0.15)', color:'#56c47a', fontWeight:600 }}>
                    🟢 {activeToday} active today
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ width:32, height:32, borderRadius:9, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(240,112,112,0.15)'; e.currentTarget.style.color='#f07070' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.5)' }}
            >✕</button>
          </div>

          {/* Search + Sort row */}
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, position:'relative' }}>
              <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'rgba(255,255,255,0.25)', pointerEvents:'none' }}>🔍</span>
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                style={{
                  width:'100%', background:'rgba(255,255,255,0.07)',
                  border:'1px solid rgba(255,255,255,0.1)',
                  borderRadius:9, padding:'8px 12px 8px 32px',
                  fontSize:13, color:'#fff', outline:'none',
                  transition:'border-color 0.18s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(124,140,232,0.6)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <SortDropdown value={sort} onChange={setSort} />
          </div>
        </div>

        {/* ── User list ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px 12px' }}>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'40px 0', color:'rgba(255,255,255,0.3)' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.1)', borderTopColor:'#7c8ce8', animation:'spin 0.8s linear infinite' }} />
              <span style={{ fontSize:13 }}>Loading users...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.3)' }}>
              <p style={{ fontSize:32, marginBottom:10, opacity:0.3 }}>👤</p>
              <p style={{ fontSize:14 }}>No users found</p>
            </div>
          ) : (
            filtered.map((u, i) => {
              const active   = isActiveToday(u.lastActive)
              const initials = u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
              // Gradient based on first letter
              const gradients = [
                'linear-gradient(135deg,#5c6ac4,#7c8ce8)',
                'linear-gradient(135deg,#e05555,#f08fa0)',
                'linear-gradient(135deg,#3d9a5e,#6dbe8f)',
                'linear-gradient(135deg,#d4891a,#e6b94a)',
                'linear-gradient(135deg,#9464dc,#b48af0)',
                'linear-gradient(135deg,#dc7838,#f0a870)',
              ]
              const grad = gradients[u.name.charCodeAt(0) % gradients.length]

              return (
                <div
                  key={u._id}
                  style={{
                    display:'flex', alignItems:'center', gap:14,
                    padding:'11px 10px', borderRadius:11,
                    transition:'background 0.15s',
                    animation:`fadeInUp 0.25s ease ${Math.min(i,10)*0.03}s both`,
                    cursor:'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  {/* Avatar */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <div style={{
                      width:40, height:40, borderRadius:'50%',
                      background:grad,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:14, fontWeight:700, color:'#fff',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                      {initials}
                    </div>
                    {/* Active indicator dot */}
                    <span style={{
                      position:'absolute', bottom:1, right:1,
                      width:10, height:10, borderRadius:'50%',
                      background: active ? '#56c47a' : 'rgba(255,255,255,0.15)',
                      border: '2px solid #1a1c28',
                    }} title={active ? 'Active today' : `Last seen ${timeSince(u.lastActive)}`} />
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:2 }}>
                      <p style={{ fontSize:13.5, fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {u.name}
                      </p>
                      {u.status !== 1 && (
                        <span style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'rgba(240,112,112,0.15)', color:'#f07070', fontWeight:600, flexShrink:0 }}>
                          inactive
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.35)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontFamily:"'DM Mono',monospace" }}>
                      {u.email}
                    </p>
                  </div>

                  {/* Stats pills */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                    <div style={{ display:'flex', gap:5 }}>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'rgba(92,106,196,0.15)', color:'#7c8ce8', fontFamily:"'DM Mono',monospace", fontWeight:600 }}>
                        📝 {u.notes}
                      </span>
                      {u.notebooks > 0 && (
                        <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'rgba(212,137,26,0.12)', color:'#e8a040', fontFamily:"'DM Mono',monospace", fontWeight:600 }}>
                          📓 {u.notebooks}
                        </span>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:10.5, color:'rgba(255,255,255,0.25)', fontFamily:"'DM Mono',monospace" }}>
                        {timeSince(u.lastActive)}
                      </span>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.15)' }}>·</span>
                      <span style={{ fontSize:10.5, color:'rgba(255,255,255,0.2)', fontFamily:"'DM Mono',monospace" }}>
                        joined {new Date(u.joinedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}
                      </span>
                      {/* Reset password button */}
                      <button
                        onClick={e => { e.stopPropagation(); setResetTarget(u) }}
                        title="Reset password"
                        style={{ padding:'2px 7px', borderRadius:6, border:'1px solid rgba(240,112,112,0.25)', background:'rgba(240,112,112,0.08)', color:'rgba(240,112,112,0.7)', cursor:'pointer', fontSize:10.5, transition:'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(240,112,112,0.2)'; e.currentTarget.style.color='#f07070'; e.currentTarget.style.borderColor='rgba(240,112,112,0.4)' }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(240,112,112,0.08)'; e.currentTarget.style.color='rgba(240,112,112,0.7)'; e.currentTarget.style.borderColor='rgba(240,112,112,0.25)' }}
                      >
                        🔑 reset
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:'10px 22px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.25)', fontFamily:"'DM Mono',monospace" }}>
            {filtered.length !== users.length ? `${filtered.length} of ${users.length} shown` : `${users.length} users total`}
          </span>
          <button
            onClick={onClose}
            style={{ padding:'6px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.45)', cursor:'pointer', fontSize:12.5, transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.45)' }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          adminToken={adminToken}
          onClose={() => setResetTarget(null)}
          onDone={() => setResetTarget(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )
}

/* ─── Password Modal ───────────────────────────────────── */
function PasswordModal({ onSuccess, onClose }) {
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const inputRef = useRef(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80) }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return
    setLoading(true); setError('')
    try {
      const res = await axios.post('/users/admin-verify', { password })
      onSuccess(res.data.adminToken, res.data.expiresIn)
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed')
      setPassword(''); inputRef.current?.focus()
    } finally { setLoading(false) }
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center animate-fade-in"
      style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-slide-up" style={{ width:320, background:'#1e2030', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, padding:'24px', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <div style={{ width:48, height:48, borderRadius:14, margin:'0 auto 12px', background:'linear-gradient(135deg,var(--accent),#9464dc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:'0 4px 16px rgba(92,106,196,0.4)' }}>🔐</div>
          <p style={{ fontSize:16, fontWeight:600, color:'#fff', marginBottom:4 }}>Admin Access</p>
          <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>Enter your account password to continue</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="Your account password"
            style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:`1px solid ${error?'var(--danger)':'rgba(255,255,255,0.12)'}`, borderRadius:9, padding:'10px 14px', fontSize:14, color:'#fff', outline:'none', marginBottom:error?6:14, transition:'border-color 0.18s' }}
            onFocus={e => { if (!error) e.target.style.borderColor='var(--accent)' }}
            onBlur={e  => { if (!error) e.target.style.borderColor='rgba(255,255,255,0.12)' }}
          />
          {error && <p style={{ fontSize:12, color:'var(--danger)', marginBottom:12, display:'flex', alignItems:'center', gap:5 }}><span>⚠</span>{error}</p>}
          <div style={{ display:'flex', gap:8 }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13 }}>Cancel</button>
            <button type="submit" disabled={loading||!password} style={{ flex:2, padding:'9px', borderRadius:8, border:'none', background:loading||!password?'rgba(92,106,196,0.4)':'var(--accent)', color:'#fff', cursor:loading||!password?'not-allowed':'pointer', fontSize:13, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:loading||!password?'none':'var(--shadow-accent)' }}>
              {loading ? <><span style={{ width:8,height:8,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',animation:'spin 0.7s linear infinite',display:'inline-block' }}/>Verifying...</> : '🔓 Verify & Open'}
            </button>
          </div>
        </form>
        <p style={{ fontSize:11, color:'rgba(255,255,255,0.2)', textAlign:'center', marginTop:14 }}>Access expires in 15 minutes</p>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )
}

/* ─── Admin Stats Panel ────────────────────────────────── */
function AdminPanel({ adminToken, onClose, onTokenExpired, onShowUsers }) {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    axios.get('/users/app-stats', { headers:{'x-admin-token':adminToken} })
      .then(res => setStats(res.data.data))
      .catch(err => {
        const code = err.response?.data?.code
        if (code==='ADMIN_TOKEN_INVALID'||code==='ADMIN_TOKEN_MISSING') onTokenExpired()
        else setError(err.response?.data?.message||'Failed to load')
      })
      .finally(() => setLoading(false))
  }, [adminToken])

  const row = (icon, label, value, color) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ display:'flex', alignItems:'center', gap:7, fontSize:12.5, color:'rgba(255,255,255,0.6)' }}><span>{icon}</span>{label}</span>
      <span style={{ fontSize:13, fontWeight:700, fontFamily:"'DM Mono',monospace", color:color||'rgba(255,255,255,0.9)' }}>
        {value!=null?<CountUp value={value}/>:'—'}
      </span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-start p-4 animate-fade-in" style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)' }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="animate-slide-up" style={{ width:300, marginLeft:4, background:'#1e2030', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.5)', maxHeight:'85vh', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <p style={{ fontSize:14, fontWeight:600, color:'#fff', marginBottom:2 }}>📊 Admin Dashboard</p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" }}>Owner · Live · 15min session</p>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:14 }}>✕</button>
        </div>

        <div style={{ padding:'14px 18px', overflowY:'auto', flex:1 }}>
          {loading && <div style={{ textAlign:'center', padding:'24px 0', color:'rgba(255,255,255,0.3)', fontSize:13 }}><div style={{ width:20,height:20,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.15)',borderTopColor:'var(--accent)',animation:'spin 0.8s linear infinite',margin:'0 auto 10px' }}/>Loading...</div>}
          {error   && <div style={{ textAlign:'center', padding:'16px 0', color:'var(--danger)', fontSize:13 }}>{error}</div>}
          {stats && (
            <>
              <p style={{ fontSize:10, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:8 }}>Users</p>
              {row('👥','Total users',       stats.totalUsers,       '#7c8ce8')}
              {row('🟢','Active today',      stats.activeToday,      '#56c47a')}
              {row('📅','Active this week',  stats.activeThisWeek,   '#e8a040')}
              {row('📆','Active this month', stats.activeThisMonth)}
              {row('🆕','New this week',     stats.newUsersThisWeek, '#7c8ce8')}

              <p style={{ fontSize:10, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', margin:'14px 0 8px' }}>Content</p>
              {row('📝','Total notes',    stats.totalNotes)}
              {row('📓','Total notebooks',stats.totalNotebooks)}

              {/* ── View All Users button ── */}
              <button
                onClick={onShowUsers}
                style={{
                  width:'100%', marginTop:16, padding:'10px',
                  borderRadius:9, border:'1px solid rgba(124,140,232,0.3)',
                  background:'rgba(92,106,196,0.12)',
                  color:'#7c8ce8', cursor:'pointer', fontSize:13,
                  fontWeight:500, display:'flex', alignItems:'center',
                  justifyContent:'center', gap:8,
                  transition:'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(92,106,196,0.25)'; e.currentTarget.style.borderColor='rgba(124,140,232,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(92,106,196,0.12)'; e.currentTarget.style.borderColor='rgba(124,140,232,0.3)' }}
              >
                <span style={{ fontSize:15 }}>👥</span>
                View all {stats.totalUsers} users
                <span style={{ marginLeft:'auto', fontSize:11, opacity:0.6 }}>→</span>
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )
}

/* ─── Main Widget ──────────────────────────────────────── */
export default function AppStatsWidget() {
  const { user }   = useAuth()
  const [stats,        setStats]        = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [adminToken,   setAdminToken]   = useState(null)
  const [showAdmin,    setShowAdmin]    = useState(false)
  const [showUsers,    setShowUsers]    = useState(false)
  const tokenExpiry = useRef(null)

  const ownerEmail = import.meta.env.VITE_OWNER_EMAIL
  const isOwner    = ownerEmail && user?.email === ownerEmail

  useEffect(() => {
    axios.get('/users/public-stats').then(res => setStats(res.data.data)).catch(()=>{})
  }, [])

  const handleAdminGranted = (token, expiresIn) => {
    setAdminToken(token)
    setShowPassword(false)
    setShowAdmin(true)
    clearTimeout(tokenExpiry.current)
    tokenExpiry.current = setTimeout(() => {
      setAdminToken(null); setShowAdmin(false); setShowUsers(false)
    }, expiresIn * 1000)
  }

  const handleTokenExpired = () => {
    setAdminToken(null); setShowAdmin(false); setShowUsers(false)
    setShowPassword(true)
  }

  const handleBadgeClick = () => {
    if (!isOwner) return
    if (adminToken) setShowAdmin(true)
    else setShowPassword(true)
  }

  if (!stats) return null

  return (
    <>
      {/* ── Community badge ── */}
      <div
        onClick={handleBadgeClick}
        style={{ margin:'6px 10px 8px', padding:'8px 12px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', cursor:isOwner?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all 0.18s' }}
        onMouseEnter={e => { if(isOwner){e.currentTarget.style.background='rgba(255,255,255,0.07)';e.currentTarget.style.borderColor='rgba(255,255,255,0.14)'}}}
        onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ position:'relative', width:8, height:8, flexShrink:0, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:'var(--success)', opacity:0.3, animation:'pulse 2s ease infinite' }} />
            <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--success)', position:'relative' }} />
          </span>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', fontWeight:500 }}>Community</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:12, fontWeight:700, color:'#fff', background:'linear-gradient(135deg,var(--accent),#9464dc)', padding:'2px 10px', borderRadius:20, boxShadow:'0 1px 8px rgba(92,106,196,0.3)', fontFamily:"'DM Mono',monospace" }}>
            <CountUp value={stats.totalUsers} duration={1200}/>
            <span style={{ fontSize:9, marginLeft:4, fontWeight:400, opacity:0.8 }}>{stats.totalUsers===1?'user':'users'}</span>
          </span>
          {isOwner && <span title={adminToken?'Admin active':'Click to unlock'} style={{ fontSize:10, color:adminToken?'var(--success)':'rgba(255,255,255,0.25)', transition:'color 0.18s' }}>{adminToken?'🔓':'🔒'}</span>}
        </div>
      </div>

      {showPassword && <PasswordModal onSuccess={handleAdminGranted} onClose={() => setShowPassword(false)} />}

      {showAdmin && adminToken && !showUsers && (
        <AdminPanel
          adminToken={adminToken}
          onClose={() => setShowAdmin(false)}
          onTokenExpired={handleTokenExpired}
          onShowUsers={() => { setShowAdmin(false); setShowUsers(true) }}
        />
      )}

      {showUsers && adminToken && (
        <UsersListModal
          adminToken={adminToken}
          onClose={() => { setShowUsers(false); setShowAdmin(true) }}
          onTokenExpired={handleTokenExpired}
        />
      )}
    </>
  )
}
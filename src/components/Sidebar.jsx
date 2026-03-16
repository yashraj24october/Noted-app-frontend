import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotes } from '../context/NotesContext.jsx'
import { useNotebooks } from '../context/NotebooksContext.jsx'
import Tooltip from './Tooltip.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import AppStatsWidget from './AppStatsWidget.jsx'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { id: 'all',       icon: '▦', label: 'All Notes' },
  { id: 'pinned',    icon: '⊕', label: 'Pinned' },
  { id: 'favorites', icon: '◇', label: 'Favorites' },
  { id: 'archived',  icon: '▣', label: 'Archived' },
  { id: 'trash',     icon: '◻', label: 'Trash' },
]

export default function Sidebar({ activeView, setActiveView, isOpen, onOpenNotebook }) {
  const { user, logout }                                 = useAuth()
  const { stats, tags, filters, setFilters, fetchNotes } = useNotes()
  const { notebooks }                                    = useNotebooks()

  const getCount = (view) => {
    if (!stats) return null
    return { all: stats.totalNotes, pinned: stats.pinned, favorites: stats.favorites, archived: stats.archived, trash: stats.trashed }[view] ?? null
  }

  const handleTagFilter = (name) => {
    const tag = filters.tag === name ? '' : name
    setFilters(f => ({ ...f, tag }))
    fetchNotes({ tag })
  }

  return (
    <aside
      style={{
        background: '#1a1c23',
        width: isOpen ? 240 : 0,
        minWidth: isOpen ? 240 : 0,
        overflow: 'hidden',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        flexShrink: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Inner — fixed width so content doesn't squish during animation */}
      <div style={{ width: 240, minWidth: 240, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-base flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#5c6ac4,#7c8ce8)' }}
        >
          📝
        </div>
        <span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontSize: 20, color: '#ffffff' }}>
          Noted
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5" style={{ padding: '14px 10px' }}>

        {/* Main links */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', padding: '0 10px', marginBottom: 6 }}>
            Workspace
          </p>
          {NAV_ITEMS.map((item, idx) => {
            const count  = getCount(item.id)
            const active = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13.5,
                  textAlign: 'left',
                  background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  fontWeight: active ? 500 : 400,
                  transform: 'translateX(0)',
                  transition: 'background 0.18s ease, color 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                  animationDelay: `${idx * 0.04}s`,
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.color = '#ffffff'
                    e.currentTarget.style.transform = 'translateX(3px)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }
                }}
              >
                <span style={{ width: 20, textAlign: 'center', fontSize: 14, opacity: 0.85 }}>{item.icon}</span>
                <span>{item.label}</span>
                {count !== null && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontFamily: 'DM Mono, monospace',
                    padding: '1px 7px',
                    borderRadius: 20,
                    background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
                    color: active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Notebooks */}
        {notebooks.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', padding: '0 10px', marginBottom: 6 }}>
              Notebooks
            </p>
            {notebooks.slice(0, 6).map(nb => (
              <button
                key={nb._id}
                onClick={() => onOpenNotebook?.(nb)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, textAlign: 'left', background: 'transparent',
                  color: 'rgba(255,255,255,0.6)', transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateX(3px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'translateX(0)' }}
              >
                <span style={{ fontSize: 15 }}>{nb.emoji}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nb.name}</span>
                <span style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', padding: '1px 6px', borderRadius: 20 }}>
                  {nb.noteCount || 0}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Subjects */}
        {stats?.bySubject?.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', padding: '0 10px', marginBottom: 6 }}>
              Subjects
            </p>
            {stats.bySubject.map(s => (
              <button
                key={s._id}
                onClick={() => { setFilters(f => ({ ...f, subject: s._id })); fetchNotes({ subject: s._id }) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, textAlign: 'left', background: 'transparent',
                  color: 'rgba(255,255,255,0.6)', transition: 'all 0.18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              >
                <span style={{ width: 20, textAlign: 'center', fontSize: 13 }}>◈</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s._id}</span>
                <span style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', padding: '1px 6px', borderRadius: 20 }}>
                  {s.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', padding: '0 10px', marginBottom: 6 }}>
              Tags
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 4px' }}>
              {tags.slice(0, 14).map(t => (
                <button
                  key={t.name}
                  onClick={() => handleTagFilter(t.name)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    border: '1px solid',
                    borderColor: filters.tag === t.name ? 'rgba(92,106,196,0.5)' : 'rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: '3px 9px', fontSize: 11.5, cursor: 'pointer',
                    transition: 'all 0.18s',
                    background: filters.tag === t.name ? 'rgba(92,106,196,0.28)' : 'rgba(255,255,255,0.06)',
                    color: filters.tag === t.name ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  #{t.name}
                  <span style={{ opacity: 0.5, fontSize: 9, fontFamily: 'DM Mono,monospace' }}>{t.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ── App Stats Widget ── */}
      <AppStatsWidget />

      {/* ── User footer ── */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#5c6ac4,#7c8ce8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, color: '#ffffff',
        }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#e8e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email}
          </p>
        </div>

        <ThemeToggle />

        <Tooltip text="Sign out" position="top">
          <button
            onClick={() => { logout(); toast.success('Signed out') }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 7, width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
              fontSize: 15, transition: 'all 0.18s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,85,85,0.18)'; e.currentTarget.style.color = '#e05555'; e.currentTarget.style.borderColor = 'rgba(224,85,85,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
          >
            ⏻
          </button>
        </Tooltip>
      </div>
      </div>  {/* end inner fixed-width wrapper */}
    </aside>
  )
}
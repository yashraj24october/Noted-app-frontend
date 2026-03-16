import React, { useState, useEffect, useCallback } from 'react'
import { useNotes } from '../context/NotesContext.jsx'
import Sidebar from '../components/Sidebar.jsx'
import NotesGrid from '../components/NotesGrid.jsx'
import NoteEditor from '../components/NoteEditor.jsx'
import NoteViewPage from '../components/NoteViewPage.jsx'
import ShareModal from '../components/ShareModal.jsx'
import StatsPanel from '../components/StatsPanel.jsx'
import Tooltip from '../components/Tooltip.jsx'

const VIEW_PARAMS = {
  all:       { archived: undefined, trashed: undefined, favorites: undefined, pinned: undefined },
  pinned:    { pinned: 'true',      archived: undefined, trashed: undefined,  favorites: undefined },
  favorites: { favorites: 'true',   archived: undefined, trashed: undefined,  pinned: undefined },
  archived:  { archived: 'true',    trashed: undefined,  favorites: undefined, pinned: undefined },
  trash:     { trashed: 'true',     archived: undefined, favorites: undefined, pinned: undefined },
}

export default function DashboardPage() {
  const [activeView,  setActiveView]  = useState('all')
  const [showEditor,  setShowEditor]  = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [viewingNote, setViewingNote] = useState(null)
  const [sharingNote, setSharingNote] = useState(null)  // for standalone ShareModal
  const [viewMode,    setViewMode]    = useState('grid')
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)

  const { fetchNotes, fetchStats, fetchTags, setFilters, filters } = useNotes()

  useEffect(() => {
    fetchStats(); fetchTags(); fetchNotes(VIEW_PARAMS.all)
  }, []) // eslint-disable-line

  const handleViewChange = useCallback((view) => {
    setActiveView(view)
    // On mobile, close sidebar after selecting a view
    if (window.innerWidth < 1024) setSidebarOpen(false)
    const params = VIEW_PARAMS[view] || VIEW_PARAMS.all
    setFilters(f => ({ ...f, ...params, search: '', priority: '', tag: '' }))
    fetchNotes({ ...params, search: '', priority: '', tag: '' })
  }, [fetchNotes, setFilters])

  const openView  = useCallback(note => { setViewingNote(note); setShowEditor(false); setEditingNote(null) }, [])
  const openEdit  = useCallback((note = null) => { setEditingNote(note); setShowEditor(true); setViewingNote(null) }, [])
  const closeEditor = useCallback(() => { setEditingNote(null); setShowEditor(false) }, [])

  // Open ShareModal directly — no NoteViewPage involved
  const openShare = useCallback(note => {
    setSharingNote(note)
    setViewingNote(null)  // close view panel if open
  }, [])

  const refreshAll = useCallback(() => {
    const params = VIEW_PARAMS[activeView] || VIEW_PARAMS.all
    fetchNotes(params); fetchStats(); fetchTags()
  }, [activeView, fetchNotes, fetchStats, fetchTags])

  const handleSearch = useCallback(search => {
    setFilters(f => ({ ...f, search }))
    fetchNotes({ search })
  }, [fetchNotes, setFilters])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>

      {/* Mobile overlay — only on small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar activeView={activeView} setActiveView={handleViewChange} isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 24px',background:'var(--bg-page)',borderBottom:'1px solid var(--border-soft)',flexShrink:0 }}>

          <Tooltip text={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} position="bottom">
            <button
              style={{ width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,background:'var(--bg-card)',border:'1px solid var(--border-soft)',color:'var(--text-secondary)',fontSize:14,cursor:'pointer',flexShrink:0 }}
              onClick={() => setSidebarOpen(o => !o)}
            >☰</button>
          </Tooltip>

          <div style={{ position:'relative',flex:1,maxWidth:380 }}>
            <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-tertiary)',fontSize:14,pointerEvents:'none' }}>🔍</span>
            <input
              type="text"
              placeholder="Search notes, tags, subjects..."
              value={filters.search || ''}
              onChange={e => handleSearch(e.target.value)}
              style={{ width:'100%',background:'var(--bg-card)',border:'1px solid var(--border-soft)',borderRadius:10,padding:'8px 14px 8px 36px',fontSize:13.5,color:'var(--text-primary)',outline:'none',boxShadow:'var(--shadow-xs)' }}
              onFocus={e => { e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px var(--accent-light)' }}
              onBlur={e => { e.target.style.borderColor='var(--border-soft)'; e.target.style.boxShadow='var(--shadow-xs)' }}
            />
          </div>

          <div style={{ display:'flex',alignItems:'center',gap:8,marginLeft:'auto' }}>
            <Tooltip text="Grid view" position="bottom">
              <button
                onClick={() => setViewMode('grid')}
                style={{ width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid var(--border-soft)',fontSize:15,cursor:'pointer',transition:'all 0.18s',background:viewMode==='grid'?'var(--accent-light)':'var(--bg-card)',color:viewMode==='grid'?'var(--accent)':'var(--text-secondary)',boxShadow:'var(--shadow-xs)' }}
              >⊞</button>
            </Tooltip>
            <Tooltip text="List view" position="bottom">
              <button
                onClick={() => setViewMode('list')}
                style={{ width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid var(--border-soft)',fontSize:15,cursor:'pointer',transition:'all 0.18s',background:viewMode==='list'?'var(--accent-light)':'var(--bg-card)',color:viewMode==='list'?'var(--accent)':'var(--text-secondary)',boxShadow:'var(--shadow-xs)' }}
              >☰</button>
            </Tooltip>
            {activeView !== 'trash' && (
              <Tooltip text="Create a new note" shortcut="N" position="bottom">
                <button
                  onClick={() => openEdit(null)}
                  style={{ display:'flex',alignItems:'center',gap:6,background:'var(--accent)',color:'#fff',fontSize:13.5,fontWeight:500,padding:'8px 16px',borderRadius:9,border:'none',cursor:'pointer',boxShadow:'var(--shadow-accent)',transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--accent-hover)'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(92,106,196,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='var(--accent)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='var(--shadow-accent)' }}
                  onMouseDown={e => e.currentTarget.style.transform='scale(0.97)'}
                  onMouseUp={e => e.currentTarget.style.transform='translateY(-1px)'}
                >+ New Note</button>
              </Tooltip>
            )}
          </div>
        </header>

        {/* Content — remounts with fade animation on view change */}
        <main
          key={activeView}
          style={{ flex:1, overflowY:'auto', padding:'20px 24px', animation: 'fadeInUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both' }}
        >
          {activeView === 'all' && <StatsPanel />}
          <NotesGrid
            activeView={activeView}
            viewMode={viewMode}
            onViewNote={openView}
            onEditNote={openEdit}
            onShareNote={openShare}
          />
        </main>
      </div>

      {/* Note view panel */}
      {viewingNote && (
        <NoteViewPage
          note={viewingNote}
          onClose={() => setViewingNote(null)}
          onEditNote={note => { setViewingNote(null); openEdit(note) }}
          onShareNote={openShare}   // ← share button inside view panel also uses standalone modal
          onRefresh={refreshAll}
        />
      )}

      {/* Note editor */}
      {showEditor && (
        <NoteEditor note={editingNote} onClose={closeEditor} onSaved={refreshAll} />
      )}

      {/* ── Standalone Share Modal — rendered independently, no NoteViewPage needed ── */}
      {sharingNote && (
        <ShareModal
          note={sharingNote}
          onClose={() => { setSharingNote(null); refreshAll() }}
          onUpdate={updatedNote => {
            setSharingNote(updatedNote)
            // Also update the viewing note if it's the same one
            if (viewingNote?._id === updatedNote._id) setViewingNote(updatedNote)
            refreshAll()
          }}
        />
      )}
    </div>
  )
}
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNotes }     from '../context/NotesContext.jsx'
import { useNotebooks } from '../context/NotebooksContext.jsx'
import { formatDistanceToNow } from 'date-fns'
import Tooltip from './Tooltip.jsx'
import toast from 'react-hot-toast'

const VIEW_LABELS = { all:'All Notes', pinned:'Pinned', favorites:'Favorites', archived:'Archived', trash:'Trash' }

const EMPTY = {
  all:       { icon:'📝', title:'No notes yet',      sub:'Create your first note to get started' },
  pinned:    { icon:'📌', title:'No pinned notes',    sub:'Pin important notes to find them quickly' },
  favorites: { icon:'⭐', title:'No favourites',      sub:'Star notes to save them here' },
  archived:  { icon:'🗂️', title:'Nothing archived',  sub:'Archive notes to keep things tidy' },
  trash:     { icon:'🗑️', title:'Trash is empty',    sub:'Deleted notes will appear here' },
}

/* ─── Add to Notebook sub-panel ─────────────────────── */
function AddToNotebookPanel({ note, notebooks, onClose }) {
  const { addNotesToNotebook, fetchNotebooks } = useNotebooks()
  const { notes: allNotes, fetchNotes } = useNotes()
  const [saving,    setSaving]    = useState(null)
  // Local set of notebook IDs so UI updates instantly on add without waiting for fetchNotes
  const [localAdded, setLocalAdded] = useState(new Set())
  const [localRemoved, setLocalRemoved] = useState(new Set())

  // Always read the LIVE note from context — prop may be stale after fetchNotes
  const liveNote = allNotes.find(n => n._id === note._id) || note

  // Convert ALL IDs to strings for reliable comparison
  // MongoDB ObjectId.toString() === plain string ID — works either way
  const noteNotebookIds = new Set([
    ...(liveNote.notebooks || []).map(nb => String(nb?._id || nb)),
    ...localAdded,
  ].filter(id => !localRemoved.has(id)))

  const handleAdd = async (nb) => {
    if (saving) return
    setSaving(nb._id)
    // Optimistic local update — show ✓ Added immediately
    setLocalAdded(prev => new Set([...prev, String(nb._id)]))
    try {
      await addNotesToNotebook(nb._id, [note._id])
      // Refresh both notes (for note.notebooks[]) and notebooks (for count badge)
      await Promise.all([fetchNotes(), fetchNotebooks()])
    } catch (_) {
      // Rollback optimistic update on failure
      setLocalAdded(prev => { const s = new Set(prev); s.delete(String(nb._id)); return s })
    } finally {
      setSaving(null)
      onClose()
    }
  }

  return (
    <div style={{
      borderTop: '1px solid var(--border-soft)',
      padding: '4px 0',
      maxHeight: 200,
      overflowY: 'auto',
    }}>
      <p style={{ fontSize:10.5,fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase',color:'var(--text-tertiary)',padding:'6px 12px 4px' }}>
        Add to notebook
      </p>
      {notebooks.length === 0 ? (
        <p style={{ fontSize:12,color:'var(--text-tertiary)',padding:'8px 12px',fontStyle:'italic' }}>
          No notebooks yet
        </p>
      ) : (
        notebooks.map(nb => {
          const alreadyIn = noteNotebookIds.has(String(nb._id))
          return (
            <button
              key={nb._id}
              onClick={e => { e.stopPropagation(); if (!alreadyIn) handleAdd(nb) }}
              disabled={alreadyIn || saving === nb._id}
              style={{
                width:'100%',display:'flex',alignItems:'center',gap:9,
                padding:'7px 12px',border:'none',background:'transparent',
                fontSize:12.5,textAlign:'left',cursor:alreadyIn?'default':'pointer',
                transition:'all 0.15s',
                color: alreadyIn ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                opacity: saving && saving !== nb._id ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!alreadyIn) { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text-primary)' }}}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=alreadyIn?'var(--text-tertiary)':'var(--text-secondary)' }}
            >
              <span style={{ fontSize:15 }}>{nb.emoji}</span>
              <span style={{ flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{nb.name}</span>
              {alreadyIn && <span style={{ fontSize:10,color:'var(--success)',fontWeight:600 }}>✓ Added</span>}
              {saving === nb._id && <span style={{ fontSize:10,color:'var(--accent)' }}>...</span>}
            </button>
          )
        })
      )}
    </div>
  )
}

/* ─── Portal dropdown ────────────────────────────────── */
function CardMenu({ note, btnRef, onClose, onView, onEdit, onDuplicate, onDelete, onRestore, onShare }) {
  const { notebooks } = useNotebooks()
  const menuRef = useRef(null)
  const [pos, setPos]             = useState({ top: 0, left: 0 })
  const [showNotebooks, setShowNotebooks] = useState(false)
  const [positioned, setPositioned]       = useState(false)

  // Calculate position AFTER mount so we know the actual menu height
  useEffect(() => {
    if (!btnRef.current) return
    const r     = btnRef.current.getBoundingClientRect()
    const menuEl = menuRef.current
    const menuW  = 190
    const menuH  = menuEl ? menuEl.offsetHeight : 220

    let left = r.right - menuW
    let top  = r.bottom + 6

    // Clamp so menu never goes off-screen
    if (left < 6) left = 6
    if (left + menuW > window.innerWidth  - 6) left = window.innerWidth  - menuW - 6
    if (top  + menuH > window.innerHeight - 8) top  = r.top - menuH - 6   // flip above button

    setPos({ top, left })
    setPositioned(true)
  }, [showNotebooks]) // recalculate when notebook panel opens

  useEffect(() => {
    const onClick = e => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current  && !btnRef.current.contains(e.target)) onClose()
    }
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown',   onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown',   onKey)
    }
  }, [onClose])

  const menuItem = (fn, icon, label, danger = false, extra = null) => (
    <button
      onClick={e => { e.stopPropagation(); if (fn) { onClose(); fn() } }}
      style={{
        width:'100%',display:'flex',alignItems:'center',gap:9,
        padding:'8px 12px',border:'none',background:'transparent',
        fontSize:13,textAlign:'left',cursor:'pointer',transition:'all 0.15s',
        color: danger ? 'var(--danger)' : 'var(--text-secondary)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background=danger?'var(--danger-bg)':'var(--bg-hover)'; e.currentTarget.style.color=danger?'var(--danger)':'var(--text-primary)' }}
      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=danger?'var(--danger)':'var(--text-secondary)' }}
    >
      <span style={{ fontSize:14,flexShrink:0 }}>{icon}</span>
      <span style={{ flex:1 }}>{label}</span>
      {extra}
    </button>
  )

  return createPortal(
    <div
      ref={menuRef}
      onClick={e => e.stopPropagation()}
      style={{
        position:'fixed',
        top: positioned ? pos.top : -9999,
        left: pos.left,
        width: 190,
        zIndex: 99999,        // always float above everything
        background: 'var(--bg-card)',
        border: '1px solid var(--border-soft)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        animation: 'fadeIn 0.14s ease',
      }}
    >
      {menuItem(onView,      '👁',  'View note')}
      {menuItem(onEdit,      '✏️', 'Edit note')}
      {menuItem(onDuplicate, '⧉',  'Duplicate')}

      {/* Add to Notebook toggle */}
      {!note.isTrashed && (
        <button
          onClick={e => { e.stopPropagation(); setShowNotebooks(v => !v) }}
          style={{
            width:'100%',display:'flex',alignItems:'center',gap:9,
            padding:'8px 12px',border:'none',background:'transparent',
            fontSize:13,textAlign:'left',cursor:'pointer',transition:'all 0.15s',
            color:'var(--text-secondary)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-secondary)' }}
        >
          <span style={{ fontSize:14,flexShrink:0 }}>📓</span>
          <span style={{ flex:1 }}>Add to notebook</span>
          <span style={{ fontSize:10,color:'var(--text-tertiary)',transition:'transform 0.18s',display:'inline-block',transform:showNotebooks?'rotate(180deg)':'rotate(0deg)' }}>▾</span>
        </button>
      )}

      {/* Notebook sub-list */}
      {showNotebooks && !note.isTrashed && (
        <AddToNotebookPanel
          note={note}
          notebooks={notebooks}
          onClose={onClose}
        />
      )}

      {!note.isTrashed && (
        menuItem(onShare, note.isShared ? '🔗' : '↗', note.isShared ? 'Manage share' : 'Share note')
      )}

      <div style={{ height:1,background:'var(--border-soft)',margin:'4px 0' }} />

      {note.isTrashed ? (
        <>
          {menuItem(onRestore,            '↺', 'Restore')}
          {menuItem(() => onDelete(true), '✕', 'Delete forever', true)}
        </>
      ) : (
        menuItem(() => onDelete(false), '🗑', 'Move to trash', true)
      )}
    </div>,
    document.body
  )
}

/* ─── Note Card ──────────────────────────────────────── */
function NoteCard({ note, viewMode, onView, onEdit, onDelete, onRestore, onDuplicate, onTogglePin, onToggleFavorite, onShare, index = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered,  setHovered]  = useState(false)
  const menuBtnRef = useRef(null)
  const isList = viewMode === 'list'

  const plain = (note.content || '')
    .replace(/!\[[^\]]*\]\([^)]+\)(?:\{[^}]*\})?/g, '') // strip image markdown
    .replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '')
    .replace(/`/g, '').replace(/\n/g, ' ').trim()

  const stop = useCallback((e, fn) => { e.stopPropagation(); fn() }, [])

  const delayMs = Math.min(index, 8) * 40

  return (
    <div
      onClick={() => onView(note)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:'relative',
        background:'var(--bg-card)',
        border:`1px solid ${hovered?'var(--border-md)':note.isPinned?'rgba(212,137,26,0.25)':'var(--border-soft)'}`,
        borderRadius:12,cursor:'pointer',overflow:'visible',
        boxShadow: hovered?'var(--shadow-md)':'var(--shadow-xs)',
        transform: hovered?'translateY(-3px)':'translateY(0)',
        transition:'transform 0.22s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.22s ease,border-color 0.18s ease',
        padding: isList?'10px 16px':16,
        display: isList?'flex':'block',
        alignItems: isList?'center':undefined,
        gap: isList?14:undefined,
        '--delay': `${delayMs}ms`,
      }}
      className="note-card-enter group"
    >
      {/* Accent bar */}
      <div style={{
        position:'absolute',left:0,top:18,bottom:18,
        width:3,borderRadius:'0 3px 3px 0',
        background:note.isPinned?'var(--warning)':'var(--accent)',
        opacity:hovered?1:0,
        transform:hovered?'scaleY(1)':'scaleY(0.4)',
        transformOrigin:'center',
        transition:'opacity 0.2s ease,transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }} />

      <div style={{ flex:isList?1:undefined, minWidth:isList?0:undefined }}>
        {/* Header */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:8 }}>
          <h3 style={{
            fontSize:14,fontWeight:600,color:'var(--text-primary)',
            lineHeight:1.4,overflow:'hidden',
            display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',
            letterSpacing:'-0.1px',
          }}>
            {note.isPinned && <span style={{ color:'var(--warning)',fontSize:12,marginRight:4 }}>📌</span>}
            {note.title || 'Untitled'}
          </h3>

          {/* Hover actions */}
          <div
            style={{
              display:'flex',gap:2,flexShrink:0,
              opacity:hovered?1:0,
              transform:hovered?'translateX(0)':'translateX(6px)',
              transition:'opacity 0.18s ease,transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <Tooltip text={note.isFavorite?'Remove favourite':'Add to favourites'} position="top">
              <button
                onClick={e => stop(e, () => onToggleFavorite(note._id))}
                style={{ width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:5,border:'none',background:'transparent',cursor:'pointer',fontSize:13,color:note.isFavorite?'var(--warm)':'var(--text-tertiary)',transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.2)'}
                onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
              >{note.isFavorite?'★':'☆'}</button>
            </Tooltip>
            <Tooltip text={note.isPinned?'Unpin':'Pin note'} position="top">
              <button
                onClick={e => stop(e, () => onTogglePin(note._id))}
                style={{ width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:5,border:'none',background:'transparent',cursor:'pointer',fontSize:12,color:note.isPinned?'var(--warning)':'var(--text-tertiary)',transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.2)'}
                onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
              >◉</button>
            </Tooltip>
            <Tooltip text="Edit note" position="top">
              <button
                onClick={e => stop(e, () => onEdit(note))}
                style={{ width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:5,border:'none',background:'transparent',cursor:'pointer',fontSize:12,color:'var(--text-tertiary)',transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background='var(--accent-light)';e.currentTarget.style.color='var(--accent)';e.currentTarget.style.transform='scale(1.1)' }}
                onMouseLeave={e=>{ e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-tertiary)';e.currentTarget.style.transform='scale(1)' }}
              >✏️</button>
            </Tooltip>
            <Tooltip text="More options" position="top">
              <button
                ref={menuBtnRef}
                onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
                style={{ width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:5,border:'none',cursor:'pointer',fontSize:11,transition:'all 0.15s',background:menuOpen?'var(--accent-light)':'transparent',color:menuOpen?'var(--accent)':'var(--text-tertiary)' }}
              >···</button>
            </Tooltip>
          </div>
        </div>

        {/* Preview */}
        {!isList && plain && (
          <p style={{ fontSize:12.5,color:'var(--text-secondary)',lineHeight:1.65,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',marginBottom:12 }}>
            {plain}
          </p>
        )}

        {/* Footer */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:6,flexWrap:'wrap' }}>
          <div style={{ display:'flex',alignItems:'center',gap:5,flexWrap:'wrap' }}>
            {note.subject && (
              <span style={{ fontSize:11,fontWeight:500,padding:'2px 8px',borderRadius:20,background:'var(--accent-light)',color:'var(--accent)',border:'1px solid var(--border-soft)' }}>
                {note.subject}
              </span>
            )}
            {note.tags?.slice(0,3).map(tag => (
              <span key={tag} style={{ fontSize:11,padding:'2px 8px',borderRadius:20,background:'var(--bg-input)',color:'var(--text-tertiary)',border:'1px solid var(--border-soft)',fontFamily:"'DM Mono',monospace" }}>
                #{tag}
              </span>
            ))}
            {note.isShared && (
              <span style={{ fontSize:11,padding:'2px 7px',borderRadius:20,background:'var(--success-bg)',color:'var(--success)',border:'1px solid var(--border-soft)' }}>
                🔗 shared
              </span>
            )}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--text-tertiary)',fontFamily:"'DM Mono',monospace",flexShrink:0 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:note.priority==='high'?'var(--danger)':note.priority==='medium'?'var(--warning)':'var(--success)',display:'inline-block',flexShrink:0 }} />
            <span>{formatDistanceToNow(new Date(note.updatedAt||note.createdAt),{addSuffix:true})}</span>
            {!isList && note.wordCount>0 && <span>· {note.wordCount}w</span>}
          </div>
        </div>
      </div>

      {menuOpen && (
        <CardMenu
          note={note}
          btnRef={menuBtnRef}
          onClose={() => setMenuOpen(false)}
          onView={() => onView(note)}
          onEdit={() => onEdit(note)}
          onDuplicate={() => onDuplicate(note._id)}
          onDelete={perm => onDelete(note._id, perm)}
          onRestore={() => onRestore(note._id)}
          onShare={() => onShare(note)}
        />
      )}
    </div>
  )
}

/* ─── Notes Grid ─────────────────────────────────────── */
export default function NotesGrid({ activeView, viewMode, onViewNote, onEditNote, onShareNote }) {
  const { notes, loading, deleteNote, restoreNote, duplicateNote, togglePin, toggleFavorite, filters, setFilters, fetchNotes } = useNotes()

  const pinned  = activeView === 'all' ? notes.filter(n => n.isPinned && !n.isTrashed) : []
  const regular = activeView === 'all' ? notes.filter(n => !n.isPinned) : notes

  const hasActiveFilters = !!(filters.priority || filters.tag || filters.subject || filters.search)

  const clearFilters = () => {
    setFilters(f => ({ ...f, priority:'', tag:'', subject:'', search:'' }))
    fetchNotes({ priority:'', tag:'', subject:'', search:'' })
  }

  const cardProps = note => ({
    note, viewMode,
    onView: onViewNote, onEdit: onEditNote,
    onDelete: deleteNote, onRestore: restoreNote, onDuplicate: duplicateNote,
    onTogglePin: togglePin, onToggleFavorite: toggleFavorite,
    onShare: onShareNote,
  })

  const gridCls = viewMode === 'list'
    ? 'flex flex-col gap-2'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'

  if (loading) {
    return (
      <div style={{ display:'flex',justifyContent:'center',padding:'64px 0' }}>
        <div style={{ display:'flex',gap:6 }}>
          {[0,0.2,0.4].map((d,i) => (
            <span key={i} style={{ width:6,height:6,borderRadius:'50%',background:'var(--text-tertiary)',animation:`dotBounce 1.2s ${d}s infinite` }} />
          ))}
        </div>
      </div>
    )
  }

  if (notes.length === 0) {
    if (hasActiveFilters) {
      const pills = [
        filters.search   && { label:`"${filters.search}"`,  key:'search'   },
        filters.priority && { label:filters.priority,        key:'priority' },
        filters.tag      && { label:`#${filters.tag}`,       key:'tag'      },
        filters.subject  && { label:filters.subject,         key:'subject'  },
      ].filter(Boolean)

      return (
        <div>
          <Toolbar activeView={activeView} notes={notes} filters={filters} setFilters={setFilters} fetchNotes={fetchNotes} />
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'60px 20px',gap:14,textAlign:'center' }}>
            <span style={{ fontSize:48,opacity:0.2 }}>🔍</span>
            <p style={{ fontFamily:"'Instrument Serif',serif",fontStyle:'italic',fontSize:20,color:'var(--text-secondary)' }}>No notes match your filters</p>
            <div style={{ display:'flex',flexWrap:'wrap',justifyContent:'center',gap:8,marginTop:4 }}>
              {pills.map(pill => (
                <span key={pill.key} style={{ display:'inline-flex',alignItems:'center',gap:6,background:'var(--bg-card)',border:'1px solid var(--border-soft)',color:'var(--text-secondary)',fontSize:12,padding:'5px 12px',borderRadius:20 }}>
                  {pill.label}
                  <button onClick={()=>{setFilters(f=>({...f,[pill.key]:''}));fetchNotes({[pill.key]:''})}} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-tertiary)',fontSize:14,lineHeight:1,padding:0 }}>×</button>
                </span>
              ))}
            </div>
            <button onClick={clearFilters} style={{ marginTop:4,display:'flex',alignItems:'center',gap:6,background:'var(--accent)',color:'#fff',fontSize:13.5,fontWeight:500,padding:'9px 20px',borderRadius:8,border:'none',cursor:'pointer',boxShadow:'var(--shadow-accent)' }}>
              ✕ Clear all filters
            </button>
          </div>
        </div>
      )
    }

    const e = EMPTY[activeView] || EMPTY.all
    return (
      <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'80px 20px',gap:14,textAlign:'center' }}>
        <span style={{ fontSize:48,opacity:0.2 }}>{e.icon}</span>
        <p style={{ fontFamily:"'Instrument Serif',serif",fontStyle:'italic',fontSize:20,color:'var(--text-secondary)' }}>{e.title}</p>
        <p style={{ fontSize:13.5,color:'var(--text-tertiary)',maxWidth:300 }}>{e.sub}</p>
      </div>
    )
  }

  return (
    <div>
      <Toolbar activeView={activeView} notes={notes} filters={filters} setFilters={setFilters} fetchNotes={fetchNotes} />

      {hasActiveFilters && (
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap' }}>
          <span style={{ fontSize:12,color:'var(--text-tertiary)' }}>Filtered by:</span>
          {filters.search   && <FilterPill label={`"${filters.search}"`}  onRemove={()=>{setFilters(f=>({...f,search:''}));   fetchNotes({search:''})}} />}
          {filters.priority && <FilterPill label={filters.priority}        onRemove={()=>{setFilters(f=>({...f,priority:''})); fetchNotes({priority:''})}} />}
          {filters.tag      && <FilterPill label={`#${filters.tag}`}       onRemove={()=>{setFilters(f=>({...f,tag:''}));      fetchNotes({tag:''})}} />}
          {filters.subject  && <FilterPill label={filters.subject}         onRemove={()=>{setFilters(f=>({...f,subject:''}));  fetchNotes({subject:''})}} />}
          <button onClick={clearFilters} style={{ fontSize:12,color:'var(--danger)',background:'none',border:'none',cursor:'pointer',fontWeight:500 }}>Clear all</button>
        </div>
      )}

      {pinned.length > 0 && (
        <>
          <SectionDivider label="Pinned" />
          <div className={`${gridCls} mb-5`}>{pinned.map((n,i)=><NoteCard key={n._id} {...cardProps(n)} index={i}/>)}</div>
          <SectionDivider label="Other notes" />
        </>
      )}
      <div className={gridCls}>{regular.map((n,i)=><NoteCard key={n._id} {...cardProps(n)} index={i}/>)}</div>
    </div>
  )
}

function FilterPill({ label, onRemove }) {
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:4,background:'var(--accent-light)',border:'1px solid var(--border-soft)',color:'var(--accent)',fontSize:12,padding:'4px 10px',borderRadius:20 }}>
      {label}
      <button onClick={onRemove} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-tertiary)',fontSize:14,lineHeight:1,padding:0,marginLeft:2 }}>×</button>
    </span>
  )
}

function SectionDivider({ label }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
      <span style={{ fontSize:10.5,fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase',color:'var(--text-tertiary)',whiteSpace:'nowrap' }}>{label}</span>
      <div style={{ flex:1,height:1,background:'var(--border-soft)' }} />
    </div>
  )
}

function Toolbar({ activeView, notes, filters, setFilters, fetchNotes }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16,flexWrap:'wrap' }}>
      <h2 style={{ fontFamily:"'Instrument Serif',serif",fontStyle:'italic',fontSize:18,color:'var(--text-primary)' }}>
        {VIEW_LABELS[activeView]||'Notes'}
      </h2>
      <span style={{ fontFamily:"'DM Mono',monospace",fontSize:12,color:'var(--text-tertiary)',marginLeft:'auto' }}>
        {notes.length} note{notes.length!==1?'s':''}
      </span>
      <Tooltip text="Sort notes" position="bottom">
        <select
          value={filters.sort||'-createdAt'}
          onChange={e=>{setFilters(f=>({...f,sort:e.target.value}));fetchNotes({sort:e.target.value})}}
          style={{ background:'var(--bg-card)',border:'1px solid var(--border-soft)',borderRadius:9,padding:'6px 11px',fontSize:13,color:'var(--text-secondary)',outline:'none',cursor:'pointer',boxShadow:'var(--shadow-xs)' }}
        >
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="-updatedAt">Recently edited</option>
          <option value="title">Title A–Z</option>
          <option value="-wordCount">Longest</option>
        </select>
      </Tooltip>
      <Tooltip text="Filter by priority" position="bottom">
        <select
          value={filters.priority||''}
          onChange={e=>{setFilters(f=>({...f,priority:e.target.value}));fetchNotes({priority:e.target.value})}}
          style={{ background:'var(--bg-card)',border:'1px solid var(--border-soft)',borderRadius:9,padding:'6px 11px',fontSize:13,color:'var(--text-secondary)',outline:'none',cursor:'pointer',boxShadow:'var(--shadow-xs)' }}
        >
          <option value="">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
      </Tooltip>
    </div>
  )
}
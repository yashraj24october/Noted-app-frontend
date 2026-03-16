import React, { useState, useEffect, useRef } from 'react'
import { useNotebooks } from '../context/NotebooksContext.jsx'
import { useNotes }     from '../context/NotesContext.jsx'
import Tooltip from './Tooltip.jsx'
import toast from 'react-hot-toast'

// ─── Notebook color palette ───────────────────────────
const COLORS = {
  indigo: { bg: 'rgba(92,106,196,0.12)',  border: 'rgba(92,106,196,0.3)',  text: 'var(--accent)',   dot: '#5c6ac4' },
  rose:   { bg: 'rgba(240,112,112,0.1)',  border: 'rgba(240,112,112,0.3)', text: 'var(--danger)',   dot: '#e05555' },
  amber:  { bg: 'rgba(212,137,26,0.1)',   border: 'rgba(212,137,26,0.3)',  text: 'var(--warning)',  dot: '#d4891a' },
  green:  { bg: 'rgba(61,154,94,0.1)',    border: 'rgba(61,154,94,0.3)',   text: 'var(--success)',  dot: '#3d9a5e' },
  blue:   { bg: 'rgba(56,132,220,0.1)',   border: 'rgba(56,132,220,0.3)',  text: '#3884dc',         dot: '#3884dc' },
  purple: { bg: 'rgba(148,100,220,0.1)',  border: 'rgba(148,100,220,0.3)', text: '#9464dc',         dot: '#9464dc' },
  orange: { bg: 'rgba(220,120,56,0.1)',   border: 'rgba(220,120,56,0.3)',  text: '#dc7838',         dot: '#dc7838' },
}

const EMOJIS = ['📓','📔','📒','📕','📗','📘','📙','🗒️','📋','🗂️','💼','🎯','🚀','💡','🔬','🎨','💻','📐','🧠','⭐']

// ─── Create / Edit Notebook Modal ────────────────────
function NotebookFormModal({ notebook, onClose, onSave }) {
  const [name,  setName]  = useState(notebook?.name  || '')
  const [emoji, setEmoji] = useState(notebook?.emoji || '📓')
  const [color, setColor] = useState(notebook?.color || 'indigo')
  const [desc,  setDesc]  = useState(notebook?.description || '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Please enter a name'); return }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), emoji, color, description: desc })
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 animate-slide-up"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h3 style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:21, color:'var(--text-primary)' }}>
            {notebook ? 'Edit notebook' : 'New notebook'}
          </h3>
          <button onClick={onClose} style={{ width:30,height:30,borderRadius:7,border:'1px solid var(--border-soft)',background:'var(--bg-input)',color:'var(--text-secondary)',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
        </div>

        {/* Emoji picker */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block',fontSize:12,fontWeight:500,color:'var(--text-secondary)',marginBottom:8 }}>Icon</label>
          <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width:36,height:36,borderRadius:8,border:`2px solid ${emoji===e?'var(--accent)':'var(--border-soft)'}`,
                  background: emoji===e?'var(--accent-light)':'var(--bg-input)',
                  cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',
                  transition:'all 0.15s',
                }}
              >{e}</button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block',fontSize:12,fontWeight:500,color:'var(--text-secondary)',marginBottom:5 }}>Name *</label>
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="e.g. MCA Notes, Project Ideas..."
            style={{ width:'100%',background:'var(--bg-input)',border:'1px solid var(--border-md)',borderRadius:9,padding:'9px 13px',fontSize:14,color:'var(--text-primary)',outline:'none' }}
            onFocus={e => { e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px var(--accent-light)' }}
            onBlur={e => { e.target.style.borderColor='var(--border-md)'; e.target.style.boxShadow='none' }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block',fontSize:12,fontWeight:500,color:'var(--text-secondary)',marginBottom:5 }}>Description <span style={{ opacity:0.5 }}>(optional)</span></label>
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="What's this notebook for?"
            style={{ width:'100%',background:'var(--bg-input)',border:'1px solid var(--border-md)',borderRadius:9,padding:'9px 13px',fontSize:13.5,color:'var(--text-primary)',outline:'none' }}
            onFocus={e => { e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px var(--accent-light)' }}
            onBlur={e => { e.target.style.borderColor='var(--border-md)'; e.target.style.boxShadow='none' }}
          />
        </div>

        {/* Color picker */}
        <div style={{ marginBottom:22 }}>
          <label style={{ display:'block',fontSize:12,fontWeight:500,color:'var(--text-secondary)',marginBottom:8 }}>Color</label>
          <div style={{ display:'flex',gap:8 }}>
            {Object.entries(COLORS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setColor(key)}
                style={{
                  width:28,height:28,borderRadius:'50%',border:`3px solid ${color===key?cfg.dot:'transparent'}`,
                  background:cfg.dot,cursor:'pointer',
                  transform: color===key?'scale(1.2)':'scale(1)',
                  transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                  outline: color===key?`2px solid var(--bg-card)`:'none',
                  outlineOffset: color===key?'1px':'0',
                }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:10,background:COLORS[color].bg,border:`1px solid ${COLORS[color].border}`,marginBottom:20 }}>
          <span style={{ fontSize:22 }}>{emoji}</span>
          <div>
            <p style={{ fontSize:14,fontWeight:600,color:'var(--text-primary)' }}>{name || 'Notebook name'}</p>
            {desc && <p style={{ fontSize:12,color:'var(--text-secondary)',marginTop:2 }}>{desc}</p>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 18px',borderRadius:8,border:'1px solid var(--border-soft)',background:'var(--bg-input)',color:'var(--text-secondary)',cursor:'pointer',fontSize:13 }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{ padding:'9px 20px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:500,boxShadow:'var(--shadow-accent)',opacity:saving||!name.trim()?0.7:1,transition:'all 0.18s' }}
          >
            {saving ? 'Saving...' : notebook ? 'Save changes' : 'Create notebook'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Existing Notes Modal ─────────────────────────
function AddNotesModal({ notebook, onClose, onAdded }) {
  const { notes } = useNotes()
  const { addNotesToNotebook } = useNotebooks()
  const [selected, setSelected] = useState(new Set())
  const [search,   setSearch]   = useState('')
  const [saving,   setSaving]   = useState(false)

  // Filter out already-in-notebook notes and trashed
  const available = notes.filter(n =>
    !n.isTrashed &&
    !n.notebooks?.some(nb => nb === notebook._id || nb?._id === notebook._id) &&
    (n.title.toLowerCase().includes(search.toLowerCase()) ||
     (n.content || '').toLowerCase().includes(search.toLowerCase()))
  )

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(available.map(n => n._id)))
  const clearAll  = () => setSelected(new Set())

  const handleAdd = async () => {
    if (selected.size === 0) return
    setSaving(true)
    await addNotesToNotebook(notebook._id, [...selected])
    onAdded()
    onClose()
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl animate-slide-up flex flex-col"
        style={{ background:'var(--bg-card)',border:'1px solid var(--border-soft)',boxShadow:'var(--shadow-xl)',maxHeight:'80vh' }}
      >
        {/* Header */}
        <div style={{ padding:'20px 22px 16px',borderBottom:'1px solid var(--border-soft)',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
            <div>
              <h3 style={{ fontFamily:"'Instrument Serif',serif",fontStyle:'italic',fontSize:20,color:'var(--text-primary)',marginBottom:2 }}>
                Add notes to {notebook.emoji} {notebook.name}
              </h3>
              <p style={{ fontSize:12.5,color:'var(--text-tertiary)' }}>
                Select notes to add — they'll stay in their original location too
              </p>
            </div>
            <button onClick={onClose} style={{ width:30,height:30,borderRadius:7,border:'1px solid var(--border-soft)',background:'var(--bg-input)',color:'var(--text-secondary)',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>✕</button>
          </div>

          {/* Search */}
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'var(--text-tertiary)',pointerEvents:'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              style={{ width:'100%',background:'var(--bg-input)',border:'1px solid var(--border-soft)',borderRadius:8,padding:'8px 12px 8px 32px',fontSize:13,color:'var(--text-primary)',outline:'none' }}
              onFocus={e => { e.target.style.borderColor='var(--accent)' }}
              onBlur={e => { e.target.style.borderColor='var(--border-soft)' }}
            />
          </div>

          {/* Select all / clear */}
          {available.length > 0 && (
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10 }}>
              <span style={{ fontSize:12,color:'var(--text-tertiary)' }}>
                {available.length} note{available.length !== 1 ? 's' : ''} available
              </span>
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={selectAll} style={{ fontSize:12,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontWeight:500 }}>Select all</button>
                {selected.size > 0 && <button onClick={clearAll} style={{ fontSize:12,color:'var(--text-tertiary)',background:'none',border:'none',cursor:'pointer' }}>Clear</button>}
              </div>
            </div>
          )}
        </div>

        {/* Notes list */}
        <div style={{ flex:1,overflowY:'auto',padding:'8px 12px' }}>
          {available.length === 0 ? (
            <div style={{ textAlign:'center',padding:'40px 20px' }}>
              <span style={{ fontSize:36,opacity:0.2,display:'block',marginBottom:10 }}>📝</span>
              <p style={{ fontSize:13.5,color:'var(--text-tertiary)' }}>
                {search ? 'No notes match your search' : 'All your notes are already in this notebook'}
              </p>
            </div>
          ) : (
            available.map(note => {
              const isSelected = selected.has(note._id)
              const preview = (note.content || '').replace(/#{1,6}\s/g,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/\n/g,' ').trim().slice(0, 80)
              return (
                <div
                  key={note._id}
                  onClick={() => toggle(note._id)}
                  style={{
                    display:'flex',alignItems:'flex-start',gap:12,padding:'10px 10px',borderRadius:9,
                    cursor:'pointer',marginBottom:4,
                    background: isSelected ? 'var(--accent-light)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                    transition:'all 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background='var(--bg-input)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background='transparent' }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width:18,height:18,borderRadius:5,border:`2px solid ${isSelected?'var(--accent)':'var(--border-md)'}`,
                    background:isSelected?'var(--accent)':'transparent',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    flexShrink:0,marginTop:2,transition:'all 0.15s',
                  }}>
                    {isSelected && <span style={{ color:'#fff',fontSize:11,fontWeight:700,lineHeight:1 }}>✓</span>}
                  </div>

                  {/* Content */}
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:13.5,fontWeight:500,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                      {note.title || 'Untitled'}
                    </p>
                    {preview && <p style={{ fontSize:12,color:'var(--text-tertiary)',marginTop:2,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical' }}>{preview}</p>}
                    <div style={{ display:'flex',gap:8,marginTop:4,alignItems:'center' }}>
                      {note.subject && <span style={{ fontSize:11,padding:'1px 7px',borderRadius:20,background:'var(--accent-light)',color:'var(--accent)' }}>{note.subject}</span>}
                      {note.tags?.slice(0,2).map(t => <span key={t} style={{ fontSize:11,color:'var(--text-tertiary)',fontFamily:"'DM Mono',monospace" }}>#{t}</span>)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 22px',borderTop:'1px solid var(--border-soft)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <span style={{ fontSize:13,color:'var(--text-secondary)' }}>
            {selected.size > 0 ? `${selected.size} note${selected.size > 1?'s':''} selected` : 'No notes selected'}
          </span>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={onClose} style={{ padding:'8px 16px',borderRadius:8,border:'1px solid var(--border-soft)',background:'var(--bg-input)',color:'var(--text-secondary)',cursor:'pointer',fontSize:13 }}>
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selected.size === 0 || saving}
              style={{ padding:'8px 18px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',cursor:selected.size===0?'not-allowed':'pointer',fontSize:13,fontWeight:500,opacity:selected.size===0||saving?0.5:1,transition:'all 0.18s',boxShadow:'var(--shadow-accent)' }}
            >
              {saving ? 'Adding...' : `Add ${selected.size > 0 ? selected.size : ''} note${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Notebook View (notes inside a notebook) ──────────
function NotebookView({ notebook, onClose, onEditNote, onViewNote, onRefresh }) {
  const { getNotebookNotes, removeNotesFromNotebook } = useNotebooks()
  const { createNote, fetchNotes } = useNotes()
  const [notes,   setNotes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await getNotebookNotes(notebook._id)
    setNotes(res.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [notebook._id])

  const handleRemove = async (noteId) => {
    await removeNotesFromNotebook(
      notebook._id,
      [noteId],
      () => fetchNotes()   // ← refresh notes[] so note.notebooks is up to date
    )
    setNotes(prev => prev.filter(n => n._id !== noteId))
  }

  const cfg = COLORS[notebook.color] || COLORS.indigo

  return (
    <div
      className="fixed inset-0 z-[100] animate-fade-in flex items-stretch justify-end"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 backdrop-blur-[8px]" style={{ background:'rgba(0,0,0,0.3)' }} onClick={onClose} />

      <div
        className="relative w-full max-w-3xl flex flex-col animate-slide-in-right"
        style={{ background:'var(--bg-page)',boxShadow:'var(--shadow-modal)' }}
      >
        {/* Header */}
        <div style={{ padding:'16px 22px',borderBottom:'1px solid var(--border-soft)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--bg-card)',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <button onClick={onClose} style={{ width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'none',background:'var(--bg-input)',cursor:'pointer',fontSize:14,color:'var(--text-secondary)' }}>←</button>
            <div style={{ width:38,height:38,borderRadius:10,background:cfg.bg,border:`1px solid ${cfg.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>
              {notebook.emoji}
            </div>
            <div>
              <h2 style={{ fontFamily:"'Instrument Serif',serif",fontStyle:'italic',fontSize:20,color:'var(--text-primary)',lineHeight:1.2 }}>{notebook.name}</h2>
              {notebook.description && <p style={{ fontSize:12,color:'var(--text-tertiary)',marginTop:2 }}>{notebook.description}</p>}
            </div>
          </div>

          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:12,fontFamily:"'DM Mono',monospace",color:'var(--text-tertiary)',padding:'4px 10px',borderRadius:20,background:'var(--bg-input)',border:'1px solid var(--border-soft)' }}>
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </span>
            <Tooltip text="Add existing notes" position="bottom">
              <button
                onClick={() => setShowAdd(true)}
                style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,background:'var(--bg-input)',border:'1px solid var(--border-soft)',cursor:'pointer',fontSize:13,color:'var(--text-secondary)',transition:'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.background='var(--accent-light)'; e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.borderColor='var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.background='var(--bg-input)'; e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderColor='var(--border-soft)' }}
              >
                ＋ Add notes
              </button>
            </Tooltip>
            <button onClick={onClose} style={{ width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'none',background:'var(--bg-input)',cursor:'pointer',fontSize:16,color:'var(--text-tertiary)' }}>✕</button>
          </div>
        </div>

        {/* Notes list */}
        <div style={{ flex:1,overflowY:'auto',padding:20 }}>
          {loading ? (
            <div style={{ display:'flex',justifyContent:'center',padding:40 }}>
              <div style={{ display:'flex',gap:5 }}>
                {[0,0.2,0.4].map((d,i) => <span key={i} style={{ width:8,height:8,borderRadius:'50%',background:'var(--text-tertiary)',animation:`dotBounce 1.2s ${d}s infinite` }} />)}
              </div>
            </div>
          ) : notes.length === 0 ? (
            <div style={{ textAlign:'center',padding:'60px 20px' }}>
              <span style={{ fontSize:48,opacity:0.2,display:'block',marginBottom:14 }}>{notebook.emoji}</span>
              <p style={{ fontFamily:"'Instrument Serif',serif",fontStyle:'italic',fontSize:20,color:'var(--text-secondary)',marginBottom:8 }}>This notebook is empty</p>
              <p style={{ fontSize:13.5,color:'var(--text-tertiary)',marginBottom:20 }}>Add existing notes or create a new one</p>
              <button
                onClick={() => setShowAdd(true)}
                style={{ padding:'9px 20px',borderRadius:9,border:'none',background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:13.5,fontWeight:500,boxShadow:'var(--shadow-accent)' }}
              >＋ Add notes</button>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {notes.map((note, i) => {
                const preview = (note.content||'').replace(/#{1,6}\s/g,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/\n/g,' ').trim().slice(0,100)
                return (
                  <div
                    key={note._id}
                    onClick={() => onViewNote(note)}
                    style={{
                      padding:'14px 16px',borderRadius:11,cursor:'pointer',
                      background:'var(--bg-card)',border:'1px solid var(--border-soft)',
                      boxShadow:'var(--shadow-xs)',transition:'all 0.18s',
                      animation:`fadeInUp 0.28s ease ${i*0.04}s both`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow='var(--shadow-xs)'; e.currentTarget.style.transform='translateY(0)' }}
                  >
                    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10 }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p style={{ fontSize:14,fontWeight:600,color:'var(--text-primary)',marginBottom:4 }}>{note.title||'Untitled'}</p>
                        {preview && <p style={{ fontSize:12.5,color:'var(--text-secondary)',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',lineHeight:1.6 }}>{preview}</p>}
                        <div style={{ display:'flex',gap:6,marginTop:8,alignItems:'center' }}>
                          <span style={{ fontSize:11,color:'var(--text-tertiary)',fontFamily:"'DM Mono',monospace" }}>
                            {note.wordCount||0}w
                          </span>
                          {note.subject && <span style={{ fontSize:11,padding:'1px 7px',borderRadius:20,background:'var(--accent-light)',color:'var(--accent)' }}>{note.subject}</span>}
                          {note.tags?.slice(0,2).map(t => <span key={t} style={{ fontSize:11,color:'var(--text-tertiary)',fontFamily:"'DM Mono',monospace" }}>#{t}</span>)}
                        </div>
                      </div>
                      <div style={{ display:'flex',gap:4,flexShrink:0 }} onClick={e => e.stopPropagation()}>
                        <Tooltip text="Edit note" position="left">
                          <button
                            onClick={() => onEditNote(note)}
                            style={{ width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,border:'1px solid transparent',background:'transparent',cursor:'pointer',fontSize:12,color:'var(--text-tertiary)',transition:'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background='var(--accent-light)'; e.currentTarget.style.color='var(--accent)' }}
                            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-tertiary)' }}
                          >✏️</button>
                        </Tooltip>
                        <Tooltip text="Remove from notebook" position="left">
                          <button
                            onClick={() => handleRemove(note._id)}
                            style={{ width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,border:'1px solid transparent',background:'transparent',cursor:'pointer',fontSize:12,color:'var(--text-tertiary)',transition:'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background='var(--danger-bg)'; e.currentTarget.style.color='var(--danger)' }}
                            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-tertiary)' }}
                          >✕</button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddNotesModal
          notebook={notebook}
          onClose={() => setShowAdd(false)}
          onAdded={() => { load(); onRefresh?.() }}
        />
      )}
    </div>
  )
}

// ─── Main NotebooksPanel ──────────────────────────────
export default function NotebooksPanel({ onViewNote, onEditNote, onRefresh, initialOpen, onClose }) {
  const { notebooks, fetchNotebooks, createNotebook, updateNotebook, deleteNotebook } = useNotebooks()
  const [showCreate,  setShowCreate]  = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [openNotebook, setOpenNotebook] = useState(initialOpen || null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => { fetchNotebooks() }, [])

  // If opened from sidebar with a specific notebook, show it directly
  useEffect(() => {
    if (initialOpen) setOpenNotebook(initialOpen)
  }, [initialOpen])

  const handleCreate = async (data) => {
    const nb = await createNotebook(data)
    return nb
  }

  const handleDelete = async (nb) => {
    await deleteNotebook(nb._id)
    setConfirmDelete(null)
    if (openNotebook?._id === nb._id) setOpenNotebook(null)
  }

  return (
    <div style={{ marginBottom:28 }}>

      {/* Section header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <h3 style={{ fontFamily:"'Instrument Serif',serif",fontStyle:'italic',fontSize:19,color:'var(--text-primary)' }}>Notebooks</h3>
          <span style={{ fontSize:11,fontFamily:"'DM Mono',monospace",color:'var(--text-tertiary)',background:'var(--bg-input)',padding:'2px 8px',borderRadius:20,border:'1px solid var(--border-soft)' }}>
            {notebooks.length}
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:8,border:'1px solid var(--border-soft)',background:'var(--bg-card)',color:'var(--text-secondary)',cursor:'pointer',fontSize:13,fontWeight:500,transition:'all 0.18s',boxShadow:'var(--shadow-xs)' }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--accent)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.boxShadow='var(--shadow-accent)' }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg-card)'; e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderColor='var(--border-soft)'; e.currentTarget.style.boxShadow='var(--shadow-xs)' }}
        >
          ＋ New Notebook
        </button>
      </div>

      {/* Empty state */}
      {notebooks.length === 0 ? (
        <div
          onClick={() => setShowCreate(true)}
          style={{ padding:'28px 20px',borderRadius:14,border:'2px dashed var(--border-md)',textAlign:'center',cursor:'pointer',transition:'all 0.18s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='var(--accent-light)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-md)'; e.currentTarget.style.background='transparent' }}
        >
          <span style={{ fontSize:36,opacity:0.3,display:'block',marginBottom:10 }}>📓</span>
          <p style={{ fontSize:14,color:'var(--text-secondary)',fontWeight:500 }}>No notebooks yet</p>
          <p style={{ fontSize:12.5,color:'var(--text-tertiary)',marginTop:4 }}>Click to create your first notebook</p>
        </div>
      ) : (
        /* Notebooks grid */
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10 }}>
          {notebooks.map((nb, i) => {
            const cfg = COLORS[nb.color] || COLORS.indigo
            return (
              <div
                key={nb._id}
                onClick={() => setOpenNotebook(nb)}
                style={{
                  padding:'14px 16px',borderRadius:12,cursor:'pointer',position:'relative',
                  background:cfg.bg,border:`1px solid ${cfg.border}`,
                  transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  animation:`fadeInUp 0.28s ease ${i*0.05}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-sm)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
              >
                {/* Action buttons */}
                <div
                  style={{ position:'absolute',top:8,right:8,display:'flex',gap:3,opacity:0,transition:'opacity 0.15s' }}
                  className="notebook-actions"
                  onClick={e => e.stopPropagation()}
                >
                  <Tooltip text="Edit notebook" position="top">
                    <button
                      onClick={() => setEditTarget(nb)}
                      style={{ width:26,height:26,borderRadius:6,border:'none',background:'rgba(255,255,255,0.85)',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:cfg.dot,boxShadow:'0 1px 4px rgba(0,0,0,0.12)',transition:'all 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'}
                      onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                    >✏️</button>
                  </Tooltip>
                  <Tooltip text="Delete notebook" position="top">
                    <button
                      onClick={() => setConfirmDelete(nb)}
                      style={{ width:26,height:26,borderRadius:6,border:'none',background:'rgba(255,255,255,0.85)',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--danger)',boxShadow:'0 1px 4px rgba(0,0,0,0.12)',transition:'all 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'}
                      onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                    >🗑</button>
                  </Tooltip>
                </div>

                <div style={{ fontSize:28,marginBottom:10 }}>{nb.emoji}</div>
                <p style={{ fontSize:14,fontWeight:600,color:'var(--text-primary)',marginBottom:4,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis' }}>
                  {nb.name}
                </p>
                {nb.description && (
                  <p style={{ fontSize:11.5,color:'var(--text-secondary)',marginBottom:6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical' }}>
                    {nb.description}
                  </p>
                )}
                <div style={{ display:'flex',alignItems:'center',gap:5,marginTop:8 }}>
                  <span style={{ width:6,height:6,borderRadius:'50%',background:cfg.dot,display:'inline-block' }} />
                  <span style={{ fontSize:11.5,fontFamily:"'DM Mono',monospace",color:cfg.text,fontWeight:500 }}>
                    {nb.noteCount || 0} note{nb.noteCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Hover show actions CSS */}
      <style>{`
        div:hover .notebook-actions { opacity: 1 !important; }
      `}</style>

      {/* Modals */}
      {showCreate && (
        <NotebookFormModal onClose={() => setShowCreate(false)} onSave={handleCreate} />
      )}
      {editTarget && (
        <NotebookFormModal
          notebook={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={async (data) => { await updateNotebook(editTarget._id, data); setEditTarget(null) }}
        />
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-5 animate-fade-in" style={{ background:'rgba(0,0,0,0.45)',backdropFilter:'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-slide-up" style={{ background:'var(--bg-card)',border:'1px solid var(--border-soft)',boxShadow:'var(--shadow-xl)' }}>
            <p style={{ fontFamily:"'Instrument Serif',serif",fontStyle:'italic',fontSize:20,color:'var(--text-primary)',marginBottom:6 }}>Delete notebook?</p>
            <p style={{ fontSize:13.5,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:20 }}>
              <strong>"{confirmDelete.name}"</strong> will be deleted. Your notes will <strong>not</strong> be deleted — they'll just be unlinked.
            </p>
            <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding:'8px 16px',borderRadius:8,border:'1px solid var(--border-soft)',background:'var(--bg-input)',color:'var(--text-secondary)',cursor:'pointer',fontSize:13 }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ padding:'8px 16px',borderRadius:8,border:'none',background:'var(--danger)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:500 }}>Delete notebook</button>
            </div>
          </div>
        </div>
      )}
      {openNotebook && (
        <NotebookView
          notebook={openNotebook}
          onClose={() => { setOpenNotebook(null); onClose?.() }}
          onViewNote={note => { setOpenNotebook(null); onClose?.(); onViewNote(note) }}
          onEditNote={note => { setOpenNotebook(null); onClose?.(); onEditNote(note) }}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}
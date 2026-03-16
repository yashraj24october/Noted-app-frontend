import React, { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { useNotes } from '../context/NotesContext.jsx'
import Tooltip from './Tooltip.jsx'
import toast from 'react-hot-toast'

const COLORS = {
  white:'#ffffff', warm:'#fff8ef', blue:'#f0f3ff',
  green:'#f0f8f3', rose:'#fff0f3', amber:'#fffbee',
  slate:'#f5f6f8', sand:'#faf7f2',
}

// Dark mode note backgrounds
const COLORS_DARK = {
  white:'#242736', warm:'#2a2519', blue:'#1e2238',
  green:'#1a2820', rose:'#2a1e24', amber:'#252218',
  slate:'#1e2030', sand:'#23211c',
}

const PRIORITY_CFG = {
  high:   { label:'High',   dotCls:'bg-danger',  textCls:'text-danger',  bgCls:'bg-danger-bg'  },
  medium: { label:'Medium', dotCls:'bg-warning', textCls:'text-warning', bgCls:'bg-warning-bg' },
  low:    { label:'Low',    dotCls:'bg-success', textCls:'text-success', bgCls:'bg-success-bg' },
}

function MarkdownContent({ content }) {
  // Split on image tags first so we can render them as real <img> elements
  const IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)(?:\{([^}]*)\})?/g
  const parts = []
  let lastIndex = 0, m
  while ((m = IMAGE_RE.exec(content || '')) !== null) {
    if (m.index > lastIndex) parts.push({ type: 'text', value: content.slice(lastIndex, m.index) })
    const attrs = {}
    ;(m[3] || '').split(',').forEach(p => { const [k,v] = p.split('='); if(k&&v) attrs[k.trim()]=v.trim() })
    parts.push({ type: 'image', alt: m[1], src: m[2], align: attrs.align || 'center', width: attrs.width || '100%' })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < (content||'').length) parts.push({ type: 'text', value: content.slice(lastIndex) })

  const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' }

  const renderText = (text) => {
    const html = text
      .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:600;margin:18px 0 8px;color:var(--text-primary)">$1</h3>')
      .replace(/^## (.+)$/gm,  '<h2 style="font-size:20px;font-weight:600;margin:22px 0 10px;color:var(--text-primary)">$1</h2>')
      .replace(/^# (.+)$/gm,   '<h1 style="font-family:\'Instrument Serif\',serif;font-size:26px;font-style:italic;margin:24px 0 12px;color:var(--text-primary)">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g,'<strong style="font-weight:600;color:var(--text-primary)">$1</strong>')
      .replace(/\*(.+?)\*/g,   '<em style="color:var(--text-secondary);font-style:italic">$1</em>')
      .replace(/`(.+?)`/g,     '<code style="background:var(--bg-input);padding:2px 7px;border-radius:5px;font-family:\'DM Mono\',monospace;font-size:13px;color:var(--accent);border:1px solid var(--border-soft)">$1</code>')
      .replace(/^- (.+)$/gm,   '<li style="margin:5px 0;color:var(--text-secondary);margin-left:20px;list-style:disc">$1</li>')
      .replace(/^\d+\. (.+)$/gm,'<li style="margin:5px 0;color:var(--text-secondary);margin-left:20px;list-style:decimal">$1</li>')
      .replace(/^> (.+)$/gm,   '<blockquote style="border-left:3px solid var(--accent);padding:4px 0 4px 14px;margin:12px 0;color:var(--text-secondary);font-style:italic;background:var(--accent-light);border-radius:0 6px 6px 0">$1</blockquote>')
      .replace(/^---$/gm,      '<hr style="border:none;border-top:1px solid var(--border-soft);margin:20px 0">')
      .replace(/\n\n/g,'<br/><br/>').replace(/\n/g,'<br/>')
    return <div key={Math.random()} style={{fontSize:15,lineHeight:1.9,color:'var(--text-primary)',fontFamily:"'DM Sans',sans-serif"}} dangerouslySetInnerHTML={{__html:html}}/>
  }

  return (
    <div>
      {parts.map((p, i) =>
        p.type === 'image' ? (
          <div key={i} style={{ display:'flex', justifyContent: justifyMap[p.align]||'center', margin:'14px 0' }}>
            <img
              src={p.src}
              alt={p.alt}
              style={{ width: p.width, maxWidth:'100%', height:'auto', borderRadius:8, boxShadow:'0 2px 12px rgba(0,0,0,0.1)', display:'block' }}
            />
          </div>
        ) : renderText(p.value)
      )}
    </div>
  )
}

/* ── Main NoteViewPage ── */
export default function NoteViewPage({ note, onClose, onEditNote, onShareNote, onRefresh }) {
  const { togglePin, toggleFavorite, deleteNote, duplicateNote } = useNotes()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [localNote, setLocalNote]     = useState(note)

  useEffect(() => { setLocalNote(note) }, [note])

  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') { if (isFullscreen) setIsFullscreen(false); else onClose() }
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        setIsFullscreen(f => !f)
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isFullscreen, onClose])

  if (!localNote) return null

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark'
  const colorMap = isDarkMode ? COLORS_DARK : COLORS
  const bg = colorMap[localNote.color] || (isDarkMode ? '#242736' : '#ffffff')
  const priCfg = PRIORITY_CFG[localNote.priority] || PRIORITY_CFG.medium
  const wordCount = (localNote.content || '').trim().split(/\s+/).filter(Boolean).length
  const readTime  = Math.max(1, Math.ceil(wordCount / 200))

  const handleDelete = async () => { await deleteNote(localNote._id); onRefresh?.(); onClose() }
  const handleDuplicate = async () => { await duplicateNote(localNote._id); onRefresh?.() }
  const handleTogglePin = async () => { await togglePin(localNote._id); setLocalNote(n => ({...n, isPinned: !n.isPinned})); onRefresh?.() }
  const handleToggleFav = async () => { await toggleFavorite(localNote._id); setLocalNote(n => ({...n, isFavorite: !n.isFavorite})); onRefresh?.() }

  const panelCls = isFullscreen
    ? 'fixed inset-0 z-[200] flex flex-col overflow-hidden animate-fade-in'
    : 'relative w-full max-w-3xl flex flex-col animate-slide-in-right overflow-visible'

  const iconBtn = (active, activeCls, inactiveCls, child) => ({
    width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
    borderRadius:8, border: active ? `1px solid var(--border-soft)` : '1px solid transparent',
    cursor:'pointer', fontSize:14, transition:'all 0.18s',
    background: active ? `var(--accent-light)` : 'rgba(128,128,128,0.08)',
  })

  return (
    <div
      className="fixed inset-0 z-[100] animate-fade-in flex items-stretch justify-end"
      onClick={e => { if (!isFullscreen && e.target === e.currentTarget) onClose() }}
    >
      {!isFullscreen && (
        <div className="absolute inset-0 backdrop-blur-[8px]" style={{ background:'rgba(0,0,0,0.3)' }} onClick={onClose} />
      )}

      <div className={panelCls} style={{ background: bg, boxShadow: 'var(--shadow-modal)' }}>

        {/* ── Topbar ── */}
        <div style={{ display:'flex',alignItems:'center', flexWrap:'wrap',justifyContent:'space-between',rowGap:'.5rem',padding:'12px 20px',borderBottom:'1px solid var(--border-soft)',background:bg,flexShrink:0 }}>

          {/* Left */}
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            {!isFullscreen && (
              <Tooltip text="Close" shortcut="Esc" position="bottom">
                <button onClick={onClose} style={{ width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid transparent',background:'rgba(128,128,128,0.08)',cursor:'pointer',fontSize:14,color:'var(--text-secondary)',transition:'all 0.18s' }}>←</button>
              </Tooltip>
            )}
            <span style={{ width:8,height:8,borderRadius:'50%',background:`var(--${priCfg.dotCls.replace('bg-','')})`,display:'inline-block' }} />
            <span style={{ fontSize:12,fontWeight:500,padding:'3px 10px',borderRadius:20,background:`var(--${priCfg.bgCls.replace('bg-','')})`,color:`var(--${priCfg.textCls.replace('text-','')})` }}>
              {priCfg.label} priority
            </span>
            {localNote.subject && (
              <span style={{ fontSize:12,fontWeight:500,padding:'3px 10px',borderRadius:20,background:'var(--accent-light)',color:'var(--accent)',border:'1px solid var(--border-soft)' }}>
                {localNote.subject}
              </span>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display:'flex',alignItems:'center',gap:6 }}>

            <Tooltip text={localNote.isFavorite ? 'Remove favourite' : 'Add to favourites'} position="bottom">
              <button onClick={handleToggleFav} style={{ width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid transparent',cursor:'pointer',fontSize:14,transition:'all 0.18s', background: localNote.isFavorite ? 'var(--warm-bg)' : 'rgba(128,128,128,0.08)', color: localNote.isFavorite ? 'var(--warm)' : 'var(--text-tertiary)' }}>
                {localNote.isFavorite ? '★' : '☆'}
              </button>
            </Tooltip>

            <Tooltip text={localNote.isPinned ? 'Unpin' : 'Pin note'} position="bottom">
              <button onClick={handleTogglePin} style={{ width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid transparent',cursor:'pointer',fontSize:14,transition:'all 0.18s', background: localNote.isPinned ? 'var(--accent-light)' : 'rgba(128,128,128,0.08)', color: localNote.isPinned ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                📌
              </button>
            </Tooltip>

            <Tooltip text="Duplicate note" position="bottom">
              <button onClick={handleDuplicate} style={{ width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid transparent',background:'rgba(128,128,128,0.08)',cursor:'pointer',fontSize:14,color:'var(--text-secondary)',transition:'all 0.18s' }}>⧉</button>
            </Tooltip>

            {/* ── Share button ── */}
            <Tooltip text={localNote.isShared ? 'Manage share link' : 'Share this note'} position="bottom">
              <button
                onClick={() => onShareNote?.(localNote)}
                style={{
                  width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',
                  borderRadius:8,cursor:'pointer',fontSize:14,transition:'all 0.18s',
                  background: localNote.isShared ? 'var(--success-bg)' : 'rgba(128,128,128,0.08)',
                  color: localNote.isShared ? 'var(--success)' : 'var(--text-secondary)',
                  border: localNote.isShared ? '1px solid var(--border-soft)' : '1px solid transparent',
                }}
              >
                {localNote.isShared ? '🔗' : '↗'}
              </button>
            </Tooltip>

            <Tooltip text="Move to trash" position="bottom">
              <button onClick={() => setShowConfirm(true)} style={{ width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid transparent',background:'rgba(128,128,128,0.08)',cursor:'pointer',fontSize:14,color:'var(--text-tertiary)',transition:'all 0.18s' }}>🗑</button>
            </Tooltip>

            <Tooltip text={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} shortcut="F" position="bottom">
              <button
                onClick={() => setIsFullscreen(f => !f)}
                style={{
                  width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',
                  borderRadius:8,cursor:'pointer',fontSize:14,transition:'all 0.18s',
                  background: isFullscreen ? 'var(--accent)' : 'rgba(128,128,128,0.08)',
                  color: isFullscreen ? '#fff' : 'var(--text-tertiary)',
                  border: '1px solid transparent',
                }}
              >
                {isFullscreen ? '⊡' : '⛶'}
              </button>
            </Tooltip>

            <Tooltip text="Edit this note" shortcut="E" position="bottom">
              <button
                onClick={() => onEditNote(localNote)}
                style={{ display:'flex',alignItems:'center',gap:6,background:'var(--accent)',color:'#fff',fontSize:12.5,fontWeight:500,padding:'7px 14px',borderRadius:8,border:'none',cursor:'pointer',boxShadow:'var(--shadow-accent)',marginLeft:2 }}
              >
                ✏️ Edit note
              </button>
            </Tooltip>

            {!isFullscreen && (
              <Tooltip text="Close" shortcut="Esc" position="bottom">
                <button onClick={onClose} style={{ width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid transparent',background:'rgba(128,128,128,0.08)',cursor:'pointer',fontSize:16,color:'var(--text-tertiary)',marginLeft:2 }}>✕</button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex:1, overflowY:'auto', padding: isFullscreen ? '48px max(48px, calc(50% - 380px))' : '32px', background:bg }}>
          <h1 style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize: isFullscreen ? 36 : 30, lineHeight:1.25, color:'var(--text-primary)', marginBottom:14, letterSpacing:'-0.3px' }}>
            {localNote.isPinned && <span style={{ color:'var(--warning)',fontSize:22,marginRight:8 }}>📌</span>}
            {localNote.title || 'Untitled'}
          </h1>

          <div style={{ display:'flex',flexWrap:'wrap',alignItems:'center',gap:10,marginBottom:28,paddingBottom:22,borderBottom:'1px solid var(--border-soft)' }}>
            <span style={{ fontSize:12,color:'var(--text-tertiary)',fontFamily:"'DM Mono',monospace" }}>{format(new Date(localNote.createdAt),'MMM d, yyyy')}</span>
            <span style={{ color:'var(--border-md)' }}>·</span>
            <span style={{ fontSize:12,color:'var(--text-tertiary)',fontFamily:"'DM Mono',monospace" }}>edited {formatDistanceToNow(new Date(localNote.updatedAt || localNote.createdAt), {addSuffix:true})}</span>
            <span style={{ color:'var(--border-md)' }}>·</span>
            <span style={{ fontSize:12,color:'var(--text-tertiary)',fontFamily:"'DM Mono',monospace" }}>{wordCount} words · ~{readTime} min</span>
            {localNote.tags?.length > 0 && (
              <>
                <span style={{ color:'var(--border-md)' }}>·</span>
                <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                  {localNote.tags.map(tag => (
                    <span key={tag} style={{ fontSize:11,fontFamily:"'DM Mono',monospace",padding:'2px 8px',borderRadius:20,background:'var(--bg-input)',color:'var(--text-tertiary)',border:'1px solid var(--border-soft)' }}>#{tag}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {localNote.content ? <MarkdownContent content={localNote.content} /> : (
            <div style={{ textAlign:'center',padding:'60px 0' }}>
              <p style={{ fontFamily:"'Instrument Serif',serif",fontStyle:'italic',fontSize:18,color:'var(--text-tertiary)' }}>No content yet</p>
              <button onClick={() => onEditNote(localNote)} style={{ marginTop:12,fontSize:13,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontWeight:500 }}>Click Edit to add content →</button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 20px',borderTop:'1px solid var(--border-soft)',background:bg,flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' }}>
            {localNote.subject && <span style={{ fontSize:11.5,fontWeight:500,padding:'2px 8px',borderRadius:20,background:'var(--accent-light)',color:'var(--accent)',border:'1px solid var(--border-soft)' }}>{localNote.subject}</span>}
            {localNote.tags?.map(t => <span key={t} style={{ fontSize:11,fontFamily:"'DM Mono',monospace",padding:'2px 7px',borderRadius:20,background:'var(--bg-input)',color:'var(--text-tertiary)' }}>#{t}</span>)}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <button onClick={() => setIsFullscreen(f=>!f)} style={{ display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text-tertiary)',background:'none',border:'none',cursor:'pointer',padding:'5px 8px',borderRadius:7,fontWeight:500,transition:'all 0.18s' }}>
              {isFullscreen ? '⊡ Exit fullscreen' : '⛶ Fullscreen'}
            </button>
            <button onClick={() => onEditNote(localNote)} style={{ display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer',fontWeight:500 }}>✏️ Edit note</button>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center z-10 animate-fade-in" onClick={() => setShowConfirm(false)}>
          <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-soft)',borderRadius:16,padding:24,width:320,boxShadow:'var(--shadow-xl)' }} onClick={e=>e.stopPropagation()}>
            <p style={{ fontFamily:"'Instrument Serif',serif",fontStyle:'italic',fontSize:20,color:'var(--text-primary)',marginBottom:6 }}>Move to trash?</p>
            <p style={{ fontSize:13.5,color:'var(--text-secondary)',marginBottom:20,lineHeight:1.5 }}>You can restore this note from trash later.</p>
            <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding:'8px 16px',borderRadius:8,border:'1px solid var(--border-soft)',background:'var(--bg-input)',color:'var(--text-secondary)',cursor:'pointer',fontSize:13 }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding:'8px 16px',borderRadius:8,border:'none',background:'var(--danger)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:500 }}>Move to trash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
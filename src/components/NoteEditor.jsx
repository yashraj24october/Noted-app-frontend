import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNotes } from '../context/NotesContext.jsx'
import Tooltip from './Tooltip.jsx'
import toast from 'react-hot-toast'

const COLORS = [
  { key:'white', bg:'#ffffff', dot:'#e2e2e2', label:'White' },
  { key:'warm',  bg:'#fff8ef', dot:'#f5c07a', label:'Warm'  },
  { key:'blue',  bg:'#f0f3ff', dot:'#7c8ce8', label:'Blue'  },
  { key:'green', bg:'#f0f8f3', dot:'#6dbe8f', label:'Green' },
  { key:'rose',  bg:'#fff0f3', dot:'#f08fa0', label:'Rose'  },
  { key:'amber', bg:'#fffbee', dot:'#e6b94a', label:'Amber' },
  { key:'slate', bg:'#f5f6f8', dot:'#b0b8c8', label:'Slate' },
  { key:'sand',  bg:'#faf7f2', dot:'#c8b89a', label:'Sand'  },
]

// ─── Image syntax: ![alt](url){align=center,width=60%} ────────────────
const IMAGE_RE_G = () => /!\[([^\]]*)\]\(([^)]+)\)(?:\{([^}]*)\})?/g

function parseImageAttrs(str = '') {
  const out = { align: 'center', width: '100%' }
  str.split(',').forEach(p => {
    const [k, v] = p.trim().split('=')
    if (k && v) out[k.trim()] = v.trim()
  })
  return out
}

function hasImages(content) {
  return /!\[[^\]]*\]\([^)]+\)/.test(content)
}

// ─── Resizable / Alignable Image Block ─────────────────────────────────
function ImageBlock({ src, alt, attrsStr, onUpdate }) {
  const { align, width } = parseImageAttrs(attrsStr)
  const [curWidth,  setCurWidth]  = useState(width)
  const [curAlign,  setCurAlign]  = useState(align)
  const [hovered,   setHovered]   = useState(false)
  const [dragging,  setDragging]  = useState(false)
  const containerRef = useRef(null)
  const startX = useRef(0)
  const startPx = useRef(0)

  const justifyMap = { left:'flex-start', center:'center', right:'flex-end' }

  // Commit changes back to markdown content
  const commit = (newAlign, newWidth) => {
    onUpdate?.(src, alt, attrsStr, newAlign, newWidth)
  }

  const handleAlignChange = (a) => {
    setCurAlign(a)
    commit(a, curWidth)
  }

  const handleResizeStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    startX.current = e.clientX
    const parentW = containerRef.current?.offsetWidth || 600
    startPx.current = (parseFloat(curWidth) / 100) * parentW

    const onMove = (me) => {
      const delta  = me.clientX - startX.current
      const parentW = containerRef.current?.offsetWidth || 600
      const newPct  = Math.round(Math.min(100, Math.max(10, ((startPx.current + delta) / parentW) * 100)))
      setCurWidth(`${newPct}%`)
    }
    const onUp = (me) => {
      setDragging(false)
      const delta  = me.clientX - startX.current
      const parentW = containerRef.current?.offsetWidth || 600
      const newPct  = Math.round(Math.min(100, Math.max(10, ((startPx.current + delta) / parentW) * 100)))
      const finalW = `${newPct}%`
      setCurWidth(finalW)
      commit(curAlign, finalW)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const show = hovered || dragging

  return (
    <div
      ref={containerRef}
      style={{ display:'flex', justifyContent: justifyMap[curAlign]||'center', margin:'12px 0', position:'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!dragging) setHovered(false) }}
    >
      <div style={{ position:'relative', width: curWidth, maxWidth:'100%', display:'inline-block' }}>
        {/* The image */}
        <img
          src={src}
          alt={alt || 'image'}
          style={{
            width:'100%', height:'auto', borderRadius:8, display:'block',
            boxShadow: show ? '0 0 0 2px var(--accent), 0 4px 16px rgba(0,0,0,0.15)' : '0 2px 10px rgba(0,0,0,0.1)',
            transition:'box-shadow 0.18s',
            userSelect:'none',
          }}
          draggable={false}
        />

        {/* Width badge bottom-right */}
        {show && (
          <div style={{
            position:'absolute',bottom:8,right:12,
            background:'rgba(0,0,0,0.6)',color:'#fff',
            fontSize:11,padding:'2px 8px',borderRadius:20,
            fontFamily:"'DM Mono',monospace",backdropFilter:'blur(4px)',
            pointerEvents:'none',
          }}>
            {curWidth}
          </div>
        )}

        {/* Alignment + size controls — top bar */}
        {show && (
          <div style={{
            position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',
            display:'flex',alignItems:'center',gap:4,
            background:'rgba(15,15,20,0.75)',backdropFilter:'blur(8px)',
            borderRadius:9,padding:'5px 8px',
            boxShadow:'0 2px 12px rgba(0,0,0,0.3)',
          }}>
            {/* Align buttons */}
            {[
              { a:'left',   icon:'⬛◻◻', label:'Align left'   },
              { a:'center', icon:'◻⬛◻', label:'Align center' },
              { a:'right',  icon:'◻◻⬛', label:'Align right'  },
            ].map(({ a, icon, label }) => (
              <button
                key={a}
                onClick={() => handleAlignChange(a)}
                title={label}
                style={{
                  width:26,height:26,borderRadius:6,border:'none',cursor:'pointer',
                  background: curAlign===a ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                  color:'#fff',fontSize:9,transition:'all 0.15s',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}
              >{icon}</button>
            ))}

            <div style={{ width:1,height:16,background:'rgba(255,255,255,0.2)',margin:'0 2px' }} />

            {/* Quick size presets */}
            {['25%','50%','75%','100%'].map(w => (
              <button
                key={w}
                onClick={() => { setCurWidth(w); commit(curAlign, w) }}
                title={`Width ${w}`}
                style={{
                  height:26,padding:'0 7px',borderRadius:6,border:'none',cursor:'pointer',
                  background: curWidth===w ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                  color:'#fff',fontSize:10,fontFamily:"'DM Mono',monospace",
                  transition:'all 0.15s',whiteSpace:'nowrap',
                }}
              >{w}</button>
            ))}
          </div>
        )}

        {/* Resize handle — right edge drag */}
        {show && (
          <div
            onMouseDown={handleResizeStart}
            style={{
              position:'absolute',right:-8,top:'50%',transform:'translateY(-50%)',
              width:16,height:44,borderRadius:8,
              background:'var(--accent)',cursor:'ew-resize',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 2px 10px rgba(92,106,196,0.5)',
              zIndex:10,
            }}
            title="Drag to resize"
          >
            <span style={{ color:'#fff',fontSize:9,letterSpacing:1,lineHeight:1 }}>⋮⋮</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tags Input ─────────────────────────────────────────────────────────
function TagsInput({ tags, onChange }) {
  const [inp, setInp] = useState('')
  const add = (v) => {
    const t = v.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (t && !tags.includes(t) && tags.length < 10) onChange([...tags, t])
    setInp('')
  }
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(inp) }
    else if (e.key === 'Backspace' && !inp && tags.length) onChange(tags.slice(0, -1))
  }
  return (
    <div className="flex flex-wrap gap-1.5 items-center bg-inp border border-black/10 rounded-md px-2.5 py-1.5 min-h-[38px] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 transition-all">
      {tags.map(t => (
        <span key={t} className="inline-flex items-center gap-1 bg-accent-light border border-accent/20 rounded-full px-2 py-0.5 text-[11.5px] text-accent font-mono">
          #{t}
          <button onClick={() => onChange(tags.filter(x => x !== t))} className="opacity-50 hover:opacity-100 hover:text-danger text-sm leading-none">×</button>
        </span>
      ))}
      <input
        value={inp} onChange={e => setInp(e.target.value)}
        onKeyDown={onKey} onBlur={() => inp && add(inp)}
        placeholder={tags.length === 0 ? 'Add tags — press Enter' : ''}
        className="bg-transparent border-none outline-none text-sm text-primary placeholder-tertiary min-w-[80px] flex-1"
      />
    </div>
  )
}

// ─── Markdown + Image Renderer ──────────────────────────────────────────
// Splits content into text segments and ImageBlock components
function MarkdownContent({ content, onUpdateImage }) {
  const parts = []
  let lastIndex = 0
  const re = IMAGE_RE_G()
  let m
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) parts.push({ type:'text', value: content.slice(lastIndex, m.index) })
    parts.push({ type:'image', alt: m[1], src: m[2], attrsStr: m[3] || '' })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < content.length) parts.push({ type:'text', value: content.slice(lastIndex) })

  const renderText = (text, i) => {
    const html = text
      .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;margin:14px 0 6px;color:var(--text-primary)">$1</h3>')
      .replace(/^## (.+)$/gm,  '<h2 style="font-size:18px;font-weight:600;margin:16px 0 8px;color:var(--text-primary)">$1</h2>')
      .replace(/^# (.+)$/gm,   '<h1 style="font-family:\'Instrument Serif\',serif;font-size:22px;font-style:italic;margin:18px 0 10px;color:var(--text-primary)">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g,'<strong style="font-weight:600">$1</strong>')
      .replace(/\*(.+?)\*/g,   '<em style="color:var(--text-secondary)">$1</em>')
      .replace(/`(.+?)`/g,     '<code style="background:var(--bg-input);padding:1px 6px;border-radius:4px;font-family:\'DM Mono\',monospace;font-size:12.5px;color:var(--accent)">$1</code>')
      .replace(/^- (.+)$/gm,   '<li style="margin:3px 0;color:var(--text-secondary);margin-left:16px">$1</li>')
      .replace(/^> (.+)$/gm,   '<blockquote style="border-left:3px solid var(--accent);padding:2px 0 2px 12px;margin:10px 0;color:var(--text-secondary);font-style:italic;opacity:0.85">$1</blockquote>')
      .replace(/^---$/gm,      '<hr style="border:none;border-top:1px solid var(--border-soft);margin:16px 0">')
      .replace(/\n\n/g,'<br/><br/>').replace(/\n/g,'<br/>')
    return <div key={i} className="text-sm text-primary leading-[1.85]" dangerouslySetInnerHTML={{ __html: html }} />
  }

  return (
    <div>
      {parts.map((p, i) =>
        p.type === 'image' ? (
          <ImageBlock
            key={i}
            src={p.src}
            alt={p.alt}
            attrsStr={p.attrsStr}
            onUpdate={onUpdateImage}
          />
        ) : renderText(p.value, i)
      )}
    </div>
  )
}

// ─── Toolbar Button ──────────────────────────────────────────────────────
function TbBtn({ icon, title, shortcut, onClick }) {
  return (
    <Tooltip text={title} shortcut={shortcut} position="bottom">
      <button
        onClick={onClick}
        className="w-7 h-7 flex items-center justify-center rounded border border-black/8 bg-white/80 text-secondary hover:bg-accent-light hover:text-accent hover:border-accent/25 transition-all text-[11px] font-mono"
      >{icon}</button>
    </Tooltip>
  )
}

// ─── Main NoteEditor ────────────────────────────────────────────────────
export default function NoteEditor({ note, onClose, onSaved }) {
  const { createNote, updateNote } = useNotes()
  const isNew = !note

  const [form, setForm] = useState({
    title:      note?.title      || '',
    content:    note?.content    || '',
    tags:       note?.tags       || [],
    subject:    note?.subject    || '',
    priority:   note?.priority   || 'medium',
    color:      note?.color      || 'white',
    isPinned:   note?.isPinned   || false,
    isFavorite: note?.isFavorite || false,
  })

  const [saving,       setSaving]       = useState(false)
  const [showColors,   setShowColors]   = useState(false)
  const [savedAt,      setSavedAt]      = useState(null)
  const [uploading,    setUploading]    = useState(false)
  // Preview is always shown for existing notes; auto-shown when images present
  const [showPreview,  setShowPreview]  = useState(!isNew || hasImages(note?.content || ''))
  const timerRef    = useRef(null)
  const taRef       = useRef(null)
  const fileInputRef = useRef(null)

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  // Auto-show preview when images are added
  useEffect(() => {
    if (hasImages(form.content) && !showPreview) setShowPreview(true)
  }, [form.content])

  // Auto-save for existing notes
  useEffect(() => {
    if (isNew) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try { await updateNote(note._id, form); setSavedAt(new Date()) } catch (_) {}
    }, 1500)
    return () => clearTimeout(timerRef.current)
  }, [form])

  useEffect(() => { setTimeout(() => taRef.current?.focus(), 80) }, [])
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [form])

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length
  const readTime  = Math.max(1, Math.ceil(wordCount / 200))

  // ─── Insert markdown at cursor ──────────────────────────
  const insertMd = (syntax) => {
    const ta = taRef.current
    if (!ta) return
    const s = ta.selectionStart, e = ta.selectionEnd
    const sel = form.content.slice(s, e)
    const map = {
      bold:    `**${sel || 'bold text'}**`,
      italic:  `*${sel || 'italic text'}*`,
      code:    `\`${sel || 'code'}\``,
      h1:      `\n# ${sel || 'Heading 1'}`,
      h2:      `\n## ${sel || 'Heading 2'}`,
      list:    `\n- ${sel || 'List item'}`,
      quote:   `\n> ${sel || 'Blockquote'}`,
      divider: '\n---\n',
    }
    const ins = map[syntax] || ''
    const newContent = form.content.slice(0, s) + ins + form.content.slice(e)
    setForm(f => ({ ...f, content: newContent }))
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + ins.length }, 0)
  }

  // ─── Insert image markdown at cursor ────────────────────
  const insertImageMd = (url, alt = 'image') => {
    const ta  = taRef.current
    const pos = ta ? ta.selectionStart : form.content.length
    const md  = `\n![${alt}](${url}){align=center,width=100%}\n`
    const newContent = form.content.slice(0, pos) + md + form.content.slice(pos)
    setForm(f => ({ ...f, content: newContent }))
    setShowPreview(true)  // always show preview after inserting image
    setTimeout(() => { ta?.focus(); if (ta) ta.selectionStart = ta.selectionEnd = pos + md.length }, 0)
  }

  // ─── Update image attrs when user resizes/aligns in preview ─
  const handleUpdateImage = (src, alt, oldAttrsStr, newAlign, newWidth) => {
    const oldFull = `![${alt}](${src})${oldAttrsStr ? `{${oldAttrsStr}}` : ''}`
    const newFull = `![${alt}](${src}){align=${newAlign},width=${newWidth}}`
    setForm(f => ({ ...f, content: f.content.replace(oldFull, newFull) }))
  }

  // ─── Upload handler ──────────────────────────────────────
  const handleImageUpload = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 10 * 1024 * 1024)   { toast.error('Image must be under 10MB'); return }

    setUploading(true)
    const toastId = toast.loading('Uploading image...')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await axios.post('/images/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      insertImageMd(res.data.url, file.name.replace(/\.[^.]+$/, ''))
      toast.success('Image added!', { id: toastId })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) await handleImageUpload(file)
  }

  const handlePaste = async (e) => {
    const items = Array.from(e.clipboardData?.items || [])
    const img   = items.find(i => i.type.startsWith('image/'))
    if (img) { e.preventDefault(); await handleImageUpload(img.getAsFile()) }
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Please add a title'); return }
    setSaving(true)
    try {
      if (isNew) await createNote(form)
      else { await updateNote(note._id, form); setSavedAt(new Date()) }
      onSaved?.()
      onClose()
    } catch (_) {}
    finally { setSaving(false) }
  }

  const handleClose = () => {
    if (isNew && (form.title || form.content)) {
      if (window.confirm('Discard unsaved note?')) onClose()
    } else onClose()
  }

  const currentColor = COLORS.find(c => c.key === form.color) || COLORS[0]
  const bg = currentColor.bg

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[10px] z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full max-w-6xl rounded-xl shadow-modal flex flex-col animate-slide-up overflow-hidden"
        style={{ height: 'min(90vh, 820px)', background: bg }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-black/8 flex-shrink-0" style={{ background: bg }}>
          <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded text-tertiary hover:text-primary hover:bg-black/6 transition-all text-sm flex-shrink-0">←</button>
          <input
            value={form.title}
            onChange={e => set('title')(e.target.value)}
            placeholder="Note title..."
            className="flex-1 bg-transparent border-none outline-none text-[17px] font-semibold text-primary placeholder-tertiary min-w-0"
            style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic' }}
          />
          <div className="flex items-center gap-1 text-[11px] font-mono text-tertiary mr-1 flex-shrink-0">
            <span>{wordCount}w</span>
            {savedAt && !isNew && <span className="text-success ml-1">· ✓</span>}
          </div>
          <button onClick={() => set('isPinned')(!form.isPinned)} className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-all flex-shrink-0 ${form.isPinned ? 'text-warning' : 'text-tertiary hover:text-warning'}`}>📌</button>
          <button onClick={() => set('isFavorite')(!form.isFavorite)} className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-all flex-shrink-0 ${form.isFavorite ? 'text-warm' : 'text-tertiary hover:text-warm'}`}>{form.isFavorite ? '★' : '☆'}</button>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-1 flex-wrap px-5 py-2 border-b border-black/8 flex-shrink-0" style={{ background: bg }}>
          <TbBtn icon="B"  title="Bold"       shortcut="Ctrl+B" onClick={() => insertMd('bold')} />
          <TbBtn icon="I"  title="Italic"     shortcut="Ctrl+I" onClick={() => insertMd('italic')} />
          <TbBtn icon="`"  title="Code"                         onClick={() => insertMd('code')} />
          <TbBtn icon="H1" title="Heading 1"                    onClick={() => insertMd('h1')} />
          <TbBtn icon="H2" title="Heading 2"                    onClick={() => insertMd('h2')} />
          <div className="w-px h-4 bg-black/8 mx-0.5" />
          <TbBtn icon="—"  title="Divider"                      onClick={() => insertMd('divider')} />
          <TbBtn icon="≡"  title="List item"                    onClick={() => insertMd('list')} />
          <TbBtn icon="❝"  title="Blockquote"                   onClick={() => insertMd('quote')} />
          <div className="w-px h-4 bg-black/8 mx-0.5" />

          {/* Image upload */}
          <Tooltip text="Insert image (drag & drop or paste also works)" position="bottom">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-7 h-7 flex items-center justify-center rounded border border-black/8 bg-white/80 text-secondary hover:bg-accent-light hover:text-accent hover:border-accent/25 transition-all text-[13px] disabled:opacity-50"
            >
              {uploading ? (
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-accent animate-dot1" />
                  <span className="w-1 h-1 rounded-full bg-accent animate-dot2" />
                  <span className="w-1 h-1 rounded-full bg-accent animate-dot3" />
                </span>
              ) : '🖼'}
            </button>
          </Tooltip>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleImageUpload(e.target.files[0])} />

          <div className="w-px h-4 bg-black/8 mx-0.5" />

          {/* Preview toggle */}
          <Tooltip text={showPreview ? 'Hide preview' : 'Show preview'} position="bottom">
            <button
              onClick={() => setShowPreview(v => !v)}
              className={`flex items-center gap-1 px-2 h-7 rounded border text-[11px] transition-all font-sans ${
                showPreview
                  ? 'bg-accent text-white border-transparent'
                  : 'border-black/8 bg-white/80 text-secondary hover:bg-accent-light hover:text-accent'
              }`}
            >
              <span>{showPreview ? '✎' : '◧'}</span>
              <span className="hidden sm:inline">{showPreview ? 'Editor only' : 'Split preview'}</span>
            </button>
          </Tooltip>

          {/* Color picker */}
          <div className="relative">
            <Tooltip text="Note background colour" position="bottom">
              <button
                onClick={() => setShowColors(!showColors)}
                className="w-7 h-7 rounded-full border-2 border-white shadow-xs transition-all hover:scale-110 ml-0.5"
                style={{ background: currentColor.dot }}
              />
            </Tooltip>
            {showColors && (
              <div className="absolute left-0 top-full mt-1.5 bg-card border border-black/10 rounded-lg shadow-lg p-3 z-20 animate-fade-in">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-2">Background</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLORS.map(c => (
                    <Tooltip key={c.key} text={c.label} position="bottom">
                      <button
                        onClick={() => { set('color')(c.key); setShowColors(false) }}
                        className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${form.color === c.key ? 'ring-2 ring-accent ring-offset-1' : 'ring-1 ring-black/10'}`}
                        style={{ background: c.dot }}
                      />
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subject + Priority */}
          <div className="ml-auto flex gap-1.5 items-center flex-wrap">
            <Tooltip text="Academic subject / course" position="bottom">
              <input
                className="bg-white/80 border border-black/8 rounded-md px-2.5 py-1 text-xs text-primary placeholder-tertiary outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all w-32"
                placeholder="Subject..."
                value={form.subject}
                onChange={e => set('subject')(e.target.value)}
              />
            </Tooltip>
            <Tooltip text="Note priority level" position="bottom">
              <select
                value={form.priority}
                onChange={e => set('priority')(e.target.value)}
                className="bg-white/80 border border-black/8 rounded-md px-2.5 py-1 text-xs text-primary outline-none focus:border-accent transition-all cursor-pointer"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </Tooltip>
          </div>
        </div>

        {/* ── Body: Editor + Preview ── */}
        <div className="flex-1 overflow-hidden flex min-h-0" style={{ background: bg }}>

          {/* ── Editor pane ── */}
          <div
            style={{
              width: showPreview ? '48%' : '100%',
              display: 'flex', flexDirection: 'column',
              borderRight: showPreview ? '1px solid rgba(0,0,0,0.08)' : 'none',
              transition: 'width 0.25s ease',
              position: 'relative',
            }}
          >
            {/* Drag-drop overlay hint */}
            <textarea
              ref={taRef}
              value={form.content}
              onChange={e => set('content')(e.target.value)}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onPaste={handlePaste}
              className="flex-1 w-full px-6 py-5 bg-transparent border-none outline-none text-[14.5px] text-primary leading-[1.85] resize-none placeholder-tertiary font-mono"
              placeholder={`Start writing your note...\n\nMarkdown:\n**bold**  *italic*  # Heading\n\`code\`  - list  > quote\n\n🖼 Insert image: toolbar button, drag & drop, or paste`}
              style={{ background:'transparent', fontFamily:"'DM Mono','Fira Code',monospace", fontSize:13.5 }}
              spellCheck={false}
            />

            {/* Image drop zone hint at bottom */}
            <div style={{
              position:'absolute',bottom:8,right:8,
              fontSize:10.5,color:'rgba(0,0,0,0.3)',
              fontFamily:"'DM Mono',monospace",
              pointerEvents:'none',
            }}>
              🖼 drag/paste image
            </div>
          </div>

          {/* ── Preview pane ── */}
          {showPreview && (
            <div
              style={{ width:'52%', overflowY:'auto', padding:'20px 28px', background: bg }}
            >
              {/* Preview label */}
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14,paddingBottom:10,borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
                <span style={{ fontSize:10,fontWeight:600,letterSpacing:'1px',textTransform:'uppercase',color:'var(--text-tertiary)' }}>Live Preview</span>
                {hasImages(form.content) && (
                  <span style={{ fontSize:11,color:'var(--accent)',background:'var(--accent-light)',padding:'2px 8px',borderRadius:20,border:'1px solid var(--border-soft)' }}>
                    🖼 Hover image to resize & align
                  </span>
                )}
              </div>

              {form.content ? (
                <MarkdownContent
                  content={form.content}
                  onUpdateImage={handleUpdateImage}
                />
              ) : (
                <div style={{ textAlign:'center',padding:'40px 0',color:'var(--text-tertiary)' }}>
                  <span style={{ fontSize:36,display:'block',marginBottom:10,opacity:0.2 }}>◧</span>
                  <p style={{ fontStyle:'italic',fontSize:13 }}>Start typing to see a preview...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Tags ── */}
        <div className="px-6 py-2.5 border-t border-black/8 flex-shrink-0" style={{ background: bg }}>
          <TagsInput tags={form.tags} onChange={set('tags')} />
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center gap-2 px-6 py-3 border-t border-black/8 flex-shrink-0" style={{ background: bg }}>
          <div className="flex gap-2.5 font-mono text-[11.5px] text-tertiary mr-auto flex-wrap">
            <span>{wordCount} words</span>
            <span>·</span>
            <span>~{readTime} min read</span>
            {savedAt && !isNew && <span className="text-success">· Auto-saved ✓</span>}
          </div>
          <Tooltip text="Discard changes" position="top">
            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-secondary bg-white/80 border border-black/10 rounded-md hover:bg-hover hover:text-primary transition-all">
              Cancel
            </button>
          </Tooltip>
          <Tooltip text={isNew ? 'Save new note' : 'Save changes'} shortcut="Ctrl+S" position="top">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-md transition-all shadow-accent disabled:opacity-60"
            >
              {saving ? (
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-dot1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-dot2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-dot3" />
                </span>
              ) : isNew ? 'Create note' : 'Save changes'}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import axios from 'axios'
import { useNotes } from '../context/NotesContext.jsx'
import Tooltip from './Tooltip.jsx'
import toast from 'react-hot-toast'

/* ─── Note background colors ───────────────────────────── */
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

/* ─── Markdown → HTML converter (for old notes) ───────── */
const markdownToHtml = (md) => {
  if (!md) return ''
  // Check if already HTML
  if (/<[a-z][\s\S]*>/i.test(md)) return md

  return md
    // Images with attrs: ![alt](url){align=center,width=60%}
    .replace(/!\[([^\]]*)\]\(([^)]+)\)(?:\{[^}]*\})?/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;" />')
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Checklist items
    .replace(/^- \[x\] (.+)$/gim, '<li><input type="checkbox" checked disabled /> $1</li>')
    .replace(/^- \[ \] (.+)$/gim, '<li><input type="checkbox" disabled /> $1</li>')
    // Unordered list
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Divider
    .replace(/^---$/gm, '<hr />')
    // Paragraphs — double newlines
    .replace(/\n\n/g, '</p><p>')
    // Single newlines inside paragraphs
    .replace(/\n/g, '<br />')
    // Wrap in paragraph if not already block element
    .replace(/^(?!<[hbpuoli])/gm, '')
    .trim()
    .replace(/^(.+)$/, (line) => {
      if (/^<(h[1-6]|p|ul|ol|li|blockquote|hr|img|div)/.test(line)) return line
      return `<p>${line}</p>`
    })
}

/* ─── Tags Input ───────────────────────────────────────── */
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
          <button onClick={() => onChange(tags.filter(x => x !== t))} className="opacity-50 hover:opacity-100 text-sm leading-none">×</button>
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

/* ─── Draw.io Diagram Modal ────────────────────────────── */
function DrawioModal({ onClose, onInsert }) {
  const iframeRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.origin !== 'https://embed.diagrams.net') return
      try {
        const msg = JSON.parse(e.data)
        if (msg.event === 'init') {
          iframeRef.current?.contentWindow.postMessage(
            JSON.stringify({ action: 'load', xml: '' }), '*'
          )
        }
        if (msg.event === 'export') {
          // Insert the exported SVG/PNG into the editor
          const dataUrl = msg.data
          onInsert(dataUrl, msg.format)
          onClose()
        }
        if (msg.event === 'exit') onClose()
      } catch (_) {}
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onClose, onInsert])

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="animate-slide-up flex flex-col"
        style={{
          width: '92vw', height: '88vh', maxWidth: 1200,
          background: '#fff', borderRadius: 14,
          overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>📊</span>
            <div>
              <p style={{ fontWeight:600, fontSize:14, color:'#111827', margin:0 }}>Draw.io Diagram</p>
              <p style={{ fontSize:11.5, color:'#6b7280', margin:0 }}>Create flowcharts, shapes, diagrams — click Export when done</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer', fontSize:13, color:'#374151', fontWeight:500 }}
          >
            Cancel
          </button>
        </div>

        <iframe
          ref={iframeRef}
          src="https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&modified=unsavedChanges&proto=json&format=xmlsvg&libraries=1&lang=en"
          style={{ flex:1, border:'none', width:'100%' }}
          title="Draw.io Diagram Editor"
        />

        {/* Footer hint */}
        <div style={{ padding:'8px 16px', borderTop:'1px solid #e5e7eb', background:'#f9fafb', flexShrink:0, textAlign:'center' }}>
          <p style={{ fontSize:11.5, color:'#9ca3af', margin:0 }}>
            💡 Use <strong>File → Export as → SVG</strong> or the Export button in draw.io to insert your diagram into the note
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Main NoteEditor ──────────────────────────────────── */
export default function NoteEditor({ note, onClose, onSaved }) {
  const { createNote, updateNote } = useNotes()
  const isNew = !note
  const editorRef = useRef(null)

  const [form, setForm] = useState({
    title:      note?.title      || '',
    content:    note?.contentType === 'markdown' && note?.content
                  ? markdownToHtml(note.content)
                  : (note?.content || ''),
    contentType: 'html',
    tags:       note?.tags       || [],
    subject:    note?.subject    || '',
    priority:   note?.priority   || 'medium',
    color:      note?.color      || 'white',
    isPinned:   note?.isPinned   || false,
    isFavorite: note?.isFavorite || false,
  })

  const [saving,      setSaving]      = useState(false)
  const [showColors,  setShowColors]  = useState(false)
  const [savedAt,     setSavedAt]     = useState(null)
  const [uploading,   setUploading]   = useState(false)
  const [showDrawio,  setShowDrawio]  = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const timerRef    = useRef(null)
  const fileInputRef = useRef(null)

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  // Auto-save for existing notes
  useEffect(() => {
    if (isNew || !editorReady) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try { await updateNote(note._id, form); setSavedAt(new Date()) } catch (_) {}
    }, 2000)
    return () => clearTimeout(timerRef.current)
  }, [form])

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [form])

  // Word count from HTML content
  const wordCount = (form.content || '')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  /* ─── Image upload handler (wired to TinyMCE) ─── */
  const handleImageUpload = async (file) => {
    if (!file?.type.startsWith('image/')) { toast.error('Please select an image file'); return null }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return null }
    const toastId = toast.loading('Uploading image...')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await axios.post('/images/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Image uploaded!', { id: toastId })
      return res.data.url
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId })
      return null
    }
  }

  /* ─── TinyMCE images_upload_handler ─── */
  const tinymceUploadHandler = async (blobInfo, progress) => {
    const fd = new FormData()
    fd.append('image', blobInfo.blob(), blobInfo.filename())
    try {
      const res = await axios.post('/images/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => progress(Math.round((e.loaded / e.total) * 100)),
      })
      return res.data.url
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Upload failed')
    }
  }

  /* ─── Draw.io diagram insert ─── */
  const handleDiagramInsert = useCallback((dataUrl, format) => {
    const ed = editorRef.current
    if (!ed) return
    const tag = format === 'xmlsvg' || format === 'svg'
      ? `<p><img src="${dataUrl}" alt="Diagram" style="max-width:100%;height:auto;border-radius:8px;border:1px solid #e5e7eb;" /></p>`
      : `<p><img src="${dataUrl}" alt="Diagram" style="max-width:100%;height:auto;" /></p>`
    ed.insertContent(tag)
  }, [])

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
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[10px] z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
        onClick={e => e.target === e.currentTarget && handleClose()}
      >
        <div
          className="w-full max-w-6xl rounded-xl shadow-modal flex flex-col animate-slide-up overflow-hidden"
          style={{ height: 'min(92vh, 860px)', background: bg }}
          onClick={e => e.stopPropagation()}
        >

          {/* ── Header ── */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-black/8 flex-shrink-0" style={{ background: bg }}>
            <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded text-tertiary hover:text-primary hover:bg-black/6 transition-all flex-shrink-0">←</button>
            <input
              value={form.title}
              onChange={e => set('title')(e.target.value)}
              placeholder="Note title..."
              className="flex-1 bg-transparent border-none outline-none text-[17px] font-semibold text-primary placeholder-tertiary min-w-0"
              style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic' }}
            />
            <div className="flex items-center gap-1 text-[11px] font-mono text-tertiary flex-shrink-0">
              <span>{wordCount}w</span>
              {savedAt && !isNew && <span className="text-success ml-1">· ✓</span>}
            </div>
            <button onClick={() => set('isPinned')(!form.isPinned)} className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-all flex-shrink-0 ${form.isPinned?'text-warning':'text-tertiary hover:text-warning'}`}>📌</button>
            <button onClick={() => set('isFavorite')(!form.isFavorite)} className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-all flex-shrink-0 ${form.isFavorite?'text-warm':'text-tertiary hover:text-warm'}`}>{form.isFavorite?'★':'☆'}</button>

            {/* Subject + Priority */}
            <div className="flex gap-1.5 items-center ml-1">
              <Tooltip text="Subject / course" position="bottom">
                <input
                  className="bg-white/80 border border-black/8 rounded-md px-2.5 py-1 text-xs text-primary placeholder-tertiary outline-none focus:border-accent transition-all w-28"
                  placeholder="Subject..."
                  value={form.subject}
                  onChange={e => set('subject')(e.target.value)}
                />
              </Tooltip>
              <Tooltip text="Priority level" position="bottom">
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

              {/* Color picker */}
              <div className="relative">
                <Tooltip text="Note colour" position="bottom">
                  <button
                    onClick={() => setShowColors(!showColors)}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-xs transition-all hover:scale-110"
                    style={{ background: currentColor.dot }}
                  />
                </Tooltip>
                {showColors && (
                  <div className="absolute right-0 top-full mt-1.5 bg-card border border-black/10 rounded-lg shadow-lg p-3 z-20 animate-fade-in">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-tertiary mb-2">Background</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {COLORS.map(c => (
                        <Tooltip key={c.key} text={c.label} position="bottom">
                          <button
                            onClick={() => { set('color')(c.key); setShowColors(false) }}
                            className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${form.color===c.key?'ring-2 ring-accent ring-offset-1':'ring-1 ring-black/10'}`}
                            style={{ background: c.dot }}
                          />
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── TinyMCE Editor Body ── */}
          <div className="flex-1 overflow-hidden" style={{ background: bg }}>
            <Editor
              tinymceScriptSrc="/assets/tinymce/tinymce.min.js"
              licenseKey="gpl"
              onInit={(_evt, editor) => {
                editorRef.current = editor
                setEditorReady(true)
                // Focus after mount
                setTimeout(() => editor.focus(), 100)
              }}
              value={form.content}
              onEditorChange={(content) => setForm(f => ({ ...f, content }))}
              init={{
                height: '100%',
                menubar: true,
                resize: false,
                branding: false,
                promotion: false,
                statusbar: false,

                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                  'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
                  'fullscreen', 'insertdatetime', 'table', 'wordcount', 'emoticons',
                  'codesample', 'nonbreaking', 'pagebreak', 'directionality',
                  'quickbars', 'checklist',
                ],

                toolbar: [
                  'undo redo | blocks fontfamily fontsize |',
                  'bold italic underline strikethrough |',
                  'forecolor backcolor | removeformat |',
                  'alignleft aligncenter alignright alignjustify |',
                  'bullist numlist checklist | outdent indent |',
                  'table | link uploadimage | drawdiagram | emoticons charmap |',
                  'codesample blockquote hr | code fullscreen',
                ].join(' '),

                toolbar_mode: 'wrap',

                /* ── Custom buttons ── */
                setup: (editor) => {
                  // Upload image button
                  editor.ui.registry.addButton('uploadimage', {
                    icon: 'image',
                    tooltip: 'Upload Image (or drag & drop / paste)',
                    onAction: () => fileInputRef.current?.click(),
                  })

                  // Draw.io diagram button
                  editor.ui.registry.addButton('drawdiagram', {
                    text: '📊 Diagram',
                    tooltip: 'Insert Flowchart / Shape Diagram (draw.io)',
                    onAction: () => setShowDrawio(true),
                  })

                  // Paste image support
                  editor.on('paste', async (e) => {
                    const items = Array.from(e.clipboardData?.items || [])
                    const imgItem = items.find(i => i.type.startsWith('image/'))
                    if (imgItem) {
                      e.preventDefault()
                      const file = imgItem.getAsFile()
                      setUploading(true)
                      const url = await handleImageUpload(file)
                      setUploading(false)
                      if (url) editor.insertContent(`<img src="${url}" alt="image" style="max-width:100%;height:auto;border-radius:6px;" />`)
                    }
                  })

                  // Drag-drop image support
                  editor.on('drop', async (e) => {
                    const file = e.dataTransfer?.files?.[0]
                    if (file?.type.startsWith('image/')) {
                      e.preventDefault()
                      setUploading(true)
                      const url = await handleImageUpload(file)
                      setUploading(false)
                      if (url) editor.insertContent(`<img src="${url}" alt="image" style="max-width:100%;height:auto;border-radius:6px;" />`)
                    }
                  })
                },

                /* ── Images: upload via our backend ── */
                images_upload_handler: tinymceUploadHandler,
                automatic_uploads: true,
                images_reuse_filename: true,
                file_picker_types: 'image',
                image_advtab: true,
                image_caption: true,

                /* ── Content styles matching Noted theme ── */
                content_style: `
                  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono&family=Instrument+Serif:ital@0;1&display=swap');
                  body {
                    font-family: 'DM Sans', -apple-system, sans-serif;
                    font-size: 14.5px;
                    color: #1a1c23;
                    line-height: 1.85;
                    padding: 18px 28px;
                    margin: 0;
                    background: ${bg};
                  }
                  p { margin: 0 0 0.4rem; }
                  h1 { font-family: 'Instrument Serif', serif; font-style: italic; font-size: 1.7rem; font-weight: 400; margin: 1rem 0 0.5rem; color: #1a1c23; }
                  h2 { font-size: 1.25rem; font-weight: 600; margin: 0.9rem 0 0.4rem; color: #1a1c23; }
                  h3 { font-size: 1.05rem; font-weight: 600; margin: 0.7rem 0 0.3rem; color: #1a1c23; }
                  ul, ol { padding-left: 1.5rem; margin-bottom: 0.5rem; }
                  li { margin-bottom: 0.2rem; }
                  blockquote { border-left: 3px solid #5c6ac4; padding-left: 14px; color: #6b6b78; margin: 0.7rem 0; font-style: italic; }
                  a { color: #5c6ac4; text-decoration: underline; }
                  img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 8px 0; }
                  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                  td, th { border: 1px solid #e8e8f0; padding: 8px 12px; }
                  th { background: #f5f6f8; font-weight: 600; }
                  code { background: #f0f0f5; border-radius: 4px; padding: 1px 6px; font-family: 'DM Mono', monospace; font-size: 12.5px; color: #5c6ac4; }
                  pre { background: #1a1c23; color: #e8e8f0; border-radius: 8px; padding: 14px 18px; overflow-x: auto; }
                  hr { border: none; border-top: 1px solid #e8e8f0; margin: 14px 0; }
                  input[type="checkbox"] { margin-right: 6px; accent-color: #5c6ac4; }
                  /* Checklist */
                  .tox-checklist > li:not(.tox-checklist--checked)::before { border-color: #5c6ac4; }
                  .tox-checklist > li.tox-checklist--checked::before { background-color: #5c6ac4; border-color: #5c6ac4; }
                `,

                /* ── Table defaults ── */
                table_default_styles: { width: '100%', borderCollapse: 'collapse' },
                table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',

                /* ── Code samples ── */
                codesample_languages: [
                  { text: 'HTML', value: 'markup' },
                  { text: 'JavaScript', value: 'javascript' },
                  { text: 'TypeScript', value: 'typescript' },
                  { text: 'CSS', value: 'css' },
                  { text: 'Python', value: 'python' },
                  { text: 'Java', value: 'java' },
                  { text: 'C++', value: 'cpp' },
                  { text: 'JSON', value: 'json' },
                  { text: 'Bash', value: 'bash' },
                  { text: 'SQL', value: 'sql' },
                ],

                /* ── Quick toolbar on text selection ── */
                quickbars_selection_toolbar: 'bold italic underline | forecolor backcolor | link | blockquote',
                quickbars_insert_toolbar: false,

                /* ── Link defaults ── */
                link_default_target: '_blank',
                link_assume_external_targets: true,

                /* ── Paste ── */
                paste_data_images: true,
                smart_paste: true,
                paste_as_text: false,

                /* ── Keyboard shortcut: Ctrl+S ── */
                init_instance_callback: (editor) => {
                  editor.addShortcut('ctrl+s', 'Save note', () => handleSave())
                },

                /* ── Skin matching Noted's theme ── */
                skin: 'oxide',
                content_css: false,
              }}
            />

            {/* Hidden file input for image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display:'none' }}
              onChange={async e => {
                const file = e.target.files[0]
                if (!file) return
                setUploading(true)
                const url = await handleImageUpload(file)
                setUploading(false)
                if (url && editorRef.current) {
                  editorRef.current.insertContent(
                    `<img src="${url}" alt="${file.name.replace(/\.[^.]+$/, '')}" style="max-width:100%;height:auto;border-radius:6px;" />`
                  )
                }
                e.target.value = ''
              }}
            />
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
              {uploading && <span className="text-accent">· uploading image...</span>}
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

      {/* ── Draw.io Modal ── */}
      {showDrawio && (
        <DrawioModal
          onClose={() => setShowDrawio(false)}
          onInsert={handleDiagramInsert}
        />
      )}
    </>
  )
}
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import ThemeToggle from '../components/ThemeToggle.jsx'

function MarkdownContent({ content }) {
  const html = (content || '')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:17px;font-weight:600;margin:20px 0 8px;color:var(--text-primary)">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:22px;font-weight:600;margin:28px 0 10px;color:var(--text-primary)">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-family:\'Instrument Serif\',serif;font-size:28px;font-style:italic;margin:32px 0 14px;color:var(--text-primary)">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:var(--text-primary)">$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em style="color:var(--text-secondary);font-style:italic">$1</em>')
    .replace(/`(.+?)`/g,      '<code style="background:var(--bg-input);padding:2px 8px;border-radius:5px;font-family:\'DM Mono\',monospace;font-size:13.5px;color:var(--accent);border:1px solid var(--border-soft)">$1</code>')
    .replace(/^- (.+)$/gm,    '<li style="margin:6px 0;color:var(--text-secondary);margin-left:22px;list-style:disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm,'<li style="margin:6px 0;color:var(--text-secondary);margin-left:22px;list-style:decimal">$1</li>')
    .replace(/^> (.+)$/gm,    '<blockquote style="border-left:3px solid var(--accent);padding:6px 0 6px 16px;margin:14px 0;color:var(--text-secondary);font-style:italic;background:var(--accent-light);border-radius:0 8px 8px 0">$1</blockquote>')
    .replace(/^---$/gm,       '<hr style="border:none;border-top:1px solid var(--border-soft);margin:24px 0">')
    .replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')

  return (
    <div
      style={{ fontSize: 16, lineHeight: 1.95, color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

const PRIORITY_CFG = {
  high:   { label: 'High priority',   color: 'var(--danger)',   bg: 'var(--danger-bg)' },
  medium: { label: 'Medium priority', color: 'var(--warning)',  bg: 'var(--warning-bg)' },
  low:    { label: 'Low priority',    color: 'var(--success)',  bg: 'var(--success-bg)' },
}

export default function SharedNotePage() {
  const { token } = useParams()
  const [note, setNote]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    axios.get(`/shared/${token}`)
      .then(res => setNote(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Note not found'))
      .finally(() => setLoading(false))
  }, [token])

  const wordCount = note ? (note.content || '').trim().split(/\s+/).filter(Boolean).length : 0
  const readTime  = Math.max(1, Math.ceil(wordCount / 200))
  const priCfg    = note ? (PRIORITY_CFG[note.priority] || PRIORITY_CFG.medium) : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>

      {/* ── Topbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-soft)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 56,
        boxShadow: 'var(--shadow-xs)',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, fontSize: 16,
            background: 'linear-gradient(135deg, var(--accent), #7c8ce8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>📝</div>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 20, color: 'var(--text-primary)' }}>
            Noted
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Shared badge */}
          <span style={{
            fontSize: 11.5, fontWeight: 500,
            padding: '4px 10px', borderRadius: 20,
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            border: '1px solid var(--border-soft)',
          }}>
            🔗 Shared note
          </span>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 80 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--accent)', opacity: 0.5,
                  animation: `dotBounce 1.2s ${d}s infinite`,
                }} />
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: "'DM Mono',monospace" }}>
              Loading note...
            </p>
          </div>
        )}

        {error && (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <span style={{ fontSize: 52, opacity: 0.25 }}>🔗</span>
            <p style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontSize: 24, color: 'var(--text-secondary)' }}>
              Link not found
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', maxWidth: 340, lineHeight: 1.6 }}>
              This shared note doesn't exist or the link has been revoked by the author.
            </p>
            <Link to="/" style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500,
              padding: '9px 20px', borderRadius: 8, textDecoration: 'none',
              boxShadow: 'var(--shadow-accent)',
            }}>
              Open Noted →
            </Link>
          </div>
        )}

        {note && (
          <article style={{ animation: 'fadeIn 0.35s ease' }}>

            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              {priCfg && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20,
                  background: priCfg.bg, color: priCfg.color,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: priCfg.color, display: 'inline-block' }} />
                  {priCfg.label}
                </span>
              )}
              {note.subject && (
                <span style={{
                  fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20,
                  background: 'var(--accent-light)', color: 'var(--accent)',
                  border: '1px solid var(--border-soft)',
                }}>
                  {note.subject}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 38, fontStyle: 'italic',
              color: 'var(--text-primary)',
              lineHeight: 1.25, letterSpacing: '-0.5px',
              marginBottom: 20,
            }}>
              {note.title || 'Untitled'}
            </h1>

            {/* Meta */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center',
              gap: 8, marginBottom: 36, paddingBottom: 28,
              borderBottom: '1px solid var(--border-soft)',
            }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontFamily: "'DM Mono',monospace" }}>
                {format(new Date(note.createdAt), 'MMMM d, yyyy')}
              </span>
              <span style={{ color: 'var(--border-md)', fontSize: 14 }}>·</span>
              <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontFamily: "'DM Mono',monospace" }}>
                {wordCount} words
              </span>
              <span style={{ color: 'var(--border-md)', fontSize: 14 }}>·</span>
              <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontFamily: "'DM Mono',monospace" }}>
                ~{readTime} min read
              </span>

              {note.tags?.length > 0 && (
                <>
                  <span style={{ color: 'var(--border-md)', fontSize: 14 }}>·</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {note.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 11.5, padding: '2px 9px', borderRadius: 20,
                        background: 'var(--bg-input)', color: 'var(--text-tertiary)',
                        border: '1px solid var(--border-soft)',
                        fontFamily: "'DM Mono',monospace",
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Body */}
            {note.content ? (
              <MarkdownContent content={note.content} />
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: 15 }}>
                This note has no content.
              </p>
            )}

            {/* Footer */}
            <div style={{
              marginTop: 64, paddingTop: 28,
              borderTop: '1px solid var(--border-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
            }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                Shared via{' '}
                <span style={{ color: 'var(--accent)', fontStyle: 'italic', fontFamily: "'Instrument Serif',serif", fontSize: 14 }}>
                  Noted
                </span>
              </p>
              <Link to="/" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12.5, color: 'var(--accent)', fontWeight: 500,
                textDecoration: 'none', padding: '7px 16px', borderRadius: 8,
                background: 'var(--accent-light)',
                border: '1px solid var(--border-soft)',
                transition: 'all 0.18s',
              }}>
                📝 Start taking notes free →
              </Link>
            </div>
          </article>
        )}
      </main>

      <style>{`
        @keyframes dotBounce {
          0%,100% { transform: translateY(0); opacity: 0.4; }
          50%      { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  )
}
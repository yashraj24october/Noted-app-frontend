import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function ShareModal({ note, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [localNote, setLocalNote] = useState(note)

  const isShared = localNote.isShared && localNote.shareToken
  const shareUrl = isShared
    ? `${window.location.origin}/share/${localNote.shareToken}`
    : null

  const handleShare = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`/shared/${localNote._id}/share`)
      const updated = { ...localNote, isShared: true, shareToken: res.data.data.shareToken }
      setLocalNote(updated)
      onUpdate?.(updated)
      toast.success('Share link created!')
    } catch (_) { toast.error('Failed to create share link') }
    finally { setLoading(false) }
  }

  const handleRevoke = async () => {
    setLoading(true)
    try {
      await axios.delete(`/shared/${localNote._id}/share`)
      const updated = { ...localNote, isShared: false, shareToken: null }
      setLocalNote(updated)
      onUpdate?.(updated)
      toast.success('Share link revoked')
    } catch (_) { toast.error('Failed to revoke') }
    finally { setLoading(false) }
  }

  const copyLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 animate-slide-up"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-soft)',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontSize: 22, color: 'var(--text-primary)', marginBottom: 4 }}>
              Share note
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Anyone with the link can view — no login needed
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width:32,height:32,borderRadius:8,border:'1px solid var(--border-soft)',background:'var(--bg-input)',color:'var(--text-secondary)',cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}
          >✕</button>
        </div>

        {/* Note pill */}
        <div style={{ display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:10,background:'var(--bg-input)',border:'1px solid var(--border-soft)',marginBottom:20 }}>
          <div style={{ width:34,height:34,borderRadius:9,background:'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>📄</div>
          <div style={{ flex:1,overflow:'hidden' }}>
            <p style={{ fontSize:13.5,fontWeight:600,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
              {localNote.title || 'Untitled'}
            </p>
            <p style={{ fontSize:11.5,color:'var(--text-tertiary)',fontFamily:"'DM Mono',monospace",marginTop:2 }}>
              {localNote.wordCount || 0} words · {localNote.subject || 'No subject'}
            </p>
          </div>
          {isShared && (
            <span style={{ fontSize:11,padding:'3px 9px',borderRadius:20,background:'var(--success-bg)',color:'var(--success)',fontWeight:500,flexShrink:0 }}>
              🔗 Live
            </span>
          )}
        </div>

        {isShared ? (
          <div>
            {/* Link box + copy */}
            <div style={{ display:'flex',alignItems:'center',gap:8,background:'var(--bg-input)',border:'1px solid var(--border-soft)',borderRadius:10,padding:'10px 14px',marginBottom:12 }}>
              <span style={{ flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12.5,color:'var(--text-secondary)',fontFamily:"'DM Mono',monospace" }}>
                {shareUrl}
              </span>
              <button
                onClick={copyLink}
                style={{
                  flexShrink:0,padding:'5px 14px',borderRadius:7,border:'none',
                  cursor:'pointer',fontSize:13,fontWeight:500,transition:'all 0.18s',
                  background: copied ? 'var(--success-bg)' : 'var(--accent)',
                  color: copied ? 'var(--success)' : '#fff',
                }}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>

            {/* Open preview */}
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:7,width:'100%',padding:'10px',borderRadius:9,marginBottom:10,background:'var(--accent-light)',color:'var(--accent)',fontSize:13.5,fontWeight:500,textDecoration:'none',border:'1px solid var(--border-soft)',transition:'all 0.18s' }}
            >
              🔗 Open preview link
            </a>

            {/* Revoke */}
            <button
              onClick={handleRevoke}
              disabled={loading}
              style={{ width:'100%',padding:'10px',borderRadius:9,border:'1px solid var(--border-soft)',cursor:'pointer',fontSize:13.5,fontWeight:500,transition:'all 0.18s',background:'var(--danger-bg)',color:'var(--danger)',opacity:loading?0.6:1 }}
            >
              {loading ? 'Revoking...' : '✕  Revoke share link'}
            </button>
          </div>
        ) : (
          <div>
            {/* Private state */}
            <div style={{ textAlign:'center',padding:'20px 16px',borderRadius:10,background:'var(--bg-input)',border:'1px solid var(--border-soft)',marginBottom:16 }}>
              <span style={{ fontSize:36,display:'block',marginBottom:10,opacity:0.35 }}>🔒</span>
              <p style={{ fontSize:14,color:'var(--text-secondary)',lineHeight:1.6 }}>
                This note is <strong style={{ color:'var(--text-primary)' }}>private</strong>.<br/>
                Generate a link to share it publicly.
              </p>
            </div>
            <button
              onClick={handleShare}
              disabled={loading}
              style={{ width:'100%',padding:'12px',borderRadius:9,border:'none',cursor:'pointer',fontSize:14,fontWeight:500,background:'var(--accent)',color:'#fff',boxShadow:'var(--shadow-accent)',opacity:loading?0.7:1,transition:'all 0.18s' }}
            >
              {loading ? 'Creating link...' : '🔗  Generate share link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
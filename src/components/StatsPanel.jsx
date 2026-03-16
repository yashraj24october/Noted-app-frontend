import React, { useEffect, useRef, useState } from 'react'
import { useNotes } from '../context/NotesContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { format } from 'date-fns'

/* ── Animated number counter ── */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const fromRef = useRef(0)

  useEffect(() => {
    const target = Number(value) || 0
    const from   = fromRef.current
    if (from === target) return

    const duration = 600
    cancelAnimationFrame(rafRef.current)
    startRef.current = null

    const step = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
      else { fromRef.current = target; setDisplay(target) }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  return <span>{display}</span>
}

/* ── Animated progress bar ── */
function ProgressBar({ pct, color }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 60)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div style={{ height: 5, borderRadius: 5, background: 'var(--bg-input)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 5,
        background: color,
        width: `${width}%`,
        transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
      }} />
    </div>
  )
}

const STAT_CARDS = [
  { key: 'totalNotes', icon: '📋', label: 'Total Notes', iconBg: 'rgba(92,106,196,0.15)',  animCls: 'animate-stat-1' },
  { key: 'pinned',     icon: '📌', label: 'Pinned',      iconBg: 'rgba(212,137,26,0.15)', animCls: 'animate-stat-2' },
  { key: 'favorites',  icon: '⭐', label: 'Favourites',  iconBg: 'rgba(196,135,92,0.15)', animCls: 'animate-stat-3' },
  { key: 'archived',   icon: '🗂️', label: 'Archived',    iconBg: 'rgba(61,154,94,0.15)',  animCls: 'animate-stat-4' },
]

const PRIORITY_COLOR = {
  high:   'var(--danger)',
  medium: 'var(--warning)',
  low:    'var(--success)',
}

export default function StatsPanel() {
  const { stats } = useNotes()
  const { user }  = useAuth()

  if (!stats) return null

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const total    = stats.totalNotes || 1

  return (
    <div style={{ marginBottom: 24 }}>

      {/* ── Greeting — slides in from left ── */}
      <div className="animate-slide-in-left" style={{ marginBottom: 20 }}>
        <h2 style={{
          fontFamily: "'Instrument Serif',serif", fontStyle: 'italic',
          fontSize: 26, color: 'var(--text-primary)',
          marginBottom: 3, letterSpacing: '-0.3px',
        }}>
          {greeting}, {user?.name?.split(' ')[0]}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          {format(new Date(), 'EEEE, MMMM d yyyy')}
          {stats.totalNotes > 0 && ` · ${stats.totalNotes} notes in your workspace`}
        </p>
      </div>

      {/* ── Stat cards — staggered spring entrance ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12, marginBottom: 12,
      }}>
        {STAT_CARDS.map((s, i) => (
          <div
            key={s.key}
            className={`hover-lift ${s.animCls}`}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-soft)',
              borderRadius: 14,
              padding: '16px 18px',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle gradient shimmer on hover */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 14,
              background: 'linear-gradient(135deg, transparent 60%, rgba(92,106,196,0.04))',
              pointerEvents: 'none',
            }} />

            <div style={{
              width: 36, height: 36, borderRadius: 9, marginBottom: 12,
              background: s.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {s.icon}
            </div>

            <p style={{
              fontFamily: "'Instrument Serif',serif",
              fontSize: 32, color: 'var(--text-primary)',
              lineHeight: 1, marginBottom: 4,
            }}>
              <AnimatedNumber value={stats[s.key] ?? 0} />
            </p>
            <p style={{
              fontSize: 10.5, fontWeight: 600,
              letterSpacing: '0.5px', textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
            }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Priority + Tags — fade in after stat cards ── */}
      {(stats.byPriority?.length > 0 || stats.topTags?.length > 0) && (
        <div
          className="animate-fade-in"
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 12, marginBottom: 14,
            animationDelay: '0.35s', animationFillMode: 'both',
          }}
        >

          {/* Priority breakdown */}
          {stats.byPriority?.length > 0 && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-soft)',
              borderRadius: 14, padding: '14px 16px',
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14 }}>
                Priority breakdown
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.byPriority.map((p, i) => {
                  const color = PRIORITY_COLOR[p._id] || PRIORITY_COLOR.medium
                  const pct   = Math.round((p.count / total) * 100)
                  return (
                    <div key={p._id} style={{ animationDelay: `${0.4 + i * 0.08}s` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                          {p._id}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--text-tertiary)' }}>
                          <AnimatedNumber value={p.count} />
                        </span>
                      </div>
                      <ProgressBar pct={pct} color={color} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top tags */}
          {stats.topTags?.length > 0 && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-soft)',
              borderRadius: 14, padding: '14px 16px',
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14 }}>
                Top tags
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.topTags.slice(0, 5).map((t, i) => {
                  const pct = Math.round((t.count / (stats.topTags[0]?.count || 1)) * 100)
                  return (
                    <div key={t.tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{
                        fontSize: 13, color: 'var(--text-secondary)',
                        transition: 'color 0.18s ease',
                        cursor: 'default',
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        #{t.tag}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <div style={{ width: 56, height: 4, borderRadius: 4, background: 'var(--bg-input)', overflow: 'hidden' }}>
                          <ProgressBar pct={pct} color="var(--accent)" />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--text-tertiary)', minWidth: 16, textAlign: 'right' }}>
                          <AnimatedNumber value={t.count} />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
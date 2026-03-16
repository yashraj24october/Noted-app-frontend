import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

/**
 * Tooltip — portal-based so it's never clipped by overflow:hidden ancestors.
 * Position is calculated from getBoundingClientRect (viewport coords).
 * Since we render with position:fixed, NO scroll offset is added.
 */
export default function Tooltip({ text, children, position = 'top', shortcut, className = '' }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos]         = useState({ top: -9999, left: -9999, opacity: 0 })
  const triggerRef = useRef(null)
  const timerRef   = useRef(null)
  const GAP = 8

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()

    // Estimate tooltip size (we render it off-screen first, then refine)
    const W = 160   // max expected width
    const H = 32    // max expected height

    let top  = 0
    let left = 0

    if (position === 'top') {
      top  = r.top  - H - GAP
      left = r.left + r.width / 2 - W / 2
    } else if (position === 'bottom') {
      top  = r.bottom + GAP
      left = r.left + r.width / 2 - W / 2
    } else if (position === 'left') {
      top  = r.top + r.height / 2 - H / 2
      left = r.left - W - GAP
    } else {
      top  = r.top + r.height / 2 - H / 2
      left = r.right + GAP
    }

    // Clamp to viewport
    left = Math.max(6, Math.min(left, window.innerWidth  - W - 6))
    top  = Math.max(6, Math.min(top,  window.innerHeight - H - 6))

    setPos({ top, left, opacity: 1 })
  }, [position])

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setVisible(true)
      // Use rAF so the element is in the DOM before we measure
      requestAnimationFrame(calcPos)
    }, 280)
  }, [calcPos])

  const hide = useCallback(() => {
    clearTimeout(timerRef.current)
    setVisible(false)
    setPos(p => ({ ...p, opacity: 0 }))
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const arrowStyle = {
    top: {
      position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
      width: 0, height: 0, borderLeft: '5px solid transparent',
      borderRight: '5px solid transparent', borderTop: '5px solid #1a1c23',
    },
    bottom: {
      position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)',
      width: 0, height: 0, borderLeft: '5px solid transparent',
      borderRight: '5px solid transparent', borderBottom: '5px solid #1a1c23',
    },
    left: {
      position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)',
      width: 0, height: 0, borderTop: '5px solid transparent',
      borderBottom: '5px solid transparent', borderLeft: '5px solid #1a1c23',
    },
    right: {
      position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
      width: 0, height: 0, borderTop: '5px solid transparent',
      borderBottom: '5px solid transparent', borderRight: '5px solid #1a1c23',
    },
  }[position] || {}

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={`inline-flex items-center justify-center ${className}`}
      >
        {children}
      </span>

      {visible && createPortal(
        <div
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            opacity: pos.opacity,
            zIndex: 99999,
            pointerEvents: 'none',
            transition: 'opacity 0.12s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#1a1c23',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 11.5,
            fontFamily: "'DM Sans', sans-serif",
            padding: '5px 10px',
            borderRadius: 7,
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            lineHeight: 1,
          }}>
            {text}
            {shortcut && (
              <span style={{
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.55)',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
              }}>
                {shortcut}
              </span>
            )}
            <span style={arrowStyle} />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

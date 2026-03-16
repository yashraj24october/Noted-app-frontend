import React from 'react'
import { useTheme } from '../context/ThemeContext.jsx'
import Tooltip from './Tooltip.jsx'

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <Tooltip text={isDark ? 'Switch to light mode' : 'Switch to dark mode'} position="bottom">
      <button
        onClick={toggleTheme}
        className={`relative w-14 h-7 rounded-full border transition-all duration-300 focus:outline-none ${className}`}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #2a2d3e, #363950)'
            : 'linear-gradient(135deg, #fef3c7, #fde68a)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
          boxShadow: isDark
            ? 'inset 0 1px 3px rgba(0,0,0,0.4)'
            : 'inset 0 1px 3px rgba(0,0,0,0.08)',
        }}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {/* Track icons */}
        <span
          className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] transition-opacity duration-200"
          style={{ opacity: isDark ? 0 : 1 }}
        >☀️</span>
        <span
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] transition-opacity duration-200"
          style={{ opacity: isDark ? 1 : 0 }}
        >🌙</span>

        {/* Sliding thumb */}
        <span
          className="absolute top-0.5 w-6 h-6 rounded-full shadow-sm transition-all duration-300 flex items-center justify-center text-xs"
          style={{
            left: isDark ? 'calc(100% - 28px)' : '2px',
            background: isDark ? '#4a4e6a' : '#ffffff',
            boxShadow: isDark
              ? '0 1px 4px rgba(0,0,0,0.5)'
              : '0 1px 4px rgba(0,0,0,0.15)',
          }}
        >
          <span className="transition-all duration-300" style={{ fontSize: 12 }}>
            {isDark ? '🌙' : '☀️'}
          </span>
        </span>
      </button>
    </Tooltip>
  )
}

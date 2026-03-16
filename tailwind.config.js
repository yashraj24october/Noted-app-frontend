/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas:     'var(--bg-canvas)',
        page:       'var(--bg-page)',
        card:       'var(--bg-card)',
        'card-alt': 'var(--bg-card-alt)',
        inp:        'var(--bg-input)',
        hover:      'var(--bg-hover)',
        primary:    'var(--text-primary)',
        secondary:  'var(--text-secondary)',
        tertiary:   'var(--text-tertiary)',
        accent: {
          DEFAULT: 'var(--accent)',
          light:   'var(--accent-light)',
          hover:   'var(--accent-hover)',
        },
        danger:      'var(--danger)',
        'danger-bg': 'var(--danger-bg)',
        warning:     'var(--warning)',
        'warning-bg':'var(--warning-bg)',
        success:     'var(--success)',
        'success-bg':'var(--success-bg)',
        warm:        'var(--warm)',
        'warm-bg':   'var(--warm-bg)',
        sidebar:    '#1a1c23',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:  ['"DM Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '6px', md: '10px', lg: '14px', xl: '20px', '2xl': '28px',
      },
      boxShadow: {
        xs:     'var(--shadow-xs)',
        sm:     'var(--shadow-sm)',
        md:     'var(--shadow-md)',
        lg:     'var(--shadow-lg)',
        xl:     'var(--shadow-xl)',
        modal:  'var(--shadow-modal)',
        accent: 'var(--shadow-accent)',
      },
      transitionTimingFunction: {
        'spring':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':  'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce':  'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        'natural': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      transitionDuration: {
        '50': '50ms', '80': '80ms', '250': '250ms', '350': '350ms', '400': '400ms',
      },
      keyframes: {
        /* ── Entrance ── */
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(48px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        /* ── Stat card stagger ── */
        statReveal: {
          '0%':   { opacity: '0', transform: 'translateY(16px) scale(0.96)' },
          '60%':  { opacity: '1', transform: 'translateY(-3px) scale(1.01)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        /* ── Number count-up shimmer ── */
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        /* ── Subtle pulse for active/live indicators ── */
        pulse: {
          '0%,100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        /* ── Dots loader ── */
        dotBounce: {
          '0%,100%': { transform: 'translateY(0)', opacity: '0.4' },
          '50%':      { transform: 'translateY(-6px)', opacity: '1' },
        },
        /* ── Sidebar nav item slide ── */
        navSlideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        /* ── Card hover lift spring ── */
        liftIn: {
          '0%':   { transform: 'translateY(0)  scale(1)' },
          '50%':  { transform: 'translateY(-4px) scale(1.01)' },
          '100%': { transform: 'translateY(-2px) scale(1)' },
        },
        /* ── Topbar search focus expand ── */
        expandWidth: {
          '0%':   { maxWidth: '340px' },
          '100%': { maxWidth: '480px' },
        },
        /* ── Theme toggle rotation ── */
        spinOnce: {
          '0%':   { transform: 'rotate(0deg) scale(1)' },
          '50%':  { transform: 'rotate(180deg) scale(0.8)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        /* ── Success checkmark ── */
        checkPop: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '60%':  { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)',  opacity: '1' },
        },
        /* ── Gradient bar progress ── */
        progressFill: {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--target-width, 100%)' },
        },
      },
      animation: {
        /* Entrance */
        'fade-in-up':     'fadeInUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'fade-in-down':   'fadeInDown 0.22s ease forwards',
        'fade-in':        'fadeIn 0.18s ease forwards',
        'scale-in':       'scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'slide-up':       'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'slide-in-right': 'slideInRight 0.32s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-in-left':  'slideInLeft 0.28s cubic-bezier(0.22,1,0.36,1) forwards',

        /* Staggered stat cards */
        'stat-1': 'statReveal 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.05s both',
        'stat-2': 'statReveal 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.12s both',
        'stat-3': 'statReveal 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.19s both',
        'stat-4': 'statReveal 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.26s both',

        /* Misc */
        'shimmer':   'shimmer 1.6s linear infinite',
        'pulse':     'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'nav-slide': 'navSlideIn 0.22s cubic-bezier(0.22,1,0.36,1) forwards',
        'check-pop': 'checkPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'spin-once': 'spinOnce 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'progress':  'progressFill 0.8s cubic-bezier(0.22,1,0.36,1) forwards',

        /* Loader dots */
        'dot1': 'dotBounce 1.2s 0s infinite',
        'dot2': 'dotBounce 1.2s 0.2s infinite',
        'dot3': 'dotBounce 1.2s 0.4s infinite',
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // OLED/Midnight blacks
        midnight: {
          DEFAULT: '#030712', // deepest OLED black
          50:  '#0a0f1e',
          100: '#060b14',
          200: '#040810',
        },
        // Electric Cyan accents
        cyan: {
          glow:  '#00f5ff',
          400:   '#22d3ee',
          500:   '#06b6d4',
          600:   '#0891b2',
        },
        // Emerald for success/active
        emerald: {
          glow: '#00ff88',
          400:  '#34d399',
          500:  '#10b981',
        },
        // Keep primary mapped to cyan for component compat
        primary: {
          DEFAULT: '#00f5ff',
          dark:    '#06b6d4',
          muted:   '#0891b2',
        },
        // Slate-dark variants
        slate: {
          850: '#0d1424',
          900: '#0a1020',
          950: '#05080f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'scan':        'scan 2s linear infinite',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'dash':        'dash 4s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'spin-slow':   'spin 3s linear infinite',
        'border-spin': 'borderSpin 3s linear infinite',
      },
      keyframes: {
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px #00f5ff44, 0 0 30px #00f5ff22' },
          '50%':      { boxShadow: '0 0 20px #00f5ff88, 0 0 60px #00f5ff44' },
        },
        dash: {
          to: { strokeDashoffset: '-100' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        borderSpin: {
          '0%':    { transform: 'rotate(0deg)' },
          '100%':  { transform: 'rotate(360deg)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-dark':       'radial-gradient(at 40% 20%, #00f5ff0d 0px, transparent 50%), radial-gradient(at 80% 0%, #00ff880a 0px, transparent 50%), radial-gradient(at 0% 50%, #06b6d406 0px, transparent 50%)',
      },
      dropShadow: {
        'glow-cyan':    '0 0 20px rgba(0, 245, 255, 0.5)',
        'glow-emerald': '0 0 20px rgba(0, 255, 136, 0.4)',
      },
      boxShadow: {
        'glow-cyan':    '0 0 20px rgba(0, 245, 255, 0.25), 0 0 60px rgba(0, 245, 255, 0.1)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.25), 0 0 60px rgba(16, 185, 129, 0.1)',
        'inner-glow':   'inset 0 0 30px rgba(0, 245, 255, 0.05)',
        'bento':        '0 1px 0 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(0, 245, 255, 0.08)',
      },
    },
  },
  plugins: [],
}

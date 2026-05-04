module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',
          400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',
          800:'#3730a3',900:'#312e81',
        },
        accent: {
          400:'#22d3ee',500:'#06b6d4',600:'#0891b2',
        },
        magenta: {
          400:'#e879f9',500:'#d946ef',600:'#c026d3',
        },
        surface: {
          DEFAULT:'#08080b',
          secondary:'#0f0f14',
          tertiary:'#16161d',
          border:'rgba(255,255,255,0.08)',
        },
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(99,102,241,0.45)',
        'glow-lg': '0 0 60px -8px rgba(99,102,241,0.55)',
        'glow-cyan': '0 0 24px -4px rgba(34,211,238,0.45)',
        'glow-magenta': '0 0 24px -4px rgba(217,70,239,0.45)',
        'glow-red': '0 0 24px -4px rgba(239,68,68,0.45)',
        'glow-emerald': '0 0 24px -4px rgba(16,185,129,0.45)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
      animation: {
        'fade-in':'fadeIn 0.4s ease forwards',
        'slide-up':'slideUp 0.4s ease forwards',
        'slide-down':'slideDown 0.3s ease forwards',
        'scale-in':'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'shimmer':'shimmer 2.5s linear infinite',
        'float':'float 8s ease-in-out infinite',
        'float-slow':'float 14s ease-in-out infinite',
        'gradient-x':'gradientX 8s ease infinite',
        'pulse-glow':'pulseGlow 3s ease-in-out infinite',
        'spin-slow':'spin 8s linear infinite',
        'aurora':'aurora 22s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from:{opacity:0}, to:{opacity:1} },
        slideUp: { from:{opacity:0,transform:'translateY(16px)'}, to:{opacity:1,transform:'translateY(0)'} },
        slideDown: { from:{opacity:0,transform:'translateY(-8px)'}, to:{opacity:1,transform:'translateY(0)'} },
        scaleIn: { from:{opacity:0,transform:'scale(0.95)'}, to:{opacity:1,transform:'scale(1)'} },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-40px) scale(1.05)' },
          '66%': { transform: 'translate(-20px,30px) scale(0.95)' },
        },
        gradientX: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 24px -4px rgba(99,102,241,0.45)' },
          '50%': { boxShadow: '0 0 48px -2px rgba(99,102,241,0.75)' },
        },
        aurora: {
          '0%,100%': { transform: 'translate(0,0) rotate(0deg) scale(1)' },
          '50%': { transform: 'translate(-30%,20%) rotate(180deg) scale(1.2)' },
        },
      },
      backgroundImage: {
        'grid-fade': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 60%)',
        'mesh-1': 'radial-gradient(at 20% 20%, rgba(99,102,241,0.18) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(217,70,239,0.14) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(34,211,238,0.14) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
}

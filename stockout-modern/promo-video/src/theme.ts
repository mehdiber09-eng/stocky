// Couleurs et typographie partagées avec l'app Stocky
export const theme = {
  colors: {
    bg: '#06060c',
    bgGradient1: 'rgba(99,102,241,0.18)',
    bgGradient2: 'rgba(217,70,239,0.12)',
    bgGradient3: 'rgba(34,211,238,0.10)',
    primary: '#6366f1',
    secondary: '#d946ef',
    accent: '#38bdf8',
    success: '#10b981',
    warning: '#fbbf24',
    danger: '#f87171',
    white: '#ffffff',
    text: '#e4e4e7',
    textMuted: '#a1a1aa',
    textDim: '#71717a',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.10)',
  },
  font: {
    sans: '"DM Sans", "Cairo", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
    text: 'linear-gradient(135deg, #818cf8 0%, #c084fc 40%, #38bdf8 100%)',
    glow: '0 0 60px rgba(99,102,241,0.5)',
  },
}

export type Lang = 'fr' | 'ar' | 'en'

export const isRTL = (lang: Lang) => lang === 'ar'

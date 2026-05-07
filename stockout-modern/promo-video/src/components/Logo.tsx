import React from 'react'
import { theme } from '../theme'

export const Logo: React.FC<{ size?: number }> = ({ size = 80 }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.18,
        fontFamily: theme.font.sans,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          background: theme.gradient.primary,
          boxShadow: `0 ${size * 0.1}px ${size * 0.3}px -${size * 0.08}px rgba(99,102,241,0.6)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Activity icon SVG (Lucide) */}
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>
      <span
        style={{
          fontSize: size * 0.7,
          fontWeight: 800,
          letterSpacing: -size * 0.015,
          color: theme.colors.white,
        }}
      >
        Stocky
      </span>
    </div>
  )
}

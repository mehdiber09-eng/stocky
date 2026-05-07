import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'
import { theme } from '../theme'

/**
 * Background commun à toutes les scènes : aurora gradient + dotted grid
 * subtle qui pulse légèrement.
 */
export const Background: React.FC = () => {
  const frame = useCurrentFrame()
  const drift = interpolate(frame, [0, 900], [0, 60])

  return (
    <AbsoluteFill style={{ background: theme.colors.bg, overflow: 'hidden' }}>
      {/* Mesh aurora */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: `${10 + drift * 0.3}%`,
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.colors.bgGradient1}, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: `${-5 + drift * 0.2}%`,
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.colors.bgGradient2}, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: `${30 - drift * 0.3}%`,
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.colors.bgGradient3}, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
      {/* Dotted grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px)',
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  )
}

import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { theme, isRTL, type Lang } from '../theme'
import { translations } from '../translations'

interface Props { lang: Lang; format: 'vertical' | 'horizontal' }

/** Scène 3-9s (180 frames) : "Une rupture de stock = -30% clients" */
export const Problem: React.FC<Props> = ({ lang, format }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = translations[lang]
  const rtl = isRTL(lang)

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' })
  const titleY = interpolate(frame, [0, 22], [40, 0], { extrapolateRight: 'clamp' })

  const statScale = spring({ frame: frame - 25, fps, config: { damping: 10, stiffness: 70 } })
  const statOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: 'clamp' })

  const subOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' })
  const subY = interpolate(frame, [60, 80], [20, 0], { extrapolateRight: 'clamp' })

  // Glow pulsing on the stat
  const glowPulse = (Math.sin(frame * 0.15) + 1) / 2

  const fadeOut = interpolate(frame, [165, 180], [1, 0], { extrapolateRight: 'clamp' })

  const isVertical = format === 'vertical'
  const titleSize = isVertical ? 60 : 70
  const statSize = isVertical ? 280 : 360
  const subSize = isVertical ? 32 : 38

  return (
    <AbsoluteFill
      style={{
        opacity: fadeOut,
        direction: rtl ? 'rtl' : 'ltr',
        fontFamily: theme.font.sans,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
        textAlign: 'center',
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: titleSize,
          fontWeight: 600,
          color: theme.colors.textMuted,
          marginBottom: 30,
        }}
      >
        {t.problem_title}
      </div>

      {/* Big red stat */}
      <div
        style={{
          opacity: statOpacity,
          transform: `scale(${statScale})`,
          fontSize: statSize,
          fontWeight: 900,
          lineHeight: 1,
          color: theme.colors.danger,
          letterSpacing: -statSize * 0.04,
          filter: `drop-shadow(0 0 ${40 + glowPulse * 30}px rgba(248,113,113,${0.4 + glowPulse * 0.3}))`,
          marginBottom: 20,
        }}
      >
        {t.problem_stat}
      </div>

      <div
        style={{
          opacity: statOpacity,
          fontSize: subSize * 1.2,
          fontWeight: 700,
          color: theme.colors.white,
          marginBottom: 24,
        }}
      >
        {t.problem_stat_label}
      </div>

      <div
        style={{
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          fontSize: subSize,
          color: theme.colors.textMuted,
          maxWidth: 800,
        }}
      >
        {t.problem_sub}
      </div>
    </AbsoluteFill>
  )
}

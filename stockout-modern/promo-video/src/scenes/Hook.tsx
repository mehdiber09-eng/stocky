import React from 'react'
import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from 'remotion'
import { theme, isRTL, type Lang } from '../theme'
import { translations } from '../translations'
import { Logo } from '../components/Logo'
import { shake } from '../components/effects'

interface Props {
  lang: Lang
  format: 'vertical' | 'horizontal'
}

/** Scène 0-3s : Logo + accroche */
export const Hook: React.FC<Props> = ({ lang, format }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = translations[lang]
  const rtl = isRTL(lang)

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } })
  const logoOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })

  const titleOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' })
  const titleY = interpolate(frame, [20, 40], [40, 0], { extrapolateRight: 'clamp' })

  const titleHighlightOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: 'clamp' })
  const titleHighlightY = interpolate(frame, [40, 60], [40, 0], { extrapolateRight: 'clamp' })

  const fadeOut = interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Flash d'intro blanc qui s'efface
  const introFlash = interpolate(frame, [0, 6], [0.6, 0], { extrapolateRight: 'clamp' })
  // Léger shake permanent
  const sh = shake(frame, 1.2, fps)

  const isVertical = format === 'vertical'
  const titleSize = isVertical ? 130 : 140
  const subSize = isVertical ? 28 : 32

  return (
    <AbsoluteFill
      style={{
        opacity: fadeOut,
        direction: rtl ? 'rtl' : 'ltr',
        fontFamily: theme.font.sans,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
        transform: `translate(${sh.x}px, ${sh.y}px)`,
      }}
    >
      {/* Flash blanc d'intro */}
      <AbsoluteFill style={{ background: 'white', opacity: introFlash }} />

      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 60,
        }}
      >
        <Logo size={isVertical ? 110 : 130} />
      </div>

      {/* Pretitle pill */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          padding: '10px 22px',
          borderRadius: 999,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(217,70,239,0.18))',
          border: '1px solid rgba(99,102,241,0.4)',
          color: theme.colors.text,
          fontSize: subSize * 0.9,
          fontWeight: 600,
          marginBottom: 30,
          letterSpacing: 1,
        }}
      >
        {t.hook_pretitle}
      </div>

      {/* Main title in 2 parts */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: titleSize,
          fontWeight: 900,
          lineHeight: 0.95,
          color: theme.colors.white,
          textAlign: 'center',
          letterSpacing: -titleSize * 0.025,
        }}
      >
        {t.hook_a}
      </div>
      <div
        style={{
          opacity: titleHighlightOpacity,
          transform: `translateY(${titleHighlightY}px)`,
          fontSize: titleSize,
          fontWeight: 900,
          lineHeight: 0.95,
          background: theme.gradient.text,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          letterSpacing: -titleSize * 0.025,
          filter: 'drop-shadow(0 4px 32px rgba(192,132,252,0.4))',
        }}
      >
        {t.hook_b}
      </div>
    </AbsoluteFill>
  )
}

import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { theme, isRTL, type Lang } from '../theme'
import { translations } from '../translations'
import { Logo } from '../components/Logo'

interface Props { lang: Lang; format: 'vertical' | 'horizontal' }

/** Scène 25-30s (150 frames) : Logo + URL + CTA + prix */
export const CTA: React.FC<Props> = ({ lang, format }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = translations[lang]
  const rtl = isRTL(lang)

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } })
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' })

  const titleOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: 'clamp' })
  const titleY = interpolate(frame, [15, 38], [30, 0], { extrapolateRight: 'clamp' })

  const buttonScale = spring({ frame: frame - 40, fps, config: { damping: 14, stiffness: 100 } })
  const buttonOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: 'clamp' })

  const flagsOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' })
  const noteOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' })

  // Pulsing glow on button
  const glowPulse = (Math.sin(frame * 0.18) + 1) / 2

  const isVertical = format === 'vertical'
  const titleSizeA = isVertical ? 90 : 110
  const titleSizeB = isVertical ? 60 : 72
  const buttonSize = isVertical ? 42 : 50
  const urlSize = isVertical ? 36 : 42

  const flags = ['🇩🇿', '🇸🇦', '🇦🇪', '🇫🇷']

  return (
    <AbsoluteFill
      style={{
        direction: rtl ? 'rtl' : 'ltr',
        fontFamily: theme.font.sans,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
        textAlign: 'center',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          height: '50%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.30), rgba(217,70,239,0.12) 50%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.8,
        }}
      />

      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 40,
          zIndex: 2,
        }}
      >
        <Logo size={isVertical ? 110 : 130} />
      </div>

      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: titleSizeA,
          fontWeight: 900,
          lineHeight: 1,
          color: theme.colors.white,
          letterSpacing: -titleSizeA * 0.025,
          marginBottom: 20,
          zIndex: 2,
        }}
      >
        {t.cta_title_a}
      </div>
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: titleSizeB,
          fontWeight: 700,
          lineHeight: 1.1,
          background: theme.gradient.text,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 30,
          maxWidth: 1000,
          zIndex: 2,
        }}
      >
        {t.cta_title_b}
      </div>

      <div
        style={{
          opacity: titleOpacity,
          fontSize: urlSize * 0.85,
          fontFamily: theme.font.mono,
          color: theme.colors.textMuted,
          marginBottom: 40,
          zIndex: 2,
        }}
      >
        {t.cta_pricing}
      </div>

      {/* CTA button */}
      <div
        style={{
          opacity: buttonOpacity,
          transform: `scale(${buttonScale})`,
          padding: `${buttonSize * 0.5}px ${buttonSize * 1.5}px`,
          borderRadius: 999,
          background: theme.gradient.primary,
          color: theme.colors.white,
          fontWeight: 800,
          fontSize: buttonSize,
          boxShadow: `0 0 ${50 + glowPulse * 40}px rgba(99,102,241,${0.5 + glowPulse * 0.3}), inset 0 1px 0 rgba(255,255,255,0.25)`,
          marginBottom: 30,
          zIndex: 2,
        }}
      >
        {t.cta_button} →
      </div>

      <div
        style={{
          opacity: buttonOpacity,
          fontSize: urlSize,
          fontFamily: theme.font.mono,
          fontWeight: 700,
          color: theme.colors.white,
          letterSpacing: 2,
          marginBottom: 35,
          zIndex: 2,
        }}
      >
        {t.cta_url}
      </div>

      <div
        style={{
          opacity: flagsOpacity,
          display: 'flex',
          gap: 20,
          fontSize: isVertical ? 70 : 80,
          marginBottom: 25,
          zIndex: 2,
        }}
      >
        {flags.map(f => <span key={f}>{f}</span>)}
      </div>

      <div
        style={{
          opacity: noteOpacity,
          fontSize: urlSize * 0.6,
          color: theme.colors.textDim,
          zIndex: 2,
        }}
      >
        {t.cta_note}
      </div>
    </AbsoluteFill>
  )
}

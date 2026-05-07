import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { theme, isRTL, type Lang } from '../theme'
import { translations } from '../translations'
import { countUp } from '../components/effects'

interface Props { lang: Lang; format: 'vertical' | 'horizontal' }

/** Scène 19-25s — 3 chiffres clés en ticker count-up. */
export const Stats: React.FC<Props> = ({ lang, format }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = translations[lang]
  const rtl = isRTL(lang)

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' })
  const titleY = interpolate(frame, [0, 22], [-30, 0], { extrapolateRight: 'clamp' })

  const fadeOut = interpolate(frame, [165, 180], [1, 0], { extrapolateRight: 'clamp' })

  const isVertical = format === 'vertical'
  const titleSize = isVertical ? 60 : 70
  const numSize = isVertical ? 180 : 220
  const labelSize = isVertical ? 28 : 32

  // Localized digits for AR
  const toArDigits = (n: string) =>
    n.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
  const fmt = (n: number, prefix = '', suffix = '') => {
    const base = `${prefix}${n}${suffix}`
    return rtl ? toArDigits(base) : base
  }

  const items = [
    { value: 91, prefix: '',   suffix: '%', label: t.stats_1_label, color: theme.colors.primary,   delay: 25, dur: 30 },
    { value: 22, prefix: '+',  suffix: '%', label: t.stats_2_label, color: theme.colors.success,   delay: 55, dur: 30 },
    { value: 87, prefix: '−',  suffix: '%', label: t.stats_3_label, color: theme.colors.secondary, delay: 85, dur: 30 },
  ]

  return (
    <AbsoluteFill
      style={{
        direction: rtl ? 'rtl' : 'ltr',
        fontFamily: theme.font.sans,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: titleSize,
          fontWeight: 800,
          color: theme.colors.white,
          textAlign: 'center',
          marginBottom: 70,
        }}
      >
        {t.stats_title}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          gap: isVertical ? 50 : 80,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {items.map((it) => {
          const opacity = interpolate(frame, [it.delay, it.delay + 12], [0, 1], { extrapolateRight: 'clamp' })
          const scale = spring({ frame: frame - it.delay, fps, config: { damping: 11, stiffness: 90 } })
          const glow = (Math.sin((frame - it.delay) * 0.12) + 1) / 2
          const current = countUp(frame, it.delay + 5, it.dur, it.value)

          return (
            <div
              key={it.label}
              style={{
                opacity,
                transform: `scale(${scale})`,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: numSize,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: it.color,
                  letterSpacing: -numSize * 0.03,
                  filter: `drop-shadow(0 0 ${30 + glow * 30}px ${it.color}aa)`,
                  marginBottom: 14,
                  fontFamily: theme.font.sans,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {fmt(current, it.prefix, it.suffix)}
              </div>
              <div
                style={{
                  fontSize: labelSize,
                  color: theme.colors.text,
                  fontWeight: 500,
                  maxWidth: isVertical ? 600 : 360,
                }}
              >
                {it.label}
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

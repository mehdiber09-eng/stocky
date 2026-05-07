import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { theme, isRTL, type Lang } from '../theme'
import { translations } from '../translations'

interface Props { lang: Lang; format: 'vertical' | 'horizontal' }

/** Scène 19-25s (180 frames) : 3 chiffres animés */
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

  const items = [
    { num: t.stats_1, label: t.stats_1_label, color: theme.colors.primary,    delay: 25  },
    { num: t.stats_2, label: t.stats_2_label, color: theme.colors.success,    delay: 50  },
    { num: t.stats_3, label: t.stats_3_label, color: theme.colors.secondary,  delay: 75  },
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
          const opacity = interpolate(frame, [it.delay, it.delay + 20], [0, 1], { extrapolateRight: 'clamp' })
          const scale = spring({ frame: frame - it.delay, fps, config: { damping: 11, stiffness: 90 } })
          const glow = (Math.sin((frame - it.delay) * 0.1) + 1) / 2
          return (
            <div
              key={it.num}
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
                  filter: `drop-shadow(0 0 ${30 + glow * 25}px ${it.color}aa)`,
                  marginBottom: 14,
                }}
              >
                {it.num}
              </div>
              <div
                style={{
                  fontSize: labelSize,
                  color: theme.colors.text,
                  fontWeight: 500,
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

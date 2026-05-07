import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { theme, isRTL, type Lang } from '../theme'
import { translations } from '../translations'
import { countUp, shake } from '../components/effects'

interface Props { lang: Lang; format: 'vertical' | 'horizontal' }

interface StatCard {
  value: number
  prefix: string
  suffix: string
  label: string
  color: string
  bgGradient: string
}

/** Scène 19-25s — 3 cartes pleine écran successives, 1 chiffre par carte. */
export const Stats: React.FC<Props> = ({ lang, format }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = translations[lang]
  const rtl = isRTL(lang)

  const isVertical = format === 'vertical'

  /* Timing (180 frames totales = 6s) :
   * Card 1 : 0   - 60   (2s) — 91% précision IA
   * Card 2 : 55  - 120  (2s) — +22% CA Ramadan
   * Card 3 : 115 - 180  (2s) — −87% ruptures
   * Overlap de 5 frames pour transition fluide
   */

  const cards: StatCard[] = [
    {
      value: 91, prefix: '', suffix: '%',
      label: t.stats_1_label,
      color: theme.colors.primary,
      bgGradient: 'radial-gradient(circle at center, rgba(99,102,241,0.30), transparent 65%)',
    },
    {
      value: 22, prefix: '+', suffix: '%',
      label: t.stats_2_label,
      color: theme.colors.success,
      bgGradient: 'radial-gradient(circle at center, rgba(16,185,129,0.30), transparent 65%)',
    },
    {
      value: 87, prefix: '−', suffix: '%',
      label: t.stats_3_label,
      color: theme.colors.secondary,
      bgGradient: 'radial-gradient(circle at center, rgba(217,70,239,0.30), transparent 65%)',
    },
  ]

  // Aligné sur 168 frames totaux (Stats sequence)
  const SLOTS = [
    { start: 0,   end: 60  }, // Card 1 (0 - 2s)
    { start: 56,  end: 116 }, // Card 2 (1.87s - 3.87s)
    { start: 112, end: 168 }, // Card 3 (3.73s - 5.6s)
  ]

  const toArDigits = (n: string) =>
    n.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
  const fmt = (n: number, p: string, s: string) => {
    const base = `${p}${n}${s}`
    return rtl ? toArDigits(base) : base
  }

  // Header label "Résultats prouvés" reste visible
  const headerOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' })

  // Mini progress dots
  const dotOpacity = interpolate(frame, [10, 22], [0, 1], { extrapolateRight: 'clamp' })

  // Camera shake léger
  const sh = shake(frame, 0.8, fps)

  const numSize = isVertical ? 360 : 460
  const labelSize = isVertical ? 50 : 58
  const headerSize = isVertical ? 36 : 42

  return (
    <AbsoluteFill
      style={{
        direction: rtl ? 'rtl' : 'ltr',
        fontFamily: theme.font.sans,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        transform: `translate(${sh.x}px, ${sh.y}px)`,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: isVertical ? 140 : 100,
          opacity: headerOpacity,
          fontSize: headerSize,
          fontWeight: 700,
          color: theme.colors.textMuted,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        {t.stats_title}
      </div>

      {/* 3 cartes successives — une seule visible à la fois */}
      {cards.map((c, i) => {
        const slot = SLOTS[i]
        // Entrée : opacity + scale + slide
        const localFrame = frame - slot.start
        const enterOpacity = interpolate(localFrame, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const exitOpacity = interpolate(frame, [slot.end - 14, slot.end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const opacity = enterOpacity * exitOpacity
        if (opacity < 0.01) return null

        const enterScale = spring({ frame: localFrame, fps, config: { damping: 11, stiffness: 90 } })
        const exitScale = interpolate(frame, [slot.end - 14, slot.end], [1, 1.15], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

        const slideY = interpolate(localFrame, [0, 18], [60, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const exitY = interpolate(frame, [slot.end - 14, slot.end], [0, -40], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

        const glow = (Math.sin(localFrame * 0.13) + 1) / 2

        // Count-up : 0 → value pendant 25 frames
        const current = countUp(frame, slot.start + 8, 25, c.value)

        return (
          <div
            key={c.label}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity,
              transform: `scale(${enterScale * exitScale}) translateY(${slideY + exitY}px)`,
            }}
          >
            {/* Background glow par carte */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: c.bgGradient,
                opacity: 0.7 + glow * 0.3,
                filter: 'blur(40px)',
              }}
            />
            <div
              style={{
                fontSize: numSize,
                fontWeight: 900,
                lineHeight: 1,
                color: c.color,
                letterSpacing: -numSize * 0.04,
                filter: `drop-shadow(0 0 ${80 + glow * 60}px ${c.color}cc)`,
                fontVariantNumeric: 'tabular-nums',
                marginBottom: 30,
                position: 'relative',
                zIndex: 2,
              }}
            >
              {fmt(current, c.prefix, c.suffix)}
            </div>
            <div
              style={{
                fontSize: labelSize,
                color: theme.colors.white,
                fontWeight: 600,
                maxWidth: isVertical ? 800 : 900,
                textAlign: 'center',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {c.label}
            </div>
          </div>
        )
      })}

      {/* Progress dots en bas */}
      <div
        style={{
          position: 'absolute',
          bottom: isVertical ? 140 : 80,
          display: 'flex',
          gap: 14,
          opacity: dotOpacity,
        }}
      >
        {SLOTS.map((slot, i) => {
          const active = frame >= slot.start && frame < slot.end
          const passed = frame >= slot.end
          return (
            <div
              key={i}
              style={{
                width: active ? 44 : 14,
                height: 14,
                borderRadius: 999,
                background: active || passed ? cards[i].color : 'rgba(255,255,255,0.18)',
                transition: 'all 0.3s',
                boxShadow: active ? `0 0 16px ${cards[i].color}` : 'none',
              }}
            />
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

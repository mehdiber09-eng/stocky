import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { theme, isRTL, type Lang } from '../theme'
import { translations } from '../translations'
import { impactShake, glitchOffset, shake } from '../components/effects'

interface Props { lang: Lang; format: 'vertical' | 'horizontal' }

/** Scène 3-9s (180 frames) — Choc visuel maximal sur "−30%". */
export const Problem: React.FC<Props> = ({ lang, format }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = translations[lang]
  const rtl = isRTL(lang)

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' })
  const titleY = interpolate(frame, [0, 22], [40, 0], { extrapolateRight: 'clamp' })

  const HIT_FRAME = 28
  const statScale = spring({ frame: frame - HIT_FRAME, fps, config: { damping: 8, stiffness: 90, mass: 0.8 } })
  const statOpacity = interpolate(frame, [HIT_FRAME - 3, HIT_FRAME + 12], [0, 1], { extrapolateRight: 'clamp' })

  const subOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' })
  const subY = interpolate(frame, [80, 100], [20, 0], { extrapolateRight: 'clamp' })

  // Camera shake léger en continu + impact gros au hit
  const idleShake = shake(frame, 1.5, fps)
  const impact = impactShake(frame, HIT_FRAME, 30, 22)
  const cameraX = idleShake.x + impact.x
  const cameraY = idleShake.y + impact.y
  const cameraRot = impact.rot

  // Glitch chromatic sur le -30%
  const g = glitchOffset(frame, HIT_FRAME + 4, 18)

  // Flash blanc sur l'impact
  const flashOpacity = interpolate(
    frame,
    [HIT_FRAME, HIT_FRAME + 3, HIT_FRAME + 8],
    [0, 0.45, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  // Glow pulsing après l'impact
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
        transform: `translate(${cameraX}px, ${cameraY}px) rotate(${cameraRot}deg)`,
      }}
    >
      {/* Flash blanc sur l'impact */}
      <AbsoluteFill style={{ background: 'white', opacity: flashOpacity, mixBlendMode: 'overlay' }} />

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

      {/* Stat avec glitch chromatic — 3 layers RGB superposés */}
      <div
        style={{
          opacity: statOpacity,
          transform: `scale(${statScale})`,
          position: 'relative',
          marginBottom: 20,
        }}
      >
        {/* Slice overlay (déchirure horizontale aléatoire) */}
        {Math.abs(g.slice) > 0.5 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translateX(${g.slice * 6}px)`,
              clipPath: `inset(${30 + g.slice * 20}% 0 ${30 - g.slice * 20}% 0)`,
              fontSize: statSize,
              fontWeight: 900,
              lineHeight: 1,
              color: theme.colors.danger,
              letterSpacing: -statSize * 0.04,
              opacity: 0.7,
            }}
          >
            {t.problem_stat}
          </div>
        )}
        {/* Cyan layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate(${-g.r}px, 0)`,
            fontSize: statSize,
            fontWeight: 900,
            lineHeight: 1,
            color: '#22d3ee',
            letterSpacing: -statSize * 0.04,
            mixBlendMode: 'screen',
            opacity: g.r !== 0 ? 0.8 : 0,
          }}
        >
          {t.problem_stat}
        </div>
        {/* Magenta layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate(${-g.b}px, 0)`,
            fontSize: statSize,
            fontWeight: 900,
            lineHeight: 1,
            color: '#d946ef',
            letterSpacing: -statSize * 0.04,
            mixBlendMode: 'screen',
            opacity: g.b !== 0 ? 0.8 : 0,
          }}
        >
          {t.problem_stat}
        </div>
        {/* Main red layer */}
        <div
          style={{
            position: 'relative',
            fontSize: statSize,
            fontWeight: 900,
            lineHeight: 1,
            color: theme.colors.danger,
            letterSpacing: -statSize * 0.04,
            filter: `drop-shadow(0 0 ${50 + glowPulse * 35}px rgba(248,113,113,${0.5 + glowPulse * 0.3}))`,
          }}
        >
          {t.problem_stat}
        </div>
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

import React from 'react'
import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from 'remotion'
import { theme, isRTL, type Lang } from '../theme'
import { translations } from '../translations'
import { Logo } from '../components/Logo'
import { particles } from '../components/effects'

interface Props { lang: Lang; format: 'vertical' | 'horizontal' }

interface Card {
  text: string
  icon: React.ReactNode
  color: string
  /** position de départ (relative au centre, en %) */
  fromX: number
  fromY: number
}

const ICON_BOXES = (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19.07V12L8.03 9.84a2 2 0 0 0-2.06 0z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 12V7a2 2 0 0 1 .97-1.71l3-1.8a2 2 0 0 1 2.06 0l3 1.8A2 2 0 0 1 22 7v3.24a2 2 0 0 1-.97 1.71L18 13.7"/>
  </svg>
)
const ICON_BRAIN = (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
  </svg>
)
const ICON_ALERT = (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
)
const ICON_GLOBE = (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
  </svg>
)

/** Scène 0-3s — 4 cartons convergent au centre, explosion, logo + tagline. */
export const Hook: React.FC<Props> = ({ lang, format }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = translations[lang]
  const rtl = isRTL(lang)
  const isVertical = format === 'vertical'

  /* PHASE 1 (0-25 frames) : cartes apparaissent depuis les 4 coins */
  /* PHASE 2 (25-35 frames) : cartes convergent au centre + explosion */
  /* PHASE 3 (35-90 frames) : logo + tagline reveal */

  const cards: Card[] = [
    { text: lang === 'ar' ? 'مخزون' : lang === 'en' ? 'Stock' : 'Stock',     icon: ICON_BOXES, color: '#6366f1', fromX: -45, fromY: -30 },
    { text: lang === 'ar' ? 'ذكاء'  : lang === 'en' ? 'AI'    : 'IA',        icon: ICON_BRAIN, color: '#d946ef', fromX:  45, fromY: -30 },
    { text: lang === 'ar' ? 'نفاد'  : lang === 'en' ? 'Stockout' : 'Rupture', icon: ICON_ALERT, color: '#f87171', fromX: -45, fromY:  30 },
    { text: lang === 'ar' ? 'الجزائر' : lang === 'en' ? 'DZ'  : 'DZ',         icon: ICON_GLOBE, color: '#22d3ee', fromX:  45, fromY:  30 },
  ]

  // Phase explosion (frame 30)
  const explosionFrame = 32
  const explosionOpacity = interpolate(frame, [explosionFrame - 1, explosionFrame, explosionFrame + 8], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const sparkles = particles(20, frame, explosionFrame, 30)

  // Logo phase (apparaît à 35)
  const logoScale = spring({ frame: frame - 35, fps, config: { damping: 11, stiffness: 100 } })
  const logoOpacity = interpolate(frame, [35, 45], [0, 1], { extrapolateRight: 'clamp' })

  // Tagline pretitle pill
  const pillOpacity = interpolate(frame, [50, 60], [0, 1], { extrapolateRight: 'clamp' })
  const pillY = interpolate(frame, [50, 65], [20, 0], { extrapolateRight: 'clamp' })

  // Title
  const titleOpacity = interpolate(frame, [60, 70], [0, 1], { extrapolateRight: 'clamp' })
  const titleY = interpolate(frame, [60, 72], [30, 0], { extrapolateRight: 'clamp' })

  // Highlight
  const highlightOpacity = interpolate(frame, [70, 80], [0, 1], { extrapolateRight: 'clamp' })
  const highlightY = interpolate(frame, [70, 82], [30, 0], { extrapolateRight: 'clamp' })

  const titleSize = isVertical ? 130 : 140
  const subSize = isVertical ? 28 : 32

  return (
    <AbsoluteFill
      style={{
        direction: rtl ? 'rtl' : 'ltr',
        fontFamily: theme.font.sans,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      {/* PHASE 1+2 : cartons qui convergent (visibles seulement 0-32) */}
      {cards.map((c, i) => {
        // Apparition décalée (0-12 frames)
        const appearFrame = i * 2
        const appearOpacity = interpolate(frame, [appearFrame, appearFrame + 8], [0, 1], { extrapolateRight: 'clamp' })
        const appearScale = spring({ frame: frame - appearFrame, fps, config: { damping: 12, stiffness: 100 } })

        // Convergence (frame 22-32)
        const convergeT = interpolate(frame, [22, 32], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const x = c.fromX * (1 - convergeT)
        const y = c.fromY * (1 - convergeT)

        // Disparition au moment de l'explosion
        const disappear = interpolate(frame, [31, 34], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

        const cardScale = appearScale * (1 - convergeT * 0.5) // shrink en convergeant
        const rotation = convergeT * 180 * (i % 2 === 0 ? 1 : -1)

        return (
          <div
            key={c.text}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translate(${x}vw, ${y}vh) scale(${cardScale}) rotate(${rotation}deg)`,
              opacity: appearOpacity * disappear,
              padding: '20px 28px',
              borderRadius: 20,
              background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)`,
              boxShadow: `0 24px 60px -12px ${c.color}66, inset 0 1px 0 rgba(255,255,255,0.25)`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: 'white',
              fontWeight: 700,
              fontSize: 38,
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            {c.icon}
            <span>{c.text}</span>
          </div>
        )
      })}

      {/* Explosion flash */}
      <AbsoluteFill style={{ background: 'white', opacity: explosionOpacity * 0.7, mixBlendMode: 'overlay' }} />

      {/* Sparkles particles de l'explosion */}
      {sparkles.map(p => (
        <div
          key={p.key}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 14,
            height: 14,
            marginLeft: -7,
            marginTop: -7,
            borderRadius: '50%',
            background: ['#6366f1','#d946ef','#22d3ee','#fbbf24'][p.key % 4],
            transform: `translate(${p.x}px, ${p.y}px) scale(${p.scale})`,
            opacity: p.opacity,
            filter: 'blur(1px)',
            boxShadow: '0 0 14px currentColor',
            zIndex: 5,
          }}
        />
      ))}

      {/* PHASE 3 : Logo + tagline */}
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
          opacity: pillOpacity,
          transform: `translateY(${pillY}px)`,
          padding: '10px 22px',
          borderRadius: 999,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(217,70,239,0.18))',
          border: '1px solid rgba(99,102,241,0.4)',
          color: theme.colors.text,
          fontSize: subSize * 0.9,
          fontWeight: 600,
          marginBottom: 24,
          letterSpacing: 1,
          zIndex: 2,
        }}
      >
        {t.hook_pretitle}
      </div>

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
          zIndex: 2,
        }}
      >
        {t.hook_a}
      </div>
      <div
        style={{
          opacity: highlightOpacity,
          transform: `translateY(${highlightY}px)`,
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
          zIndex: 2,
        }}
      >
        {t.hook_b}
      </div>
    </AbsoluteFill>
  )
}

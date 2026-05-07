import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from 'remotion'
import { theme, isRTL, type Lang } from '../theme'
import { translations } from '../translations'

interface Props { lang: Lang; format: 'vertical' | 'horizontal' }

/** Scène 9-19s (300 frames) : Mockup dashboard avec alertes qui apparaissent */
export const Solution: React.FC<Props> = ({ lang, format }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = translations[lang]
  const rtl = isRTL(lang)

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' })
  const titleY = interpolate(frame, [0, 22], [-30, 0], { extrapolateRight: 'clamp' })

  const mockupScale = spring({ frame: frame - 18, fps, config: { damping: 14, stiffness: 80 } })
  const mockupOpacity = interpolate(frame, [18, 40], [0, 1], { extrapolateRight: 'clamp' })

  // KPI bars fill
  const kpiProgress = interpolate(frame, [40, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  // Alert appears
  const alertOpacity = interpolate(frame, [110, 135], [0, 1], { extrapolateRight: 'clamp' })
  const alertY = interpolate(frame, [110, 135], [20, 0], { extrapolateRight: 'clamp' })
  const alertPulse = (Math.sin(frame * 0.25) + 1) / 2

  const fadeOut = interpolate(frame, [285, 300], [1, 0], { extrapolateRight: 'clamp' })

  const isVertical = format === 'vertical'
  const mockupWidth = isVertical ? 880 : 1100
  const titleSize = isVertical ? 56 : 64

  const KPIs = [
    { label: t.solution_kpi_risk,  val: '87%', color: theme.colors.danger,  width: 87 },
    { label: t.solution_kpi_days,  val: '4j',  color: theme.colors.warning, width: 26 },
    { label: t.solution_kpi_pred,  val: '91%', color: theme.colors.primary, width: 91 },
  ]

  return (
    <AbsoluteFill
      style={{
        opacity: fadeOut,
        direction: rtl ? 'rtl' : 'ltr',
        fontFamily: theme.font.sans,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
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
          marginBottom: 50,
          maxWidth: mockupWidth,
        }}
      >
        {t.solution_title}
      </div>

      {/* Browser mockup */}
      <div
        style={{
          opacity: mockupOpacity,
          transform: `scale(${mockupScale})`,
          width: mockupWidth,
          background: 'rgba(15,15,22,0.95)',
          borderRadius: 28,
          border: `1px solid ${theme.colors.cardBorder}`,
          boxShadow: '0 50px 140px rgba(0,0,0,0.7), 0 0 80px rgba(99,102,241,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Browser bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 20px',
            borderBottom: `1px solid ${theme.colors.cardBorder}`,
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: 'rgba(248,113,113,0.7)' }} />
            <div style={{ width: 12, height: 12, borderRadius: 999, background: 'rgba(251,191,36,0.7)' }} />
            <div style={{ width: 12, height: 12, borderRadius: 999, background: 'rgba(16,185,129,0.7)' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 18, color: theme.colors.textDim, fontFamily: theme.font.mono }}>
            stocky.app — Dashboard
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {KPIs.map(({ label, val, color, width }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${theme.colors.cardBorder}`,
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <div style={{ fontSize: 16, color: theme.colors.textDim, marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color, marginBottom: 12 }}>{val}</div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${width * kpiProgress}%`,
                      background: color,
                      borderRadius: 999,
                      boxShadow: `0 0 12px ${color}66`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Live alert */}
          <div
            style={{
              opacity: alertOpacity,
              transform: `translateY(${alertY}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '18px 22px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(248,113,113,0.18), rgba(248,113,113,0.06))',
              border: '1px solid rgba(248,113,113,0.4)',
              boxShadow: `0 0 ${30 + alertPulse * 30}px -8px rgba(248,113,113,${0.4 + alertPulse * 0.3})`,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: theme.colors.danger,
                boxShadow: `0 0 ${8 + alertPulse * 12}px ${theme.colors.danger}`,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fecaca' }}>{t.solution_alert_title}</div>
              <div style={{ fontSize: 18, color: '#fca5a5', marginTop: 4 }}>{t.solution_alert_msg}</div>
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(248,113,113,0.25)',
                color: '#fecaca',
              }}
            >
              87%
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

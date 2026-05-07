/** Effets cinématiques : shake, glitch, particles. Pure functions stateless. */
import { interpolate, random } from 'remotion'

/** Camera shake subtil — amplitude en px, fréquence en cycles/seconde. */
export function shake(frame: number, amplitude = 4, fps = 30) {
  const t = frame / fps
  return {
    x: Math.sin(t * 47) * amplitude,
    y: Math.cos(t * 53) * amplitude * 0.7,
  }
}

/** Big shake d'impact — amorti en exponentielle après le hit. */
export function impactShake(frame: number, hitFrame: number, amplitude = 24, decayFrames = 18) {
  if (frame < hitFrame) return { x: 0, y: 0, rot: 0 }
  const t = (frame - hitFrame) / decayFrames
  if (t > 1) return { x: 0, y: 0, rot: 0 }
  const decay = Math.exp(-t * 4)
  const phase = (frame - hitFrame) * 1.8
  return {
    x: Math.sin(phase) * amplitude * decay,
    y: Math.cos(phase * 1.3) * amplitude * decay * 0.8,
    rot: Math.sin(phase * 0.7) * 2 * decay,
  }
}

/** Glitch chromatic aberration — décalage RGB temporaire (en px). */
export function glitchOffset(frame: number, hitFrame: number, durationFrames = 12) {
  const t = (frame - hitFrame) / durationFrames
  if (t < 0 || t > 1) return { r: 0, b: 0, slice: 0 }
  // 3 burst rapides
  const burst = Math.sin(t * Math.PI * 6) * (1 - t)
  return {
    r: burst * 8,
    b: -burst * 8,
    slice: random(`slice-${Math.floor(frame / 2)}`) * burst * 4,
  }
}

/** Génère N particles avec position/scale animées entre 2 frames. */
export function particles(count: number, frame: number, startFrame: number, durationFrames = 90) {
  const t = (frame - startFrame) / durationFrames
  if (t < 0 || t > 1) return []
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + random(`angle-${i}`) * 0.4
    const distance = (200 + random(`dist-${i}`) * 400) * t
    const scale = (1 - t) * (0.6 + random(`scale-${i}`) * 0.6)
    const x = Math.cos(angle) * distance
    const y = Math.sin(angle) * distance
    const opacity = (1 - t) * 0.9
    return { x, y, scale, opacity, key: i }
  })
}

/** Ticker count-up — anime un nombre de 0 à `to` entre 2 frames. */
export function countUp(frame: number, startFrame: number, durationFrames: number, to: number) {
  return Math.round(interpolate(frame, [startFrame, startFrame + durationFrames], [0, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }))
}

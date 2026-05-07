import React from 'react'
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion'
import type { Lang } from './theme'
import { Background } from './components/Background'
import { Hook } from './scenes/Hook'
import { Problem } from './scenes/Problem'
import { Solution } from './scenes/Solution'
import { Stats } from './scenes/Stats'
import { CTA } from './scenes/CTA'

export interface PromoVideoProps {
  lang: Lang
  format: 'vertical' | 'horizontal'
}

/**
 * Active l'audio quand tu as posé les fichiers dans public/.
 * Garde-le à `false` tant que les fichiers ne sont pas là (Remotion crash sinon).
 *
 * Fichiers attendus (4) — voir README.md pour les liens Pixabay :
 *   public/music.mp3       — musique épique uplifting (~30s)
 *   public/whoosh.mp3      — transition (~0.6s, joué 4× aux changements de scène)
 *   public/impact.mp3      — bass impact (~1s, joué sur le "−30%")
 *   public/sparkle.mp3     — chime/magic dust (~1.5s, joué sur le CTA)
 */
const ENABLE_AUDIO = false

/**
 * Vidéo 30s @ 30fps = 900 frames
 *  Hook     :   0 →  90 (3s)
 *  Problem  :  90 → 270 (6s)  — hit du "−30%" autour de la frame 118
 *  Solution : 270 → 570 (10s)
 *  Stats    : 570 → 750 (6s)
 *  CTA      : 750 → 900 (5s)
 */
export const PromoVideo: React.FC<PromoVideoProps> = ({ lang, format }) => {
  return (
    <AbsoluteFill>
      <Background />

      {/* Scènes visuelles */}
      <Sequence from={0}   durationInFrames={90}>  <Hook     lang={lang} format={format} /></Sequence>
      <Sequence from={90}  durationInFrames={180}> <Problem  lang={lang} format={format} /></Sequence>
      <Sequence from={270} durationInFrames={300}> <Solution lang={lang} format={format} /></Sequence>
      <Sequence from={570} durationInFrames={180}> <Stats    lang={lang} format={format} /></Sequence>
      <Sequence from={750} durationInFrames={150}> <CTA      lang={lang} format={format} /></Sequence>

      {/* Audio — actif seulement si ENABLE_AUDIO=true ET les fichiers existent */}
      {ENABLE_AUDIO && (
        <>
          {/* Musique de fond, volume bas pour ne pas masquer les SFX */}
          <Audio src={staticFile('music.mp3')} volume={0.18} />

          {/* Whoosh à chaque transition de scène */}
          <Sequence from={85}  durationInFrames={20}><Audio src={staticFile('whoosh.mp3')} volume={0.55} /></Sequence>
          <Sequence from={265} durationInFrames={20}><Audio src={staticFile('whoosh.mp3')} volume={0.55} /></Sequence>
          <Sequence from={565} durationInFrames={20}><Audio src={staticFile('whoosh.mp3')} volume={0.55} /></Sequence>

          {/* Impact bass au moment où "−30%" apparaît */}
          <Sequence from={116} durationInFrames={45}><Audio src={staticFile('impact.mp3')} volume={0.85} /></Sequence>

          {/* Sparkle/chime au moment du CTA */}
          <Sequence from={745} durationInFrames={60}><Audio src={staticFile('sparkle.mp3')} volume={0.7} /></Sequence>
        </>
      )}
    </AbsoluteFill>
  )
}

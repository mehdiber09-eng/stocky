import React from 'react'
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion'
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import { wipe } from '@remotion/transitions/wipe'
import { flip } from '@remotion/transitions/flip'
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
 * Voir AUDIO.md pour les liens de téléchargement.
 */
const ENABLE_AUDIO = false

/**
 * Vidéo 30s @ 30fps = 900 frames
 * Avec transitions de 12 frames entre chaque scène (overlap).
 *
 *   Hook            : 84 frames  (2.8s)
 *   ↳ flip          : 12 frames  (transition cinéma)
 *   Problem         : 168 frames (5.6s)
 *   ↳ slide-from-right : 12 frames
 *   Solution        : 288 frames (9.6s)
 *   ↳ wipe          : 12 frames
 *   Stats           : 168 frames (5.6s)
 *   ↳ fade          : 12 frames
 *   CTA             : 156 frames (5.2s)
 *
 *   Total = 84+12+168+12+288+12+168+12+156 = 912 frames
 *   On vise 900 frames → on rogne 3f sur Hook et Problem et 6 sur Solution.
 *
 * Final :
 *   Hook            : 81
 *   ↳ flip          : 12
 *   Problem         : 165
 *   ↳ slide         : 12
 *   Solution        : 282
 *   ↳ wipe          : 12
 *   Stats           : 168
 *   ↳ fade          : 12
 *   CTA             : 156
 *   Total = 81+12+165+12+282+12+168+12+156 = 900 ✓
 */
export const PromoVideo: React.FC<PromoVideoProps> = ({ lang, format }) => {
  return (
    <AbsoluteFill>
      <Background />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={81}>
          <Hook lang={lang} format={format} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={flip({ direction: 'from-right' })}
          timing={springTiming({ config: { damping: 200, mass: 0.5 }, durationInFrames: 12 })}
        />

        <TransitionSeries.Sequence durationInFrames={165}>
          <Problem lang={lang} format={format} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        <TransitionSeries.Sequence durationInFrames={282}>
          <Solution lang={lang} format={format} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: 'from-bottom-right' })}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        <TransitionSeries.Sequence durationInFrames={168}>
          <Stats lang={lang} format={format} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        <TransitionSeries.Sequence durationInFrames={156}>
          <CTA lang={lang} format={format} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Audio — activé si fichiers dans public/
       *
       * Layout des transitions (cumulatives) :
       *   Hook    0-80
       *   flip    81-92      ← woosh 1
       *   Problem 93-257
       *   slide   258-269    ← woosh 2
       *   Solution 270-551
       *   wipe    552-563    ← woosh 3
       *   Stats   564-731
       *   fade    732-743    ← woosh 4
       *   CTA     744-899
       *
       * Chaque woosh démarre ~6f avant la transition pour anticiper
       * le mouvement et finit pendant la nouvelle scène.
       */}
      {ENABLE_AUDIO && (
        <>
          <Audio src={staticFile('music.mp3')} volume={0.28} />
          <Sequence from={75}  durationInFrames={22}><Audio src={staticFile('whoosh.mp3')} volume={1.0} /></Sequence>
          <Sequence from={108} durationInFrames={45}><Audio src={staticFile('impact.mp3')} volume={0.85} /></Sequence>
          <Sequence from={252} durationInFrames={22}><Audio src={staticFile('whoosh.mp3')} volume={1.0} /></Sequence>
          <Sequence from={546} durationInFrames={22}><Audio src={staticFile('whoosh.mp3')} volume={1.0} /></Sequence>
          <Sequence from={726} durationInFrames={22}><Audio src={staticFile('whoosh.mp3')} volume={1.0} /></Sequence>
          <Sequence from={744} durationInFrames={60}><Audio src={staticFile('sparkle.mp3')} volume={0.7} /></Sequence>
        </>
      )}
    </AbsoluteFill>
  )
}

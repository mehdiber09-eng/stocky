import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
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
 * Vidéo 30s @ 30fps = 900 frames
 *  Hook     :   0 →  90 (3s)
 *  Problem  :  90 → 270 (6s)
 *  Solution : 270 → 570 (10s)
 *  Stats    : 570 → 750 (6s)
 *  CTA      : 750 → 900 (5s)
 */
export const PromoVideo: React.FC<PromoVideoProps> = ({ lang, format }) => {
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={0}   durationInFrames={90}>  <Hook     lang={lang} format={format} /></Sequence>
      <Sequence from={90}  durationInFrames={180}> <Problem  lang={lang} format={format} /></Sequence>
      <Sequence from={270} durationInFrames={300}> <Solution lang={lang} format={format} /></Sequence>
      <Sequence from={570} durationInFrames={180}> <Stats    lang={lang} format={format} /></Sequence>
      <Sequence from={750} durationInFrames={150}> <CTA      lang={lang} format={format} /></Sequence>
    </AbsoluteFill>
  )
}

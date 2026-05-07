import React from 'react'
import { Composition } from 'remotion'
import { PromoVideo } from './PromoVideo'
import type { Lang } from './theme'

const FPS = 30
const DURATION = 900 // 30s @ 30fps

const LANGS: Lang[] = ['fr', 'ar', 'en']
const FORMATS = [
  { name: 'vertical' as const,   width: 1080, height: 1920 },
  { name: 'horizontal' as const, width: 1920, height: 1080 },
]

export const Root: React.FC = () => {
  return (
    <>
      {FORMATS.map((fmt) =>
        LANGS.map((lang) => {
          const id = `Stocky-${fmt.name}-${lang}`
          return (
            <Composition
              key={id}
              id={id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              component={PromoVideo as any}
              durationInFrames={DURATION}
              fps={FPS}
              width={fmt.width}
              height={fmt.height}
              defaultProps={{ lang, format: fmt.name }}
            />
          )
        }),
      )}
    </>
  )
}

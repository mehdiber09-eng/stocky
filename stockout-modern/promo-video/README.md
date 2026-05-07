# Stocky — Vidéos promo (Remotion)

Génère **6 vidéos publicitaires** en MP4 directement depuis le code, sans After Effects ni montage manuel.

| Format       | Résolution   | Usage                                  |
|--------------|--------------|----------------------------------------|
| Vertical     | 1080 × 1920  | Reels · TikTok · YouTube Shorts        |
| Horizontal   | 1920 × 1080  | Site web · YouTube · LinkedIn          |

× 3 langues : **français · arabe (RTL) · anglais**.

Durée : 30 secondes. Storyboard :

```
0-3s   Hook      → logo + accroche
3-9s   Problem   → −30% clients perdus (chiffre choc)
9-19s  Solution  → mockup dashboard + alerte live
19-25s Stats     → 91% · +22% · −87% (chiffres animés)
25-30s CTA       → "Essaie gratuit" · stocky.app
```

## Installation (une fois)

```bash
cd stockout-modern/promo-video
npm install
```

⚠️ Première install : Remotion télécharge un Chromium (~150 MB), patience.

## Aperçu en direct (recommandé pour itérer)

```bash
npm start
```

Ouvre Remotion Studio dans le navigateur. Tu vois la vidéo en temps réel,
tu peux scrubber la timeline frame par frame, basculer langue/format dans
le panneau de droite ("Props"), et exporter une frame en image.

## Rendre une seule vidéo

```bash
npx remotion render Stocky-vertical-fr   out/stocky-vertical-fr.mp4
npx remotion render Stocky-horizontal-en out/stocky-horizontal-en.mp4
```

ID dispos : `Stocky-{vertical|horizontal}-{fr|ar|en}` → 6 combinaisons.

## Rendre les 6 vidéos d'un coup

```bash
npm run render:all
```

→ 6 fichiers `.mp4` dans `out/`. Compte ~3-5 min total sur un bon laptop.

## Customiser

- **Textes** : `src/translations.ts` — édite/ajoute des langues, change les
  accroches sans toucher au code des scènes.
- **Couleurs** : `src/theme.ts` — alignées avec l'app Stocky (mêmes
  gradients, mêmes typos).
- **Timing** : `src/PromoVideo.tsx` — change les `from={}` et
  `durationInFrames={}` pour rallonger/raccourcir une scène. Pense à
  ajuster la durée totale dans `src/Root.tsx` (`DURATION`).
- **Une scène** : chaque scène est dans `src/scenes/`. Ce sont des
  composants React standards. Tu peux y ajouter un screenshot du vrai
  Stocky avec `<Img src={staticFile('dashboard.png')} />` (place l'image
  dans `public/`).

## Ajouter une voix off

1. Génère ton audio en MP3 (ElevenLabs, ChatGPT TTS, etc.)
2. Pose-le dans `public/voiceover-fr.mp3`
3. Dans `PromoVideo.tsx` :

```tsx
import { Audio, staticFile } from 'remotion'
// ...
<Audio src={staticFile('voiceover-fr.mp3')} />
```

Pour synchroniser, ajuste les timings frame des scènes pour matcher la
voix. Remotion Studio te montre la waveform.

## Ajouter une musique de fond

Pareil mais avec `<Audio src={staticFile('bgm.mp3')} volume={0.2} />`
(volume 0–1, garde bas pour ne pas couvrir la voix off).

## Tips

- **Test une frame** : `npx remotion still Stocky-vertical-fr out/preview.png --frame=300`
  → tu obtiens une image PNG à la frame 300 sans rendre toute la vidéo.
- **Sortie 4K** : passe les Compositions à 2160×3840 dans `Root.tsx`. Le
  texte mis à l'échelle reste net.
- **Logo image** : remplace le SVG inline dans `Logo.tsx` par
  `<Img src={staticFile('logo.svg')} />` si tu veux ton logo officiel.

## Structure

```
promo-video/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── README.md
├── public/                  # assets statiques (audio, images optionnels)
├── scripts/
│   └── render-all.mjs       # rend les 6 vidéos d'un coup
└── src/
    ├── index.ts             # entry Remotion
    ├── Root.tsx             # registre des 6 compositions
    ├── PromoVideo.tsx       # vidéo principale (assemble les scènes)
    ├── theme.ts             # couleurs, fonts, types
    ├── translations.ts      # i18n FR/AR/EN
    ├── components/
    │   ├── Background.tsx   # aurora + grid (commun à toutes scènes)
    │   └── Logo.tsx
    └── scenes/
        ├── Hook.tsx         # 0-3s
        ├── Problem.tsx      # 3-9s
        ├── Solution.tsx     # 9-19s
        ├── Stats.tsx        # 19-25s
        └── CTA.tsx          # 25-30s
```

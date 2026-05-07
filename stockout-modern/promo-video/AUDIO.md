# 🔊 Activer le son de la pub

Les vidéos sont générées sans son par défaut. Pour ajouter musique + SFX :

## 1. Télécharger 4 fichiers audio gratuits

Tous gratuits, sans compte requis, licence Pixabay (utilisation commerciale OK,
attribution non obligatoire mais sympa).

### 🎵 `music.mp3` — musique de fond (épique, ~30 s)

**Recherche Pixabay** : https://pixabay.com/music/search/genre/corporate/?duration=0-30

Pistes recommandées (clique sur le titre, télécharge en MP3) :
- "**Inspiring Cinematic Logo**" — montée tendue, idéale pour pub IA
- "**Future Tech**" — beat moderne, parfait pour SaaS
- "**Epic Logo**" — court et impactant

Si tu veux chercher toi-même, tape sur Pixabay : `corporate inspiring 30 seconds`
ou `cinematic logo tech`.

### 💨 `whoosh.mp3` — transition (~0.6 s)

**Lien direct** : https://pixabay.com/sound-effects/search/whoosh/

Cherche "**fast whoosh**" ou "**transition whoosh**". Choisis-en un court (~600 ms).

### 💥 `impact.mp3` — bass drop sur le "−30%" (~1 s)

**Lien direct** : https://pixabay.com/sound-effects/search/cinematic%20impact/

Cherche "**cinematic impact**" ou "**bass hit**" ou "**impact boom**". Choisis-en
un grave avec sub-bass.

### ✨ `sparkle.mp3` — chime du CTA (~1.5 s)

**Lien direct** : https://pixabay.com/sound-effects/search/magic/

Cherche "**magic chime**" ou "**sparkle**" ou "**success notification**". Choisis
un son ascendant qui finit clean.

## 2. Poser les fichiers

Les 4 fichiers vont dans **`stockout-modern/promo-video/public/`** :

```
public/
├── music.mp3
├── whoosh.mp3
├── impact.mp3
└── sparkle.mp3
```

(Renomme les fichiers téléchargés exactement comme ça.)

## 3. Activer l'audio

Édite `src/PromoVideo.tsx` ligne ~22 :

```tsx
const ENABLE_AUDIO = true   // ← passe à true
```

Sauvegarde. Si Remotion Studio est ouvert, il rechargera tout seul.

## 4. Vérifier le timing

Les 4 SFX sont synchronisés à des frames précises (30 fps) :

| Frame | Temps  | Effet                                   |
|-------|--------|-----------------------------------------|
| 85    | 2.83 s | whoosh — Hook → Problem                 |
| 116   | 3.87 s | impact — apparition du "−30%"           |
| 265   | 8.83 s | whoosh — Problem → Solution             |
| 565   | 18.83 s| whoosh — Solution → Stats               |
| 745   | 24.83 s| sparkle — entrée du CTA                 |

Si un SFX paraît désynchro (ton fichier whoosh est plus long ou plus court
que prévu), modifie `from={X}` dans `src/PromoVideo.tsx`.

## 5. Astuces qualité

- **Volume musique bas** (0.18 = 18% du max) pour ne pas masquer les SFX.
  Si ta musique est faible, monte à 0.25-0.30.
- **Égalisation** : si la musique a trop de basses, l'impact bass se perd.
  Filtre les graves de la musique avec Audacity (gratuit) → effet "Filter Curve EQ".
- **Compression normale** : Pixabay fournit du MP3 256 kbps suffisant. Pas la peine
  de re-encoder.

## 6. Plus tard : voix off

Quand tu voudras ajouter une voix off (ElevenLabs, TTS, ou ta propre voix) :

1. Génère/enregistre un MP3 par langue : `voiceover-fr.mp3`, `voiceover-ar.mp3`,
   `voiceover-en.mp3`. Pose-les dans `public/`.
2. Dans `src/PromoVideo.tsx`, ajoute après la musique :

```tsx
<Audio src={staticFile(`voiceover-${lang}.mp3`)} volume={0.85} />
```

3. Baisse le volume de la musique à 0.10 pour laisser passer la voix.

Script optimisé à dicter (30 s, FR) :
> *"Une rupture de stock c'est jusqu'à trente pour cent de clients perdus.*
> *Avec Stocky, l'IA prédit tes ruptures trente jours à l'avance.*
> *Quatre-vingt-onze pour cent de précision, plus vingt-deux pour cent de chiffre*
> *d'affaires en saison, moins quatre-vingt-sept pour cent de ruptures.*
> *Stocky — gratuit pendant quatorze jours. stocky point app."*

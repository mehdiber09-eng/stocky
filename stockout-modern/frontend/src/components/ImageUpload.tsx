import React, { useRef, useState } from 'react'
import { Camera, X, Upload, Loader2, ImageIcon } from 'lucide-react'

interface Props {
  value: string | null
  onChange: (dataUrl: string | null) => void
  /** Taille max du carré final en pixels (default 600) */
  maxSize?: number
  /** Qualité JPEG (default 0.75) */
  quality?: number
  className?: string
}

/**
 * Upload d'image avec :
 * - Preview live
 * - Compression automatique côté navigateur (canvas resize + JPEG quality)
 * - Limite taille finale visée : ~150-200 KB
 * - Stocké en base64 data URL (prêt à envoyer à l'API)
 */
export default function ImageUpload({
  value,
  onChange,
  maxSize = 600,
  quality = 0.75,
  className = '',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Choisis un fichier image (JPG, PNG, etc.)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image trop lourde (max 10 MB avant compression)')
      return
    }
    setLoading(true)
    try {
      const dataUrl = await compressImage(file, maxSize, quality)
      onChange(dataUrl)
    } catch (e: any) {
      setError(e?.message || 'Erreur de traitement de l\'image')
    } finally {
      setLoading(false)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ''  // permet de re-sélectionner le même fichier après remove
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  function clear() {
    onChange(null)
    setError(null)
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onInputChange}
        className="hidden"
      />

      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Aperçu produit"
            className="w-full aspect-square rounded-xl object-cover border border-white/10"
          />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/70 backdrop-blur text-white hover:bg-red-500/80 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            aria-label="Supprimer l'image"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur text-white text-xs hover:bg-black/90 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Camera size={12} /> Changer
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className="aspect-square rounded-xl border-2 border-dashed border-white/15 hover:border-brand-500/60 hover:bg-brand-500/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-4 text-center"
        >
          {loading ? (
            <>
              <Loader2 size={24} className="text-brand-400 animate-spin" />
              <p className="text-xs text-zinc-400">Compression...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                <ImageIcon size={20} className="text-zinc-500" />
              </div>
              <p className="text-sm text-zinc-300 font-medium">Ajouter une photo</p>
              <p className="text-xs text-zinc-500">Touche pour ouvrir la caméra ou parcourir</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-600">
                <Upload size={10} /> JPG / PNG · Max 10 MB
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  )
}

/**
 * Compresse une image via canvas :
 * - Resize le côté le plus long à `maxSize`
 * - Re-encode en JPEG avec `quality`
 * - Retourne une data URL base64 (~150-200 KB pour 600px / quality 0.75)
 */
function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas non supporté'))
      ctx.drawImage(img, 0, 0, w, h)
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        if (dataUrl.length > 500_000) {
          // Si encore trop gros, retry avec quality plus basse
          const dataUrl2 = canvas.toDataURL('image/jpeg', 0.55)
          resolve(dataUrl2)
        } else {
          resolve(dataUrl)
        }
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image illisible'))
    }
    img.src = url
  })
}

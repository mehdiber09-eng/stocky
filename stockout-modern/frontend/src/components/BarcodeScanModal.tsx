import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  MultiFormatReader, BarcodeFormat, DecodeHintType,
  RGBLuminanceSource, BinaryBitmap, HybridBinarizer,
} from '@zxing/library'
import { Camera, CameraOff, X, Barcode, Loader2, Flashlight, FlashlightOff, FlipHorizontal2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const FORMATS = [
  BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E, BarcodeFormat.ITF, BarcodeFormat.DATA_MATRIX,
]

const EAN_COUNTRIES: { prefix: string; flag: string; name: string }[] = [
  { prefix: '613', flag: '🇩🇿', name: 'Algérie' },
  { prefix: '611', flag: '🇲🇦', name: 'Maroc' },
  { prefix: '619', flag: '🇹🇳', name: 'Tunisie' },
  { prefix: '622', flag: '🇪🇬', name: 'Égypte' },
  { prefix: '624', flag: '🇱🇾', name: 'Libye' },
  { prefix: '628', flag: '🇸🇦', name: 'Arabie Saoudite' },
  { prefix: '629', flag: '🇦🇪', name: 'Émirats' },
  { prefix: '626', flag: '🇮🇷', name: 'Iran' },
  { prefix: '625', flag: '🇯🇴', name: 'Jordanie' },
  { prefix: '627', flag: '🇰🇼', name: 'Koweït' },
  { prefix: '528', flag: '🇱🇧', name: 'Liban' },
  { prefix: '621', flag: '🇸🇾', name: 'Syrie' },
  { prefix: '690', flag: '🇨🇳', name: 'Chine' },
  { prefix: '691', flag: '🇨🇳', name: 'Chine' },
  { prefix: '692', flag: '🇨🇳', name: 'Chine' },
  { prefix: '693', flag: '🇨🇳', name: 'Chine' },
  { prefix: '880', flag: '🇰🇷', name: 'Corée du Sud' },
  { prefix: '890', flag: '🇮🇳', name: 'Inde' },
  { prefix: '868', flag: '🇹🇷', name: 'Turquie' },
  { prefix: '869', flag: '🇹🇷', name: 'Turquie' },
  { prefix: '885', flag: '🇹🇭', name: 'Thaïlande' },
  { prefix: '893', flag: '🇻🇳', name: 'Vietnam' },
  { prefix: '300', flag: '🇫🇷', name: 'France' },
  { prefix: '310', flag: '🇫🇷', name: 'France' },
  { prefix: '320', flag: '🇫🇷', name: 'France' },
  { prefix: '330', flag: '🇫🇷', name: 'France' },
  { prefix: '340', flag: '🇫🇷', name: 'France' },
  { prefix: '350', flag: '🇫🇷', name: 'France' },
  { prefix: '500', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '501', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '400', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '401', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '800', flag: '🇮🇹', name: 'Italie' },
  { prefix: '840', flag: '🇪🇸', name: 'Espagne' },
]

function getEANCountry(code: string) {
  if (code.length < 3) return null
  const p3 = code.slice(0, 3)
  const match = EAN_COUNTRIES.find(c => c.prefix === p3)
  return match ? { flag: match.flag, name: match.name } : null
}

// Short beep
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 1200; osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15)
  } catch { /* no audio */ }
}

let _nativeDetector: any = null
if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
  try {
    _nativeDetector = new (window as any).BarcodeDetector({
      formats: ['qr_code','ean_13','ean_8','code_128','code_39','upc_a','upc_e','itf','data_matrix'],
    })
  } catch { _nativeDetector = null }
}

let _reader: MultiFormatReader | null = null
function getReader(): MultiFormatReader {
  if (!_reader) {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS)
    hints.set(DecodeHintType.TRY_HARDER, true)
    _reader = new MultiFormatReader()
    _reader.setHints(hints)
  }
  return _reader
}

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanModal({ onDetected, onClose }: Props) {
  const { t } = useLanguage()
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [detected, setDetected] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const frameRef = useRef(0)
  const doneRef = useRef(false)

  const stopStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(tr => tr.stop())
    streamRef.current = null
  }, [])

  const startStream = useCallback(async (facing: 'environment' | 'user') => {
    doneRef.current = false
    frameRef.current = 0
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      const track = stream.getVideoTracks()[0]
      const caps = track.getCapabilities?.() as any
      setTorchAvailable(!!caps?.torch)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') setCameraError(t('scan_err_denied'))
      else if (err.name === 'NotFoundError') setCameraError(t('scan_err_no_cam'))
      else setCameraError(t('scan_err_generic'))
    }
  }, [t])

  useEffect(() => {
    startStream(facingMode)
    return () => stopStream()
  }, [facingMode])

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await (track as any).applyConstraints({ advanced: [{ torch: !torchOn }] })
      setTorchOn(prev => !prev)
    } catch { /* not supported */ }
  }, [torchOn])

  const flipCamera = useCallback(() => {
    stopStream()
    setTorchOn(false)
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }, [stopStream])

  // Decode loop
  useEffect(() => {
    let decoding = false

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (doneRef.current || !video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA || !video.videoWidth) {
        if (!doneRef.current) rafRef.current = requestAnimationFrame(tick)
        return
      }
      frameRef.current++
      if (frameRef.current % 2 !== 0) { rafRef.current = requestAnimationFrame(tick); return }
      if (decoding) { rafRef.current = requestAnimationFrame(tick); return }

      const vw = video.videoWidth
      const vh = video.videoHeight

      const tryZXing = () => {
        const tryRegion = (sx: number, sy: number, sw: number, sh: number) => {
          canvas.width = sw; canvas.height = sh
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (!ctx) return null
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)
          const img = ctx.getImageData(0, 0, sw, sh)
          const reader = getReader()
          try {
            reader.reset()
            const src = new RGBLuminanceSource(img.data, sw, sh)
            return reader.decode(new BinaryBitmap(new HybridBinarizer(src)))
          } catch { return null }
        }
        return tryRegion(Math.round(vw * 0.10), Math.round(vh * 0.15), Math.round(vw * 0.80), Math.round(vh * 0.70))
          ?? tryRegion(0, 0, vw, vh)
      }

      const handleCode = (code: string) => {
        doneRef.current = true
        playBeep()
        if (navigator.vibrate) navigator.vibrate([50, 30, 50])
        setDetected(code)
        stopStream()
        setTimeout(() => { onDetected(code); onClose() }, 900)
      }

      if (_nativeDetector) {
        decoding = true
        _nativeDetector.detect(video)
          .then((barcodes: any[]) => {
            decoding = false
            if (doneRef.current) return
            if (barcodes.length > 0 && barcodes[0].rawValue) { handleCode(barcodes[0].rawValue); return }
            const zResult = tryZXing()
            if (zResult) { handleCode(zResult.getText()); return }
            if (!doneRef.current) rafRef.current = requestAnimationFrame(tick)
          })
          .catch(() => {
            decoding = false
            if (doneRef.current) return
            const zResult = tryZXing()
            if (zResult) { handleCode(zResult.getText()); return }
            if (!doneRef.current) rafRef.current = requestAnimationFrame(tick)
          })
        return
      }

      const result = tryZXing()
      if (result) { handleCode(result.getText()); return }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [facingMode])

  const country = detected ? getEANCountry(detected) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-white/12"
        style={{ background: '#0f0f11' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Barcode size={16} className="text-brand-400" />
            <span className="text-sm font-semibold text-white">{t('cp_scan_sku')}</span>
          </div>
          <div className="flex items-center gap-1">
            {torchAvailable && (
              <button
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg transition-colors ${
                  torchOn ? 'text-amber-300 bg-amber-400/10' : 'text-zinc-500 hover:text-white'
                }`}
                title={torchOn ? 'Éteindre lampe' : 'Allumer lampe'}
              >
                {torchOn ? <Flashlight size={15} /> : <FlashlightOff size={15} />}
              </button>
            )}
            <button
              onClick={flipCamera}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition-colors"
              title="Retourner caméra"
            >
              <FlipHorizontal2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Camera — bg-black fix */}
        <div className="relative aspect-video" style={{ background: '#000' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            style={{ background: '#000', display: 'block' }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {!cameraError && !detected && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-black/25" />
              <div className="relative z-10 w-56 h-32">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand-400 rounded-tl-md" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-brand-400 rounded-tr-md" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand-400 rounded-bl-md" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-brand-400 rounded-br-md" />
                <div className="absolute inset-x-1 h-0.5 bg-brand-400/70 rounded-full"
                     style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }} />
              </div>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <span className="bg-black/65 text-[11px] text-zinc-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  {t('scan_point')}
                </span>
              </div>
            </div>
          )}

          {detected && (
            <div className="absolute inset-0 bg-emerald-900/70 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 size={24} className="text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm text-emerald-300 font-mono">{detected}</p>
                {country && (
                  <div className="inline-flex items-center gap-1.5 bg-black/40 rounded-full px-3 py-1">
                    <span className="text-base leading-none">{country.flag}</span>
                    <span className="text-xs text-emerald-200 font-medium">{country.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
              <div className="text-center space-y-2">
                <CameraOff size={28} className="text-zinc-500 mx-auto" />
                <p className="text-xs text-zinc-400">{cameraError}</p>
              </div>
            </div>
          )}
        </div>

        <style>{`@keyframes scanLine{0%{transform:translateY(-30px);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(30px);opacity:0}}`}</style>
      </div>
    </div>
  )
}

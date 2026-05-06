import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  MultiFormatReader, BarcodeFormat, DecodeHintType,
  RGBLuminanceSource, BinaryBitmap, HybridBinarizer,
} from '@zxing/library'
import { Camera, CameraOff, X, Barcode, Loader2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const FORMATS = [
  BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E, BarcodeFormat.ITF, BarcodeFormat.DATA_MATRIX,
]

// EAN-13 country prefix table (GS1)
const EAN_COUNTRIES: { prefix: string; flag: string; name: string }[] = [
  { prefix: '613', flag: '🇩🇿', name: 'Algérie' },
  { prefix: '611', flag: '🇲🇦', name: 'Maroc' },
  { prefix: '619', flag: '🇹🇳', name: 'Tunisie' },
  { prefix: '622', flag: '🇪🇬', name: 'Égypte' },
  { prefix: '624', flag: '🇱🇾', name: 'Libye' },
  { prefix: '628', flag: '🇸🇦', name: 'Arabie Saoudite' },
  { prefix: '629', flag: '🇦🇪', name: 'Émirats Arabes Unis' },
  { prefix: '626', flag: '🇮🇷', name: 'Iran' },
  { prefix: '625', flag: '🇯🇴', name: 'Jordanie' },
  { prefix: '627', flag: '🇰🇼', name: 'Koweït' },
  { prefix: '528', flag: '🇱🇧', name: 'Liban' },
  { prefix: '621', flag: '🇸🇾', name: 'Syrie' },
  { prefix: '300', flag: '🇫🇷', name: 'France' },
  { prefix: '301', flag: '🇫🇷', name: 'France' },
  { prefix: '302', flag: '🇫🇷', name: 'France' },
  { prefix: '303', flag: '🇫🇷', name: 'France' },
  { prefix: '304', flag: '🇫🇷', name: 'France' },
  { prefix: '305', flag: '🇫🇷', name: 'France' },
  { prefix: '306', flag: '🇫🇷', name: 'France' },
  { prefix: '307', flag: '🇫🇷', name: 'France' },
  { prefix: '308', flag: '🇫🇷', name: 'France' },
  { prefix: '309', flag: '🇫🇷', name: 'France' },
  { prefix: '310', flag: '🇫🇷', name: 'France' },
  { prefix: '311', flag: '🇫🇷', name: 'France' },
  { prefix: '312', flag: '🇫🇷', name: 'France' },
  { prefix: '313', flag: '🇫🇷', name: 'France' },
  { prefix: '314', flag: '🇫🇷', name: 'France' },
  { prefix: '315', flag: '🇫🇷', name: 'France' },
  { prefix: '316', flag: '🇫🇷', name: 'France' },
  { prefix: '317', flag: '🇫🇷', name: 'France' },
  { prefix: '318', flag: '🇫🇷', name: 'France' },
  { prefix: '319', flag: '🇫🇷', name: 'France' },
  { prefix: '320', flag: '🇫🇷', name: 'France' },
  { prefix: '321', flag: '🇫🇷', name: 'France' },
  { prefix: '322', flag: '🇫🇷', name: 'France' },
  { prefix: '323', flag: '🇫🇷', name: 'France' },
  { prefix: '324', flag: '🇫🇷', name: 'France' },
  { prefix: '325', flag: '🇫🇷', name: 'France' },
  { prefix: '326', flag: '🇫🇷', name: 'France' },
  { prefix: '327', flag: '🇫🇷', name: 'France' },
  { prefix: '328', flag: '🇫🇷', name: 'France' },
  { prefix: '329', flag: '🇫🇷', name: 'France' },
  { prefix: '330', flag: '🇫🇷', name: 'France' },
  { prefix: '331', flag: '🇫🇷', name: 'France' },
  { prefix: '332', flag: '🇫🇷', name: 'France' },
  { prefix: '333', flag: '🇫🇷', name: 'France' },
  { prefix: '334', flag: '🇫🇷', name: 'France' },
  { prefix: '335', flag: '🇫🇷', name: 'France' },
  { prefix: '336', flag: '🇫🇷', name: 'France' },
  { prefix: '337', flag: '🇫🇷', name: 'France' },
  { prefix: '338', flag: '🇫🇷', name: 'France' },
  { prefix: '339', flag: '🇫🇷', name: 'France' },
  { prefix: '340', flag: '🇫🇷', name: 'France' },
  { prefix: '341', flag: '🇫🇷', name: 'France' },
  { prefix: '342', flag: '🇫🇷', name: 'France' },
  { prefix: '343', flag: '🇫🇷', name: 'France' },
  { prefix: '344', flag: '🇫🇷', name: 'France' },
  { prefix: '345', flag: '🇫🇷', name: 'France' },
  { prefix: '346', flag: '🇫🇷', name: 'France' },
  { prefix: '347', flag: '🇫🇷', name: 'France' },
  { prefix: '348', flag: '🇫🇷', name: 'France' },
  { prefix: '349', flag: '🇫🇷', name: 'France' },
  { prefix: '350', flag: '🇫🇷', name: 'France' },
  { prefix: '351', flag: '🇫🇷', name: 'France' },
  { prefix: '352', flag: '🇫🇷', name: 'France' },
  { prefix: '353', flag: '🇫🇷', name: 'France' },
  { prefix: '354', flag: '🇫🇷', name: 'France' },
  { prefix: '355', flag: '🇫🇷', name: 'France' },
  { prefix: '356', flag: '🇫🇷', name: 'France' },
  { prefix: '357', flag: '🇫🇷', name: 'France' },
  { prefix: '358', flag: '🇫🇷', name: 'France' },
  { prefix: '359', flag: '🇫🇷', name: 'France' },
  { prefix: '360', flag: '🇫🇷', name: 'France' },
  { prefix: '361', flag: '🇫🇷', name: 'France' },
  { prefix: '362', flag: '🇫🇷', name: 'France' },
  { prefix: '363', flag: '🇫🇷', name: 'France' },
  { prefix: '364', flag: '🇫🇷', name: 'France' },
  { prefix: '365', flag: '🇫🇷', name: 'France' },
  { prefix: '366', flag: '🇫🇷', name: 'France' },
  { prefix: '367', flag: '🇫🇷', name: 'France' },
  { prefix: '368', flag: '🇫🇷', name: 'France' },
  { prefix: '369', flag: '🇫🇷', name: 'France' },
  { prefix: '370', flag: '🇫🇷', name: 'France' },
  { prefix: '371', flag: '🇫🇷', name: 'France' },
  { prefix: '372', flag: '🇫🇷', name: 'France' },
  { prefix: '373', flag: '🇫🇷', name: 'France' },
  { prefix: '374', flag: '🇫🇷', name: 'France' },
  { prefix: '375', flag: '🇫🇷', name: 'France' },
  { prefix: '376', flag: '🇫🇷', name: 'France' },
  { prefix: '377', flag: '🇫🇷', name: 'France' },
  { prefix: '378', flag: '🇫🇷', name: 'France' },
  { prefix: '379', flag: '🇫🇷', name: 'France' },
  { prefix: '690', flag: '🇨🇳', name: 'Chine' },
  { prefix: '691', flag: '🇨🇳', name: 'Chine' },
  { prefix: '692', flag: '🇨🇳', name: 'Chine' },
  { prefix: '693', flag: '🇨🇳', name: 'Chine' },
  { prefix: '694', flag: '🇨🇳', name: 'Chine' },
  { prefix: '695', flag: '🇨🇳', name: 'Chine' },
  { prefix: '696', flag: '🇨🇳', name: 'Chine' },
  { prefix: '697', flag: '🇨🇳', name: 'Chine' },
  { prefix: '698', flag: '🇨🇳', name: 'Chine' },
  { prefix: '699', flag: '🇨🇳', name: 'Chine' },
  { prefix: '890', flag: '🇮🇳', name: 'Inde' },
  { prefix: '868', flag: '🇹🇷', name: 'Turquie' },
  { prefix: '869', flag: '🇹🇷', name: 'Turquie' },
  { prefix: '880', flag: '🇰🇷', name: 'Corée du Sud' },
  { prefix: '885', flag: '🇹🇭', name: 'Thaïlande' },
  { prefix: '893', flag: '🇻🇳', name: 'Vietnam' },
  { prefix: '500', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '501', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '502', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '503', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '504', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '505', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '506', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '507', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '508', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '509', flag: '🇬🇧', name: 'Royaume-Uni' },
  { prefix: '400', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '401', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '402', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '403', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '404', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '405', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '406', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '407', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '408', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '409', flag: '🇩🇪', name: 'Allemagne' },
  { prefix: '800', flag: '🇮🇹', name: 'Italie' },
  { prefix: '801', flag: '🇮🇹', name: 'Italie' },
  { prefix: '802', flag: '🇮🇹', name: 'Italie' },
  { prefix: '803', flag: '🇮🇹', name: 'Italie' },
  { prefix: '804', flag: '🇮🇹', name: 'Italie' },
  { prefix: '840', flag: '🇪🇸', name: 'Espagne' },
  { prefix: '841', flag: '🇪🇸', name: 'Espagne' },
  { prefix: '842', flag: '🇪🇸', name: 'Espagne' },
  { prefix: '843', flag: '🇪🇸', name: 'Espagne' },
  { prefix: '844', flag: '🇪🇸', name: 'Espagne' },
]

function getEANCountry(code: string): { flag: string; name: string } | null {
  if (code.length < 3) return null
  const p3 = code.slice(0, 3)
  const match = EAN_COUNTRIES.find(c => c.prefix === p3)
  return match ? { flag: match.flag, name: match.name } : null
}

// Native BarcodeDetector (Chrome/Android) — preferred over ZXing
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

  useEffect(() => {
    let active = true
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
    }).then(stream => {
      if (!active) { stream.getTracks().forEach(tr => tr.stop()); return }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    }).catch(err => {
      if (!active) return
      if (err.name === 'NotAllowedError') setCameraError(t('scan_err_denied'))
      else if (err.name === 'NotFoundError') setCameraError(t('scan_err_no_cam'))
      else setCameraError(t('scan_err_generic'))
    })
    return () => { active = false; stopStream() }
  }, [])

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
        setDetected(code)
        stopStream()
        setTimeout(() => { onDetected(code); onClose() }, 900)
      }

      // Try native BarcodeDetector first, then ZXing as fallback regardless
      if (_nativeDetector) {
        decoding = true
        _nativeDetector.detect(video)
          .then((barcodes: any[]) => {
            decoding = false
            if (doneRef.current) return
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              handleCode(barcodes[0].rawValue)
              return
            }
            // Native found nothing — try ZXing on same frame
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

      // ZXing only (no native support)
      const result = tryZXing()
      if (result) { handleCode(result.getText()); return }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

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
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Camera */}
        <div className="relative bg-black aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
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

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

      // Try native BarcodeDetector first
      if (_nativeDetector) {
        decoding = true
        _nativeDetector.detect(video)
          .then((barcodes: any[]) => {
            decoding = false
            if (barcodes.length > 0 && !doneRef.current) {
              const code = barcodes[0].rawValue
              if (code) {
                doneRef.current = true
                setDetected(code)
                stopStream()
                setTimeout(() => { onDetected(code); onClose() }, 600)
                return
              }
            }
            if (!doneRef.current) rafRef.current = requestAnimationFrame(tick)
          })
          .catch(() => {
            decoding = false
            if (!doneRef.current) rafRef.current = requestAnimationFrame(tick)
          })
        return
      }

      // ZXing fallback
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

      const result = tryRegion(Math.round(vw * 0.10), Math.round(vh * 0.15), Math.round(vw * 0.80), Math.round(vh * 0.70))
        ?? tryRegion(0, 0, vw, vh)

      if (result) {
        const code = result.getText()
        if (code) {
          doneRef.current = true
          setDetected(code)
          stopStream()
          setTimeout(() => { onDetected(code); onClose() }, 600)
          return
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

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
              <div className="text-center space-y-1">
                <Loader2 size={24} className="text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm text-emerald-300 font-mono">{detected}</p>
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

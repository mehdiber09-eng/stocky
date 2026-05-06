import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from '@zxing/library'
import {
  Camera, CameraOff, Search, AlertTriangle, CheckCircle,
  Loader2, Package, Clock, Shield, RotateCcw, Zap, Barcode,
  Flashlight, FlashlightOff, ZoomIn, ZoomOut, FlipHorizontal2, Volume2, VolumeX,
} from 'lucide-react'
import API from '../api/api'
import Toast from '../components/Toast'
import { useLanguage } from '../context/LanguageContext'

const FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.PDF_417,
]

const FORMAT_LABEL: Record<string, string> = {
  QR_CODE: 'QR Code',
  EAN_13: 'EAN-13',
  EAN_8: 'EAN-8',
  CODE_128: 'Code 128',
  CODE_39: 'Code 39',
  UPC_A: 'UPC-A',
  UPC_E: 'UPC-E',
  ITF: 'ITF',
  DATA_MATRIX: 'Data Matrix',
  PDF_417: 'PDF 417',
}

let nativeDetector: any = null
if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
  try {
    nativeDetector = new (window as any).BarcodeDetector({
      formats: ['qr_code','ean_13','ean_8','code_128','code_39','upc_a','upc_e','itf','data_matrix'],
    })
  } catch { nativeDetector = null }
}

let _zxingReader: MultiFormatReader | null = null
function getReader(): MultiFormatReader {
  if (!_zxingReader) {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS)
    hints.set(DecodeHintType.TRY_HARDER, true)
    _zxingReader = new MultiFormatReader()
    _zxingReader.setHints(hints)
  }
  return _zxingReader
}

// Short beep via Web Audio API
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 1200
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  } catch { /* no audio context */ }
}

interface ScanResult {
  product_id: number
  product_name: string
  sku: string
  current_stock: number
  risk_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendation: string
  alert_level: string
  lead_time_days: number
  safety_stock: number
}

const RISK_CONFIG = {
  LOW:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-400',  icon: CheckCircle,    labelKey: 'risk_low' as const },
  MEDIUM:   { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   bar: 'bg-amber-400',    icon: AlertTriangle,  labelKey: 'risk_medium' as const },
  HIGH:     { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  bar: 'bg-orange-400',   icon: AlertTriangle,  labelKey: 'risk_high' as const },
  CRITICAL: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     bar: 'bg-red-400',      icon: AlertTriangle,  labelKey: 'risk_critical' as const },
}

export default function QRScanner() {
  const { t } = useLanguage()
  const [mode, setMode] = useState<'camera' | 'text'>('camera')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null)

  // Camera extras
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [zoomAvailable, setZoomAvailable] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [scanHistory, setScanHistory] = useState<string[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const frameRef = useRef(0)

  const stopCamera = useCallback(() => {
    setScanning(false)
    setCameraActive(false)
    setTorchOn(false)
    setTorchAvailable(false)
    setZoomAvailable(false)
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(tr => tr.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraActive(true)
        setScanning(true)
        frameRef.current = 0

        // Check capabilities
        const track = stream.getVideoTracks()[0]
        const caps = track.getCapabilities?.() as any
        if (caps?.torch) setTorchAvailable(true)
        if (caps?.zoom) {
          setZoomAvailable(true)
          setZoomLevel(1)
        }
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') setCameraError(t('scan_err_denied'))
      else if (err.name === 'NotFoundError') setCameraError(t('scan_err_no_cam'))
      else setCameraError(t('scan_err_generic'))
      setMode('text')
    }
  }, [facingMode, t])

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await (track as any).applyConstraints({ advanced: [{ torch: !torchOn }] })
      setTorchOn(prev => !prev)
    } catch { /* torch not supported on this device */ }
  }, [torchOn])

  const applyZoom = useCallback(async (zoom: number) => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await (track as any).applyConstraints({ advanced: [{ zoom }] })
      setZoomLevel(zoom)
    } catch { /* zoom not supported */ }
  }, [])

  const flipCamera = useCallback(async () => {
    stopCamera()
    const newFacing = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newFacing)
    setTimeout(() => startCamera(newFacing), 150)
  }, [facingMode, stopCamera, startCamera])

  // Decode loop
  useEffect(() => {
    if (!scanning || !cameraActive) return
    let decoding = false

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA || !video.videoWidth || !video.videoHeight) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      frameRef.current++
      if (frameRef.current % 2 !== 0) { rafRef.current = requestAnimationFrame(tick); return }
      if (decoding) { rafRef.current = requestAnimationFrame(tick); return }

      const vw = video.videoWidth
      const vh = video.videoHeight

      if (nativeDetector) {
        decoding = true
        nativeDetector.detect(video)
          .then((barcodes: any[]) => {
            decoding = false
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue
              if (code && code !== lastScanned) {
                const fmt = (barcodes[0].format as string).replace(/_/g, '-').toUpperCase()
                setDetectedFormat(FORMAT_LABEL[fmt.replace(/-/g, '_')] ?? fmt)
                setLastScanned(code)
                handleAnalyze(code)
                return
              }
            }
            rafRef.current = requestAnimationFrame(tick)
          })
          .catch(() => { decoding = false; rafRef.current = requestAnimationFrame(tick) })
        return
      }

      const tryRegion = (sx: number, sy: number, sw: number, sh: number) => {
        canvas.width = sw; canvas.height = sh
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return null
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)
        const imgData = ctx.getImageData(0, 0, sw, sh)
        const reader = getReader()
        try {
          reader.reset()
          const src = new RGBLuminanceSource(imgData.data, sw, sh)
          return reader.decode(new BinaryBitmap(new HybridBinarizer(src)))
        } catch { return null }
      }

      let decoded = tryRegion(Math.round(vw * 0.10), Math.round(vh * 0.15), Math.round(vw * 0.80), Math.round(vh * 0.70))
      if (!decoded) decoded = tryRegion(0, 0, vw, vh)

      if (decoded) {
        const text = decoded.getText()
        if (text && text !== lastScanned) {
          const fmt = BarcodeFormat[decoded.getBarcodeFormat()] ?? 'UNKNOWN'
          setDetectedFormat(FORMAT_LABEL[fmt] ?? fmt)
          setLastScanned(text)
          handleAnalyze(text)
          return
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [scanning, cameraActive, lastScanned])

  useEffect(() => {
    if (mode === 'camera') startCamera()
    return () => stopCamera()
  }, [mode])

  async function handleAnalyze(data: string) {
    if (soundEnabled) playBeep()
    if (navigator.vibrate) navigator.vibrate([50, 30, 50])
    setScanning(false)
    setLoading(true)
    setResult(null)
    try {
      const res = await API.post<ScanResult>('/scan_qr/', { qr_data: data.trim() })
      setResult(res.data)
      setScanHistory(prev => [data, ...prev.filter(h => h !== data)].slice(0, 5))
      stopCamera()
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || t('scan_not_found'), type: 'error' })
      setTimeout(() => { setLastScanned(null); setScanning(true) }, 2000)
    } finally {
      setLoading(false)
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualInput.trim()) return
    await handleAnalyze(manualInput.trim())
  }

  function reset() {
    setResult(null)
    setLastScanned(null)
    setDetectedFormat(null)
    setManualInput('')
    if (mode === 'camera') setScanning(true)
  }

  const cfg = result ? RISK_CONFIG[result.risk_level] : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
             style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
          <Barcode size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('scan_title')}</h1>
          <p className="text-sm text-zinc-400">{t('scan_subtitle')}</p>
        </div>
      </div>

      {/* Supported formats */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {['QR Code', 'EAN-13', 'EAN-8', 'Code 128', 'Code 39', 'UPC', 'ITF'].map(f => (
          <span key={f} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
            {f}
          </span>
        ))}
      </div>

      {/* Mode switcher */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
          <button
            onClick={() => { setMode('camera'); setResult(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'camera' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Camera size={15} /> {t('scan_camera_mode')}
          </button>
          <button
            onClick={() => { setMode('text'); stopCamera(); setResult(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'text' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Search size={15} /> {t('scan_manual_mode')}
          </button>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(s => !s)}
          className="p-2 rounded-lg bg-white/5 border border-white/8 text-zinc-500 hover:text-white transition-colors"
          title={soundEnabled ? 'Désactiver son' : 'Activer son'}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </div>

      {/* Camera view */}
      {mode === 'camera' && (
        <div className="rounded-2xl overflow-hidden border border-white/10 relative aspect-video"
             style={{ background: '#000' }}>
          {/* BLACK background fix — video element has grey default in some browsers */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            style={{ background: '#000', display: 'block' }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scan overlay */}
          {cameraActive && scanning && !loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative z-10 w-64 h-40">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
                <div className="absolute inset-x-2 h-0.5 bg-brand-400/80 rounded-full"
                     style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }} />
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <span className="bg-black/70 backdrop-blur text-xs text-zinc-300 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  {t('scan_point')}
                </span>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 size={32} className="text-brand-400 animate-spin mx-auto" />
                <p className="text-sm text-zinc-300">{t('scan_loading')}</p>
                {detectedFormat && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-brand-300 bg-brand-500/20 px-3 py-1 rounded-full">
                    <Barcode size={11} /> {detectedFormat} {t('scan_detected')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Camera error */}
          {cameraError && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <CameraOff size={32} className="text-zinc-500 mx-auto" />
                <p className="text-sm text-zinc-400">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Camera controls toolbar */}
          {cameraActive && (
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button
                onClick={stopCamera}
                className="p-2 rounded-lg bg-black/60 backdrop-blur text-zinc-400 hover:text-white transition-colors"
                title="Arrêter la caméra"
              >
                <CameraOff size={16} />
              </button>
              {torchAvailable && (
                <button
                  onClick={toggleTorch}
                  className={`p-2 rounded-lg backdrop-blur transition-colors ${
                    torchOn ? 'bg-amber-400/20 text-amber-300' : 'bg-black/60 text-zinc-400 hover:text-white'
                  }`}
                  title={torchOn ? 'Éteindre la lampe' : 'Allumer la lampe'}
                >
                  {torchOn ? <Flashlight size={16} /> : <FlashlightOff size={16} />}
                </button>
              )}
              <button
                onClick={flipCamera}
                className="p-2 rounded-lg bg-black/60 backdrop-blur text-zinc-400 hover:text-white transition-colors"
                title="Retourner la caméra"
              >
                <FlipHorizontal2 size={16} />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          {cameraActive && zoomAvailable && (
            <div className="absolute bottom-3 right-3 flex flex-col gap-1">
              <button
                onClick={() => applyZoom(Math.min(zoomLevel + 0.5, 4))}
                className="p-1.5 rounded-lg bg-black/60 backdrop-blur text-zinc-400 hover:text-white transition-colors"
              >
                <ZoomIn size={14} />
              </button>
              <span className="text-[10px] text-center text-zinc-500 bg-black/60 rounded px-1">
                {zoomLevel.toFixed(1)}x
              </span>
              <button
                onClick={() => applyZoom(Math.max(zoomLevel - 0.5, 1))}
                className="p-1.5 rounded-lg bg-black/60 backdrop-blur text-zinc-400 hover:text-white transition-colors"
              >
                <ZoomOut size={14} />
              </button>
            </div>
          )}

          {/* Start button when camera stopped */}
          {!cameraActive && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => startCamera()}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}
              >
                <Camera size={16} /> {t('scan_camera_start')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual input */}
      {mode === 'text' && (
        <div className="glass-subtle rounded-2xl p-6 border border-white/8 space-y-4">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-zinc-300">
              {t('scan_manual_label')}
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="Ex: SKU-001, 3760168930191, 42"
                  autoFocus
                  className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-zinc-500 focus:outline-none focus:border-brand-500/60 transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !manualInput.trim()}
                className="px-5 py-3 rounded-xl font-medium text-sm text-white flex items-center gap-2 transition-all disabled:opacity-40 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                {loading ? '...' : t('scan_analyze')}
              </button>
            </div>
          </form>

          {/* Quick history */}
          {scanHistory.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-zinc-600 uppercase tracking-wide font-medium">Récents</p>
              <div className="flex flex-wrap gap-1.5">
                {scanHistory.map(h => (
                  <button
                    key={h}
                    onClick={() => setManualInput(h)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-zinc-400 hover:text-white hover:border-white/20 transition-all font-mono"
                  >
                    {h.length > 20 ? h.slice(0, 20) + '…' : h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && cfg && (
        <div className={`rounded-2xl p-6 border ${cfg.border} ${cfg.bg} space-y-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
                <Package size={18} className="text-zinc-300" />
              </div>
              <div>
                <p className="font-bold text-white text-lg leading-tight">{result.product_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-zinc-500 font-mono">SKU: {result.sku}</p>
                  {detectedFormat && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/8 text-zinc-400 font-medium">
                      {detectedFormat}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${cfg.border} ${cfg.color}`}>
              {t(cfg.labelKey)}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>{t('scan_risk_label')}</span>
              <span className={`font-bold ${cfg.color}`}>{Math.round(result.risk_score * 100)}%</span>
            </div>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                   style={{ width: `${result.risk_score * 100}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{result.current_stock}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{t('scan_stock_label')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{result.safety_stock}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{t('scan_safety_label')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-zinc-400" />
                <p className="text-xl font-bold text-white">{result.lead_time_days}j</p>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{t('scan_delay_label')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
            <Shield size={15} className={`${cfg.color} mt-0.5 shrink-0`} />
            <p className="text-sm text-zinc-300 leading-relaxed">{result.recommendation}</p>
          </div>

          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            {mode === 'camera' ? t('scan_new_scan') : t('scan_new_search')}
          </button>
        </div>
      )}

      {!result && !loading && mode === 'text' && scanHistory.length === 0 && (
        <div className="text-center py-8 text-zinc-600 text-sm">
          <Barcode size={36} className="mx-auto opacity-20 mb-3" />
          <p>{t('scan_no_code')}</p>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(-40px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(40px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

import React, { useState, useRef, useEffect, useCallback } from 'react'
import jsQR from 'jsqr'
import { QrCode, Camera, CameraOff, Search, AlertTriangle, CheckCircle, Loader2, Package, Clock, Shield, RotateCcw, Zap } from 'lucide-react'
import API from '../api/api'
import Toast from '../components/Toast'

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
  LOW:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-400',  icon: CheckCircle,    label: 'Faible' },
  MEDIUM:   { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   bar: 'bg-amber-400',    icon: AlertTriangle,  label: 'Modéré' },
  HIGH:     { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  bar: 'bg-orange-400',   icon: AlertTriangle,  label: 'Élevé' },
  CRITICAL: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     bar: 'bg-red-400',      icon: AlertTriangle,  label: 'Critique' },
}

export default function QRScanner() {
  const [mode, setMode] = useState<'camera' | 'text'>('camera')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraActive(true)
        setScanning(true)
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError("Permission caméra refusée. Autorisez l'accès dans les paramètres du navigateur.")
      } else if (err.name === 'NotFoundError') {
        setCameraError('Aucune caméra détectée sur cet appareil.')
      } else {
        setCameraError("Impossible d'accéder à la caméra. Essayez le mode manuel.")
      }
      setMode('text')
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    setScanning(false)
    setCameraActive(false)
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  // QR decode loop
  useEffect(() => {
    if (!scanning || !cameraActive) return

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })
      if (code && code.data && code.data !== lastScanned) {
        setLastScanned(code.data)
        handleAnalyze(code.data)
        return // stop scanning after a hit
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [scanning, cameraActive, lastScanned])

  // Start camera on mount if mode is camera
  useEffect(() => {
    if (mode === 'camera') startCamera()
    return () => stopCamera()
  }, [mode])

  async function handleAnalyze(qrData: string) {
    setScanning(false)
    setLoading(true)
    setResult(null)
    try {
      const res = await API.post<ScanResult>('/scan_qr/', { qr_data: qrData.trim() })
      setResult(res.data)
      stopCamera()
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || 'Produit introuvable pour ce QR code', type: 'error' })
      // Resume scanning after error
      setTimeout(() => {
        setLastScanned(null)
        setScanning(true)
      }, 2000)
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
    setManualInput('')
    if (mode === 'camera') {
      setScanning(true)
    }
  }

  const cfg = result ? RISK_CONFIG[result.risk_level] : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
             style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
          <QrCode size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Scan QR Code</h1>
          <p className="text-sm text-zinc-400">Analyse IA instantanée de votre produit</p>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
        <button
          onClick={() => { setMode('camera'); setResult(null) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'camera' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Camera size={15} /> Caméra
        </button>
        <button
          onClick={() => { setMode('text'); stopCamera(); setResult(null) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'text' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Search size={15} /> Manuel
        </button>
      </div>

      {/* Camera view */}
      {mode === 'camera' && (
        <div className="rounded-2xl overflow-hidden border border-white/10 relative bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {/* Hidden canvas for jsQR */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay when scanning */}
          {cameraActive && scanning && !loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-48 h-48">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
                {/* Scan line */}
                <div className="absolute inset-x-2 h-0.5 bg-brand-400/70 rounded-full"
                     style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }} />
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <span className="bg-black/60 backdrop-blur text-xs text-zinc-300 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  Pointez la caméra vers un QR code
                </span>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 size={32} className="text-brand-400 animate-spin mx-auto" />
                <p className="text-sm text-zinc-300">Analyse IA en cours...</p>
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

          {/* Camera controls */}
          {cameraActive && (
            <div className="absolute top-3 right-3">
              <button
                onClick={stopCamera}
                className="p-2 rounded-lg bg-black/50 text-zinc-400 hover:text-white transition-colors"
                title="Arrêter la caméra"
              >
                <CameraOff size={16} />
              </button>
            </div>
          )}
          {!cameraActive && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}
              >
                <Camera size={16} /> Démarrer la caméra
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual input */}
      {mode === 'text' && (
        <div className="glass-subtle rounded-2xl p-6 border border-white/8">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-zinc-300">SKU ou ID produit</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="Ex: SKU-001 ou 42"
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
                {loading ? '...' : 'Analyser'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Result card */}
      {result && cfg && (
        <div className={`rounded-2xl p-6 border ${cfg.border} ${cfg.bg} space-y-5`}>
          {/* Product header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
                <Package size={18} className="text-zinc-300" />
              </div>
              <div>
                <p className="font-bold text-white text-lg leading-tight">{result.product_name}</p>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">SKU: {result.sku}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${cfg.border} ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>

          {/* Risk bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Risque de rupture (30j)</span>
              <span className={`font-bold ${cfg.color}`}>{Math.round(result.risk_score * 100)}%</span>
            </div>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                   style={{ width: `${result.risk_score * 100}%` }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{result.current_stock}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Stock</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{result.safety_stock}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Sécu.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-zinc-400" />
                <p className="text-xl font-bold text-white">{result.lead_time_days}j</p>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">Délai</p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
            <Shield size={15} className={`${cfg.color} mt-0.5 shrink-0`} />
            <p className="text-sm text-zinc-300 leading-relaxed">{result.recommendation}</p>
          </div>

          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            {mode === 'camera' ? 'Scanner un autre produit' : 'Nouvelle recherche'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && mode === 'text' && (
        <div className="text-center py-8 text-zinc-600 text-sm">
          <QrCode size={36} className="mx-auto opacity-20 mb-3" />
          <p>Entrez un SKU ou un ID pour obtenir une analyse IA instantanée</p>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(-60px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

import React, { useState, useRef } from 'react'
import { QrCode, Search, AlertTriangle, CheckCircle, Zap, Package, Clock, Shield, Loader2 } from 'lucide-react'
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
  LOW: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: CheckCircle,
    label: 'Faible',
    bar: 'bg-emerald-400',
  },
  MEDIUM: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: AlertTriangle,
    label: 'Modéré',
    bar: 'bg-amber-400',
  },
  HIGH: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: AlertTriangle,
    label: 'Élevé',
    bar: 'bg-orange-400',
  },
  CRITICAL: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: AlertTriangle,
    label: 'Critique',
    bar: 'bg-red-400',
  },
}

export default function QRScanner() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await API.post<ScanResult>('/scan_qr/', { qr_data: input.trim() })
      setResult(res.data)
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || 'Produit introuvable', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResult(null)
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const cfg = result ? RISK_CONFIG[result.risk_level] : null
  const RiskIcon = cfg?.icon

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
          <QrCode size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Scan QR Code</h1>
          <p className="text-sm text-zinc-400">Analyse IA instantanée de votre produit</p>
        </div>
      </div>

      {/* Input form */}
      <div className="glass-subtle rounded-2xl p-6 border border-white/8">
        <form onSubmit={handleScan} className="space-y-4">
          <label className="block text-sm font-medium text-zinc-300">
            QR Code / SKU / ID Produit
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Scannez ou saisissez un SKU / ID..."
                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500
                           focus:outline-none focus:border-brand-500/60 focus:bg-white/8 transition-all text-sm"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-xl font-medium text-sm text-white transition-all disabled:opacity-40
                         flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {loading ? 'Analyse...' : 'Analyser'}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Compatible avec les QR codes générés depuis vos produits (SKU ou ID numérique).
          </p>
        </form>
      </div>

      {/* Result card */}
      {result && cfg && RiskIcon && (
        <div className={`rounded-2xl p-6 border ${cfg.border} ${cfg.bg} space-y-5`}>
          {/* Product header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center">
                <Package size={18} className="text-zinc-300" />
              </div>
              <div>
                <p className="font-semibold text-white text-lg leading-tight">{result.product_name}</p>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">SKU: {result.sku}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
              {cfg.label}
            </span>
          </div>

          {/* Risk bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Risque de rupture</span>
              <span className={`font-bold ${cfg.color}`}>{Math.round(result.risk_score * 100)}%</span>
            </div>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                style={{ width: `${result.risk_score * 100}%` }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{result.current_stock}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Stock actuel</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white">{result.safety_stock}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Stock sécu.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-zinc-400" />
                <p className="text-xl font-bold text-white">{result.lead_time_days}j</p>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">Délai fourn.</p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
            <Shield size={16} className={`${cfg.color} mt-0.5 shrink-0`} />
            <p className="text-sm text-zinc-300 leading-relaxed">{result.recommendation}</p>
          </div>

          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
          >
            Nouveau scan
          </button>
        </div>
      )}

      {/* Tip */}
      {!result && !loading && (
        <div className="text-center py-8 text-zinc-600 text-sm space-y-2">
          <QrCode size={40} className="mx-auto opacity-20 mb-3" />
          <p>Scannez un QR code ou entrez un SKU pour obtenir une analyse IA instantanée</p>
          <p className="text-xs">Exemple: <span className="font-mono text-zinc-500">SKU-001</span> ou <span className="font-mono text-zinc-500">42</span></p>
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { FlaskConical, TrendingUp, Truck, Calendar, ArrowRight, Loader2, AlertTriangle, CheckCircle, BarChart3, Info } from 'lucide-react'
import { ProductsAPI, Product } from '../api/api'
import API from '../api/api'
import Toast from '../components/Toast'

interface SimResult {
  product_name: string
  sku: string
  current_stock: number
  base_risk: number
  simulated_risk: number
  risk_delta: number
  new_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendation: string
  business_impact: string
  stock_impact_days: number
  avg_daily_demand: number
  scenario_label: string
}

const EVENTS = [
  { value: 'none', label: 'Aucun événement', emoji: '📊' },
  { value: 'ramadan', label: 'Ramadan', emoji: '🌙' },
  { value: 'weather', label: 'Météo extrême', emoji: '🌩️' },
  { value: 'sales_promo', label: 'Promo / Soldes', emoji: '🛍️' },
  { value: 'holiday', label: 'Jours fériés', emoji: '🎉' },
]

const RISK_COLOR = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-orange-400',
  CRITICAL: 'text-red-400',
}
const RISK_BG = {
  LOW: 'bg-emerald-500/10 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/10 border-amber-500/30',
  HIGH: 'bg-orange-500/10 border-orange-500/30',
  CRITICAL: 'bg-red-500/10 border-red-500/30',
}

export default function Simulate() {
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState<number | ''>('')
  const [horizon, setHorizon] = useState(30)
  const [demandPct, setDemandPct] = useState(0)
  const [supplierDelay, setSupplierDelay] = useState(0)
  const [event, setEvent] = useState('none')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimResult | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    ProductsAPI.list().then(r => {
      setProducts(r.data)
      if (r.data.length > 0) setProductId(r.data[0].id)
    }).catch(() => {})
  }, [])

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) return
    setLoading(true)
    setResult(null)
    try {
      const res = await API.post<SimResult>('/simulate/', {
        product_id: productId,
        horizon,
        demand_increase_pct: demandPct,
        supplier_delay_days: supplierDelay,
        event,
      })
      setResult(res.data)
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || 'Erreur simulation', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function riskBar(score: number, color: string) {
    return (
      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score * 100}%` }} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
          <FlaskConical size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Simulation de Scénarios</h1>
          <p className="text-sm text-zinc-400">Anticipez l'impact de la demande, des délais et des événements</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSimulate} className="glass-subtle rounded-2xl p-6 border border-white/8 space-y-6">
        {/* Product */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Produit</label>
          <select
            value={productId}
            onChange={e => setProductId(Number(e.target.value))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm
                       focus:outline-none focus:border-brand-500/60 transition-all"
          >
            {products.length === 0 && <option value="">Aucun produit</option>}
            {products.map(p => (
              <option key={p.id} value={p.id} className="bg-zinc-900">{p.name} ({p.sku})</option>
            ))}
          </select>
        </div>

        {/* Grid params */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Horizon */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
              <Calendar size={14} className="text-zinc-500" /> Horizon (jours)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={7} max={90} value={horizon}
                onChange={e => setHorizon(Number(e.target.value))}
                className="flex-1 accent-brand-500"
              />
              <span className="text-sm font-bold text-white w-12 text-right">{horizon}j</span>
            </div>
          </div>

          {/* Supplier delay */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
              <Truck size={14} className="text-zinc-500" /> Retard fournisseur
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={30} value={supplierDelay}
                onChange={e => setSupplierDelay(Number(e.target.value))}
                className="flex-1 accent-orange-500"
              />
              <span className="text-sm font-bold text-white w-12 text-right">+{supplierDelay}j</span>
            </div>
          </div>

          {/* Demand increase */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-zinc-500" /> Variation demande
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={-30} max={200} value={demandPct}
                onChange={e => setDemandPct(Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className={`text-sm font-bold w-14 text-right ${demandPct > 0 ? 'text-orange-400' : demandPct < 0 ? 'text-emerald-400' : 'text-white'}`}>
                {demandPct > 0 ? '+' : ''}{demandPct}%
              </span>
            </div>
          </div>

          {/* Event */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
              <Calendar size={14} className="text-zinc-500" /> Événement externe
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {EVENTS.map(ev => (
                <button
                  key={ev.value}
                  type="button"
                  onClick={() => setEvent(ev.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all border
                    ${event === ev.value
                      ? 'bg-brand-500/20 border-brand-500/50 text-white'
                      : 'bg-white/3 border-white/8 text-zinc-400 hover:text-white hover:border-white/20'}`}
                >
                  <span>{ev.emoji}</span> {ev.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !productId}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2
                     transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <FlaskConical size={16} />}
          {loading ? 'Simulation en cours...' : 'Lancer la simulation'}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl p-6 border space-y-5 ${RISK_BG[result.new_risk_level]}`}>
          {/* Scenario label */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              📊 {result.scenario_label}
            </span>
            <span className={`text-sm font-bold ${RISK_COLOR[result.new_risk_level]}`}>
              {result.new_risk_level}
            </span>
          </div>

          <div>
            <p className="font-semibold text-white text-lg">{result.product_name}</p>
            <p className="text-xs text-zinc-500 font-mono">SKU: {result.sku} · Stock: {result.current_stock} · Vélocité: {result.avg_daily_demand}/j</p>
          </div>

          {/* Risk comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <p className="text-xs text-zinc-400">Risque de base</p>
              <p className="text-2xl font-bold text-white">{Math.round(result.base_risk * 100)}%</p>
              {riskBar(result.base_risk, 'bg-zinc-500')}
            </div>
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <p className="text-xs text-zinc-400">Risque simulé</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${RISK_COLOR[result.new_risk_level]}`}>
                  {Math.round(result.simulated_risk * 100)}%
                </p>
                {result.risk_delta > 0.05 && (
                  <span className="text-xs text-red-400 font-medium">
                    +{Math.round(result.risk_delta * 100)}pp
                  </span>
                )}
              </div>
              {riskBar(result.simulated_risk, result.new_risk_level === 'LOW' ? 'bg-emerald-400' : result.new_risk_level === 'MEDIUM' ? 'bg-amber-400' : result.new_risk_level === 'HIGH' ? 'bg-orange-400' : 'bg-red-400')}
            </div>
          </div>

          {/* Stock days */}
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
            <BarChart3 size={18} className="text-zinc-400 shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">
                {result.stock_impact_days >= 999 ? 'Stock suffisant' : `Stock pour ${result.stock_impact_days} jours`}
              </p>
              <p className="text-xs text-zinc-500">dans ce scénario</p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
            <Info size={16} className={`${RISK_COLOR[result.new_risk_level]} mt-0.5 shrink-0`} />
            <p className="text-sm text-zinc-300">{result.recommendation}</p>
          </div>

          {/* Business impact */}
          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
            <TrendingUp size={16} className="text-purple-400 mt-0.5 shrink-0" />
            <p className="text-sm text-zinc-300">{result.business_impact}</p>
          </div>
        </div>
      )}
    </div>
  )
}

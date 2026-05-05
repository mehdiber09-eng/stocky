import React, { useEffect, useState } from 'react'
import {
  FlaskConical, TrendingUp, Truck, Calendar, Loader2,
  AlertTriangle, BarChart3, Info, Package, ArrowUpRight,
} from 'lucide-react'
import { ProductsAPI, Product } from '../api/api'
import API from '../api/api'
import Toast from '../components/Toast'
import { useLanguage } from '../context/LanguageContext'

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

type EventKey = 'sim_event_none' | 'sim_event_ramadan' | 'sim_event_weather' | 'sim_event_promo' | 'sim_event_holiday'

const EVENTS: { value: string; labelKey: EventKey; emoji: string }[] = [
  { value: 'none',       labelKey: 'sim_event_none',    emoji: '📊' },
  { value: 'ramadan',    labelKey: 'sim_event_ramadan', emoji: '🌙' },
  { value: 'weather',    labelKey: 'sim_event_weather', emoji: '🌩️' },
  { value: 'sales_promo',labelKey: 'sim_event_promo',   emoji: '🛍️' },
  { value: 'holiday',    labelKey: 'sim_event_holiday', emoji: '🎉' },
]

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
type RiskLabelKey = 'risk_low' | 'risk_medium' | 'risk_high' | 'risk_critical'

const RISK_CONFIG: Record<RiskLevel, {
  color: string; border: string; bg: string; bar: string; labelKey: RiskLabelKey
}> = {
  LOW:      { color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/8',  bar: 'bg-emerald-400',  labelKey: 'risk_low' },
  MEDIUM:   { color: 'text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/8',    bar: 'bg-amber-400',    labelKey: 'risk_medium' },
  HIGH:     { color: 'text-orange-400',  border: 'border-orange-500/30',  bg: 'bg-orange-500/8',   bar: 'bg-orange-400',   labelKey: 'risk_high' },
  CRITICAL: { color: 'text-red-400',     border: 'border-red-500/30',     bg: 'bg-red-500/8',      bar: 'bg-red-400',      labelKey: 'risk_critical' },
}

function RiskBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-2 bg-white/8 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`}
           style={{ width: `${Math.round(score * 100)}%` }} />
    </div>
  )
}

export default function Simulate() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productId, setProductId] = useState<number | ''>('')
  const [horizon, setHorizon] = useState(30)
  const [demandPct, setDemandPct] = useState(0)
  const [supplierDelay, setSupplierDelay] = useState(0)
  const [event, setEvent] = useState('none')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimResult | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setLoadingProducts(true)
    ProductsAPI.list()
      .then(r => {
        setProducts(r.data)
        if (r.data.length > 0) setProductId(r.data[0].id)
      })
      .catch(() => setToast({ msg: t('sim_error_load'), type: 'error' }))
      .finally(() => setLoadingProducts(false))
  }, [])

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) return
    setLoading(true)
    setResult(null)
    try {
      const res = await API.post<SimResult>('/simulate/', {
        product_id: Number(productId),
        horizon,
        demand_increase_pct: demandPct,
        supplier_delay_days: supplierDelay,
        event,
      })
      setResult(res.data)
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || t('sim_error_sim')
      setToast({ msg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const cfg = result ? RISK_CONFIG[result.new_risk_level] : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
             style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
          <FlaskConical size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('sim_title')}</h1>
          <p className="text-sm text-zinc-400">{t('sim_subtitle')}</p>
        </div>
      </div>

      {/* No products state */}
      {!loadingProducts && products.length === 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-6 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">{t('sim_no_products')}</p>
            <p className="text-xs text-zinc-400 mt-1">{t('sim_no_products_msg')}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSimulate} className="glass-subtle rounded-2xl p-6 border border-white/8 space-y-6">

        {/* Product selector */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
            <Package size={14} className="text-zinc-500" /> {t('sim_product_label')}
          </label>
          {loadingProducts ? (
            <div className="h-11 bg-white/5 rounded-xl animate-pulse" />
          ) : (
            <div className="relative">
              <select
                value={productId}
                onChange={e => setProductId(Number(e.target.value))}
                disabled={products.length === 0}
                className="w-full px-4 py-3 rounded-xl text-sm text-white border border-white/10 appearance-none
                           focus:outline-none focus:border-brand-500/60 transition-all disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {products.length === 0
                  ? <option value="">{t('sim_product_none')}</option>
                  : products.map(p => (
                    <option key={p.id} value={p.id} style={{ background: '#18181b' }}>
                      {p.name}  ·  {p.sku}
                    </option>
                  ))
                }
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">▾</div>
            </div>
          )}
        </div>

        {/* Horizon */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
              <Calendar size={14} className="text-zinc-500" /> {t('sim_horizon_label')}
            </label>
            <span className="text-sm font-bold text-white">{horizon} {t('sim_days')}</span>
          </div>
          <input
            type="range" min={7} max={90} step={1} value={horizon}
            onChange={e => setHorizon(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-500"
            style={{ background: `linear-gradient(to right, #6366f1 ${((horizon - 7) / 83) * 100}%, rgba(255,255,255,0.1) 0%)` }}
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>7j</span><span>30j</span><span>60j</span><span>90j</span>
          </div>
        </div>

        {/* Demand variation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
              <TrendingUp size={14} className="text-zinc-500" /> {t('sim_demand_label')}
            </label>
            <span className={`text-sm font-bold ${demandPct > 0 ? 'text-orange-400' : demandPct < 0 ? 'text-emerald-400' : 'text-white'}`}>
              {demandPct > 0 ? '+' : ''}{demandPct}%
            </span>
          </div>
          <input
            type="range" min={-30} max={200} step={5} value={demandPct}
            onChange={e => setDemandPct(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: demandPct > 0 ? '#fb923c' : '#34d399' }}
          />
        </div>

        {/* Supplier delay */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
              <Truck size={14} className="text-zinc-500" /> {t('sim_supplier_label')}
            </label>
            <span className="text-sm font-bold text-white">+{supplierDelay} {t('sim_days')}</span>
          </div>
          <input
            type="range" min={0} max={30} step={1} value={supplierDelay}
            onChange={e => setSupplierDelay(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-orange-500"
            style={{ background: `linear-gradient(to right, #f97316 ${(supplierDelay / 30) * 100}%, rgba(255,255,255,0.1) 0%)` }}
          />
        </div>

        {/* Event selector */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
            <Calendar size={14} className="text-zinc-500" /> {t('sim_event_label')}
          </label>
          <div className="flex flex-wrap gap-2">
            {EVENTS.map(ev => (
              <button
                key={ev.value}
                type="button"
                onClick={() => setEvent(ev.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border
                  ${event === ev.value
                    ? 'bg-brand-500/20 border-brand-500/50 text-white shadow-sm'
                    : 'bg-white/3 border-white/8 text-zinc-400 hover:text-white hover:border-white/20'}`}
              >
                <span>{ev.emoji}</span> {t(ev.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !productId || products.length === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2
                     transition-all disabled:opacity-40 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> {t('sim_submitting')}</>
            : <><FlaskConical size={16} /> {t('sim_submit')}</>
          }
        </button>
      </form>

      {/* Result */}
      {result && cfg && (
        <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-6 space-y-5`}>

          {/* Header result */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-bold text-white text-lg leading-tight">{result.product_name}</p>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                {result.sku} · {result.current_stock}u · {result.avg_daily_demand}{t('sim_velocity')}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.border} ${cfg.color}`}>
              <ArrowUpRight size={12} />
              {t(cfg.labelKey)}
            </div>
          </div>

          {/* Scenario label */}
          <div className="bg-white/5 rounded-xl px-4 py-2.5">
            <p className="text-xs text-zinc-400">
              <span className="text-zinc-500">{t('sim_scenario')} </span>
              <span className="text-zinc-200 font-medium">{result.scenario_label}</span>
            </p>
          </div>

          {/* Risk comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <p className="text-xs text-zinc-500">{t('sim_base_risk')}</p>
              <p className="text-2xl font-black text-white">{Math.round(result.base_risk * 100)}%</p>
              <RiskBar score={result.base_risk} color="bg-zinc-600" />
            </div>
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <p className="text-xs text-zinc-500">{t('sim_simulated_risk')}</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-black ${cfg.color}`}>{Math.round(result.simulated_risk * 100)}%</p>
                {result.risk_delta > 0.03 && (
                  <span className="text-xs text-red-400 font-semibold bg-red-500/10 px-1.5 py-0.5 rounded">
                    +{Math.round(result.risk_delta * 100)}pp
                  </span>
                )}
              </div>
              <RiskBar score={result.simulated_risk} color={cfg.bar} />
            </div>
          </div>

          {/* Stock days */}
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
            <BarChart3 size={16} className="text-zinc-400 shrink-0" />
            <p className="text-sm text-white font-medium">
              {result.stock_impact_days >= 999
                ? t('sim_stock_sufficient')
                : `${t('sim_stock_days_label')} ${result.stock_impact_days} ${t('sim_days')}`}
            </p>
          </div>

          {/* Recommendation */}
          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
            <Info size={15} className={`${cfg.color} mt-0.5 shrink-0`} />
            <p className="text-sm text-zinc-300 leading-relaxed">{result.recommendation}</p>
          </div>

          {/* Business impact */}
          <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
            <TrendingUp size={15} className="text-purple-400 mt-0.5 shrink-0" />
            <p className="text-sm text-zinc-300 leading-relaxed">{result.business_impact}</p>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Loader2, AlertTriangle, CheckCircle, Info, Calendar, MessageCircle, ShoppingCart, Package } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine, ReferenceArea,
} from 'recharts'
import { ProductsAPI, PredictAPI, Product, PredictionResult } from '../api/api'
import Toast from '../components/Toast'
import HintTooltip from '../components/Tooltip'
import { useLanguage } from '../context/LanguageContext'
import { useCurrency } from '../context/CurrencyContext'

function getRiskLevel(prob: number, t: (k: string) => string) {
  if (prob >= 0.7) return { label: t('pred_result_high'), color: 'text-red-400', badge: 'badge-risk-high', icon: <AlertTriangle size={16} /> }
  if (prob >= 0.4) return { label: t('pred_result_medium'), color: 'text-amber-400', badge: 'badge-risk-medium', icon: <Info size={16} /> }
  return { label: t('pred_result_low'), color: 'text-emerald-400', badge: 'badge-risk-low', icon: <CheckCircle size={16} /> }
}

function estimateDaysToRupture(prob: number, horizon: number): number | null {
  if (prob < 0.4) return null
  return Math.round(horizon * (1 - prob) * 1.2)
}

function buildChartData(result: PredictionResult, horizon: number) {
  return Array.from({ length: Math.min(horizon, 14) }, (_, i) => {
    const progress = (i + 1) / 14
    const p = Math.min(1, result.probability * (0.7 + 0.3 * progress))
    return {
      label: `J+${Math.round((horizon / 14) * (i + 1))}`,
      day: Math.round((horizon / 14) * (i + 1)),
      probability: parseFloat(p.toFixed(3)),
      lower: parseFloat((result.lower * (0.7 + 0.2 * progress)).toFixed(3)),
      upper: parseFloat(Math.min(1, result.upper * (0.8 + 0.2 * progress)).toFixed(3)),
    }
  })
}

function Gauge({ probability }: { probability: number }) {
  const pct = Math.min(1, Math.max(0, probability))
  const angle = -135 + pct * 270
  const rad = (angle * Math.PI) / 180
  const cx = 100, cy = 95, r = 70
  const needleX = cx + r * 0.8 * Math.cos(rad)
  const needleY = cy + r * 0.8 * Math.sin(rad)
  const color = pct >= 0.7 ? '#ef4444' : pct >= 0.4 ? '#f59e0b' : '#10b981'

  function arcPath(startAngle: number, endAngle: number, radius: number) {
    const s = ((startAngle - 90) * Math.PI) / 180
    const e = ((endAngle - 90) * Math.PI) / 180
    const x1 = cx + radius * Math.cos(s)
    const y1 = cy + radius * Math.sin(s)
    const x2 = cx + radius * Math.cos(e)
    const y2 = cy + radius * Math.sin(e)
    const large = endAngle - startAngle > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }

  return (
    <svg viewBox="0 0 200 130" className="w-full max-w-xs mx-auto">
      <path d={arcPath(-45, 225, 70)} fill="none" stroke="#27272a" strokeWidth="12" strokeLinecap="round" />
      <path d={arcPath(-45, 63, 70)} fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
      <path d={arcPath(63, 153, 70)} fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
      <path d={arcPath(153, 225, 70)} fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
      <path d={arcPath(-45, -45 + pct * 270, 70)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill={color} />
      <text x="28" y="112" fill="#52525b" fontSize="9" textAnchor="middle">0%</text>
      <text x="100" y="22" fill="#52525b" fontSize="9" textAnchor="middle">50%</text>
      <text x="172" y="112" fill="#52525b" fontSize="9" textAnchor="middle">100%</text>
      <text x={cx} y={cy + 28} fill={color} fontSize="18" fontWeight="bold" textAnchor="middle">
        {(pct * 100).toFixed(1)}%
      </text>
    </svg>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-surface-secondary border border-surface-border rounded-xl p-3 text-xs shadow-xl">
      <p className="text-zinc-400 font-medium mb-1">{label}</p>
      <p className="text-brand-400 font-semibold">Probabilité: {(d.probability * 100).toFixed(1)}%</p>
      <p className="text-zinc-500">IC: [{(d.lower * 100).toFixed(1)}%, {(d.upper * 100).toFixed(1)}%]</p>
    </div>
  )
}

export default function Predict() {
  const { t } = useLanguage()
  const { formatPrice, convertToDZD } = useCurrency()
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState<number | ''>('')
  const [horizon, setHorizon] = useState(30)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    ProductsAPI.list()
      .then(r => { setProducts(r.data); if (r.data.length > 0) setProductId(r.data[0].id) })
      .finally(() => setLoadingProducts(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) return
    setLoading(true)
    setResult(null)
    try {
      const res = await PredictAPI.run(Number(productId), horizon)
      setResult(res.data)
    } catch (err: any) {
      if (err.response?.status === 403) {
        setToast({ msg: "Limite d'essais gratuits atteinte.", type: 'error' })
      } else {
        setToast({ msg: err.response?.data?.detail || 'Erreur lors de la prédiction', type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  const risk = result ? getRiskLevel(result.probability, t) : null
  const chartData = result ? buildChartData(result, horizon) : []
  const daysToRupture = result ? estimateDaysToRupture(result.probability, horizon) : null
  const ruptureDate = daysToRupture
    ? new Date(Date.now() + daysToRupture * 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const criticalDay = chartData.find(d => d.probability >= 0.5)?.day

  const selectedProduct = products.find(p => p.id === Number(productId)) ?? null
  const reorderQty = selectedProduct ? Math.max(selectedProduct.safety_stock * 3, 10) : 0
  const unitCostDZD = selectedProduct?.cost_price
    ? convertToDZD(selectedProduct.cost_price, (selectedProduct.price_currency as any) || 'DZD')
    : null
  const totalCostDisplay = unitCostDZD ? formatPrice(unitCostDZD * reorderQty) : null

  function sendWhatsAppPrediction() {
    if (!selectedProduct || !result) return
    const riskLabel = result.probability >= 0.7 ? '🔴 CRITIQUE' : result.probability >= 0.4 ? '🟡 MOYEN' : '🟢 FAIBLE'
    const msg = [
      `Bonjour,`,
      ``,
      `Alerte stock IA — *${selectedProduct.name}*`,
      ``,
      `📊 Risque de rupture : ${riskLabel} (${(result.probability * 100).toFixed(0)}%)`,
      daysToRupture ? `⏱ Rupture estimée dans : ~${daysToRupture} jours` : '',
      ``,
      `📦 Commande recommandée : *${reorderQty} unités*`,
      `   • SKU : ${selectedProduct.sku}`,
      `   • Délai attendu : ${selectedProduct.lead_time_days} jours`,
      totalCostDisplay ? `   • Budget estimé : ${totalCostDisplay}` : '',
      ``,
      `_Généré par Stocky IA_`,
    ].filter(Boolean).join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Link to="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft size={14} /> {t('pred_back')}
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
          <TrendingUp size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">{t('pred_title')}</h1>
          <p className="text-sm text-zinc-500">{t('pred_subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card col-span-1 space-y-4">
          <h2 className="font-medium text-zinc-200">{t('pred_params')}</h2>
          {loadingProducts ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
              <Loader2 size={14} className="animate-spin" /> {t('btn_loading')}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">{t('pred_select_product')}</label>
                <select className="input text-sm" value={productId} onChange={e => setProductId(Number(e.target.value))}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {/* Photo + info du produit sélectionné */}
                {selectedProduct && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/3 border border-white/8 p-2.5">
                    {selectedProduct.image_url ? (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Package size={18} className="text-zinc-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{selectedProduct.name}</p>
                      <code className="text-[10px] text-zinc-500 font-mono">{selectedProduct.sku}</code>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">{t('pred_horizon')}</label>
                  <span className="text-xs text-brand-400 font-mono">{horizon}j</span>
                </div>
                <input
                  dir="ltr"
                  type="range" min={7} max={90} step={7} value={horizon}
                  onChange={e => setHorizon(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                  <span>7j</span><span>90j</span>
                </div>
                <p className="text-xs text-zinc-600 mt-2">Nombre de jours à analyser (ex : 30 jours = prédiction sur le prochain mois)</p>
              </div>
              <HintTooltip text="Calculer la probabilité de rupture de stock sur la période choisie grâce à l'IA">
                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2 transition-all duration-150"
                  disabled={loading || !productId}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                  {loading ? t('pred_analysis') : t('pred_run')}
                </button>
              </HintTooltip>
            </form>
          )}
          {result && (
            <div className="pt-2 border-t border-surface-border">
              <p className="text-xs text-zinc-500 mb-2 text-center">{t('pred_gauge')}</p>
              <Gauge probability={result.probability} />
            </div>
          )}
        </div>

        <div className="col-span-2 space-y-4">
          {result && risk ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="card">
                  <p className="text-xs text-zinc-500 mb-1">{t('pred_probability')}</p>
                  <p className={`text-2xl font-semibold ${risk.color}`}>
                    {(result.probability * 100).toFixed(1)}%
                  </p>
                  <span className={`${risk.badge} mt-2 inline-flex items-center gap-1`}>
                    {risk.icon}{risk.label}
                  </span>
                </div>
                <div className="card">
                  <p className="text-xs text-zinc-500 mb-1">{t('pred_confidence_label')}</p>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">
                    {(result.lower * 100).toFixed(1)}% — {(result.upper * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">{t('pred_ic_label')}</p>
                </div>
                <div className="card">
                  <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                    <Calendar size={10} /> {t('pred_rupture_label')}
                  </p>
                  {daysToRupture ? (
                    <>
                      <p className={`text-xl font-semibold ${risk.color} mt-1`}>~{daysToRupture} {t('pred_days')}</p>
                      <p className="text-xs text-zinc-600 mt-1">{ruptureDate}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-semibold text-emerald-400 mt-1">{t('pred_stable')}</p>
                      <p className="text-xs text-zinc-600 mt-1">{t('pred_no_risk')}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Plan d'action */}
              {result.probability >= 0.4 && selectedProduct && (
                <div className="card border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingCart size={15} className="text-amber-400" />
                    <h3 className="font-semibold text-amber-300 text-sm">Plan d'action recommandé</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-white">{reorderQty}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Unités à commander</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-white">{selectedProduct.lead_time_days}j</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Délai fournisseur</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      {totalCostDisplay ? (
                        <>
                          <p className="text-lg font-bold text-emerald-400">{totalCostDisplay}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">Budget estimé</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-zinc-500">—</p>
                          <p className="text-xs text-zinc-600 mt-0.5">Prix non défini</p>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={sendWhatsAppPrediction}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#25d366,#128c7e)', boxShadow: '0 4px 16px rgba(37,211,102,0.25)' }}
                  >
                    <MessageCircle size={15} /> Envoyer la commande sur WhatsApp
                  </button>
                </div>
              )}

              <div className="card">
                <h3 className="font-medium text-zinc-300 mb-1 text-sm">{t('pred_evolution')} {horizon} {t('pred_days')}</h3>
                {criticalDay && (
                  <p className="text-xs text-red-400 mb-3">{t('pred_critical_zone')} J+{criticalDay}</p>
                )}
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradProb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                      tick={{ fill: '#71717a', fontSize: 10 }}
                      axisLine={false} tickLine={false} domain={[0, 1]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceArea y1={0.5} y2={1} fill="#ef4444" fillOpacity={0.05} />
                    <ReferenceLine
                      y={0.5} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6}
                      label={{ value: 'Seuil critique', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                    />
                    <Area
                      type="monotone" dataKey="probability"
                      stroke="#6366f1" strokeWidth={2}
                      fill="url(#gradProb)" dot={false}
                      activeDot={{ r: 4, fill: '#6366f1', stroke: '#0f0f11', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <TrendingUp size={40} className="text-zinc-700 mb-3" />
              <p className="text-zinc-400 font-medium">{t('pred_no_result')}</p>
              <p className="text-zinc-600 text-sm mt-1">{t('pred_hint')}</p>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, Loader2, Plus, X } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { ProductsAPI, PredictAPI, Product } from '../api/api'
import Toast from '../components/Toast'
import { useLanguage } from '../context/LanguageContext'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface ProductResult {
  product: Product
  probability: number
  lower: number
  upper: number
  risk: 'low' | 'medium' | 'high'
}

export default function Compare() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [horizon, setHorizon] = useState(30)
  const [results, setResults] = useState<ProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    ProductsAPI.list().then(r => setProducts(r.data)).finally(() => setLoadingProducts(false))
  }, [])

  function toggleProduct(id: number) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  async function runComparison() {
    if (selected.length < 2) { setToast({ msg: t('cmp_min_2'), type: 'error' }); return }
    setLoading(true)
    setResults([])
    try {
      const res = await Promise.all(
        selected.map(id => PredictAPI.run(id, horizon).then(r => ({
          product: products.find(p => p.id === id)!,
          probability: r.data.probability,
          lower: r.data.lower,
          upper: r.data.upper,
          risk: r.data.probability >= 0.7 ? 'high' : r.data.probability >= 0.4 ? 'medium' : 'low' as any,
        })))
      )
      setResults(res.sort((a, b) => b.probability - a.probability))
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || t('cmp_error'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const barData = results.map((r, i) => ({
    name: r.product.name.slice(0, 12),
    probability: parseFloat((r.probability * 100).toFixed(1)),
    fill: COLORS[i % COLORS.length],
  }))

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
          <BarChart2 size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">{t('cmp_title')}</h1>
          <p className="text-sm text-zinc-500">{t('cmp_subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Selection */}
        <div className="card col-span-1 space-y-4">
          <h2 className="font-medium text-zinc-200">{t('cmp_selection')} <span className="text-zinc-600 text-xs">({selected.length}/5)</span></h2>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{t('cmp_horizon')}</label>
              <span className="text-xs text-brand-400 font-mono">{horizon}j</span>
            </div>
            <input dir="ltr" type="range" min={7} max={90} step={7} value={horizon}
              onChange={e => setHorizon(Number(e.target.value))} className="w-full accent-brand-500" />
          </div>

          {loadingProducts ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm"><Loader2 size={14} className="animate-spin" /> {t('cmp_loading')}</div>
          ) : (
            <div className="space-y-2">
              {products.map((p, i) => {
                const isSelected = selected.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                      isSelected ? 'bg-brand-500/20 border border-brand-500/40 text-zinc-100' : 'bg-surface-tertiary text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: COLORS[selected.indexOf(p.id)] }} />}
                      {p.name}
                    </span>
                    {isSelected ? <X size={12} /> : <Plus size={12} />}
                  </button>
                )
              })}
            </div>
          )}

          <button
            onClick={runComparison}
            disabled={loading || selected.length < 2}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
            {loading ? t('cmp_comparing') : t('cmp_compare')}
          </button>
        </div>

        {/* Results */}
        <div className="col-span-2 space-y-4">
          {results.length > 0 ? (
            <>
              {/* Ranking */}
              <div className="card">
                <h3 className="font-medium text-zinc-200 mb-4 text-sm">{t('cmp_ranking')}</h3>
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <div key={r.product.id} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-600 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-zinc-200">{r.product.name}</span>
                          <span className={`text-sm font-semibold ${r.risk === 'high' ? 'text-red-400' : r.risk === 'medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {(r.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${r.probability * 100}%`,
                              background: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar chart */}
              <div className="card">
                <h3 className="font-medium text-zinc-200 mb-4 text-sm">{t('cmp_probability')}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip formatter={(v: any) => [`${v}%`, t('cmp_radar_risk')]} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                    {barData.map((entry, i) => (
                      <Bar key={i} dataKey="probability" fill={entry.fill} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <BarChart2 size={40} className="text-zinc-700 mb-3" />
              <p className="text-zinc-400 font-medium">{t('cmp_no_results')}</p>
              <p className="text-zinc-600 text-sm mt-1">{t('cmp_no_results_hint')}</p>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

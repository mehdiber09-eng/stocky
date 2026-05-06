import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Download, RefreshCw, Loader2, AlertTriangle,
  CheckCircle, Info, BarChart2, ShoppingCart, Package, Activity,
  Printer, Zap, Minus,
} from 'lucide-react'
import { AnalyticsAPI, ExportAPI, downloadBlob, SalesVelocityItem, InventoryHealthItem } from '../api/api'
import Toast from '../components/Toast'
import Pagination from '../components/Pagination'
import HintTooltip from '../components/Tooltip'
import { useLanguage } from '../context/LanguageContext'

const RISK_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' }

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
        <span className="text-sm text-zinc-500">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-zinc-100">{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}

const CustomBarTooltip = ({ active, payload, label, salesLabel }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-secondary border border-surface-border rounded-xl p-3 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-brand-400 font-semibold">{payload[0]?.value} {salesLabel}</p>
    </div>
  )
}

export default function Analytics() {
  const { t } = useLanguage()
  const [summary, setSummary] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [salesByProduct, setSalesByProduct] = useState<any[]>([])
  const [byRisk, setByRisk] = useState<any>(null)
  const [velocity, setVelocity] = useState<SalesVelocityItem[]>([])
  const [health, setHealth] = useState<InventoryHealthItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const HISTORY_PER_PAGE = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, h, sp, br, vel, hlth] = await Promise.all([
        AnalyticsAPI.summary(),
        AnalyticsAPI.history(200),
        AnalyticsAPI.salesByProduct(),
        AnalyticsAPI.byRisk(),
        AnalyticsAPI.salesVelocity().catch(() => ({ data: [] })),
        AnalyticsAPI.inventoryHealth().catch(() => ({ data: [] })),
      ])
      setSummary(s.data)
      setHistory(h.data)
      setSalesByProduct(sp.data)
      setByRisk(br.data)
      setVelocity(vel.data as SalesVelocityItem[])
      setHealth(hlth.data as InventoryHealthItem[])
    } catch {
      setToast({ msg: t('ana_error'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleExport(type: 'predictions' | 'sales') {
    setExporting(type)
    try {
      const res = type === 'predictions'
        ? await ExportAPI.predictionsCSV()
        : await ExportAPI.salesCSV()
      downloadBlob(res.data, `stocksense_${type}_${new Date().toISOString().slice(0, 10)}.csv`)
      setToast({ msg: t('ana_export_ok'), type: 'success' })
    } catch {
      setToast({ msg: t('ana_export_error'), type: 'error' })
    } finally {
      setExporting(null)
    }
  }

  const riskPieData = byRisk ? [
    { name: t('risk_low'), value: byRisk.low, color: RISK_COLORS.low },
    { name: t('risk_medium'), value: byRisk.medium, color: RISK_COLORS.medium },
    { name: t('risk_high'), value: byRisk.high, color: RISK_COLORS.high },
  ].filter(d => d.value > 0) : []

  const riskIcon = (risk: string) => {
    if (risk === 'high') return <AlertTriangle size={12} className="text-red-400" />
    if (risk === 'medium') return <Info size={12} className="text-amber-400" />
    return <CheckCircle size={12} className="text-emerald-400" />
  }

  const riskLabel = (risk: string) => {
    if (risk === 'high') return t('risk_high')
    if (risk === 'medium') return t('risk_medium')
    return t('risk_low')
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <BarChart2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">{t('ana_title')}</h1>
            <p className="text-sm text-zinc-500">{t('ana_subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <HintTooltip text={t('ana_tooltip_pdf')}>
            <button
              onClick={() => window.print()}
              className="btn-glass flex items-center gap-2 text-sm print:hidden transition-all duration-150"
            >
              <Printer size={14} />
              {t('ana_export_pdf')}
            </button>
          </HintTooltip>
          <HintTooltip text={t('ana_tooltip_csv')}>
            <button
              onClick={() => handleExport('predictions')}
              disabled={!!exporting}
              className="btn-ghost flex items-center gap-2 text-sm print:hidden transition-all duration-150"
            >
              {exporting === 'predictions' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {t('ana_export_pred')}
            </button>
          </HintTooltip>
          <HintTooltip text={t('ana_tooltip_csv')}>
            <button
              onClick={() => handleExport('sales')}
              disabled={!!exporting}
              className="btn-primary flex items-center gap-2 text-sm print:hidden transition-all duration-150"
            >
              {exporting === 'sales' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {t('ana_export_sales')}
            </button>
          </HintTooltip>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 size={24} className="animate-spin mr-3" /> {t('btn_loading')}
        </div>
      ) : (
        <>
          {/* Summary stats */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label={t('ana_products')} value={summary.total_products} icon={Package} color="text-brand-400 bg-brand-500/10" />
              <StatCard label={t('ana_predictions')} value={summary.total_predictions}
                sub={`${summary.high_risk_predictions} ${t('ana_high_risk_sub')}`} icon={TrendingUp} color="text-amber-400 bg-amber-500/10" />
              <StatCard label={t('ana_avg_prob')} value={`${(summary.avg_probability * 100).toFixed(1)}%`}
                sub={`${summary.recent_sales_qty} ${t('ana_recent_sales_sub')}`} icon={Activity} color="text-emerald-400 bg-emerald-500/10" />
            </div>
          )}

          {/* ── Velocity & Coverage ─────────────────────────────────────── */}
          {(velocity.length > 0 || health.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top movers */}
              {velocity.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={15} className="text-amber-400" />
                    <h2 className="font-medium text-zinc-200 text-sm">Vélocité des ventes</h2>
                  </div>
                  <div className="space-y-2">
                    {[...velocity]
                      .sort((a, b) => Math.abs(b.trend_pct) - Math.abs(a.trend_pct))
                      .slice(0, 6)
                      .map(v => (
                        <div key={v.product_id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-zinc-200 truncate">{v.product_name}</p>
                            <p className="text-xs text-zinc-500">{v.velocity_30d.toFixed(1)} u/j · 30j</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ms-3">
                            <span className="text-xs text-zinc-500">{v.velocity_7d.toFixed(1)} u/j</span>
                            {v.trend === 'accelerating' && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <TrendingUp size={10} /> +{Math.abs(Math.round(v.trend_pct))}%
                              </span>
                            )}
                            {v.trend === 'decelerating' && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                                <TrendingDown size={10} /> -{Math.abs(Math.round(v.trend_pct))}%
                              </span>
                            )}
                            {v.trend === 'stable' && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                                <Minus size={10} /> stable
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Coverage distribution */}
              {health.length > 0 && (() => {
                const withCoverage = health.filter(h => h.days_of_coverage !== null)
                const avgCoverage = withCoverage.length
                  ? Math.round(withCoverage.reduce((s, h) => s + (h.days_of_coverage ?? 0), 0) / withCoverage.length)
                  : null
                const critical = health.filter(h => h.status === 'critical').length
                const warning  = health.filter(h => h.status === 'warning').length
                const ok       = health.filter(h => h.status === 'ok').length
                const overstock= health.filter(h => h.status === 'overstock').length
                const abcA = health.filter(h => h.abc_class === 'A')
                return (
                  <div className="card space-y-4">
                    <div className="flex items-center gap-2">
                      <Package size={15} className="text-brand-400" />
                      <h2 className="font-medium text-zinc-200 text-sm">Santé du stock</h2>
                    </div>
                    {/* Status breakdown */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'Critique', val: critical, color: 'text-red-400', bg: 'bg-red-500/8' },
                        { label: 'Alerte',   val: warning,  color: 'text-amber-400', bg: 'bg-amber-500/8' },
                        { label: 'OK',       val: ok,       color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
                        { label: 'Surstock', val: overstock,color: 'text-blue-400', bg: 'bg-blue-500/8' },
                      ].map(({ label, val, color, bg }) => (
                        <div key={label} className={`rounded-xl p-2 ${bg}`}>
                          <p className={`text-xl font-bold ${color}`}>{val}</p>
                          <p className="text-[10px] text-zinc-500">{label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Coverage bar */}
                    {avgCoverage !== null && (
                      <div>
                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                          <span>Couverture moy.</span>
                          <span className="font-semibold text-zinc-300">{avgCoverage} jours</span>
                        </div>
                        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-brand-400 transition-all"
                               style={{ width: `${Math.min(100, (avgCoverage / 90) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                    {/* Classe A */}
                    {abcA.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-500 mb-1.5">Produits classe A (priorité)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {abcA.slice(0, 5).map(p => (
                            <span key={p.product_id} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300">
                              {p.product_name.length > 18 ? p.product_name.slice(0, 18) + '…' : p.product_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sales by product */}
            <div className="card col-span-3">
              <h2 className="font-medium text-zinc-200 mb-4 text-sm">{t('ana_sales_by_product')}</h2>
              {salesByProduct.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-zinc-600 text-sm">
                  <ShoppingCart size={20} className="mr-2" /> {t('ana_no_sales')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={salesByProduct} margin={{ left: -20 }}>
                    <XAxis dataKey="product" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={(props) => <CustomBarTooltip {...props} salesLabel={t('ana_sales_count')} />} />
                    <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Risk distribution pie */}
            <div className="card col-span-2">
              <h2 className="font-medium text-zinc-200 mb-4 text-sm">{t('ana_risk_dist')}</h2>
              {riskPieData.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-zinc-600 text-sm">
                  {t('ana_no_preds')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" paddingAngle={3}>
                      {riskPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend formatter={(val) => <span className="text-xs text-zinc-400">{val}</span>} />
                    <Tooltip formatter={(val: any) => [`${val} ${t('ana_preds_count')}`]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Prediction history table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
              <div>
                <h2 className="font-medium text-zinc-100">{t('ana_history_title')}</h2>
                {history.length > 0 && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {history.length} {t('ana_preds_count')} {t('ana_total')}
                  </p>
                )}
              </div>
              <Link to="/predict" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                {t('ana_new_prediction')}
              </Link>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-sm">{t('ana_no_history')}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('ana_date')}</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('ana_products')}</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell">{t('ana_horizon')}</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('ana_probability')}</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('ana_risk')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history
                      .slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE)
                      .map((row) => (
                        <tr key={row.id} className="border-b border-surface-border last:border-0 hover:bg-surface-tertiary/50 transition-colors">
                          <td className="px-6 py-3 text-zinc-500 text-xs">{new Date(row.predicted_at).toLocaleString('fr-FR')}</td>
                          <td className="px-6 py-3 font-medium text-zinc-200">{row.product_name}</td>
                          <td className="px-6 py-3 text-zinc-400 hidden sm:table-cell">{row.horizon}j</td>
                          <td className="px-6 py-3 font-semibold" style={{ color: row.probability >= 0.7 ? '#ef4444' : row.probability >= 0.4 ? '#f59e0b' : '#10b981' }}>
                            {(row.probability * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-3">
                            <span className={`flex items-center gap-1 text-xs w-fit px-2 py-0.5 rounded-full ${
                              row.risk === 'high' ? 'bg-red-500/10 text-red-400' :
                              row.risk === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {riskIcon(row.risk)}
                              {riskLabel(row.risk)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                </div>
                <div className="px-6 pb-4">
                  <Pagination
                    page={historyPage}
                    total={history.length}
                    perPage={HISTORY_PER_PAGE}
                    onChange={p => setHistoryPage(p)}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

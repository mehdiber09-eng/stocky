import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, Download, RefreshCw, Loader2, AlertTriangle,
  CheckCircle, Info, BarChart2, ShoppingCart, Package, Activity
} from 'lucide-react'
import { AnalyticsAPI, ExportAPI, downloadBlob } from '../api/api'
import Toast from '../components/Toast'

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

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-secondary border border-surface-border rounded-xl p-3 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-brand-400 font-semibold">{payload[0]?.value} ventes</p>
    </div>
  )
}

export default function Analytics() {
  const [summary, setSummary] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [salesByProduct, setSalesByProduct] = useState<any[]>([])
  const [byRisk, setByRisk] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, h, sp, br] = await Promise.all([
        AnalyticsAPI.summary(),
        AnalyticsAPI.history(10),
        AnalyticsAPI.salesByProduct(),
        AnalyticsAPI.byRisk(),
      ])
      setSummary(s.data)
      setHistory(h.data)
      setSalesByProduct(sp.data)
      setByRisk(br.data)
    } catch {
      setToast({ msg: 'Erreur de chargement des analytics', type: 'error' })
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
      setToast({ msg: 'Export téléchargé !', type: 'success' })
    } catch {
      setToast({ msg: 'Erreur lors de l\'export', type: 'error' })
    } finally {
      setExporting(null)
    }
  }

  const riskPieData = byRisk ? [
    { name: 'Faible', value: byRisk.low, color: RISK_COLORS.low },
    { name: 'Modéré', value: byRisk.medium, color: RISK_COLORS.medium },
    { name: 'Élevé', value: byRisk.high, color: RISK_COLORS.high },
  ].filter(d => d.value > 0) : []

  const riskIcon = (risk: string) => {
    if (risk === 'high') return <AlertTriangle size={12} className="text-red-400" />
    if (risk === 'medium') return <Info size={12} className="text-amber-400" />
    return <CheckCircle size={12} className="text-emerald-400" />
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
            <h1 className="text-xl font-semibold text-zinc-100">Analytics</h1>
            <p className="text-sm text-zinc-500">Vue détaillée de vos données</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => handleExport('predictions')}
            disabled={!!exporting}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            {exporting === 'predictions' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Prédictions CSV
          </button>
          <button
            onClick={() => handleExport('sales')}
            disabled={!!exporting}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {exporting === 'sales' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Ventes CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 size={24} className="animate-spin mr-3" /> Chargement...
        </div>
      ) : (
        <>
          {/* Summary stats */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Produits" value={summary.total_products} icon={Package} color="text-brand-400 bg-brand-500/10" />
              <StatCard label="Prédictions totales" value={summary.total_predictions}
                sub={`${summary.high_risk_predictions} à risque élevé`} icon={TrendingUp} color="text-amber-400 bg-amber-500/10" />
              <StatCard label="Probabilité moyenne" value={`${(summary.avg_probability * 100).toFixed(1)}%`}
                sub={`${summary.recent_sales_qty} ventes ce mois`} icon={Activity} color="text-emerald-400 bg-emerald-500/10" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sales by product */}
            <div className="card col-span-3">
              <h2 className="font-medium text-zinc-200 mb-4 text-sm">Ventes par produit</h2>
              {salesByProduct.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-zinc-600 text-sm">
                  <ShoppingCart size={20} className="mr-2" /> Aucune vente enregistrée
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={salesByProduct} margin={{ left: -20 }}>
                    <XAxis dataKey="product" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Risk distribution pie */}
            <div className="card col-span-2">
              <h2 className="font-medium text-zinc-200 mb-4 text-sm">Répartition des risques</h2>
              {riskPieData.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-zinc-600 text-sm">
                  Aucune prédiction
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
                    <Tooltip formatter={(val: any) => [`${val} prédictions`]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Prediction history table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
              <h2 className="font-medium text-zinc-100">Historique des prédictions</h2>
              <Link to="/predict" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                Nouvelle prédiction →
              </Link>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-sm">Aucune prédiction effectuée</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Produit</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Horizon</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Probabilité</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Risque</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-b border-surface-border last:border-0 hover:bg-surface-tertiary/50 transition-colors">
                      <td className="px-6 py-3 text-zinc-500 text-xs">{new Date(row.predicted_at).toLocaleString('fr-FR')}</td>
                      <td className="px-6 py-3 font-medium text-zinc-200">{row.product_name}</td>
                      <td className="px-6 py-3 text-zinc-400">{row.horizon}j</td>
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
                          {row.risk === 'high' ? 'Élevé' : row.risk === 'medium' ? 'Modéré' : 'Faible'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

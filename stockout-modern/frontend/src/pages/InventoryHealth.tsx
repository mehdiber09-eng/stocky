import React, { useEffect, useState, useCallback } from 'react'
import {
  AlertTriangle, CheckCircle, RefreshCw, Loader2, Package,
  TrendingUp, TrendingDown, Minus, Activity,
  Clock, Layers, History, X, Edit2, Trash2,
  ArrowUp, ArrowDown, ShoppingCart, DollarSign, MessageCircle,
} from 'lucide-react'
import { AnalyticsAPI, StockHistoryAPI, ProductsAPI, InventoryHealthItem, SalesVelocityItem, StockMovement, Product } from '../api/api'
import Toast from '../components/Toast'
import { useLanguage } from '../context/LanguageContext'
import EditProductModal from '../components/EditProductModal'
import { SkeletonTable } from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'
import Tooltip from '../components/Tooltip'
import { useCurrency, saveUnitPrice, calcEOQ } from '../hooks/useCurrency'

const ABC_CONFIG = {
  A: { label: 'A', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30', title: 'Top 70% revenus' },
  B: { label: 'B', bg: 'bg-sky-500/15 text-sky-300 border-sky-500/30', title: 'Revenus moyens (70-90%)' },
  C: { label: 'C', bg: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', title: 'Revenus faibles (90-100%)' },
}

const STATUS_CONFIG = {
  critical: { label: 'Critique', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
  warning: { label: 'Réappro.', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  ok: { label: 'OK', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  overstock: { label: 'Surstock', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', dot: 'bg-sky-400' },
}

function CoverageMeter({ days, reorderPoint, stock }: { days: number | null; reorderPoint: number; stock: number }) {
  if (days === null) return <span className="text-zinc-600 text-xs">—</span>
  const capped = Math.min(days, 120)
  const pct = (capped / 120) * 100
  const color = days <= 7 ? 'bg-red-500' : days <= 30 ? 'bg-amber-500' : days <= 90 ? 'bg-emerald-500' : 'bg-sky-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-400 tabular-nums">{days}j</span>
    </div>
  )
}

function TrendBadge({ trend, pct }: { trend: string; pct: number }) {
  if (trend === 'accelerating') return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
      <TrendingUp size={12} /> +{Math.abs(pct)}%
    </span>
  )
  if (trend === 'decelerating') return (
    <span className="inline-flex items-center gap-1 text-xs text-red-400">
      <TrendingDown size={12} /> -{Math.abs(pct)}%
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
      <Minus size={12} /> stable
    </span>
  )
}

function StockHistoryModal({ productId, productName, onClose }: { productId: number; productName: string; onClose: () => void }) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    StockHistoryAPI.get(productId)
      .then(res => setMovements(res.data))
      .catch(() => setError("Impossible de charger l'historique"))
      .finally(() => setLoading(false))
  }, [productId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg card animate-fade-in max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              <History size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100">Historique du stock</h2>
              <p className="text-xs text-zinc-500 truncate max-w-[220px]">{productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg shrink-0"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 -mx-4 px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <Loader2 size={18} className="animate-spin mr-2" /> Chargement...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-3">
              <AlertTriangle size={14} /> {error}
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12">
              <History size={24} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500 text-sm">Aucun mouvement de stock enregistré</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map(m => {
                const isPositive = m.change > 0
                return (
                  <div key={m.id} className="glass-subtle rounded-xl p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    }`}>
                      {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{m.change}
                        </span>
                        <span className="text-xs text-zinc-500">{m.quantity_before} → {m.quantity_after}</span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate">{m.reason}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 shrink-0 text-right tabular-nums">
                      {new Date(m.created_at).toLocaleDateString('fr-FR')}<br />
                      {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type Filter = 'all' | 'critical' | 'warning' | 'ok' | 'overstock'

export default function InventoryHealth() {
  const { t } = useLanguage()
  const { currency, symbol, formatPrice } = useCurrency()
  const [items, setItems] = useState<InventoryHealthItem[]>([])
  const [velocity, setVelocity] = useState<Record<number, SalesVelocityItem>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [historyTarget, setHistoryTarget] = useState<{ id: number; name: string } | null>(null)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [localPrices, setLocalPrices] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [healthRes, velRes] = await Promise.all([
        AnalyticsAPI.inventoryHealth(),
        AnalyticsAPI.salesVelocity(),
      ])
      setItems(healthRes.data)
      const velMap: Record<number, SalesVelocityItem> = {}
      for (const v of velRes.data) velMap[v.product_id] = v
      setVelocity(velMap)
    } catch {
      setToast({ msg: 'Erreur de chargement', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (items.length === 0) return
    const prices: Record<number, string> = {}
    for (const item of items) {
      const val = localStorage.getItem(`unitprice_${item.product_id}`)
      if (val) prices[item.product_id] = val
    }
    setLocalPrices(prices)
  }, [items])

  function setLocalPrice(productId: number, value: string) {
    setLocalPrices(prev => ({ ...prev, [productId]: value }))
    saveUnitPrice(productId, value)
  }

  const totalValue = items.reduce((sum, item) => {
    const price = localPrices[item.product_id]
    if (!price || isNaN(parseFloat(price))) return sum
    return sum + item.current_stock * parseFloat(price)
  }, 0)

  async function handleDeleteProduct() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await ProductsAPI.delete(deleteTarget.id)
      setToast({ msg: `"${deleteTarget.name}" supprimé`, type: 'success' })
      setDeleteTarget(null)
      load()
    } catch {
      setToast({ msg: 'Erreur lors de la suppression', type: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  function getWhatsAppLink(item: InventoryHealthItem): string {
    const msg = `🚨 ALERTE RUPTURE DE STOCK\n\nProduit: ${item.product_name}\nSKU: ${item.sku}\nStock actuel: ${item.current_stock} unités\nPoint de réappro: ${item.reorder_point} unités\n\n⚡ Action requise: Commander des stocks maintenant !\n\n📊 Géré via StockSense`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  const counts = {
    critical: items.filter(i => i.status === 'critical').length,
    warning: items.filter(i => i.status === 'warning').length,
    ok: items.filter(i => i.status === 'ok').length,
    overstock: items.filter(i => i.status === 'overstock').length,
  }

  const displayed = filter === 'all' ? items : items.filter(i => i.status === filter)

  const filterTabs: { key: Filter; label: string; count: number; color: string }[] = [
    { key: 'all', label: t('inv_filter_all'), count: items.length, color: 'text-zinc-300' },
    { key: 'critical', label: t('inv_filter_critical'), count: counts.critical, color: 'text-red-400' },
    { key: 'warning', label: t('inv_filter_warning'), count: counts.warning, color: 'text-amber-400' },
    { key: 'ok', label: t('inv_filter_ok'), count: counts.ok, color: 'text-emerald-400' },
    { key: 'overstock', label: t('inv_filter_overstock'), count: counts.overstock, color: 'text-sky-400' },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="card-glow relative overflow-hidden">
        <div className="absolute -top-20 -right-12 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 badge-info mb-2">
              <Layers size={10} /> {t('inv_title')}
            </div>
            <h1 className="text-2xl font-semibold text-gradient">{t('inv_title')}</h1>
            <p className="text-sm text-zinc-400 mt-1">{t('inv_abc')} · {t('inv_reorder')} · {t('inv_coverage')} · {t('inv_daily_sales')}</p>
          </div>
          <button onClick={load} className="btn-glass flex items-center gap-2 text-sm transition-all duration-150" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {t('btn_refresh')}
          </button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('inv_tile_critical'), value: counts.critical, icon: AlertTriangle, gradient: 'from-red-500/20 to-red-700/10', color: 'text-red-300', glow: 'shadow-glow-red' },
          { label: t('inv_tile_warning'), value: counts.warning, icon: Clock, gradient: 'from-amber-500/20 to-amber-700/10', color: 'text-amber-300', glow: '' },
          { label: t('inv_tile_ok'), value: counts.ok, icon: CheckCircle, gradient: 'from-emerald-500/20 to-emerald-700/10', color: 'text-emerald-300', glow: '' },
          { label: t('inv_tile_overstock'), value: counts.overstock, icon: Package, gradient: 'from-sky-500/20 to-sky-700/10', color: 'text-sky-300', glow: '' },
        ].map(({ label, value, icon: Icon, gradient, color, glow }) => (
          <div key={label} className={`stat-tile bg-gradient-to-br ${gradient} ${glow}`}>
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl glass-subtle flex items-center justify-center ${color}`}>
                <Icon size={16} />
              </div>
              <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider text-right leading-tight">{label}</span>
            </div>
            <p className="text-3xl font-semibold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* ABC legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tooltip text="Classification ABC : A = produits les plus vendus (70% du CA), B = moyens (20%), C = faibles (10%)" position="right">
          <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider cursor-help">Classification ABC :</span>
        </Tooltip>
        {Object.entries(ABC_CONFIG).map(([cls, cfg]) => (
          <span key={cls} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${cfg.bg}`}>
            <span className="font-bold">{cfg.label}</span>
            <span className="text-zinc-500">— {cfg.title}</span>
          </span>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              filter === tab.key ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            <span className={tab.color}>{tab.count}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={5} cols={6} /> : null}
      <div className="card p-0 overflow-hidden" style={{ display: loading ? 'none' : undefined }}>
        {!loading && displayed.length === 0 ? (
          <div className="text-center py-14">
            <Package size={28} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-400 font-medium">{t('inv_no_products')}</p>
            <p className="text-zinc-600 text-sm mt-1">{t('inv_no_products_sub')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('inv_product')}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    <Tooltip text="Classification ABC : A = produits les plus vendus (70% du CA), B = moyens (20%), C = faibles (10%)">
                      <span className="cursor-help border-b border-dashed border-zinc-600">ABC</span>
                    </Tooltip>
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('inv_stock')}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">
                    <Tooltip text="Quantité minimale avant de recommander une nouvelle commande">
                      <span className="cursor-help border-b border-dashed border-zinc-600">{t('inv_reorder')}</span>
                    </Tooltip>
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">
                    <Tooltip text="Nombre de jours avant rupture de stock au rythme de vente actuel">
                      <span className="cursor-help border-b border-dashed border-zinc-600">{t('inv_coverage')}</span>
                    </Tooltip>
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">{t('inv_daily_sales')}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">{t('inv_trend')}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('inv_status')}</th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t('inv_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(item => {
                  const sc = STATUS_CONFIG[item.status]
                  const abc = ABC_CONFIG[item.abc_class]
                  const vel = velocity[item.product_id]
                  const needsAction = item.status === 'critical' || item.status === 'warning'
                  const eoq = needsAction ? calcEOQ(item.avg_daily_sales_30d, item.lead_time_days, item.safety_stock) : null
                  return (
                    <tr key={item.product_id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-zinc-100">{item.product_name}</div>
                        <code className="text-[10px] text-zinc-600 font-mono">{item.sku}</code>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs font-bold ${abc.bg}`} title={abc.title}>
                          {item.abc_class}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-semibold tabular-nums ${item.current_stock === 0 ? 'text-red-400' : item.needs_reorder ? 'text-amber-300' : 'text-zinc-200'}`}>
                          {item.current_stock}
                        </span>
                        {eoq !== null && (
                          <Tooltip text={t('inv_eoq_tip')}>
                            <div className="flex items-center gap-1 mt-0.5 cursor-help">
                              <ShoppingCart size={10} className="text-emerald-500" />
                              <span className="text-[10px] text-emerald-500 font-medium">
                                {t('inv_order_rec')}{eoq} {t('inv_order_unit')}
                              </span>
                            </div>
                          </Tooltip>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400 tabular-nums hidden sm:table-cell">
                        {item.reorder_point}
                        <span className="text-zinc-600 text-xs ml-1">{t('inv_units')}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <CoverageMeter days={item.days_of_coverage} reorderPoint={item.reorder_point} stock={item.current_stock} />
                      </td>
                      <td className="px-5 py-3.5 text-zinc-300 tabular-nums hidden md:table-cell">
                        {item.avg_daily_sales_30d > 0 ? (
                          <span>{item.avg_daily_sales_30d}<span className="text-zinc-600 text-xs">/j</span></span>
                        ) : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        {vel ? <TrendBadge trend={vel.trend} pct={Math.abs(vel.trend_pct)} /> : <span className="text-zinc-600 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {needsAction && (
                            <Tooltip text={`Envoyer une alerte WhatsApp pour ${item.product_name}`}>
                              <a
                                href={getWhatsAppLink(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-150"
                              >
                                <MessageCircle size={12} />
                                <span className="hidden sm:inline">{t('inv_whatsapp')}</span>
                              </a>
                            </Tooltip>
                          )}
                          <Tooltip text="Voir l'évolution du stock dans le temps">
                            <button
                              onClick={() => setHistoryTarget({ id: item.product_id, name: item.product_name })}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-brand-300 hover:bg-brand-500/10 transition-all duration-150"
                            >
                              <History size={12} />
                              <span className="hidden sm:inline">{t('inv_history')}</span>
                            </button>
                          </Tooltip>
                          <Tooltip text="Modifier les paramètres de ce produit">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await ProductsAPI.get(item.product_id)
                                  setEditTarget(res.data)
                                } catch {
                                  setToast({ msg: 'Impossible de charger le produit', type: 'error' })
                                }
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/8 transition-all duration-150"
                            >
                              <Edit2 size={12} />
                              <span className="hidden sm:inline">{t('inv_edit')}</span>
                            </button>
                          </Tooltip>
                          <Tooltip text="Supprimer ce produit définitivement">
                            <button
                              onClick={() => setDeleteTarget({ id: item.product_id, name: item.product_name })}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                            >
                              <Trash2 size={12} />
                              <span className="hidden sm:inline">{t('btn_delete')}</span>
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Velocity section */}
      {Object.keys(velocity).length > 0 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
              <Activity size={16} />
            </div>
            <div>
              <h2 className="font-medium text-zinc-200 text-sm">{t('inv_velocity_title')}</h2>
              <p className="text-xs text-zinc-600">{t('inv_velocity_sub')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(velocity)
              .sort((a, b) => b.velocity_30d - a.velocity_30d)
              .slice(0, 9)
              .map(v => (
                <div key={v.product_id} className="glass-subtle rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{v.product_name}</p>
                    <code className="text-[10px] text-zinc-600">{v.sku}</code>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] text-zinc-600 w-6">7j</span>
                      <span className="text-xs text-zinc-400 tabular-nums w-12 text-right">{v.velocity_7d}/j</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] text-zinc-600 w-6">30j</span>
                      <span className="text-xs font-semibold text-zinc-200 tabular-nums w-12 text-right">{v.velocity_30d}/j</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] text-zinc-600 w-6">90j</span>
                      <span className="text-xs text-zinc-500 tabular-nums w-12 text-right">{v.velocity_90d}/j</span>
                    </div>
                  </div>
                  <TrendBadge trend={v.trend} pct={Math.abs(v.trend_pct)} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Stock value section */}
      {items.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <DollarSign size={16} />
              </div>
              <div>
                <h2 className="font-medium text-zinc-200 text-sm">{t('curr_set_prices')}</h2>
                <p className="text-xs text-zinc-600">{t('curr_set_prices_sub')}</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400 font-mono">
              {symbol}
            </span>
          </div>

          <div className="space-y-2">
            {items.map(item => {
              const price = localPrices[item.product_id] ?? ''
              const value = price && !isNaN(parseFloat(price)) ? item.current_stock * parseFloat(price) : null
              return (
                <div key={item.product_id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate">{item.product_name}</p>
                    <span className="text-[10px] text-zinc-600 font-mono">{item.sku} · {item.current_stock} {t('inv_units')}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={price}
                        onChange={e => setLocalPrice(item.product_id, e.target.value)}
                        placeholder={t('curr_unit_price')}
                        className="w-24 px-2 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-zinc-200 focus:outline-none focus:border-brand-500/50 transition-colors"
                      />
                      <span className="text-xs text-zinc-500">{symbol}</span>
                    </div>
                    {value !== null && (
                      <span className="text-xs font-semibold text-emerald-400 w-28 text-right">
                        = {formatPrice(value)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {totalValue > 0 && (
            <div className="mt-5 pt-4 border-t border-white/8 flex items-center justify-between">
              <span className="text-sm text-zinc-400 font-medium">{t('curr_total_value')}</span>
              <span className="text-xl font-bold text-emerald-400">{formatPrice(totalValue)}</span>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Supprimer ce produit ?"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name ?? ''}" ? Toutes les données associées (ventes, prédictions, historique) seront perdues.`}
        confirmLabel="Supprimer définitivement"
        danger
        loading={deleteLoading}
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteTarget(null)}
      />

      {historyTarget && (
        <StockHistoryModal
          productId={historyTarget.id}
          productName={historyTarget.name}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {editTarget && (
        <EditProductModal
          product={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={updated => {
            setEditTarget(null)
            setToast({ msg: `"${updated.name}" mis à jour`, type: 'success' })
            load()
          }}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

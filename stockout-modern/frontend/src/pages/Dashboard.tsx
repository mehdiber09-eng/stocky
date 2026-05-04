import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, TrendingUp, ShoppingCart, Trash2, Plus, RefreshCw, Loader2,
  Sparkles, ArrowUpRight, BarChart2, Bell, Zap, AlertTriangle, Layers,
  CheckCircle, Clock, Search, Info, Rocket, PackageCheck, Brain,
} from 'lucide-react'
import { ProductsAPI, Product, AnalyticsAPI, PredictAPI, BatchPredictionResult, InventoryHealthItem } from '../api/api'
import Toast from '../components/Toast'
import { SkeletonCard } from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'
import Tooltip from '../components/Tooltip'

interface Summary {
  total_products: number
  total_predictions: number
  high_risk_predictions: number
  avg_probability: number
  total_sales_qty: number
  recent_sales_qty: number
}

const STAT_TOOLTIPS: Record<string, string> = {
  'Produits': 'Nombre total de produits suivis dans votre catalogue',
  'Prédictions': 'Nombre total de prédictions de rupture effectuées',
  'Risque élevé': 'Produits avec une probabilité de rupture supérieure à 70%',
  'Ventes 30j': 'Quantité totale vendue au cours des 30 derniers jours',
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchResult, setBatchResult] = useState<BatchPredictionResult | null>(null)
  const [healthAlerts, setHealthAlerts] = useState<InventoryHealthItem[]>([])
  const [search, setSearch] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [resP, resS, resH] = await Promise.all([
        ProductsAPI.list(),
        AnalyticsAPI.summary().catch(() => ({ data: null })),
        AnalyticsAPI.inventoryHealth().catch(() => ({ data: [] })),
      ])
      setProducts(resP.data)
      setSummary((resS as any).data)
      const critical = (resH.data as InventoryHealthItem[]).filter(
        i => i.status === 'critical' || i.status === 'warning'
      )
      setHealthAlerts(critical.slice(0, 4))
    } catch {
      setToast({ msg: 'Erreur de chargement', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  async function runBatchPredictions() {
    setBatchLoading(true)
    setBatchResult(null)
    try {
      const res = await PredictAPI.batch(30)
      setBatchResult(res.data)
    } catch {
      setToast({ msg: 'Erreur lors des prédictions', type: 'error' })
    } finally {
      setBatchLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleDelete(id: number) {
    setDeleting(id)
    setDeleteTarget(null)
    try {
      await ProductsAPI.delete(id)
      setProducts(p => p.filter(x => x.id !== id))
      setToast({ msg: 'Produit supprimé', type: 'success' })
    } catch {
      setToast({ msg: 'Erreur lors de la suppression', type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  })

  const stats = [
    {
      label: 'Produits',
      value: summary?.total_products ?? products.length,
      icon: Package,
      gradient: 'from-brand-500/20 to-brand-700/10',
      iconColor: 'text-brand-300',
      glow: 'shadow-glow',
    },
    {
      label: 'Prédictions',
      value: summary?.total_predictions ?? '—',
      icon: TrendingUp,
      gradient: 'from-cyan-500/20 to-cyan-700/10',
      iconColor: 'text-cyan-300',
      glow: 'shadow-glow-cyan',
    },
    {
      label: 'Risque élevé',
      value: summary?.high_risk_predictions ?? 0,
      icon: Bell,
      gradient: 'from-red-500/20 to-magenta-500/10',
      iconColor: 'text-red-300',
      glow: 'shadow-glow-red',
    },
    {
      label: 'Ventes 30j',
      value: summary?.recent_sales_qty ?? 0,
      icon: BarChart2,
      gradient: 'from-magenta-500/20 to-magenta-700/10',
      iconColor: 'text-magenta-400',
      glow: 'shadow-glow-magenta',
    },
  ]

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero header */}
      <div className="card-glow shimmer relative overflow-hidden">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-magenta-500/20 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 badge-info mb-3">
              <Sparkles size={11} /> StockSense v3
            </div>
            <h1 className="text-3xl font-semibold text-gradient leading-tight">Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-2">Vue d'ensemble en temps réel · {products.length} produit{products.length !== 1 ? 's' : ''} suivi{products.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchAll} className="btn-glass flex items-center gap-2 text-sm transition-all duration-150" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <Tooltip text="Ajouter un nouveau produit à votre inventaire">
              <Link to="/create-product">
                <button className="btn-primary flex items-center gap-2 text-sm transition-all duration-150">
                  <Plus size={14} />
                  Nouveau produit
                </button>
              </Link>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Onboarding banner — shown only when no products yet */}
      {!loading && products.length === 0 && (
        <div className="card border border-brand-500/30 bg-gradient-to-br from-brand-500/10 to-purple-500/5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-500/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                <Rocket size={16} className="text-brand-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Bienvenue sur StockSense !</h2>
                <p className="text-xs text-zinc-500">Suivez ces 3 étapes pour commencer</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: Package,
                  step: '1',
                  title: 'Créer votre premier produit',
                  desc: 'Ajoutez un produit à votre catalogue avec son SKU et délai fournisseur.',
                  href: '/create-product',
                  cta: 'Créer un produit',
                  color: 'text-brand-300',
                  bg: 'bg-brand-500/10',
                  btnClass: 'btn-primary',
                },
                {
                  icon: PackageCheck,
                  step: '2',
                  title: 'Saisir votre stock initial',
                  desc: 'Enregistrez vos premières ventes ou importez votre historique CSV.',
                  href: '/add-sale',
                  cta: 'Saisir une vente',
                  color: 'text-emerald-300',
                  bg: 'bg-emerald-500/10',
                  btnClass: 'btn-glass border border-emerald-500/30 hover:border-emerald-500/50',
                },
                {
                  icon: Brain,
                  step: '3',
                  title: 'Lancer votre première prédiction IA',
                  desc: 'Obtenez la probabilité de rupture et la date estimée pour chaque produit.',
                  href: '/predict',
                  cta: 'Prédire maintenant',
                  color: 'text-purple-300',
                  bg: 'bg-purple-500/10',
                  btnClass: 'btn-glass border border-purple-500/30 hover:border-purple-500/50',
                },
              ].map(({ icon: Icon, step, title, desc, href, cta, color, bg, btnClass }) => (
                <div key={step} className="flex flex-col gap-3 p-4 rounded-xl bg-white/3 border border-white/8">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon size={16} className={color} />
                    </div>
                    <span className="text-xs font-bold text-zinc-600">Étape {step}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200 mb-1">{title}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                  </div>
                  <Link to={href}>
                    <button className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${btnClass}`}>
                      {cta}
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map(({ label, value, icon: Icon, gradient, iconColor, glow }) => (
            <div key={label} className={`stat-tile bg-gradient-to-br ${gradient} ${glow} group`}>
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl glass-subtle flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform`}>
                  <Icon size={18} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
                  <Tooltip text={STAT_TOOLTIPS[label] ?? label} position="left">
                    <span className="text-zinc-600 hover:text-zinc-400 cursor-help transition-colors">
                      <Info size={11} />
                    </span>
                  </Tooltip>
                </div>
              </div>
              <p className="text-3xl font-semibold text-white mt-1">{value}</p>
            </div>
          ))
        }
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/predict" className="card group flex items-center justify-between hover:border-zinc-600 transition-all duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-300 group-hover:shadow-glow transition-all">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">Lancer une prédiction</p>
              <p className="text-xs text-zinc-500">Anticiper les ruptures</p>
            </div>
          </div>
          <ArrowUpRight size={16} className="text-zinc-600 group-hover:text-brand-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>
        <Link to="/add-sale" className="card group flex items-center justify-between hover:border-zinc-600 transition-all duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-300 group-hover:shadow-glow-emerald transition-all">
              <ShoppingCart size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">Enregistrer une vente</p>
              <p className="text-xs text-zinc-500">Mettre à jour l'inventaire</p>
            </div>
          </div>
          <ArrowUpRight size={16} className="text-zinc-600 group-hover:text-emerald-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>
        <Link to="/analytics" className="card group flex items-center justify-between hover:border-zinc-600 transition-all duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-magenta-500/10 flex items-center justify-center text-magenta-400 group-hover:shadow-glow-magenta transition-all">
              <BarChart2 size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">Voir les analytics</p>
              <p className="text-xs text-zinc-500">Historique & graphiques</p>
            </div>
          </div>
          <ArrowUpRight size={16} className="text-zinc-600 group-hover:text-magenta-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </Link>
      </div>

      {/* Reorder alerts */}
      {healthAlerts.length > 0 && (
        <div className="card border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-300">Alertes stock</h2>
            </div>
            <Link to="/inventory-health" className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1">
              Voir tout <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {healthAlerts.map(item => (
              <div key={item.product_id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                item.status === 'critical' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/8 border border-amber-500/15'
              }`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{item.product_name}</p>
                  <p className="text-xs text-zinc-500">
                    Stock: <span className={item.current_stock === 0 ? 'text-red-400 font-semibold' : 'text-amber-400'}>{item.current_stock}</span>
                    <span className="mx-1 text-zinc-700">·</span>
                    Réappro: {item.reorder_point}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                  item.status === 'critical' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {item.status === 'critical' ? 'Critique' : 'Réappro.'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch predictions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
              <Zap size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Analyse rapide — tous les produits</h2>
              <p className="text-xs text-zinc-600">Prédictions de rupture sur 30 jours</p>
            </div>
          </div>
          <Tooltip text="Analyser tous vos produits en une seule fois pour détecter les risques de rupture">
            <button
              onClick={runBatchPredictions}
              disabled={batchLoading || products.length === 0}
              className="btn-primary flex items-center gap-2 text-sm transition-all duration-150"
            >
              {batchLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {batchLoading ? 'Analyse...' : 'Prédire tout'}
            </button>
          </Tooltip>
        </div>

        {batchResult ? (
          <div className="space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Risque élevé', count: batchResult.summary.high, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle },
                { label: 'Risque modéré', count: batchResult.summary.medium, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
                { label: 'Risque faible', count: batchResult.summary.low, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
              ].map(({ label, count, color, bg, icon: Icon }) => (
                <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border ${bg}`}>
                  <Icon size={16} className={color} />
                  <div>
                    <p className={`text-lg font-bold ${color}`}>{count}</p>
                    <p className="text-xs text-zinc-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Top risk products */}
            {batchResult.results.filter(r => r.risk !== 'low').length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider">Top risques</p>
                {batchResult.results.filter(r => r.risk !== 'low').slice(0, 5).map(r => (
                  <div key={r.product_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                    <div>
                      <span className="text-sm font-medium text-zinc-200">{r.product_name}</span>
                      <code className="text-xs text-zinc-600 ml-2">{r.sku}</code>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: r.risk === 'high' ? '#ef4444' : '#f59e0b' }}>
                        {(r.probability * 100).toFixed(1)}%
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.risk === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {r.risk === 'high' ? 'Élevé' : 'Modéré'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-zinc-600 text-sm gap-2">
            <Layers size={16} />
            Cliquez sur "Prédire tout" pour analyser {products.length} produit{products.length !== 1 ? 's' : ''} en une fois
          </div>
        )}
      </div>

      {/* Products table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-white">Catalogue produits</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {search ? `${filteredProducts.length} résultat${filteredProducts.length !== 1 ? 's' : ''} sur ${products.length}` : `${products.length} entrée${products.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {!loading && products.length > 0 && (
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                className="input pl-8 py-1.5 text-sm w-52"
                placeholder="Rechercher par nom ou référence (SKU)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredProducts.length === 0 && search ? (
          <div className="text-center py-12">
            <Search size={20} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-400 font-medium">Aucun résultat pour "{search}"</p>
            <p className="text-zinc-600 text-sm mt-1">Essayez un autre nom ou SKU</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl glass-subtle flex items-center justify-center">
              <Package size={20} className="text-zinc-500" />
            </div>
            <p className="text-zinc-300 font-medium">Aucun produit</p>
            <p className="text-zinc-500 text-sm mt-1">Commencez par créer un produit pour suivre votre stock</p>
            <Link to="/create-product">
              <button className="btn-primary mt-5 text-sm">Créer un produit</button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Produit</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">SKU</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Délai</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Stock min.</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-100">{p.name}</td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <code className="text-xs bg-white/5 border border-white/8 px-2 py-0.5 rounded font-mono text-zinc-400">{p.sku}</code>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{p.lead_time_days}j</td>
                    <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{p.safety_stock}</td>
                    <td className="px-6 py-4 text-right">
                      <Tooltip text="Supprimer définitivement ce produit et tout son historique" position="left">
                        <button
                          onClick={() => setDeleteTarget(p.id)}
                          disabled={deleting === p.id}
                          className="p-2 rounded-lg text-zinc-500 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
                        >
                          {deleting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Supprimer ce produit ?"
        message={`Voulez-vous vraiment supprimer le produit "${products.find(p => p.id === deleteTarget)?.name ?? ''}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
        loading={deleting !== null}
        onConfirm={() => deleteTarget !== null && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

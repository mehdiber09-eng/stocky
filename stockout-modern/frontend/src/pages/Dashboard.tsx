import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, TrendingUp, ShoppingCart, Trash2, Plus, RefreshCw, Loader2,
  Sparkles, ArrowUpRight, BarChart2, Bell, Zap, AlertTriangle, Layers,
  CheckCircle, Clock, Search, Info, Rocket, PackageCheck, Brain, QrCode,
  TrendingDown, Minus, MessageCircle, X, WifiOff,
} from 'lucide-react'
import { ProductsAPI, Product, AnalyticsAPI, PredictAPI, BatchPredictionResult, InventoryHealthItem, SalesAPI, SalesVelocityItem } from '../api/api'
import Toast from '../components/Toast'
import { SkeletonCard } from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'
import Tooltip from '../components/Tooltip'
import QRProductModal from '../components/QRProductModal'
import OnboardingModal from '../components/OnboardingModal'
import { useLanguage } from '../context/LanguageContext'

const PRODUCTS_CACHE_KEY = 'stocky_products_cache'
const ONBOARDED_KEY = 'stocky_onboarded'

interface Summary {
  total_products: number
  total_predictions: number
  high_risk_predictions: number
  avg_probability: number
  total_sales_qty: number
  recent_sales_qty: number
}

export default function Dashboard() {
  const { t } = useLanguage()
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
  const [qrProduct, setQrProduct] = useState<Product | null>(null)
  const [velocityMap, setVelocityMap] = useState<Map<number, SalesVelocityItem>>(new Map())
  const [quickSaleProduct, setQuickSaleProduct] = useState<Product | null>(null)
  const [quickSaleQty, setQuickSaleQty] = useState('1')
  const [quickSaleLoading, setQuickSaleLoading] = useState(false)
  const [usingCache, setUsingCache] = useState(false)
  const [cacheDate, setCacheDate] = useState<Date | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [resP, resS, resH, resV] = await Promise.all([
        ProductsAPI.list(),
        AnalyticsAPI.summary().catch(() => ({ data: null })),
        AnalyticsAPI.inventoryHealth().catch(() => ({ data: [] })),
        AnalyticsAPI.salesVelocity().catch(() => ({ data: [] })),
      ])
      const loadedProducts = resP.data
      setProducts(loadedProducts)
      setSummary((resS as any).data)
      const critical = (resH.data as InventoryHealthItem[]).filter(
        i => i.status === 'critical' || i.status === 'warning'
      )
      setHealthAlerts(critical.slice(0, 4))
      const vMap = new Map<number, SalesVelocityItem>()
      ;(resV.data as SalesVelocityItem[]).forEach(v => vMap.set(v.product_id, v))
      setVelocityMap(vMap)
      setUsingCache(false)
      setCacheDate(null)
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ products: loadedProducts, ts: Date.now() }))
      if (loadedProducts.length === 0 && !localStorage.getItem(ONBOARDED_KEY)) {
        setShowOnboarding(true)
      }
    } catch {
      const raw = localStorage.getItem(PRODUCTS_CACHE_KEY)
      if (raw) {
        try {
          const { products: cached, ts } = JSON.parse(raw)
          setProducts(cached)
          setUsingCache(true)
          setCacheDate(new Date(ts))
        } catch {
          setToast({ msg: 'Erreur de chargement', type: 'error' })
        }
      } else {
        setToast({ msg: 'Erreur de chargement', type: 'error' })
      }
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

  async function handleQuickSale() {
    if (!quickSaleProduct) return
    const qty = parseInt(quickSaleQty)
    if (!qty || qty < 1) return
    setQuickSaleLoading(true)
    try {
      await SalesAPI.add({ product_id: quickSaleProduct.id, quantity: qty })
      setToast({ msg: `✓ ${qty} × ${quickSaleProduct.name} enregistré`, type: 'success' })
      setQuickSaleProduct(null)
      setQuickSaleQty('1')
    } catch {
      setToast({ msg: 'Erreur lors de l\'enregistrement', type: 'error' })
    } finally {
      setQuickSaleLoading(false)
    }
  }

  function sendWhatsAppReport() {
    if (healthAlerts.length === 0) return
    const lines = healthAlerts.map(item => {
      const status = item.status === 'critical' ? '🔴' : '🟡'
      const coverage = item.days_of_coverage !== null ? `${Math.round(item.days_of_coverage)}j` : 'N/A'
      return `${status} *${item.product_name}* (${item.sku})\n   Stock: ${item.current_stock} u · Couverture: ${coverage}`
    }).join('\n\n')
    const msg = `🚨 *Rapport Stock Critique — Stocky*\n\n${lines}\n\n_Généré le ${new Date().toLocaleDateString('fr-DZ')}_`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function sendWhatsAppReorder(item: InventoryHealthItem) {
    const reorderQty = Math.max(item.reorder_point * 2, item.safety_stock * 3, 10)
    const msg = [
      `Bonjour,`,
      ``,
      `Je souhaite passer une commande urgente :`,
      ``,
      `📦 *${item.product_name}*`,
      `   • SKU : ${item.sku}`,
      `   • Stock actuel : ${item.current_stock} unité${item.current_stock > 1 ? 's' : ''}`,
      `   • Quantité souhaitée : *${reorderQty} unités*`,
      `   • Délai souhaité : ${item.lead_time_days} jours`,
      ``,
      `Merci de confirmer la disponibilité et le prix.`,
      ``,
      `_Via Stocky — Gestion de stock intelligente_`,
    ].join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function closeOnboarding() {
    localStorage.setItem(ONBOARDED_KEY, '1')
    setShowOnboarding(false)
  }

  function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return '☀️ Bonjour'
    if (h < 18) return '🌤 Bonne après-midi'
    return '🌙 Bonsoir'
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

  // ── ÉTAT VIDE — Pour les nouveaux utilisateurs sans produit ───────────────
  // On affiche un dashboard ultra simple et focalisé : 1 seul CTA, 3 previews
  // de ce qui apparaîtra plus tard. Évite le sentiment d'abandon face à
  // 9 sections vides pour quelqu'un qui ne sait pas encore quoi faire.
  if (!loading && !usingCache && products.length === 0) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto pt-4 pb-12">
        {/* Greeting */}
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">
          {getGreeting()} ·{' '}
          {new Date().toLocaleDateString('fr-DZ', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {/* Hero principal */}
        <div className="card-glow shimmer relative overflow-hidden mb-8">
          <div className="absolute -top-32 -right-20 w-72 h-72 rounded-full bg-brand-500/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-magenta-500/15 blur-3xl pointer-events-none" />
          <div className="relative text-center sm:text-left">
            <div className="inline-flex items-center gap-2 badge-info mb-4">
              <Rocket size={11} /> Bienvenue sur Stocky
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient leading-tight mb-3">
              Anticipe tes ruptures<br className="hidden sm:block" /> de stock en 5 min
            </h1>
            <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto sm:mx-0">
              Ajoute ton premier produit, enregistre quelques ventes, et l'IA prédit
              tes ruptures à 30 jours avec 91% de précision.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center sm:justify-start">
              <Link to="/create-product">
                <button className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm">
                  <Plus size={15} /> Créer mon premier produit
                  <ArrowUpRight size={14} />
                </button>
              </Link>
              <Link to="/import">
                <button className="btn-glass w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 text-sm">
                  <Layers size={14} /> Importer un CSV
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 3 previews de ce qui apparaîtra plus tard */}
        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">
          Ce qui s'affichera ici dès ton premier produit
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            {
              icon: Bell,
              color: 'text-red-300',
              bg: 'bg-red-500/10',
              border: 'border-red-500/20',
              title: 'Alertes ruptures',
              desc: 'Notifs 30j à l\'avance pour commander à temps',
            },
            {
              icon: BarChart2,
              color: 'text-emerald-300',
              bg: 'bg-emerald-500/10',
              border: 'border-emerald-500/20',
              title: 'Prédictions IA',
              desc: 'XGBoost + LSTM avec intervalle de confiance',
            },
            {
              icon: TrendingUp,
              color: 'text-purple-300',
              bg: 'bg-purple-500/10',
              border: 'border-purple-500/20',
              title: 'Vélocité ventes',
              desc: 'Tendances 7j / 30j / 90j par produit',
            },
          ].map(({ icon: Icon, color, bg, border, title, desc }) => (
            <div key={title} className={`p-4 rounded-xl bg-white/3 border ${border} opacity-60 hover:opacity-100 transition-opacity`}>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-sm font-semibold text-zinc-200 mb-1">{title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Raccourcis */}
        <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 flex-wrap">
          <Link to="/scan-qr" className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
            <QrCode size={12} /> Scanner un produit
          </Link>
          <span className="text-zinc-700">·</span>
          <Link to="/suppliers" className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
            <Package size={12} /> Ajouter un fournisseur
          </Link>
          <span className="text-zinc-700">·</span>
          <Link to="/profile" className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
            <Sparkles size={12} /> Configurer le profil
          </Link>
        </div>

        {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
      </div>
    )
  }

  const stats = [
    {
      label: t('dash_products'),
      tooltip: 'Nombre total de produits suivis dans votre catalogue',
      value: summary?.total_products ?? products.length,
      icon: Package,
      gradient: 'from-brand-500/20 to-brand-700/10',
      iconColor: 'text-brand-300',
      glow: 'shadow-glow',
    },
    {
      label: t('dash_predictions'),
      tooltip: 'Nombre total de prédictions de rupture effectuées',
      value: summary?.total_predictions ?? '—',
      icon: TrendingUp,
      gradient: 'from-cyan-500/20 to-cyan-700/10',
      iconColor: 'text-cyan-300',
      glow: 'shadow-glow-cyan',
    },
    {
      label: t('dash_high_risk'),
      tooltip: 'Produits avec une probabilité de rupture supérieure à 70%',
      value: summary?.high_risk_predictions ?? 0,
      icon: Bell,
      gradient: 'from-red-500/20 to-magenta-500/10',
      iconColor: 'text-red-300',
      glow: 'shadow-glow-red',
    },
    {
      label: t('dash_recent_sales'),
      tooltip: 'Quantité totale vendue au cours des 30 derniers jours',
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
              <Sparkles size={11} /> Stocky v3
            </div>
            <h1 className="text-3xl font-semibold text-gradient leading-tight">{t('dash_title')}</h1>
            <p className="text-sm text-zinc-400 mt-2">{t('dash_overview')} · {products.length} produit{products.length !== 1 ? 's' : ''} suivi{products.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchAll} className="btn-glass flex items-center gap-2 text-sm transition-all duration-150" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {t('btn_refresh')}
            </button>
            <Tooltip text="Ajouter un nouveau produit à votre inventaire">
              <Link to="/create-product">
                <button className="btn-primary flex items-center gap-2 text-sm transition-all duration-150">
                  <Plus size={14} />
                  {t('dash_new_product')}
                </button>
              </Link>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Offline cache banner */}
      {usingCache && cacheDate && (
        <div className="flex items-center gap-2.5 text-xs text-amber-400 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-2.5">
          <WifiOff size={13} className="shrink-0" />
          <span>
            Données hors-ligne · Dernière sync : <strong>{cacheDate.toLocaleDateString('fr-DZ')}</strong> à {cacheDate.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={fetchAll}
            className="ml-auto flex items-center gap-1 font-medium text-amber-300 hover:text-amber-200 transition-colors"
          >
            <RefreshCw size={11} /> Réessayer
          </button>
        </div>
      )}

      {/* Résumé rapide */}
      {!loading && summary && !usingCache && (
        <div className="card flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider">{getGreeting()}</p>
            <p className="text-sm text-zinc-400 mt-0.5">
              {new Date().toLocaleDateString('fr-DZ', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{summary.recent_sales_qty}</p>
              <p className="text-[11px] text-zinc-500">ventes / 30j</p>
            </div>
            <div className="w-px h-8 bg-white/8 hidden sm:block" />
            <div className="text-center">
              <p className={`text-2xl font-bold ${healthAlerts.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{healthAlerts.length}</p>
              <p className="text-[11px] text-zinc-500">alertes actives</p>
            </div>
            <div className="w-px h-8 bg-white/8 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-300">{products.length}</p>
              <p className="text-[11px] text-zinc-500">produits suivis</p>
            </div>
          </div>
          <Tooltip text="Envoyer un bilan des alertes sur WhatsApp" position="left">
            <button
              onClick={sendWhatsAppReport}
              disabled={healthAlerts.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 transition-all"
            >
              <MessageCircle size={14} /> Bilan WhatsApp
            </button>
          </Tooltip>
        </div>
      )}

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
                <h2 className="text-sm font-semibold text-zinc-100">Bienvenue sur Stocky !</h2>
                <p className="text-xs text-zinc-500">Suivez ces 3 étapes pour commencer</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: Package,
                  step: '1',
                  title: t('dash_step1_title'),
                  desc: t('dash_step1_desc'),
                  href: '/create-product',
                  cta: t('dash_step1_cta'),
                  color: 'text-brand-300',
                  bg: 'bg-brand-500/10',
                  btnClass: 'btn-primary',
                },
                {
                  icon: PackageCheck,
                  step: '2',
                  title: t('dash_step2_title'),
                  desc: t('dash_step2_desc'),
                  href: '/add-sale',
                  cta: t('dash_step2_cta'),
                  color: 'text-emerald-300',
                  bg: 'bg-emerald-500/10',
                  btnClass: 'btn-glass border border-emerald-500/30 hover:border-emerald-500/50',
                },
                {
                  icon: Brain,
                  step: '3',
                  title: t('dash_step3_title'),
                  desc: t('dash_step3_desc'),
                  href: '/predict',
                  cta: t('dash_step3_cta'),
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
                    <span className="text-xs font-bold text-zinc-600">{t('dash_step_label')} {step}</span>
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
          : stats.map(({ label, tooltip, value, icon: Icon, gradient, iconColor, glow }) => (
            <div key={label} className={`stat-tile bg-gradient-to-br ${gradient} ${glow} group`}>
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl glass-subtle flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform`}>
                  <Icon size={18} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
                  <Tooltip text={tooltip} position="left">
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
              <p className="text-sm font-medium text-zinc-100">{t('dash_qa_predict')}</p>
              <p className="text-xs text-zinc-500">{t('dash_qa_predict_sub')}</p>
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
              <p className="text-sm font-medium text-zinc-100">{t('dash_qa_sale')}</p>
              <p className="text-xs text-zinc-500">{t('dash_qa_sale_sub')}</p>
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
              <p className="text-sm font-medium text-zinc-100">{t('dash_qa_analytics')}</p>
              <p className="text-xs text-zinc-500">{t('dash_qa_analytics_sub')}</p>
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
              <h2 className="text-sm font-semibold text-amber-300">{t('dash_alerts')}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip text="Envoyer tous les produits critiques sur WhatsApp" position="left">
                <button
                  onClick={sendWhatsAppReport}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  <MessageCircle size={12} /> WhatsApp
                </button>
              </Tooltip>
              <Link to="/inventory-health" className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1">
                {t('dash_see_all')} <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {healthAlerts.map(item => (
              <div key={item.product_id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                item.status === 'critical' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/8 border border-amber-500/15'
              }`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200 truncate">{item.product_name}</p>
                  <p className="text-xs text-zinc-500">
                    {t('dash_alert_stock')} <span className={item.current_stock === 0 ? 'text-red-400 font-semibold' : 'text-amber-400'}>{item.current_stock}</span>
                    <span className="mx-1 text-zinc-700">·</span>
                    {t('dash_alert_reorder')} {item.reorder_point}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'critical' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {item.status === 'critical' ? t('dash_alert_critical') : t('dash_alert_warning')}
                  </span>
                  <Tooltip text="Commander sur WhatsApp" position="left">
                    <button
                      onClick={() => sendWhatsAppReorder(item)}
                      className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                    >
                      <MessageCircle size={12} />
                    </button>
                  </Tooltip>
                </div>
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
              <h2 className="text-sm font-semibold text-zinc-200">{t('dash_batch_title')}</h2>
              <p className="text-xs text-zinc-600">{t('dash_batch_sub')}</p>
            </div>
          </div>
          <Tooltip text="Analyser tous vos produits en une seule fois pour détecter les risques de rupture">
            <button
              onClick={runBatchPredictions}
              disabled={batchLoading || products.length === 0}
              className="btn-primary flex items-center gap-2 text-sm transition-all duration-150"
            >
              {batchLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {batchLoading ? t('btn_loading') : t('dash_predict_all')}
            </button>
          </Tooltip>
        </div>

        {batchResult ? (
          <div className="space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('pred_result_high'), count: batchResult.summary.high, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle },
                { label: t('pred_result_medium'), count: batchResult.summary.medium, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
                { label: t('pred_result_low'), count: batchResult.summary.low, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
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
                <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider">{t('dash_top_risks')}</p>
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
                        {r.risk === 'high' ? t('dash_badge_high') : t('dash_badge_medium')}
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
            {t('dash_batch_empty')} {products.length} produit{products.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Products table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-white">{t('dash_catalog')}</h2>
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
                placeholder={t('dash_search_placeholder')}
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
            <p className="text-zinc-300 font-medium">{t('dash_no_products')}</p>
            <p className="text-zinc-500 text-sm mt-1">{t('dash_no_products_sub')}</p>
            <Link to="/create-product">
              <button className="btn-primary mt-5 text-sm">{t('dash_create_product_btn')}</button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('dash_prod_col')}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">SKU</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">{t('dash_delay_col')}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">{t('dash_safety_col')}</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const vel = velocityMap.get(p.id)
                  const trend = vel?.trend
                  return (
                  <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-100">{p.name}</span>
                        {trend === 'accelerating' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                            <TrendingUp size={9} /> +{vel ? Math.abs(Math.round(vel.trend_pct)) : ''}%
                          </span>
                        )}
                        {trend === 'decelerating' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                            <TrendingDown size={9} /> -{vel ? Math.abs(Math.round(vel.trend_pct)) : ''}%
                          </span>
                        )}
                        {trend === 'stable' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded-full">
                            <Minus size={9} /> stable
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <code className="text-xs bg-white/5 border border-white/8 px-2 py-0.5 rounded font-mono text-zinc-400">{p.sku}</code>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{p.lead_time_days}j</td>
                    <td className="px-6 py-4 text-zinc-400 hidden md:table-cell">{p.safety_stock}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip text="Enregistrer une vente rapidement" position="left">
                          <button
                            onClick={() => { setQuickSaleProduct(p); setQuickSaleQty('1') }}
                            className="p-2 rounded-lg text-zinc-500 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-150"
                          >
                            <ShoppingCart size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Générer le QR code de ce produit" position="left">
                          <button
                            onClick={() => setQrProduct(p)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-brand-300 hover:bg-brand-500/10 transition-all duration-150"
                          >
                            <QrCode size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Supprimer définitivement ce produit et tout son historique" position="left">
                          <button
                            onClick={() => setDeleteTarget(p.id)}
                            disabled={deleting === p.id}
                            className="p-2 rounded-lg text-zinc-500 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
                          >
                            {deleting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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

      {/* Quick Sale Modal */}
      {quickSaleProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setQuickSaleProduct(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-2xl border border-white/10 p-6 space-y-4"
            style={{ background: 'rgba(15,15,25,0.97)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Vente rapide</p>
                <p className="font-semibold text-white mt-0.5 truncate">{quickSaleProduct.name}</p>
              </div>
              <button onClick={() => setQuickSaleProduct(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Quantité vendue</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuickSaleQty(q => String(Math.max(1, parseInt(q || '1') - 1)))}
                  className="w-10 h-10 rounded-xl border border-white/10 text-zinc-300 hover:border-white/25 transition-colors text-lg font-bold flex items-center justify-center"
                >−</button>
                <input
                  type="number"
                  min="1"
                  value={quickSaleQty}
                  onChange={e => setQuickSaleQty(e.target.value)}
                  className="flex-1 text-center py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-lg font-bold focus:outline-none focus:border-brand-500/60 transition-all"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleQuickSale()}
                />
                <button
                  onClick={() => setQuickSaleQty(q => String(parseInt(q || '0') + 1))}
                  className="w-10 h-10 rounded-xl border border-white/10 text-zinc-300 hover:border-white/25 transition-colors text-lg font-bold flex items-center justify-center"
                >+</button>
              </div>
            </div>
            <button
              onClick={handleQuickSale}
              disabled={quickSaleLoading || !quickSaleQty || parseInt(quickSaleQty) < 1}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
            >
              {quickSaleLoading ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
              {quickSaleLoading ? 'Enregistrement...' : `Valider ${quickSaleQty} vente${parseInt(quickSaleQty) > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

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

      <QRProductModal product={qrProduct} onClose={() => setQrProduct(null)} />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
    </div>
  )
}

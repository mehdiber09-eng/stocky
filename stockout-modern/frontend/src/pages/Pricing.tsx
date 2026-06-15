import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle, Crown, Zap, CreditCard, Loader2, Shield, Star,
  ArrowRight, Sparkles, Globe, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PaymentAPI } from '../api/api'
import Toast from '../components/Toast'
import Tooltip from '../components/Tooltip'
import { useCurrency, TO_DZD, type Currency } from '../hooks/useCurrency'

const FREE_FEATURES = [
  '5 prédictions ML gratuites',
  'Tous vos produits',
  'Analytics & graphiques',
  'Import CSV',
  'Conseiller IA (Groq)',
  'Notifications in-app',
]

const PRO_FEATURES = [
  'Prédictions illimitées',
  'Analyse en lot (tous produits)',
  'Alertes email automatiques',
  'ABC analysis & santé stock',
  'Vélocité des ventes & tendances',
  'Export CSV avancé',
  'Accès API complet',
  'Support prioritaire',
]

const CURRENCY_FLAGS: Record<Currency, string> = {
  EUR: '🇫🇷',
  USD: '🌐',
  SAR: '🇸🇦',
  AED: '🇦🇪',
}

type PayMethod = 'edahabia' | 'cib' | 'paypal' | 'stripe' | null

export default function Pricing() {
  const { isAuthenticated } = useAuth()
  const { currency } = useCurrency()

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [paypalEnabled, setPaypalEnabled] = useState(false)
  const [stripeEnabled, setStripeEnabled] = useState(false)
  const [priceDzd, setPriceDzd] = useState(1500)
  const [priceUsd, setPriceUsd] = useState(15)
  const [priceEur, setPriceEur] = useState(14)
  const [loading, setLoading] = useState<PayMethod>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!isAuthenticated) { setStatusLoading(false); return }
    PaymentAPI.status()
      .then(r => {
        setIsSubscribed(r.data.is_subscribed)
        setPaypalEnabled(r.data.paypal_enabled)
        setStripeEnabled(r.data.stripe_enabled)
        setPriceDzd(r.data.price_dzd)
        setPriceUsd(r.data.price_usd)
        if (r.data.price_eur) setPriceEur(r.data.price_eur)
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false))
  }, [isAuthenticated])

  // Prix converti dans la devise active de l'utilisateur
  const mainPrice = useMemo(() => {
    switch (currency) {
      case 'EUR': return { display: priceEur.toFixed(2), unit: '€/mois' }
      case 'USD': return { display: priceUsd.toFixed(2), unit: '$/mois' }
      case 'SAR': {
        const val = Math.round(priceDzd / TO_DZD.SAR)
        return { display: val.toLocaleString('ar-SA'), unit: 'SAR/مو' }
      }
      case 'AED': {
        const val = Math.round(priceDzd / TO_DZD.AED)
        return { display: val.toLocaleString('ar-AE'), unit: 'AED/شهر' }
      }
    }
  }, [currency, priceDzd, priceEur, priceUsd])

  // Équivalents dans toutes les devises
  const equivalents = useMemo(() => {
    const priceSar = Math.round(priceDzd / TO_DZD.SAR)
    const priceAed = Math.round(priceDzd / TO_DZD.AED)
    const all: { code: Currency; flag: string; value: string; color: string }[] = [
      { code: 'SAR', flag: '🇸🇦', value: `${priceSar} SAR`,                   color: 'text-green-400  border-green-500/20  bg-green-500/10'  },
      { code: 'AED', flag: '🇦🇪', value: `${priceAed} AED`,                   color: 'text-sky-400    border-sky-500/20    bg-sky-500/10'    },
      { code: 'EUR', flag: '🇫🇷', value: `${priceEur} €`,                     color: 'text-blue-400   border-blue-500/20   bg-blue-500/10'   },
      { code: 'USD', flag: '🌐',   value: `$${priceUsd}`,                      color: 'text-violet-400 border-violet-500/20 bg-violet-500/10' },
    ]
    // Mettre la devise active en premier
    const idx = all.findIndex(e => e.code === currency)
    if (idx > 0) { const [active] = all.splice(idx, 1); all.unshift(active) }
    return all
  }, [currency, priceDzd, priceEur, priceUsd])

  async function payStripe() {
    setLoading('stripe')
    try {
      const res = await PaymentAPI.stripeCreate()
      // redirect to Stripe Checkout
      window.location.href = res.data.session_url
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || 'Erreur paiement par carte', type: 'error' })
      setLoading(null)
    }
  }

  async function payPaypal() {
    setLoading('paypal')
    try {
      const res = await PaymentAPI.paypalCreate()
      window.location.href = res.data.approval_url
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || 'Erreur PayPal', type: 'error' })
      setLoading(null)
    }
  }

  return (
    <div className="animate-fade-in space-y-12">

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 badge-info mb-2">
          <Sparkles size={11} /> Tarifs transparents
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gradient">
          Passez à Stocky Pro
        </h1>
        <p className="text-zinc-400 max-w-lg mx-auto">
          Commencez gratuitement. Passez Pro quand vous êtes prêt.
          Disponible en Algérie, Arabie Saoudite, Émirats et France.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

        {/* Free */}
        <div className="card flex flex-col">
          <div className="mb-6">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Gratuit</p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-zinc-100">0</span>
              <span className="text-zinc-400 mb-1.5">{currency}</span>
            </div>
            <p className="text-zinc-500 text-sm mt-1">Pour démarrer et tester la plateforme</p>
          </div>

          <ul className="space-y-2.5 flex-1 mb-6">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {isAuthenticated ? (
            <Link to="/dashboard">
              <button className="btn-glass w-full flex items-center justify-center gap-2 text-sm">
                Accéder au dashboard <ArrowRight size={14} />
              </button>
            </Link>
          ) : (
            <Link to="/register">
              <button className="btn-glass w-full flex items-center justify-center gap-2 text-sm">
                Créer un compte gratuit <ArrowRight size={14} />
              </button>
            </Link>
          )}
        </div>

        {/* Pro */}
        <div className="card-glow flex flex-col relative overflow-hidden">
          <div
            className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', borderRadius: '0 1rem 0 1rem' }}
          >
            ⭐ Populaire
          </div>

          {/* Prix principal dans la devise active */}
          <div className="mb-4">
            <p className="text-xs font-medium text-brand-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              Pro {CURRENCY_FLAGS[currency]}
            </p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-white">{mainPrice.display}</span>
              <span className="text-zinc-400 mb-1.5 text-sm">{mainPrice.unit}</span>
            </div>

            {/* Équivalents toutes devises */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {equivalents.map(e => (
                <span
                  key={e.code}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${e.color} ${e.code === currency ? 'ring-1 ring-white/20' : 'opacity-70'}`}
                >
                  {e.flag} {e.value}
                </span>
              ))}
            </div>
            <p className="text-zinc-500 text-xs mt-2">
              Prédictions illimitées · Sans engagement ·{' '}
              <Link to="/profile" className="text-brand-400 hover:underline">Changer de devise</Link>
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-2.5 flex-1 mb-8">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-zinc-200">
                <CheckCircle size={14} className="text-brand-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Payment section */}
          {isSubscribed ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-sm">
              <Crown size={15} /> Plan Pro actif — merci !
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-2">
              <Link to="/register">
                <button className="btn-primary w-full flex items-center justify-center gap-2">
                  <Zap size={14} /> Créer un compte et payer
                </button>
              </Link>
              <p className="text-center text-xs text-zinc-600">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-brand-400">Se connecter</Link>
              </p>
            </div>
          ) : statusLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={18} className="animate-spin text-zinc-500" />
            </div>
          ) : (
            <div className="space-y-4">


              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-700/60" />
                <span className="text-xs text-zinc-500 font-medium">— ou —</span>
                <div className="flex-1 h-px bg-zinc-700/60" />
              </div>

              {/* ── International (PayPal) ── */}
              <div className="border border-zinc-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    🌍 Paiement international
                  </p>
                  <div className="flex gap-1">
                    {(['SAR','AED','EUR','USD'] as const).map(c => (
                      <span key={c} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-700/60 text-zinc-300 border border-zinc-600/40">
                        {CURRENCY_FLAGS[c]} {c}
                      </span>
                    ))}
                  </div>
                </div>

                <Tooltip text="Paiement sécurisé via PayPal — SAR, AED, EUR, USD acceptés" position="left">
                  <button
                    onClick={payPaypal}
                    disabled={loading !== null || !paypalEnabled}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#0070ba,#003087)', color: '#fff', boxShadow: '0 4px 16px rgba(0,112,186,0.3)' }}
                  >
                    {loading === 'paypal' ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                    PayPal · {mainPrice.display} {mainPrice.unit.split('/')[0]}
                  </button>
                </Tooltip>

                <Tooltip text="Payez directement par carte (Stripe)" position="left">
                  <button
                    onClick={payStripe}
                    disabled={loading !== null || !stripeEnabled}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-600/60 text-zinc-300 hover:bg-zinc-700/40"
                  >
                    {loading === 'stripe' ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                    Carte (Visa / Mastercard)
                  </button>
                </Tooltip>

                {!paypalEnabled && (
                  <p className="text-xs text-amber-500/80 flex items-center gap-1">
                    <AlertCircle size={11} /> PayPal non configuré
                  </p>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500 max-w-2xl mx-auto">
        <span className="flex items-center gap-2">
          <Shield size={14} className="text-emerald-400" /> Paiement sécurisé SSL
        </span>
        <span className="flex items-center gap-2">
          <Globe size={14} className="text-brand-400" /> 🇸🇦 🇦🇪 🇫🇷 🌐
        </span>
        <span className="flex items-center gap-2">
          <Star size={14} className="text-amber-400" /> Support 7j/7
        </span>
        <span className="flex items-center gap-2">
          <CheckCircle size={14} className="text-zinc-400" /> Sans engagement
        </span>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-3">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Questions fréquentes</h2>
        {[
          {
            q: 'Quelles méthodes de paiement sont disponibles ?',
            a: "Paiement : Carte (Visa/Mastercard) via Stripe et PayPal pour international — aucun compte PayPal requis pour payer par carte. Vos données bancaires ne transitent jamais par nos serveurs.",
          },
          {
            q: 'Je suis en Arabie Saoudite, comment voir le prix en SAR ?',
            a: "Dans votre Profil → sélectionner le marché Arabie Saoudite. Le prix s'affichera automatiquement en SAR sur toutes les pages.",
          },
          {
            q: 'Le plan gratuit est-il vraiment gratuit ?',
            a: "Oui, 5 prédictions gratuites sans carte bancaire. Aucune limite sur les produits, l'import CSV ou le conseiller IA.",
          },
          {
            q: 'Puis-je annuler à tout moment ?',
            a: "Oui. L'abonnement Pro est mensuel sans engagement. Il expire automatiquement au bout de 30 jours si vous ne renouvelez pas.",
          },
        ].map(({ q, a }) => (
          <div key={q} className="card">
            <p className="font-medium text-zinc-200 text-sm mb-1">{q}</p>
            <p className="text-sm text-zinc-500">{a}</p>
          </div>
        ))}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

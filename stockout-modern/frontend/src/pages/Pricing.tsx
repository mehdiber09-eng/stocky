import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle, Crown, Zap, CreditCard, Loader2, Shield, Star,
  ArrowRight, Sparkles, Globe, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PaymentAPI } from '../api/api'
import Toast from '../components/Toast'

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

type PayMethod = 'edahabia' | 'cib' | 'paypal' | null

export default function Pricing() {
  const { isAuthenticated } = useAuth()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [chargilyEnabled, setChargilyEnabled] = useState(false)
  const [paypalEnabled, setPaypalEnabled] = useState(false)
  const [priceDzd, setPriceDzd] = useState(900)
  const [priceUsd, setPriceUsd] = useState(9)
  const [loading, setLoading] = useState<PayMethod>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!isAuthenticated) { setStatusLoading(false); return }
    PaymentAPI.status()
      .then(r => {
        setIsSubscribed(r.data.is_subscribed)
        setChargilyEnabled(r.data.chargily_enabled)
        setPaypalEnabled(r.data.paypal_enabled)
        setPriceDzd(r.data.price_dzd)
        setPriceUsd(r.data.price_usd)
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false))
  }, [isAuthenticated])

  async function payChargily(method: 'edahabia' | 'cib') {
    setLoading(method)
    try {
      const res = await PaymentAPI.chargilyCheckout(method)
      window.location.href = res.data.checkout_url
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || 'Erreur paiement Chargily', type: 'error' })
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
    <div className="animate-fade-in space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 badge-info mb-2">
          <Sparkles size={11} /> Tarifs transparents
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gradient">
          Choisissez votre plan
        </h1>
        <p className="text-zinc-400 max-w-lg mx-auto">
          Commencez gratuitement. Passez Pro quand vous êtes prêt.
          Paiement 100% algérien — Dahabia, CIB, Visa ou PayPal.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">

        {/* Free */}
        <div className="card flex flex-col">
          <div className="mb-6">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Gratuit</p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-zinc-100">0</span>
              <span className="text-zinc-400 mb-1.5">DZD</span>
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
          <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
               style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', borderRadius: '0 1rem 0 1rem' }}>
            ⭐ Populaire
          </div>
          <div className="mb-6">
            <p className="text-xs font-medium text-brand-400 uppercase tracking-wider mb-1">Pro</p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-white">{priceDzd.toLocaleString()}</span>
              <span className="text-zinc-400 mb-1.5">DZD/mois</span>
            </div>
            <p className="text-zinc-500 text-sm mt-1">≈ {priceUsd}€ · Prédictions illimitées</p>
          </div>

          <ul className="space-y-2.5 flex-1 mb-6">
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
              <p className="text-center text-xs text-zinc-600">Déjà un compte ? <Link to="/login" className="text-brand-400">Se connecter</Link></p>
            </div>
          ) : statusLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={18} className="animate-spin text-zinc-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Chargily section */}
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <span className="text-base">🇩🇿</span> Paiement algérien — Chargily Pay
                </p>
                <button
                  onClick={() => payChargily('edahabia')}
                  disabled={loading !== null || !chargilyEnabled}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#00a651,#007a3d)', color: '#fff', boxShadow: '0 4px 16px rgba(0,166,81,0.3)' }}
                >
                  {loading === 'edahabia' ? <Loader2 size={14} className="animate-spin" /> : '💳'}
                  Dahabia (Poste Algérie)
                </button>
                <button
                  onClick={() => payChargily('cib')}
                  disabled={loading !== null || !chargilyEnabled}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#fff', boxShadow: '0 4px 16px rgba(29,78,216,0.3)' }}
                >
                  {loading === 'cib' ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                  CIB / Visa / Mastercard
                </button>
                {!chargilyEnabled && (
                  <p className="text-xs text-amber-500/80 flex items-center gap-1">
                    <AlertCircle size={11} /> Chargily non configuré (admin requis)
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs text-zinc-600">ou</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* PayPal */}
              <button
                onClick={payPaypal}
                disabled={loading !== null || !paypalEnabled}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#0070ba,#003087)', color: '#fff', boxShadow: '0 4px 16px rgba(0,112,186,0.3)' }}
              >
                {loading === 'paypal' ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                PayPal — {priceUsd}€
              </button>
              {!paypalEnabled && (
                <p className="text-xs text-amber-500/80 flex items-center gap-1">
                  <AlertCircle size={11} /> PayPal non configuré (admin requis)
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500 max-w-2xl mx-auto">
        <span className="flex items-center gap-2"><Shield size={14} className="text-emerald-400" /> Paiement sécurisé SSL</span>
        <span className="flex items-center gap-2"><Star size={14} className="text-amber-400" /> Chargily — passerelle algérienne officielle</span>
        <span className="flex items-center gap-2"><Globe size={14} className="text-brand-400" /> Visa, Mastercard, Dahabia, CIB, PayPal</span>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-3">
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Questions fréquentes</h2>
        {[
          { q: 'Comment fonctionne Chargily ?', a: "Chargily Pay est la passerelle de paiement algérienne officielle. Elle accepte Dahabia (Poste Algérie), CIB et cartes internationales. Vos données bancaires ne transitent jamais par nos serveurs." },
          { q: 'Le plan gratuit est-il vraiment gratuit ?', a: "Oui, 5 prédictions gratuites sans carte bancaire. Aucune limite sur les produits, l'import CSV ou le conseiller IA." },
          { q: "Puis-je annuler à tout moment ?", a: "Oui. L'abonnement Pro est mensuel sans engagement. Contactez-nous par email pour annuler." },
          { q: "PayPal fonctionne-t-il depuis l'Algérie ?", a: "PayPal permet de payer depuis certains comptes algériens. Si vous rencontrez des difficultés, utilisez Chargily qui est optimisé pour l'Algérie." },
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

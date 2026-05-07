import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle, Crown, Zap, CreditCard, Loader2, Shield, Star,
  ArrowRight, Sparkles, Globe, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PaymentAPI } from '../api/api'
import Toast from '../components/Toast'
import Tooltip from '../components/Tooltip'

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
        setChargilyEnabled(r.data.chargily_enabled)
        setPaypalEnabled(r.data.paypal_enabled)
        setPriceDzd(r.data.price_dzd)
        setPriceUsd(r.data.price_usd)
        if (r.data.price_eur) setPriceEur(r.data.price_eur)
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
    <div className="animate-fade-in space-y-12">

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 badge-info mb-2">
          <Sparkles size={11} /> Tarifs transparents
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gradient">
          Passez à StockSense Pro
        </h1>
        <p className="text-zinc-400 max-w-lg mx-auto">
          Commencez gratuitement. Passez Pro quand vous êtes prêt.
          Disponible en Algérie et en France — plusieurs méthodes de paiement acceptées.
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
          <div
            className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', borderRadius: '0 1rem 0 1rem' }}
          >
            ⭐ Populaire
          </div>

          {/* Price header */}
          <div className="mb-6">
            <p className="text-xs font-medium text-brand-400 uppercase tracking-wider mb-1">Pro</p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-white">{priceDzd.toLocaleString()}</span>
              <span className="text-zinc-400 mb-1.5">DZD/mois</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">≈ {priceEur} €</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">≈ {priceUsd} $</span>
            </div>
            <p className="text-zinc-500 text-sm mt-2">Prédictions illimitées · Sans engagement</p>
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

              {/* ── Section Algérie ── */}
              <div className="border border-zinc-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <span className="text-base">🇩🇿</span> Paiement en Algérie
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                    Algérie
                  </span>
                </div>

                <Tooltip text="Paiement via votre carte postale algérienne (CCP)" position="left">
                  <button
                    onClick={() => payChargily('edahabia')}
                    disabled={loading !== null || !chargilyEnabled}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#00a651,#007a3d)', color: '#fff', boxShadow: '0 4px 16px rgba(0,166,81,0.3)' }}
                  >
                    {loading === 'edahabia' ? <Loader2 size={14} className="animate-spin" /> : '💳'}
                    Dahabia (Poste Algérie)
                  </button>
                </Tooltip>

                <Tooltip text="Paiement via votre carte bancaire algérienne CIB" position="left">
                  <button
                    onClick={() => payChargily('cib')}
                    disabled={loading !== null || !chargilyEnabled}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#fff', boxShadow: '0 4px 16px rgba(29,78,216,0.3)' }}
                  >
                    {loading === 'cib' ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                    CIB (banque algérienne)
                  </button>
                </Tooltip>

                {!chargilyEnabled && (
                  <p className="text-xs text-amber-500/80 flex items-center gap-1">
                    <AlertCircle size={11} /> Chargily non configuré (admin requis)
                  </p>
                )}
              </div>

              {/* Séparateur 1 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-700/60" />
                <span className="text-xs text-zinc-500 font-medium">— ou —</span>
                <div className="flex-1 h-px bg-zinc-700/60" />
              </div>

              {/* ── Section PayPal ── */}
              <div className="border border-zinc-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <span className="text-base">🌍</span> Paiement international
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                    France & International
                  </span>
                </div>

                <Tooltip text="Paiement sécurisé via votre compte ou carte PayPal" position="left">
                  <button
                    onClick={payPaypal}
                    disabled={loading !== null || !paypalEnabled}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#0070ba,#003087)', color: '#fff', boxShadow: '0 4px 16px rgba(0,112,186,0.3)' }}
                  >
                    {loading === 'paypal' ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                    PayPal — {priceEur}€ / {priceUsd}$
                  </button>
                </Tooltip>

                {!paypalEnabled && (
                  <p className="text-xs text-amber-500/80 flex items-center gap-1">
                    <AlertCircle size={11} /> PayPal non configuré (admin requis)
                  </p>
                )}
              </div>

              {/* Séparateur 2 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-700/60" />
                <span className="text-xs text-zinc-500 font-medium">— ou —</span>
                <div className="flex-1 h-px bg-zinc-700/60" />
              </div>

              {/* ── Section Carte bancaire ── */}
              <div className="border border-zinc-700/50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <CreditCard size={13} className="text-zinc-400" /> Carte bancaire
                </p>
                <p className="text-xs text-zinc-500">
                  Visa / Mastercard via PayPal — aucun compte PayPal requis.
                </p>
                <Tooltip text="Payez directement par carte sans créer de compte PayPal" position="left">
                  <button
                    onClick={payPaypal}
                    disabled={loading !== null || !paypalEnabled}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-600/60 text-zinc-300 hover:bg-zinc-700/40"
                  >
                    {loading === 'paypal' ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                    Payer par carte — {priceEur}€ / {priceUsd}$
                  </button>
                </Tooltip>
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
          <Globe size={14} className="text-brand-400" /> Disponible en Algérie & France
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
            a: "En Algérie : Dahabia (Poste Algérie) et CIB via Chargily. En France et à l'international : PayPal ou carte Visa / Mastercard directement via PayPal. Vos données bancaires ne transitent jamais par nos serveurs.",
          },
          {
            q: 'Le plan gratuit est-il vraiment gratuit ?',
            a: "Oui, 5 prédictions gratuites sans carte bancaire. Aucune limite sur les produits, l'import CSV ou le conseiller IA.",
          },
          {
            q: 'Puis-je annuler à tout moment ?',
            a: "Oui. L'abonnement Pro est mensuel sans engagement. Contactez-nous par email pour annuler.",
          },
          {
            q: 'Je suis en France, comment puis-je payer ?',
            a: "Utilisez PayPal ou votre carte Visa / Mastercard via PayPal. Aucun compte PayPal n'est obligatoire pour payer par carte.",
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

import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Activity, TrendingUp, Bell, Shield, Zap, ArrowRight,
  CheckCircle, Upload, Brain, BarChart3, AlertTriangle,
  Clock, MapPin, HeadphonesIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */

const problems = [
  {
    emoji: '😰',
    title: 'Stock épuisé = client perdu',
    desc: 'Chaque rupture coûte des ventes et abîme votre réputation. Le client qui ne trouve pas son produit va chez le concurrent.',
  },
  {
    emoji: '📉',
    title: 'Trop de stock = argent immobilisé',
    desc: 'Sur-stocker paralyse votre trésorerie. Des centaines de milliers de dinars bloqués dans des produits qui ne bougent pas.',
  },
  {
    emoji: '⏰',
    title: 'Décisions tardives = pertes',
    desc: 'Commander après la rupture, c\'est déjà trop tard. Les délais fournisseurs font le reste.',
  },
]

const steps = [
  {
    emoji: '📊',
    number: '01',
    title: 'Importez vos ventes',
    desc: 'Glissez-déposez un CSV ou saisissez vos ventes manuellement. StockSense apprend de votre historique en quelques secondes.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
  },
  {
    emoji: '🤖',
    number: '02',
    title: "L'IA analyse et prédit",
    desc: 'Notre moteur XGBoost + LSTM calcule la probabilité de rupture avec un intervalle de confiance à 95% sur l\'horizon de votre choix.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    emoji: '📬',
    number: '03',
    title: 'Recevez des alertes',
    desc: 'Notification email automatique dès que le risque dépasse votre seuil. Commandez au bon moment, jamais trop tôt ni trop tard.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
]

const stats = [
  { icon: TrendingUp, value: '95%', label: 'Précision ML', color: 'text-brand-400' },
  { icon: Zap, value: '< 2s', label: 'Par prédiction', color: 'text-amber-400' },
  { icon: MapPin, value: 'DZ & FR', label: 'Algérie & France', color: 'text-emerald-400' },
  { icon: HeadphonesIcon, value: '7j/7', label: 'Support inclus', color: 'text-purple-400' },
]

const testimonials = [
  {
    name: 'Karim B.',
    role: 'Gérant · épicerie fine, Alger',
    flag: '🇩🇿',
    text: 'StockSense m\'a alerté 12 jours avant la rupture de mon huile d\'olive premium. Je commande maintenant au bon moment, sans jamais sur-stocker. Les ventes ont augmenté de 18%.',
    rating: 5,
  },
  {
    name: 'Sophie M.',
    role: 'Responsable stock · pharmacie, Lyon',
    flag: '🇫🇷',
    text: 'Outil incroyablement précis. L\'import CSV nous a économisé des heures de saisie chaque semaine. Le conseiller IA répond comme un expert en supply chain. Je recommande sans hésiter.',
    rating: 5,
  },
  {
    name: 'Youcef A.',
    role: 'Propriétaire · électroménager, Oran',
    flag: '🇩🇿',
    text: 'Le seul outil vraiment adapté à la réalité algérienne : paiement CIB/Edahabia, interface en français, support réactif. Et les prédictions sont bluffantes de précision.',
    rating: 5,
  },
]

const freePlanFeatures = [
  '5 prédictions IA par mois',
  'Tous vos produits',
  'Export CSV',
  'Conseiller IA',
  'Support email',
]

const proPlanFeatures = [
  'Prédictions illimitées',
  'Alertes email automatiques',
  'Analytics & graphiques avancés',
  'Import CSV en masse',
  'Comparaison multi-produits',
  'Support prioritaire 7j/7',
]

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-amber-400 text-sm">★</span>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  if (isAuthenticated || !!localStorage.getItem('token')) {
    return <Navigate to="/dashboard" replace />
  }

  const scrollToDemo = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-surface text-zinc-100 overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-zinc-950/90 backdrop-blur border-b border-zinc-800' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight">StockSense</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
            <button onClick={scrollToDemo} className="hover:text-zinc-100 transition-colors">Comment ça marche</button>
            <Link to="/pricing" className="hover:text-zinc-100 transition-colors">Tarifs</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="btn-ghost text-sm">Connexion</Link>
            <Link to="/register">
              <button className="btn-primary text-sm px-4 py-2">Commencer gratuitement</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-36 sm:pt-44 pb-24 sm:pb-32 text-center">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-brand-600/10 blur-[120px] animate-pulse" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/25 rounded-full px-4 py-1.5 text-xs text-brand-400 mb-8 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
          </span>
          Prédiction de ruptures par IA · DZ &amp; FR
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.08]">
          <span className="text-zinc-100">Ne jamais manquer</span>
          <br />
          <span
            className="bg-gradient-to-r from-brand-400 via-purple-400 to-brand-500 bg-clip-text text-transparent"
            style={{ backgroundSize: '200% auto', animation: 'gradientShift 4s ease infinite' }}
          >
            une vente.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-zinc-400 text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          StockSense analyse vos ventes et prédit les ruptures avant qu'elles arrivent.
          Pour les commerçants <strong className="text-zinc-300">algériens</strong> et <strong className="text-zinc-300">français</strong>.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <button className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-base w-full sm:w-auto shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.03] transition-all duration-200">
              Commencer gratuitement <ArrowRight size={16} />
            </button>
          </Link>
          <button
            onClick={scrollToDemo}
            className="flex items-center justify-center gap-2 px-8 py-4 text-base w-full sm:w-auto rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 hover:bg-white/5 transition-all duration-200"
          >
            Voir une démo
          </button>
        </div>

        <p className="text-xs text-zinc-600 mt-5">
          5 prédictions gratuites · Aucune carte bancaire · CIB &amp; Edahabia acceptés
        </p>

        {/* Mini dashboard illustration */}
        <div className="mt-16 max-w-3xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur p-5 sm:p-6 text-left shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            <span className="ml-2 text-xs text-zinc-600">StockSense — Tableau de bord</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Risque rupture', value: '87%', color: 'text-red-400', bar: 'bg-red-500', w: 'w-[87%]' },
              { label: 'Niveau de stock', value: '13 unités', color: 'text-amber-400', bar: 'bg-amber-500', w: 'w-[26%]' },
              { label: 'Prédiction J+7', value: '2 unités', color: 'text-brand-400', bar: 'bg-brand-500', w: 'w-[10%]' },
            ].map(({ label, value, color, bar, w }) => (
              <div key={label} className="bg-zinc-800/60 rounded-lg p-3">
                <p className="text-zinc-500 text-xs mb-1">{label}</p>
                <p className={`font-semibold text-sm ${color}`}>{value}</p>
                <div className="mt-2 h-1 bg-zinc-700 rounded-full overflow-hidden">
                  <div className={`h-full ${bar} ${w} rounded-full`} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <Bell size={12} className="text-red-400 shrink-0" />
            <span className="text-xs text-red-300">Alerte · Huile d'olive premium · Rupture estimée dans <strong>4 jours</strong> · Commander maintenant</span>
          </div>
        </div>
      </section>

      {/* ── LE PROBLÈME ── */}
      <section className="border-t border-zinc-800 py-20 sm:py-24 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Le problème</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">
              Chaque commerçant connaît cette douleur
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {problems.map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="font-semibold text-zinc-100 mb-2 text-base">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LA SOLUTION / HOW IT WORKS ── */}
      <section id="how-it-works" className="border-t border-zinc-800 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">La solution</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">
              Opérationnel en moins de 5 minutes
            </h2>
            <p className="text-zinc-500 mt-3 max-w-xl mx-auto text-sm sm:text-base">
              Trois étapes simples. Zéro formation requise.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connector lines (desktop) */}
            <div className="hidden md:flex absolute top-12 left-[calc(33.33%+1.5rem)] right-[calc(33.33%+1.5rem)] items-center justify-between pointer-events-none" aria-hidden>
              <ArrowRight size={18} className="text-zinc-700 -ml-2" />
              <ArrowRight size={18} className="text-zinc-700 -mr-2" />
            </div>

            {steps.map(({ emoji, number, title, desc, color, bg, border }) => (
              <div
                key={number}
                className={`rounded-2xl border ${border} ${bg} p-6 flex flex-col items-center text-center relative`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-zinc-900 border ${border} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                  {emoji}
                </div>
                <span className={`text-xs font-bold ${color} mb-2 tracking-widest`}>ÉTAPE {number}</span>
                <h3 className="font-semibold text-zinc-100 mb-2 text-base">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS / SOCIAL PROOF ── */}
      <section className="border-t border-zinc-800 py-20 sm:py-24 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-3">
              Rejoignez les commerçants qui ne tombent plus en rupture
            </h2>
            <p className="text-zinc-500 text-sm sm:text-base">
              Des résultats concrets, mesurables, dès la première semaine.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
            {stats.map(({ icon: Icon, value, label, color }) => (
              <div
                key={label}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-center hover:border-zinc-700 transition-colors"
              >
                <Icon size={20} className={`${color} mx-auto mb-2`} />
                <p className={`text-2xl sm:text-3xl font-bold ${color} mb-1`}>{value}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(({ name, role, flag, text, rating }) => (
              <div
                key={name}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col gap-4 hover:border-zinc-700 transition-colors"
              >
                <StarRating count={rating} />
                <p className="text-zinc-400 text-sm leading-relaxed flex-1">"{text}"</p>
                <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
                  <span className="text-xl">{flag}</span>
                  <div>
                    <p className="text-zinc-200 font-medium text-sm">{name}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFS COURT ── */}
      <section className="border-t border-zinc-800 py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Tarifs</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">Simple et transparent</h2>
            <p className="text-zinc-500 mt-3 text-sm">
              Paiement 100% algérien (CIB / Edahabia) · ou carte bancaire française
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {/* Gratuit */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h3 className="font-bold text-zinc-100 mb-1 text-lg">Gratuit</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-zinc-100">0</span>
                <span className="text-zinc-500 text-sm">DA / mois</span>
              </div>
              <p className="text-zinc-600 text-xs mb-6">Pour commencer sans risque</p>
              <ul className="space-y-2.5 mb-6">
                {freePlanFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                    <CheckCircle size={13} className="text-zinc-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <button className="w-full py-2.5 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:bg-white/5 transition-all">
                  Commencer gratuitement
                </button>
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border border-brand-600/50 bg-brand-500/5 p-6 shadow-lg shadow-brand-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                Recommandé
              </div>
              <h3 className="font-bold text-zinc-100 mb-1 text-lg">Pro</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-zinc-100">900</span>
                <span className="text-zinc-500 text-sm">DA / mois</span>
              </div>
              <p className="text-zinc-500 text-xs mb-6">ou 9 € / mois · Annulation libre</p>
              <ul className="space-y-2.5 mb-6">
                {proPlanFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle size={13} className="text-brand-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <button className="btn-primary w-full py-2.5 rounded-xl text-sm font-medium shadow-md shadow-brand-500/20 hover:scale-[1.02] transition-transform">
                  Essayer 14 jours gratuits
                </button>
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-4"
            >
              Voir les tarifs complets <ArrowRight size={13} />
            </Link>
          </div>

          <p className="text-center text-xs text-zinc-600 mt-4 flex items-center justify-center gap-1.5">
            <Shield size={11} /> Paiement sécurisé · Aucun engagement · Annulation à tout moment
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="border-t border-zinc-800 py-20 sm:py-24 text-center bg-zinc-900/50">
        <div className="max-w-xl mx-auto px-4 sm:px-8">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Prêt à anticiper vos ruptures ?
          </h2>
          <p className="text-zinc-500 mb-10 text-sm sm:text-base">
            Rejoignez les commerçants algériens et français qui pilotent leur stock avec intelligence.
          </p>
          <Link to="/register">
            <button className="btn-primary px-10 py-4 text-base flex items-center gap-2 mx-auto shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.03] transition-all duration-200">
              Commencer gratuitement <ArrowRight size={16} />
            </button>
          </Link>
          <p className="text-xs text-zinc-600 mt-4">Sans carte bancaire · 5 prédictions offertes · Annulation libre</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-800 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <Activity size={12} className="text-white" />
            </div>
            <span className="font-semibold text-zinc-500">StockSense</span>
            <span className="text-zinc-700">·</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/pricing" className="hover:text-zinc-300 transition-colors">Tarifs</Link>
            <Link to="/login" className="hover:text-zinc-300 transition-colors">Connexion</Link>
            <a href="mailto:support@stocksense.app" className="hover:text-zinc-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Gradient animation keyframes */}
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% center; }
          50%  { background-position: 100% center; }
          100% { background-position: 0% center; }
        }
      `}</style>
    </div>
  )
}

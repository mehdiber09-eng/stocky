import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Activity, TrendingUp, BarChart2, Bell, Shield, Zap, ArrowRight,
  CheckCircle, MessageCircle, Upload, GitCompare, ChevronDown,
  PackageCheck, Brain, ClipboardList,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const features = [
  { icon: TrendingUp, title: 'Prédiction ML', desc: 'XGBoost + LSTM pour anticiper vos ruptures avec précision et intervalle de confiance à 95%', color: 'text-brand-400 bg-brand-500/10' },
  { icon: BarChart2, title: 'Analytics avancés', desc: 'Historique complet, graphiques interactifs et export CSV de toutes vos données', color: 'text-emerald-400 bg-emerald-500/10' },
  { icon: Bell, title: 'Alertes email', desc: 'Notification automatique quand le risque dépasse votre seuil personnalisé', color: 'text-amber-400 bg-amber-500/10' },
  { icon: GitCompare, title: 'Comparaison', desc: 'Comparez jusqu\'à 5 produits simultanément avec classement par niveau de risque', color: 'text-purple-400 bg-purple-500/10' },
  { icon: Upload, title: 'Import CSV', desc: 'Importez vos ventes en masse par drag & drop avec validation ligne par ligne', color: 'text-pink-400 bg-pink-500/10' },
  { icon: MessageCircle, title: 'Conseiller IA', desc: 'Chatbot expert en supply chain pour vous guider dans vos décisions de stock', color: 'text-cyan-400 bg-cyan-500/10' },
]

const howItWorksSteps = [
  {
    icon: ClipboardList,
    step: '01',
    title: 'Ajoutez vos produits',
    desc: 'Créez votre catalogue en quelques clics : nom, SKU, stock de sécurité, délai fournisseur. Importez aussi depuis Excel ou CSV.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: PackageCheck,
    step: '02',
    title: 'Enregistrez vos ventes',
    desc: 'Saisissez vos mouvements de stock manuellement ou importez vos historiques de ventes en masse. StockSense apprend de vos données.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Brain,
    step: '03',
    title: 'Obtenez des prédictions IA',
    desc: 'En 1 clic, notre moteur ML calcule la probabilité de rupture sur l\'horizon de votre choix, avec date estimée et conseils concrets.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
]

const testimonials = [
  {
    name: 'Karim B.',
    role: 'Gérant — épicerie fine, Alger',
    text: 'Depuis que j\'utilise StockSense, je ne me retrouve plus en rupture de mon huile d\'olive premium. L\'IA m\'a alerté 12 jours avant la rupture. Je commande au bon moment, sans sur-stocker.',
    rating: 5,
  },
  {
    name: 'Amira L.',
    role: 'Responsable stock — pharmacie, Oran',
    text: 'L\'import CSV nous a économisé des heures de saisie. Le conseiller IA répond à mes questions comme un expert en supply chain. Vraiment impressionnant pour le prix.',
    rating: 5,
  },
  {
    name: 'Youcef M.',
    role: 'Propriétaire — magasin électroménager, Constantine',
    text: 'J\'ai essayé plusieurs outils mais StockSense est le seul adapté à la réalité algérienne : paiement local, interface claire, et le support répond rapidement en français.',
    rating: 5,
  },
]

const faqs = [
  {
    q: 'Est-ce que StockSense fonctionne sans connexion internet permanente ?',
    a: 'StockSense est une application web qui nécessite une connexion internet. Cependant, vos données sont sauvegardées automatiquement côté serveur, donc vous ne perdez rien en cas de coupure.',
  },
  {
    q: 'Puis-je importer mes données depuis Excel ?',
    a: 'Oui, notre module Import CSV accepte les fichiers CSV exportés depuis Excel. Un guide de formatage est disponible directement dans l\'interface.',
  },
  {
    q: 'Comment fonctionne le paiement ?',
    a: 'Nous acceptons les cartes CIB et Edahabia. Le paiement est 100% sécurisé et traité localement. Aucune carte étrangère requise.',
  },
  {
    q: 'Combien de produits puis-je gérer ?',
    a: 'Tous les plans permettent de gérer un nombre illimité de produits. La différence porte sur le nombre de prédictions mensuelles disponibles.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Vos données sont hébergées en Europe, chiffrées en transit (TLS 1.3) et au repos (AES-256). Nous ne partageons jamais vos données commerciales.',
  },
]

const plans = [
  {
    name: 'Gratuit',
    price: '0 DA',
    period: '',
    features: ['5 prédictions', 'Tous les produits', 'Export CSV', 'Conseiller IA', 'Support email'],
    cta: 'Commencer gratuitement',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '990 DA',
    period: '/mois',
    features: ['Prédictions illimitées', 'Alertes email auto', 'Analytics avancés', 'Import CSV en masse', 'Comparaison multi-produits', 'Support prioritaire'],
    cta: 'Essayer 14 jours gratuits',
    highlight: true,
  },
]

const trustStats = [
  { value: '500+', label: 'Commerçants actifs' },
  { value: '99.9%', label: 'Uptime garanti' },
  { value: '100%', label: 'Paiement algérien' },
  { value: '95%', label: 'Précision ML' },
]

const perfStats = [
  { value: '95%', label: 'Précision ML' },
  { value: '<1s', label: 'Temps de réponse' },
  { value: '∞', label: 'Produits supportés' },
  { value: '24/7', label: 'Monitoring' },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-amber-400 text-sm">★</span>
      ))}
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-surface-border last:border-0">
      <button
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-zinc-100 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-zinc-200 font-medium text-sm">{q}</span>
        <ChevronDown
          size={16}
          className={`text-zinc-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-zinc-500 text-sm leading-relaxed">{a}</p>
      )}
    </div>
  )
}

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

  return (
    <div className="min-h-screen bg-surface text-zinc-100">
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-surface/90 backdrop-blur border-b border-surface-border' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <span className="font-semibold text-zinc-100">StockSense</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="btn-ghost text-sm">Connexion</Link>
            <Link to="/register">
              <button className="btn-primary text-sm px-4 py-2">Démarrer gratuitement</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-36 sm:pt-40 pb-20 sm:pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-xs text-brand-400 mb-8 animate-fade-in">
          <Zap size={10} /> Nouveau — Conseiller IA intégré
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 leading-tight animate-slide-up">
          Anticipez vos ruptures<br />
          <span className="text-brand-400">avant qu'elles arrivent</span>
        </h1>
        <p className="text-zinc-400 text-base sm:text-xl max-w-2xl mx-auto mb-10 animate-fade-in">
          StockSense prédit avec précision les risques de rupture de stock grâce au ML — avec date estimée, jauge visuelle, alertes automatiques et conseiller IA.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
          <Link to="/register" className="w-full sm:w-auto">
            <button className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-base w-full sm:w-auto shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-105 transition-all duration-200">
              Démarrer gratuitement <ArrowRight size={16} />
            </button>
          </Link>
          <Link to="/login" className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm">
            Déjà un compte →
          </Link>
        </div>
        <p className="text-xs text-zinc-600 mt-4">5 prédictions gratuites · Aucune carte bancaire requise</p>
      </section>

      {/* Trust stats bar */}
      <section className="border-y border-surface-border py-10 bg-white/2">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {trustStats.map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl sm:text-3xl font-semibold text-brand-400 mb-1">{value}</p>
              <p className="text-xs sm:text-sm text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-20 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-3">Tout ce qu'il vous faut</h2>
        <p className="text-zinc-500 text-center mb-12 sm:mb-14">Une plateforme complète pour gérer votre stock intelligemment</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card hover:border-zinc-600 transition-colors">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                <Icon size={18} />
              </div>
              <h3 className="font-medium text-zinc-200 mb-2">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-surface-border py-20 sm:py-24 bg-white/2">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-3">Comment ça marche</h2>
          <p className="text-zinc-500 text-center mb-12 sm:mb-14">Opérationnel en moins de 5 minutes, sans formation requise</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {howItWorksSteps.map(({ icon: Icon, step, title, desc, color, bg }, idx) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                {/* Connector line between steps */}
                {idx < howItWorksSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px bg-gradient-to-r from-surface-border to-transparent" />
                )}
                <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center mb-5 relative`}>
                  <Icon size={28} className={color} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface border border-surface-border flex items-center justify-center text-xs font-bold text-zinc-500">
                    {step}
                  </span>
                </div>
                <h3 className="font-semibold text-zinc-200 mb-2 text-lg">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-surface-border py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-3">Ce que disent nos clients</h2>
          <p className="text-zinc-500 text-center mb-12 sm:mb-14">Des commerçants algériens qui ont repris le contrôle de leur stock</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, rating }) => (
              <div key={name} className="card flex flex-col gap-4">
                <StarRating count={rating} />
                <p className="text-zinc-400 text-sm leading-relaxed flex-1">"{text}"</p>
                <div className="pt-2 border-t border-white/6">
                  <p className="text-zinc-200 font-medium text-sm">{name}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance stats */}
      <section className="border-t border-surface-border py-10 bg-white/2">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {perfStats.map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl sm:text-3xl font-semibold text-brand-400 mb-1">{value}</p>
              <p className="text-xs sm:text-sm text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-surface-border py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-3">Tarifs simples</h2>
          <p className="text-zinc-500 text-center mb-12 sm:mb-14">Commencez gratuitement · Paiement 100% algérien (CIB / Edahabia)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`card relative ${plan.highlight ? 'border-brand-600/60 bg-brand-500/5' : ''}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-3 py-0.5 rounded-full font-medium">
                    Recommandé
                  </div>
                )}
                <h3 className="font-semibold text-zinc-100 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                      <CheckCircle size={13} className="text-brand-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <button className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${plan.highlight ? 'btn-primary' : 'btn-ghost border border-surface-border'}`}>
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-600 mt-6 flex items-center justify-center gap-1.5">
            <Shield size={11} /> Paiement sécurisé · Aucun engagement · Annulation à tout moment
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-surface-border py-20 sm:py-24 bg-white/2">
        <div className="max-w-2xl mx-auto px-4 sm:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-3">Questions fréquentes</h2>
          <p className="text-zinc-500 text-center mb-10 sm:mb-12">Tout ce que vous devez savoir avant de vous lancer</p>
          <div className="card p-0 overflow-hidden divide-y divide-surface-border">
            <div className="px-6">
              {faqs.map(({ q, a }) => (
                <FaqItem key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-surface-border py-20 sm:py-24 text-center">
        <div className="max-w-xl mx-auto px-4 sm:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Prêt à anticiper vos ruptures ?</h2>
          <p className="text-zinc-500 mb-10">Rejoignez plus de 500 commerçants algériens qui pilotent leur stock avec StockSense.</p>
          <Link to="/register">
            <button className="btn-primary px-10 py-4 text-base flex items-center gap-2 mx-auto shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-105 transition-all duration-200">
              Commencer gratuitement <ArrowRight size={16} />
            </button>
          </Link>
          <p className="text-xs text-zinc-600 mt-4">Sans carte bancaire · 5 prédictions offertes · Annulation libre</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border px-4 sm:px-8 py-8 text-center text-zinc-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity size={14} className="text-brand-500" />
          <span className="font-medium text-zinc-500">StockSense</span>
        </div>
        <p>© 2026 StockSense · Prédiction de ruptures de stock par ML · Fait avec ♥ en Algérie</p>
      </footer>
    </div>
  )
}

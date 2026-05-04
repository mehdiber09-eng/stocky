import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, ArrowLeft, Home, BarChart2, TrendingUp } from 'lucide-react'

const suggestions = [
  { label: 'Tableau de bord', href: '/dashboard', icon: Home, desc: 'Vue d\'ensemble de votre stock' },
  { label: 'Prédiction IA', href: '/predict', icon: TrendingUp, desc: 'Analyser les risques de rupture' },
  { label: 'Analytics', href: '/analytics', icon: BarChart2, desc: 'Historique et graphiques' },
]

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full animate-fade-in text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12 opacity-60">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span className="font-semibold text-zinc-300 text-sm">StockSense</span>
        </div>

        {/* 404 visual */}
        <div className="relative mb-8 select-none">
          <p className="text-[8rem] sm:text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-zinc-700 to-zinc-900 leading-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shadow-glow">
              <Activity size={32} className="text-brand-400" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-semibold text-zinc-100 mb-3">Page introuvable</h1>
        <p className="text-zinc-500 mb-10 leading-relaxed">
          La page que vous cherchez n'existe pas ou a été déplacée.<br />
          Voici quelques liens utiles pour continuer :
        </p>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {suggestions.map(({ label, href, icon: Icon, desc }) => (
            <Link
              key={href}
              to={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-surface-border bg-white/3 hover:bg-white/6 hover:border-zinc-600 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:shadow-glow transition-all">
                <Icon size={17} />
              </div>
              <span className="text-sm font-medium text-zinc-200">{label}</span>
              <span className="text-xs text-zinc-600 text-center">{desc}</span>
            </Link>
          ))}
        </div>

        {/* Back & Home buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={14} /> Page précédente
          </button>
          <Link to="/">
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Home size={14} /> Accueil
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

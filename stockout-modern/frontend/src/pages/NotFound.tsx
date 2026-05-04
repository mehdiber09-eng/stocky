import React from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center text-center px-4">
      <div className="animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-8">
          <Activity size={28} className="text-white" />
        </div>
        <p className="text-brand-400 text-sm font-mono mb-3">404</p>
        <h1 className="text-3xl font-semibold text-zinc-100 mb-3">Page introuvable</h1>
        <p className="text-zinc-500 mb-8 max-w-sm mx-auto">La page que vous cherchez n'existe pas ou a été déplacée.</p>
        <Link to="/">
          <button className="btn-primary flex items-center gap-2 mx-auto">
            <ArrowLeft size={14} /> Retour à l'accueil
          </button>
        </Link>
      </div>
    </div>
  )
}

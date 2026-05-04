import React, { useEffect, useState } from 'react'
import { Cookie, Shield, X, CheckCircle } from 'lucide-react'

const STORAGE_KEY = 'stocky_cookie_consent'

type Consent = { essential: true; analytics: boolean; accepted_at: string }

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Small delay to not flash on initial load
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  function saveConsent(analyticsEnabled: boolean) {
    const consent: Consent = {
      essential: true,
      analytics: analyticsEnabled,
      accepted_at: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto glass-strong rounded-2xl border border-white/12 p-5 shadow-2xl">
        {!showDetails ? (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-brand-500/20 border border-brand-500/30">
              <Cookie size={18} className="text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white mb-1">Nous utilisons des cookies</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Stocky utilise des cookies essentiels pour le fonctionnement du service et des cookies analytics
                pour améliorer votre expérience. Vos données ne sont jamais revendues.
              </p>
              <button
                onClick={() => setShowDetails(true)}
                className="text-xs text-brand-400 hover:text-brand-300 mt-1 underline underline-offset-2"
              >
                Personnaliser
              </button>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <button
                onClick={() => saveConsent(false)}
                className="px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
              >
                Essentiels seulement
              </button>
              <button
                onClick={() => saveConsent(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}
              >
                Accepter tout
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-brand-400" />
                <span className="text-sm font-semibold text-white">Préférences cookies</span>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Essential cookies — always on */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/8">
              <div>
                <p className="text-sm text-white font-medium">Cookies essentiels</p>
                <p className="text-xs text-zinc-500 mt-0.5">Authentification, session, sécurité. Requis.</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                <CheckCircle size={14} />
                <span>Toujours actif</span>
              </div>
            </div>

            {/* Analytics cookies — toggle */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/8">
              <div>
                <p className="text-sm text-white font-medium">Cookies analytics</p>
                <p className="text-xs text-zinc-500 mt-0.5">Amélioration de l'expérience, mesure d'usage.</p>
              </div>
              <button
                onClick={() => setAnalytics(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${analytics ? 'bg-brand-500' : 'bg-white/20'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${analytics ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => saveConsent(analytics)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

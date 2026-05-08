import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ShoppingCart, Brain, ArrowRight, Sparkles, X, QrCode } from 'lucide-react'

interface Props {
  onClose: () => void
}

const STEPS = [
  {
    icon: Package,
    color: 'text-brand-300',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
    step: '1',
    title: 'Créez votre premier produit',
    desc: 'Ajoutez un produit avec son SKU, délai fournisseur et stock initial. Scannez un code-barres EAN pour aller encore plus vite.',
  },
  {
    icon: ShoppingCart,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    step: '2',
    title: 'Enregistrez vos ventes',
    desc: "Saisissez vos ventes manuellement, scannez via QR ou importez un CSV. L'IA apprend votre vélocité pour affiner ses prédictions.",
  },
  {
    icon: Brain,
    color: 'text-purple-300',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    step: '3',
    title: 'Lancez votre première prédiction IA',
    desc: 'XGBoost + LSTM calcule la probabilité de rupture sur 7 à 90 jours. Recevez des alertes avant que votre stock tombe à zéro.',
  },
]

export default function OnboardingModal({ onClose }: Props) {
  const navigate = useNavigate()

  function handleStart() {
    onClose()
    navigate('/create-product')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative w-full max-w-xl rounded-2xl border border-white/10 overflow-hidden animate-fade-in flex flex-col"
        style={{ background: 'rgba(11,11,19,0.98)', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glow blobs */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Header — fixe en haut */}
        <div className="relative px-5 sm:px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/8 transition-all"
            aria-label="Fermer"
          >
            <X size={15} />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}
            >
              <Sparkles size={17} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white">Bienvenue sur Stocky !</h2>
              <p className="text-xs text-zinc-500">3 étapes pour anticiper vos ruptures de stock</p>
            </div>
          </div>
        </div>

        {/* Steps — zone scrollable au milieu */}
        <div className="relative flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          {STEPS.map(({ icon: Icon, color, bg, border, step, title, desc }) => (
            <div key={step} className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/3 border ${border}`}>
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon size={17} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Étape {step}</p>
                <p className="text-sm font-semibold text-zinc-100 mb-1">{title}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}

          {/* Bonus tip */}
          <div className="flex items-start gap-3 px-3 sm:px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <QrCode size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              <span className="text-amber-300 font-medium">Astuce :</span> Utilisez le scan QR pour enregistrer des ventes en 1 seconde depuis votre mobile.
            </p>
          </div>
        </div>

        {/* CTA — fixe en bas */}
        <div className="relative shrink-0 px-5 sm:px-6 py-4 border-t border-white/8 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-between gap-3"
             style={{ background: 'rgba(11,11,19,0.98)' }}>
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2 sm:py-0 text-center sm:text-left"
          >
            Passer pour l'instant
          </button>
          <button
            onClick={handleStart}
            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
          >
            <Package size={14} />
            <span className="whitespace-nowrap">Créer mon premier produit</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Crown, ArrowRight, RefreshCw } from 'lucide-react'
import { PaymentAPI } from '../api/api'

interface Props {
  type: 'success' | 'cancel'
}

export default function PaymentResult({ type }: Props) {
  const [searchParams] = useSearchParams()
  const [capturing, setCapturing] = useState(false)
  const [captured, setCaptured] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // PayPal redirects back with ?token=<order_id>&PayerID=<payer_id>
    if (type !== 'success') return
    const orderId = searchParams.get('token') || searchParams.get('order_id')
    if (!orderId) return

    setCapturing(true)
    PaymentAPI.paypalCapture(orderId)
      .then(() => setCaptured(true))
      .catch(err => setError(err.response?.data?.detail || 'Erreur lors de la validation du paiement'))
      .finally(() => setCapturing(false))
  }, [type, searchParams])

  if (type === 'cancel') {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-zinc-500/10 flex items-center justify-center">
          <XCircle size={32} className="text-zinc-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">Paiement annulé</h1>
          <p className="text-zinc-500">Votre paiement a été annulé. Aucun montant n'a été débité.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/pricing">
            <button className="btn-primary flex items-center gap-2">
              <RefreshCw size={14} /> Réessayer
            </button>
          </Link>
          <Link to="/dashboard">
            <button className="btn-glass flex items-center gap-2">
              Dashboard <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // success
  if (capturing) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <Loader2 size={36} className="animate-spin text-brand-400" />
        <p className="text-zinc-400">Validation du paiement en cours…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <XCircle size={32} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">Erreur de validation</h1>
          <p className="text-zinc-500">{error}</p>
        </div>
        <Link to="/pricing">
          <button className="btn-primary flex items-center gap-2">
            <RefreshCw size={14} /> Réessayer
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
      <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
        <CheckCircle size={40} className="text-emerald-400" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium mb-2">
          <Crown size={14} /> Plan Pro activé !
        </div>
        <h1 className="text-3xl font-bold text-zinc-100">Paiement confirmé</h1>
        <p className="text-zinc-400">
          Bienvenue dans StockSense Pro — prédictions illimitées et toutes les fonctionnalités avancées sont maintenant actives.
        </p>
      </div>

      <div className="card w-full text-left space-y-2">
        {[
          'Prédictions illimitées débloquées',
          'Alertes email automatiques actives',
          'Analyse ABC & santé stock',
          'Export CSV avancé',
          'Support prioritaire',
        ].map(f => (
          <div key={f} className="flex items-center gap-2 text-sm text-zinc-300">
            <CheckCircle size={13} className="text-emerald-400 shrink-0" />
            {f}
          </div>
        ))}
      </div>

      <Link to="/dashboard">
        <button className="btn-primary flex items-center gap-2 px-6">
          Aller au dashboard <ArrowRight size={14} />
        </button>
      </Link>
    </div>
  )
}

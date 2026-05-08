import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader2, Activity, ArrowRight } from 'lucide-react'
import { AuthAPI } from '../api/api'

type Status = 'verifying' | 'success' | 'error'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState<Status>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setStatus('error')
      setErrorMsg('Lien invalide — aucun token fourni.')
      return
    }
    AuthAPI.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error')
        setErrorMsg(err.response?.data?.detail || 'Le lien est invalide ou expiré.')
      })
  }, [params])

  return (
    <div className="bg-aurora min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-sm animate-fade-in relative z-10">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
            <Activity size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white leading-tight text-lg">Stocky</h1>
            <p className="text-xs text-zinc-400">Vérification d'email</p>
          </div>
        </div>

        <div className="card-glow text-center">
          {status === 'verifying' && (
            <>
              <Loader2 size={36} className="text-brand-400 animate-spin mx-auto mb-5" />
              <h2 className="text-lg font-semibold text-white mb-2">Vérification en cours...</h2>
              <p className="text-sm text-zinc-400">On confirme ton email, ça prend une seconde.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 0 40px rgba(16,185,129,0.4)' }}>
                <CheckCircle size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Email confirmé ✨</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Ton compte est maintenant activé. Tu peux te connecter.
              </p>
              <Link to="/login">
                <button className="btn-primary w-full flex items-center justify-center gap-2">
                  Se connecter <ArrowRight size={14} />
                </button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-red-500/15 border border-red-500/30">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Lien invalide</h2>
              <p className="text-sm text-zinc-400 mb-6">{errorMsg}</p>
              <Link to="/register">
                <button className="btn-primary w-full">
                  Demander un nouveau lien
                </button>
              </Link>
              <Link to="/login" className="block mt-3">
                <button className="btn-glass w-full text-sm">
                  Aller à la connexion
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

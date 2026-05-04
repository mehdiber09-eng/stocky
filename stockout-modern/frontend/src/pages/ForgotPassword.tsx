import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Activity, AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import API from '../api/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await API.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue. Vérifiez votre adresse email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-aurora min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-sm animate-fade-in relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div
            className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}
          >
            <Activity size={22} className="text-white relative z-10" />
            <div className="absolute inset-0 bg-white/20 blur-md rounded-2xl" />
          </div>
          <div>
            <h1 className="font-semibold text-white leading-tight text-lg">StockSense</h1>
            <p className="text-xs text-zinc-400">Prédiction de ruptures</p>
          </div>
        </div>

        <div className="card-glow">
          {sent ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Email envoyé !</h2>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Si un compte existe pour <span className="text-zinc-200 font-medium">{email}</span>,
                vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="text-xs text-zinc-600 mb-6">
                Vérifiez également votre dossier spam.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2 text-sm">
                <ArrowLeft size={14} />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <h2 className="text-xl font-semibold text-white mb-1">Mot de passe oublié</h2>
              <p className="text-sm text-zinc-500 mb-6">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label">Adresse email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email"
                      className="input pl-9"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
                </button>
              </form>

              <p className="text-center text-sm text-zinc-500 mt-5">
                <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors flex items-center justify-center gap-1">
                  <ArrowLeft size={13} />
                  Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

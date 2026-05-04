import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Activity, AlertCircle, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import API from '../api/api'
import Toast from '../components/Toast'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  if (!token) {
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in relative z-10 card-glow text-center py-8">
          <AlertCircle size={32} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Lien invalide</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <Link to="/forgot-password" className="btn-primary inline-flex items-center gap-2 text-sm">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    try {
      await API.post('/auth/reset-password', { token, new_password: newPassword })
      setToast({ msg: 'Mot de passe réinitialisé ! Vous pouvez vous connecter.', type: 'success' })
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lien expiré ou invalide. Demandez un nouveau lien.')
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
          <h2 className="text-xl font-semibold text-white mb-1">Nouveau mot de passe</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Choisissez un mot de passe sécurisé pour votre compte.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Nouveau mot de passe</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-xs text-zinc-600 mt-1">Minimum 8 caractères</p>
            </div>

            <div>
              <label className="label">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-5">
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors flex items-center justify-center gap-1">
              <ArrowLeft size={13} />
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

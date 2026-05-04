import React, { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Mail, Lock, Activity, AlertCircle, Loader2 } from 'lucide-react'
import { AuthAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/dashboard'

  if (isAuthenticated || !!localStorage.getItem('token')) {
    return <Navigate to={from} replace />
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await AuthAPI.login(email, password)
      login(res.data.access_token)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-aurora min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-sm animate-fade-in relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
            <Activity size={22} className="text-white relative z-10" />
            <div className="absolute inset-0 bg-white/20 blur-md rounded-2xl" />
          </div>
          <div>
            <h1 className="font-semibold text-white leading-tight text-lg">StockSense</h1>
            <p className="text-xs text-zinc-400">Prédiction de ruptures</p>
          </div>
        </div>

        <div className="card-glow">
          <h2 className="text-xl font-semibold text-white mb-1">Connexion</h2>
          <p className="text-sm text-zinc-500 mb-6">Accédez à votre tableau de bord</p>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
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

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  className="input pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-5">
            Pas de compte ?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

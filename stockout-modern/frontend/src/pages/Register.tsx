import React, { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Mail, Lock, Activity, AlertCircle, Loader2, CheckCircle, Inbox } from 'lucide-react'
import { AuthAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'

/* SVG icons inline pour Google et Apple (pas dispos dans Lucide) */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)
const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
)

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated || !!localStorage.getItem('token')) {
    return <Navigate to="/dashboard" replace />
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (password.length < 6) { setError('Mot de passe trop court (min. 6 caractères)'); return }
    setLoading(true)
    try {
      const res = await AuthAPI.register(email, password)
      // On stocke le token mais on n'auto-login pas — on demande la vérification d'abord
      localStorage.setItem('pending_token', res.data.access_token)
      setRegistered(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setResending(true)
    try {
      await AuthAPI.resendVerification(email)
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    } catch { /* silently */ }
    finally { setResending(false) }
  }

  function continueWithoutVerif() {
    // On laisse l'utilisateur entrer même sans vérif (pour ne pas bloquer le flow),
    // mais le banner du dashboard l'invitera à vérifier.
    const token = localStorage.getItem('pending_token')
    if (token) {
      localStorage.removeItem('pending_token')
      login(token)
      navigate('/dashboard')
    }
  }

  /* ── Écran "check your email" après inscription réussie ── */
  if (registered) {
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center p-4 relative">
        <div className="w-full max-w-sm animate-fade-in relative z-10">
          <div className="card-glow text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
              <Inbox size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Vérifie ton email</h2>
            <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
              On t'a envoyé un lien à <strong className="text-white">{email}</strong>.<br/>
              Clique dessus pour activer ton compte (valable 24 h).
            </p>

            {resent && (
              <div className="flex items-center gap-2 text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 mb-4">
                <CheckCircle size={14} /> Nouveau lien envoyé !
              </div>
            )}

            <button
              onClick={resend}
              disabled={resending || resent}
              className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors disabled:opacity-50 mb-3"
            >
              {resending ? 'Envoi...' : 'Renvoyer le lien'}
            </button>

            <div className="border-t border-white/8 pt-4 mt-2">
              <p className="text-xs text-zinc-500 mb-2">Pas reçu ? Pense à vérifier les spams.</p>
              <button
                onClick={continueWithoutVerif}
                className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
              >
                Continuer sans vérifier (déconseillé)
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-zinc-500 mt-5">
            Mauvaise adresse ?{' '}
            <button onClick={() => setRegistered(false)} className="text-brand-400 hover:text-brand-300 font-medium">
              Modifier
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-aurora min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-sm animate-fade-in relative z-10">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
            <Activity size={22} className="text-white relative z-10" />
            <div className="absolute inset-0 bg-white/20 blur-md rounded-2xl" />
          </div>
          <div>
            <h1 className="font-semibold text-white leading-tight text-lg">Stocky</h1>
            <p className="text-xs text-zinc-400">Prédiction de ruptures</p>
          </div>
        </div>

        <div className="card-glow">
          <h2 className="text-xl font-semibold text-white mb-1">Créer un compte</h2>
          <p className="text-sm text-zinc-500 mb-6">5 prédictions gratuites pour commencer</p>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Boutons OAuth */}
          <div className="space-y-2 mb-5">
            <a href={AuthAPI.oauthGoogleStart()} className="block">
              <button type="button" className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-100 transition-all">
                <GoogleIcon /> Continuer avec Google
              </button>
            </a>
            <a href={AuthAPI.oauthAppleStart()} className="block">
              <button type="button" className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-black text-white font-semibold text-sm border border-white/15 hover:bg-zinc-900 transition-all">
                <AppleIcon /> Continuer avec Apple
              </button>
            </a>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-zinc-500">ou avec email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

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
                  placeholder="Min. 6 caractères"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  className="input pl-9"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-5">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

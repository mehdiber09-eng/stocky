import React, { useState, useEffect } from 'react'
import { User, Lock, Bell, Loader2, CheckCircle, AlertCircle, Crown, Zap, ArrowUpRight, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API, { PaymentAPI } from '../api/api'
import Toast from '../components/Toast'
import { useLanguage } from '../context/LanguageContext'
import { useCurrency, type Currency } from '../hooks/useCurrency'

export default function Profile() {
  const { logout } = useAuth()
  const { t } = useLanguage()
  const { currency, setCurrency } = useCurrency()
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [alertThreshold, setAlertThreshold] = useState(50)
  const [loading, setLoading] = useState(false)
  const [loadingPwd, setLoadingPwd] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    API.get('/auth/me').then(r => {
      setEmail(r.data.email)
      setIsSubscribed(r.data.is_subscribed || false)
      if (typeof r.data.alert_threshold === 'number') {
        setAlertThreshold(Math.round(r.data.alert_threshold * 100))
      }
    }).catch(() => {})
    PaymentAPI.status().then(r => {
      setIsSubscribed(r.data.is_subscribed)
    }).catch(() => {})
  }, [])

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPwd !== confirmPwd) { setToast({ msg: 'Les mots de passe ne correspondent pas', type: 'error' }); return }
    if (newPwd.length < 6) { setToast({ msg: 'Minimum 6 caractères', type: 'error' }); return }
    setLoadingPwd(true)
    try {
      await API.post('/auth/change-password', { current_password: currentPwd, new_password: newPwd })
      setToast({ msg: 'Mot de passe modifié !', type: 'success' })
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (err: any) {
      setToast({ msg: err.response?.data?.detail || 'Erreur', type: 'error' })
    } finally {
      setLoadingPwd(false)
    }
  }

  async function saveAlerts(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await API.post('/auth/preferences', { alert_threshold: alertThreshold / 100 })
      setToast({ msg: 'Préférences sauvegardées !', type: 'success' })
    } catch {
      setToast({ msg: 'Erreur lors de la sauvegarde', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">{t('prof_title')}</h1>
            <p className="text-sm text-zinc-500">{email}</p>
          </div>
        </div>
        {isSubscribed ? (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium">
            <Crown size={14} /> {t('prof_pro_active')}
          </span>
        ) : (
          <Link to="/pricing" className="btn-primary flex items-center gap-2 text-sm">
            <Zap size={14} /> {t('prof_upgrade')} <ArrowUpRight size={13} />
          </Link>
        )}
      </div>

      {/* Subscription banner */}
      {!isSubscribed && (
        <div className="card border border-brand-500/20 bg-gradient-to-r from-brand-500/5 to-magenta-500/5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-zinc-200 flex items-center gap-2"><Zap size={15} className="text-brand-400" /> Passez à StockSense Pro</p>
              <p className="text-sm text-zinc-500 mt-1">Prédictions illimitées · Alertes email · 900 DZD/mois</p>
              <p className="text-xs text-zinc-600 mt-1">Paiement Dahabia, CIB, Visa ou PayPal</p>
            </div>
            <Link to="/pricing" className="btn-primary flex items-center gap-2 text-sm shrink-0">
              Voir les tarifs <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* Change password */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={16} className="text-zinc-400" />
          <h2 className="font-medium text-zinc-200">{t('prof_change_pwd')}</h2>
        </div>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="label">{t('prof_current_pwd')}</label>
            <input type="password" className="input" value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('prof_new_pwd')}</label>
              <input type="password" className="input" value={newPwd}
                onChange={e => setNewPwd(e.target.value)} placeholder="Min. 6 caractères" required />
            </div>
            <div>
              <label className="label">{t('prof_confirm_pwd')}</label>
              <input type="password" className="input" value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" required />
            </div>
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loadingPwd}>
            {loadingPwd ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            {t('prof_update_pwd')}
          </button>
        </form>
      </div>

      {/* Alert preferences */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={16} className="text-zinc-400" />
          <h2 className="font-medium text-zinc-200">{t('prof_alert_pref')}</h2>
        </div>
        <form onSubmit={saveAlerts} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{t('prof_alert_threshold')}</label>
              <span className="text-xs text-brand-400 font-mono">{alertThreshold}%</span>
            </div>
            <input type="range" min={10} max={90} step={5} value={alertThreshold}
              onChange={e => setAlertThreshold(Number(e.target.value))} className="w-full accent-brand-500" />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>10%</span><span>90%</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Vous recevrez un email quand la probabilité de rupture dépasse <strong className="text-zinc-300">{alertThreshold}%</strong>
            </p>
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {t('btn_save')}
          </button>
        </form>
      </div>

      {/* Currency selector */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <DollarSign size={16} className="text-zinc-400" />
          <h2 className="font-medium text-zinc-200">{t('curr_title')}</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['DZD', 'EUR', 'USD'] as Currency[]).map(c => (
            <button
              key={c}
              onClick={() => { setCurrency(c); setToast({ msg: t('curr_saved'), type: 'success' }) }}
              className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                currency === c
                  ? 'bg-brand-500/20 border-brand-500/50 text-white'
                  : 'bg-white/3 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              {c === 'DZD' ? '🇩🇿 DA' : c === 'EUR' ? '🇪🇺 €' : '🇺🇸 $'}
              <p className="text-[10px] font-normal text-zinc-500 mt-0.5">
                {t(c === 'DZD' ? 'curr_dzd' : c === 'EUR' ? 'curr_eur' : 'curr_usd')}
              </p>
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-600 mt-3">
          Utilisé dans la page <strong className="text-zinc-400">Santé du Stock</strong> pour calculer la valeur de votre stock.
        </p>
      </div>

      {/* Danger zone */}
      <div className="card border-red-500/20">
        <h2 className="font-medium text-red-400 mb-4">{t('prof_danger_zone')}</h2>
        <p className="text-zinc-500 text-sm mb-4">{t('prof_danger_sub')}</p>
        <button onClick={() => logout()} className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all">
          {t('prof_logout')}
        </button>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

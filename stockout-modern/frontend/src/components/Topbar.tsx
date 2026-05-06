import React from 'react'
import { Menu, Bell, BellOff, BellRing } from 'lucide-react'
import NotificationsBell from './NotificationsBell'
import SystemStatusBadge from './SystemStatusBadge'
import { useLanguage } from '../context/LanguageContext'
import { usePushNotifications } from '../hooks/usePushNotifications'

interface TopbarProps {
  onMenuOpen?: () => void
}

export default function Topbar({ onMenuOpen }: TopbarProps) {
  const { lang, setLang, isRTL } = useLanguage()
  const { state: pushState, subscribe, unsubscribe } = usePushNotifications()

  return (
    <div className="sticky top-0 z-30 px-4 sm:px-8 py-4">
      <div className="glass-subtle rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: hamburger (mobile) + status */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-all duration-150"
            onClick={onMenuOpen}
            aria-label="Ouvrir le menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
            <span className="hidden sm:inline">API connectée</span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <SystemStatusBadge />

          {/* Push notification toggle */}
          {pushState !== 'unsupported' && pushState !== 'denied' && (
            <button
              onClick={pushState === 'subscribed' ? unsubscribe : subscribe}
              title={
                pushState === 'subscribed'
                  ? (isRTL ? 'إيقاف الإشعارات' : 'Désactiver les notifications')
                  : (isRTL ? 'تفعيل الإشعارات' : 'Activer les notifications push')
              }
              className={`relative p-2 rounded-lg text-xs font-medium transition-all border ${
                pushState === 'subscribed'
                  ? 'text-brand-300 bg-brand-500/10 border-brand-500/30 hover:bg-brand-500/20'
                  : 'text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-white/8 hover:border-white/10'
              }`}
            >
              {pushState === 'loading'
                ? <BellRing size={16} className="animate-pulse" />
                : pushState === 'subscribed'
                  ? <Bell size={16} />
                  : <BellOff size={16} />
              }
              {pushState === 'subscribed' && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-400" />
              )}
            </button>
          )}

          <button
            onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
            title="Changer la langue / تغيير اللغة"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/8 border border-transparent hover:border-white/10 transition-all"
            style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}
          >
            {lang === 'fr' ? '🇩🇿 AR' : '🇫🇷 FR'}
          </button>
          <NotificationsBell />
        </div>
      </div>
    </div>
  )
}

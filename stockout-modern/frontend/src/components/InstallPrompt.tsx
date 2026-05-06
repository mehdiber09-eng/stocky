import React, { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function InstallPrompt() {
  const { isRTL } = useLanguage()
  const [prompt, setPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: any) => {
      e.preventDefault()
      setPrompt(e)
      // Delay slightly so it doesn't appear immediately on page load
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show || installed) return null

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShow(false)
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 rounded-2xl border border-brand-500/30 p-4 shadow-2xl"
      style={{ background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(20px)' }}
    >
      <button
        onClick={() => setShow(false)}
        className="absolute top-3 end-3 p-1 rounded-lg text-zinc-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
          <Smartphone size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            {isRTL ? 'ثبّت التطبيق' : "Installer l'application"}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            {isRTL
              ? 'أضف Stocky لشاشتك الرئيسية — يعمل بدون إنترنت'
              : "Accès rapide depuis votre écran d'accueil, même hors ligne"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={install}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}
        >
          <Download size={14} />
          {isRTL ? 'تثبيت' : 'Installer'}
        </button>
        <button
          onClick={() => setShow(false)}
          className="px-4 py-2.5 rounded-xl text-sm text-zinc-500 border border-white/8 hover:text-white hover:border-white/20 transition-all"
        >
          {isRTL ? 'لاحقاً' : 'Plus tard'}
        </button>
      </div>
    </div>
  )
}

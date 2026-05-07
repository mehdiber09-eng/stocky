import React, { useEffect } from 'react'
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'success', onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  const styles = {
    success: {
      accent: '#10b981',
      iconBg: 'bg-emerald-500',
      icon: <CheckCircle size={16} className="text-white" />,
      border: 'border-emerald-500/40',
      glow: '0 0 32px -4px rgba(16,185,129,0.45), 0 8px 28px rgba(0,0,0,0.5)',
    },
    error: {
      accent: '#ef4444',
      iconBg: 'bg-red-500',
      icon: <AlertCircle size={16} className="text-white" />,
      border: 'border-red-500/40',
      glow: '0 0 32px -4px rgba(239,68,68,0.45), 0 8px 28px rgba(0,0,0,0.5)',
    },
    info: {
      accent: '#6366f1',
      iconBg: 'bg-brand-500',
      icon: <Info size={16} className="text-white" />,
      border: 'border-brand-500/40',
      glow: '0 0 32px -4px rgba(99,102,241,0.45), 0 8px 28px rgba(0,0,0,0.5)',
    },
  }[type]

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
      <div
        className={`flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-2xl border ${styles.border} text-zinc-100`}
        style={{
          background: 'rgb(20, 20, 26)',
          boxShadow: styles.glow,
          minWidth: '280px',
        }}
      >
        <div className={`shrink-0 w-9 h-9 rounded-xl ${styles.iconBg} flex items-center justify-center`}
             style={{ boxShadow: `0 4px 12px -2px ${styles.accent}99` }}>
          {styles.icon}
        </div>
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

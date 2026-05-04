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
      ring: 'ring-emerald-500/30',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-200',
      glow: 'shadow-glow-emerald',
      icon: <CheckCircle size={16} className="text-emerald-300" />,
    },
    error: {
      ring: 'ring-red-500/30',
      bg: 'bg-red-500/10',
      text: 'text-red-200',
      glow: 'shadow-glow-red',
      icon: <AlertCircle size={16} className="text-red-300" />,
    },
    info: {
      ring: 'ring-brand-500/30',
      bg: 'bg-brand-500/10',
      text: 'text-brand-200',
      glow: 'shadow-glow',
      icon: <Info size={16} className="text-brand-300" />,
    },
  }[type]

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl glass-strong ring-1 ${styles.ring} ${styles.bg} ${styles.glow} ${styles.text}`}>
        {styles.icon}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-white/10"
          aria-label="Fermer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

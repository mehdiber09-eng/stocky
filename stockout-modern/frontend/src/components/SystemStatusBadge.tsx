import React, { useEffect, useState, useCallback } from 'react'
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import API from '../api/api'
import { useAuth } from '../context/AuthContext'

interface SystemStatus {
  status: 'SAFE' | 'WARNING' | 'CRITICAL'
  status_color: string
  message: string
  stats: {
    total_products: number
    critical_notifications: number
    warning_notifications: number
    predictions_last_hour: number
    high_risk_products_24h: number
  }
  high_risk_products: string[]
  security_events: Array<{ type: string; message: string; severity: string }>
}

const STATUS_CONFIG = {
  SAFE: {
    icon: CheckCircle,
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    label: 'SAFE',
  },
  WARNING: {
    icon: AlertTriangle,
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    label: 'WARNING',
  },
  CRITICAL: {
    icon: XCircle,
    dot: 'bg-red-400 animate-pulse',
    text: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    label: 'CRITICAL',
  },
}

export default function SystemStatusBadge() {
  const { isAuthenticated } = useAuth()
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [open, setOpen] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await API.get<SystemStatus>('/system-status/')
      setStatus(res.data)
    } catch {
      // Silently fail — don't break UI
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60_000) // refresh every minute
    return () => clearInterval(interval)
  }, [fetchStatus])

  if (!status) return null

  const cfg = STATUS_CONFIG[status.status]
  const Icon = cfg.icon

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                    border ${cfg.border} ${cfg.bg} ${cfg.text} hover:opacity-90`}
        title="État du système de protection"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <Shield size={12} />
        <span className="hidden sm:inline">{cfg.label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl border ${cfg.border} ${cfg.bg} p-4 shadow-2xl space-y-3`}
               style={{ backdropFilter: 'blur(20px)', background: 'rgba(10,10,18,0.92)' }}>
            {/* Header */}
            <div className="flex items-center gap-2">
              <Icon size={16} className={cfg.text} />
              <span className={`text-sm font-bold ${cfg.text}`}>Système {cfg.label}</span>
            </div>
            <p className="text-xs text-zinc-400">{status.message}</p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Produits" value={status.stats.total_products} />
              <Stat label="Alertes critiques" value={status.stats.critical_notifications} danger={status.stats.critical_notifications > 0} />
              <Stat label="Preds/1h" value={status.stats.predictions_last_hour} />
              <Stat label="Produits risque" value={status.stats.high_risk_products_24h} danger={status.stats.high_risk_products_24h > 0} />
            </div>

            {/* High risk products */}
            {status.high_risk_products.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Produits à risque élevé</p>
                {status.high_risk_products.map(name => (
                  <div key={name} className="flex items-center gap-2 text-xs text-orange-300">
                    <AlertTriangle size={10} />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Security events */}
            {status.security_events.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Événements sécurité</p>
                {status.security_events.map((ev, i) => (
                  <div key={i} className={`text-xs px-2 py-1 rounded-lg ${ev.severity === 'critical' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>
                    {ev.message}
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-zinc-600">Actualisation auto toutes les 60s</p>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="bg-white/5 rounded-lg p-2">
      <p className={`text-base font-bold ${danger && value > 0 ? 'text-red-400' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  )
}

import React from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
  loading?: boolean
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  onConfirm,
  onCancel,
  danger = false,
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm card animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              danger
                ? 'bg-red-500/10 text-red-400'
                : 'bg-brand-500/10 text-brand-400'
            }`}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100">{title}</h2>
              <p className="text-xs text-zinc-500">Cette action peut être irréversible</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="btn-ghost p-1.5 rounded-lg shrink-0 mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {danger ? (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/20 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {confirmLabel}
            </button>
          ) : (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {confirmLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-ghost text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

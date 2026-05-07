import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Bell, AlertTriangle, AlertCircle, Info, Check, X, CheckCheck } from 'lucide-react'
import { NotificationsAPI, Notification } from '../api/api'

const POLL_INTERVAL = 30_000

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

function severityIcon(severity: string) {
  if (severity === 'critical') return <AlertCircle size={16} className="text-red-400" />
  if (severity === 'warning') return <AlertTriangle size={16} className="text-amber-400" />
  return <Info size={16} className="text-brand-400" />
}

function severityRing(severity: string) {
  if (severity === 'critical') return 'ring-red-500/40 bg-red-500/15'
  if (severity === 'warning') return 'ring-amber-500/40 bg-amber-500/15'
  return 'ring-brand-500/40 bg-brand-500/15'
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        NotificationsAPI.list(false, 20),
        NotificationsAPI.count(),
      ])
      setItems(list.data)
      setUnread(count.data.unread)
    } catch {
      /* silently ignore — user might not be authenticated yet */
    }
  }, [])

  // Initial load + polling
  useEffect(() => {
    load()
    const id = setInterval(load, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [load])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function markRead(id: number) {
    setItems(items.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(u => Math.max(0, u - 1))
    try { await NotificationsAPI.markRead(id) } catch {}
  }

  async function markAll() {
    setLoading(true)
    setItems(items.map(n => ({ ...n, is_read: true })))
    setUnread(0)
    try { await NotificationsAPI.markAllRead() } finally { setLoading(false) }
  }

  async function remove(id: number) {
    const wasUnread = items.find(n => n.id === id)?.is_read === false
    setItems(items.filter(n => n.id !== id))
    if (wasUnread) setUnread(u => Math.max(0, u - 1))
    try { await NotificationsAPI.remove(id) } catch {}
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-br from-red-500 to-magenta-500 text-[10px] font-bold flex items-center justify-center text-white shadow-glow-red animate-pulse-glow">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-96 max-h-[480px] flex flex-col rounded-2xl overflow-hidden animate-scale-in z-50 border border-white/12"
          style={{
            background: 'rgb(20, 20, 26)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 60px -20px rgba(99,102,241,0.35)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8" style={{ background: 'rgba(99,102,241,0.06)' }}>
            <div>
              <h3 className="font-semibold text-white text-sm">Notifications</h3>
              <p className="text-xs text-zinc-500">
                {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour'}
              </p>
            </div>
            {unread > 0 && (
              <button
                onClick={markAll}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-brand-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                <CheckCheck size={13} /> Tout lire
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl glass-subtle flex items-center justify-center">
                  <Bell size={18} className="text-zinc-500" />
                </div>
                <p className="text-sm text-zinc-400">Aucune notification</p>
                <p className="text-xs text-zinc-600 mt-1">Vous serez prévenu en cas de risque ou stock bas</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {items.map(n => (
                  <li
                    key={n.id}
                    className={`group relative px-4 py-3 hover:bg-white/[0.04] transition-all ${!n.is_read ? 'bg-brand-500/[0.08]' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`shrink-0 w-9 h-9 rounded-xl ring-1 ${severityRing(n.severity)} flex items-center justify-center`}>
                        {severityIcon(n.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!n.is_read ? 'font-semibold text-white' : 'text-zinc-300'}`}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="shrink-0 w-2 h-2 rounded-full bg-brand-400 shadow-glow mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-zinc-600">{timeAgo(n.created_at)}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.is_read && (
                              <button
                                onClick={() => markRead(n.id)}
                                title="Marquer comme lu"
                                className="p-1 rounded-md text-zinc-500 hover:text-emerald-300 hover:bg-emerald-500/10"
                              >
                                <Check size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => remove(n.id)}
                              title="Supprimer"
                              className="p-1 rounded-md text-zinc-500 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

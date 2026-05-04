import React from 'react'
import NotificationsBell from './NotificationsBell'

export default function Topbar() {
  return (
    <div className="sticky top-0 z-30 px-8 py-4">
      <div className="glass-subtle rounded-2xl px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
          <span>API connectée</span>
        </div>

        <div className="flex items-center gap-2">
          <NotificationsBell />
        </div>
      </div>
    </div>
  )
}

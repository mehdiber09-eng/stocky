import React, { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, QrCode, ShoppingCart, BarChart2, Menu as MenuIcon } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import InstallPrompt from './InstallPrompt'

const BOTTOM_TABS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Accueil' },
  { to: '/scan-qr',    icon: QrCode,          label: 'Scanner' },
  { to: '/add-sale',   icon: ShoppingCart,    label: 'Vendre' },
  { to: '/analytics',  icon: BarChart2,        label: 'Stats' },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      {/* Animated background orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orb orb-indigo w-[520px] h-[520px] -top-40 -left-32 animate-float" />
        <div className="orb orb-magenta w-[420px] h-[420px] top-1/3 -right-24 animate-float-slow" />
        <div className="orb orb-cyan w-[480px] h-[480px] -bottom-40 left-1/3 animate-float" style={{ animationDelay: '-6s' }} />
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="relative z-10 flex-1 overflow-y-auto h-screen main-content">
        <Topbar onMenuOpen={() => setSidebarOpen(true)} />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
           style={{ background: 'rgba(8,8,14,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-5 items-end pb-safe">
          {BOTTOM_TABS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 pt-2.5 pb-3 text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-brand-400' : 'text-zinc-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`relative flex items-center justify-center w-8 h-6 ${isActive ? '' : ''}`}>
                    {isActive && (
                      <span className="absolute inset-0 rounded-full bg-brand-500/15" />
                    )}
                    <Icon size={19} className="relative" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
          {/* Menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 pt-2.5 pb-3 text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <span className="flex items-center justify-center w-8 h-6">
              <MenuIcon size={19} />
            </span>
            Plus
          </button>
        </div>
      </nav>

      <InstallPrompt />
    </div>
  )
}

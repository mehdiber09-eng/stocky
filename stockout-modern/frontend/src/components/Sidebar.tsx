import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PackagePlus, ShoppingCart, TrendingUp, LogOut, Activity,
  BarChart2, Upload, GitCompare, User, Sun, Moon, MessageCircle, HeartPulse,
  CreditCard, Truck, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/predict', label: 'Prédictions', icon: TrendingUp },
  { to: '/compare', label: 'Comparer', icon: GitCompare },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/inventory-health', label: 'Santé Stock', icon: HeartPulse },
  { to: '/suppliers', label: 'Fournisseurs', icon: Truck },
  { to: '/import', label: 'Import CSV', icon: Upload },
  { to: '/create-product', label: 'Produits', icon: PackagePlus },
  { to: '/add-sale', label: 'Ventes', icon: ShoppingCart },
  { to: '/chat', label: 'Conseiller IA', icon: MessageCircle },
  { to: '/pricing', label: 'Tarifs & Pro', icon: CreditCard },
  { to: '/profile', label: 'Profil', icon: User },
]

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const { logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  function handleNavClick() {
    onClose?.()
  }

  return (
    <>
      {/* Mobile: fixed drawer with slide-from-left transition */}
      <aside
        className={`
          sidebar-mobile
          fixed top-0 left-0 z-40 h-screen w-60 shrink-0
          transform transition-transform duration-300 ease-in-out
          lg:hidden
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="glass-strong h-full flex flex-col rounded-r-3xl border-r border-white/10">
          {/* Brand + close button */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
                <Activity size={18} className="text-white relative z-10" />
                <div className="absolute inset-0 bg-white/20 blur-md" />
              </div>
              <div>
                <span className="font-semibold text-white tracking-tight block leading-tight">StockSense</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">v3 · fluid</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-all"
              aria-label="Fermer le menu"
            >
              <X size={16} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-brand-500/20 to-magenta-500/10 shadow-glow'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-gradient-to-b from-brand-400 to-magenta-400 shadow-glow" />
                    )}
                    <Icon size={16} className={isActive ? 'text-brand-300' : ''} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer actions */}
          <div className="px-3 py-4 border-t border-white/8 space-y-1">
            <button
              onClick={toggle}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 w-full transition-all"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all"
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop: static sidebar */}
      <aside className="hidden lg:block relative z-20 w-60 shrink-0 h-screen sticky top-0">
        <div className="glass-strong h-full flex flex-col rounded-r-3xl border-r border-white/10">
          {/* Brand */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}>
              <Activity size={18} className="text-white relative z-10" />
              <div className="absolute inset-0 bg-white/20 blur-md" />
            </div>
            <div>
              <span className="font-semibold text-white tracking-tight block leading-tight">StockSense</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">v3 · fluid</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-brand-500/20 to-magenta-500/10 shadow-glow'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-gradient-to-b from-brand-400 to-magenta-400 shadow-glow" />
                    )}
                    <Icon size={16} className={isActive ? 'text-brand-300' : ''} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer actions */}
          <div className="px-3 py-4 border-t border-white/8 space-y-1">
            <button
              onClick={toggle}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 w-full transition-all"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all"
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

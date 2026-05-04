import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PackagePlus, ShoppingCart, TrendingUp, LogOut, Activity,
  BarChart2, Upload, GitCompare, User, Sun, Moon, MessageCircle, HeartPulse,
  CreditCard, Truck, X, QrCode, FlaskConical,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import type { LucideIcon } from 'lucide-react'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

type NavKey =
  | 'nav_dashboard' | 'nav_predict' | 'nav_scan_qr' | 'nav_simulate'
  | 'nav_compare' | 'nav_analytics' | 'nav_inventory' | 'nav_suppliers'
  | 'nav_import' | 'nav_products' | 'nav_sales' | 'nav_chat'
  | 'nav_pricing' | 'nav_profile'

const NAV_ITEMS: { to: string; key: NavKey; icon: LucideIcon }[] = [
  { to: '/dashboard',       key: 'nav_dashboard',  icon: LayoutDashboard },
  { to: '/predict',         key: 'nav_predict',    icon: TrendingUp },
  { to: '/scan-qr',         key: 'nav_scan_qr',    icon: QrCode },
  { to: '/simulate',        key: 'nav_simulate',   icon: FlaskConical },
  { to: '/compare',         key: 'nav_compare',    icon: GitCompare },
  { to: '/analytics',       key: 'nav_analytics',  icon: BarChart2 },
  { to: '/inventory-health',key: 'nav_inventory',  icon: HeartPulse },
  { to: '/suppliers',       key: 'nav_suppliers',  icon: Truck },
  { to: '/import',          key: 'nav_import',     icon: Upload },
  { to: '/create-product',  key: 'nav_products',   icon: PackagePlus },
  { to: '/add-sale',        key: 'nav_sales',      icon: ShoppingCart },
  { to: '/chat',            key: 'nav_chat',       icon: MessageCircle },
  { to: '/pricing',         key: 'nav_pricing',    icon: CreditCard },
  { to: '/profile',         key: 'nav_profile',    icon: User },
]

function NavItems({ onClick }: { onClick?: () => void }) {
  const { t } = useLanguage()
  return (
    <>
      {NAV_ITEMS.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onClick}
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
              <span>{t(key)}</span>
            </>
          )}
        </NavLink>
      ))}
    </>
  )
}

function SidebarFooter() {
  const { t } = useLanguage()
  const { logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  return (
    <div className="px-3 py-4 border-t border-white/8 space-y-1">
      <button
        onClick={toggle}
        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 w-full transition-all"
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        {t(theme === 'dark' ? 'theme_light' : 'theme_dark')}
      </button>
      <button
        onClick={() => { logout(); navigate('/login') }}
        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all"
      >
        <LogOut size={15} />
        {t('logout')}
      </button>
    </div>
  )
}

function Brand() {
  return (
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
  )
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile drawer */}
      <aside
        className={`
          sidebar-mobile fixed top-0 left-0 z-40 h-screen w-60 shrink-0
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="glass-strong h-full flex flex-col rounded-r-3xl border-r border-white/10">
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
            <Brand />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-all"
              aria-label="Fermer le menu"
            >
              <X size={16} />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <NavItems onClick={onClose} />
          </nav>
          <SidebarFooter />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block relative z-20 w-60 shrink-0 h-screen sticky top-0">
        <div className="glass-strong h-full flex flex-col rounded-r-3xl border-r border-white/10">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
            <Brand />
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <NavItems />
          </nav>
          <SidebarFooter />
        </div>
      </aside>
    </>
  )
}

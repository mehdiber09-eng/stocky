import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import InstallPrompt from './InstallPrompt'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      {/* Animated background orbs (behind everything) */}
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
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
          <Outlet />
        </div>
      </main>
      <InstallPrompt />
    </div>
  )
}

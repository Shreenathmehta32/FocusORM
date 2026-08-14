import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Clock,
  AppWindow,
  Globe,
  Crosshair,
  AlertTriangle,
  Settings,
  Shield,
  Zap,
  Activity
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/timeline', icon: Clock, label: 'Timeline' },
  { to: '/applications', icon: AppWindow, label: 'Applications' },
  { to: '/websites', icon: Globe, label: 'Websites' },
  { to: '/focus', icon: Crosshair, label: 'Focus Sessions' },
  { to: '/distractions', icon: AlertTriangle, label: 'Distractions' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/privacy', icon: Shield, label: 'Privacy' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 min-h-screen sticky top-0 h-screen z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-white tracking-tight">FocusORM</span>
            <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.2 rounded-full">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium truncate">Privacy Intelligence</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Analytics & Tracking
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${isActive
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* System Status Bottom Widget */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-medium text-slate-300 truncate">Local Engine Active</span>
            <span className="text-[9px] text-slate-400">127.0.0.1:8745</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

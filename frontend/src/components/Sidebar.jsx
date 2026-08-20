import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', color: '#6366f1' },
      { to: '/timeline', icon: Clock, label: 'Timeline', color: '#0ea5e9' },
    ]
  },
  {
    label: 'Activity',
    items: [
      { to: '/applications', icon: AppWindow, label: 'Applications', color: '#10b981' },
      { to: '/websites', icon: Globe, label: 'Websites', color: '#06b6d4' },
      { to: '/focus', icon: Crosshair, label: 'Focus Sessions', color: '#8b5cf6' },
      { to: '/distractions', icon: AlertTriangle, label: 'Distractions', color: '#f43f5e' },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings', color: '#94a3b8' },
      { to: '/privacy', icon: Shield, label: 'Privacy', color: '#34d399' },
    ]
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      style={{
        width: collapsed ? '68px' : '240px',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
        background: 'linear-gradient(180deg, #090e1c 0%, #05080f 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Brand */}
      <div
        style={{
          padding: '20px 16px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
          minHeight: '68px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          }}
        >
          <Zap size={18} color="white" strokeWidth={2.5} />
        </div>

        {!collapsed && (
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                FocusORM
              </span>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                background: 'rgba(99,102,241,0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99,102,241,0.25)',
                padding: '1px 6px',
                borderRadius: '9999px',
                letterSpacing: '0.05em',
              }}>
                v1.0
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(139,156,200,0.7)', marginTop: '1px', whiteSpace: 'nowrap' }}>
              Privacy Intelligence
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: '20px' }}>
            {!collapsed && (
              <div style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(74,85,120,0.9)',
                padding: '0 8px',
                marginBottom: '6px',
              }}>
                {group.label}
              </div>
            )}
            {group.items.map(({ to, icon: Icon, label, color }) => {
              const isActive = to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to)
              return (
                <NavLink
                  key={to}
                  to={to}
                  title={collapsed ? label : undefined}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: collapsed ? '10px 0' : '8px 10px',
                    borderRadius: '10px',
                    marginBottom: '2px',
                    textDecoration: 'none',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease',
                    background: isActive
                      ? `linear-gradient(90deg, rgba(${hexToRgb(color)},0.15) 0%, rgba(${hexToRgb(color)},0.05) 100%)`
                      : 'transparent',
                    border: isActive ? `1px solid rgba(${hexToRgb(color)},0.2)` : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'transparent'
                    }
                  }}
                >
                  {/* Active accent */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '60%',
                      background: color,
                      borderRadius: '0 4px 4px 0',
                      boxShadow: `0 0 8px ${color}`,
                    }} />
                  )}
                  <div style={{
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    flexShrink: 0,
                    background: isActive ? `rgba(${hexToRgb(color)},0.18)` : 'transparent',
                    transition: 'background 0.15s',
                  }}>
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2.5 : 2}
                      color={isActive ? color : 'rgba(139,156,200,0.6)'}
                    />
                  </div>
                  {!collapsed && (
                    <span style={{
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#f0f4ff' : 'rgba(139,156,200,0.7)',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.01em',
                    }}>
                      {label}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Status Footer */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        {!collapsed ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: '10px',
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.15)',
          }}>
            <div className="pulse-dot" style={{ color: '#10b981' }} />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', whiteSpace: 'nowrap' }}>
                Engine Active
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(74,85,120,0.9)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                127.0.0.1:8745
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="pulse-dot" style={{ color: '#10b981' }} />
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          position: 'absolute',
          right: '-12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: '#0f1829',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'rgba(139,156,200,0.6)',
          zIndex: 10,
          transition: 'all 0.2s',
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#1a2744'
          e.currentTarget.style.color = '#f0f4ff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#0f1829'
          e.currentTarget.style.color = 'rgba(139,156,200,0.6)'
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}

// Helper to convert hex to R,G,B string for rgba()
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}

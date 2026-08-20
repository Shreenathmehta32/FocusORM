import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { AppWindow, Keyboard, MousePointer } from 'lucide-react'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}

const CLASS_COLOR = {
  PRODUCTIVE: '#10b981',
  DISTRACTION: '#f43f5e',
  NEUTRAL: '#f59e0b',
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getApplications().then(a => {
      setApps(a || [])
      setLoading(false)
    })
  }, [])

  const maxSeconds = Math.max(...apps.map(a => a.total_seconds || 1), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AppWindow size={16} color="#10b981" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>
              Application Analytics
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '42px' }}>
            Usage, focus vs idle, and interaction metrics
          </p>
        </div>
        <div style={{
          padding: '7px 14px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
        }}>
          {apps.length} applications
        </div>
      </div>

      {/* App List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading applications...
          </div>
        ) : apps.length === 0 ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No application records logged yet today.
          </div>
        ) : (
          apps.map((app, idx) => {
            const color = CLASS_COLOR[app.classification] || '#6366f1'
            const rgb = hexToRgb(color)
            const pct = Math.min(100, Math.round((app.total_seconds / maxSeconds) * 100))
            const badgeClass = `badge-${(app.classification || 'unknown').toLowerCase()}`

            return (
              <div
                key={idx}
                className="card card-glow"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* Top Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    {/* Rank */}
                    <div style={{
                      width: '36px', height: '36px',
                      borderRadius: '10px',
                      background: `rgba(${rgb},0.1)`,
                      border: `1px solid rgba(${rgb},0.2)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      fontWeight: 700,
                      color,
                      flexShrink: 0,
                    }}>
                      {String(idx + 1).padStart(2, '0')}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4ff' }}>
                          {app.application}
                        </span>
                        <span className={`badge ${badgeClass}`}>
                          {app.category || app.classification}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                        {app.session_count} active sessions
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 700, color: '#f0f4ff' }}>
                      {app.total_formatted}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {Math.round(app.active_seconds / 60)}m active · {Math.round(app.idle_seconds / 60)}m idle
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, rgba(${rgb},0.6), ${color})`,
                    }}
                  />
                </div>

                {/* Interaction Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    <Keyboard size={12} color="#a855f7" />
                    {app.keyboard_count?.toLocaleString() || 0} keys
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    <MousePointer size={12} color="#0ea5e9" />
                    {app.click_count?.toLocaleString() || 0} clicks
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

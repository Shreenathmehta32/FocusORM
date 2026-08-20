import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Globe } from 'lucide-react'

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

export default function WebsitesPage() {
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getWebsites().then(s => {
      setSites(s || [])
      setLoading(false)
    })
  }, [])

  const maxSeconds = Math.max(...sites.map(s => s.total_seconds || 1), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Globe size={16} color="#06b6d4" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>
              Website Analytics
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '42px' }}>
            Browser activity via privacy-sanitized extension events
          </p>
        </div>
        <div style={{
          padding: '7px 14px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
        }}>
          {sites.length} domains
        </div>
      </div>

      {/* Site List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading website records...
          </div>
        ) : sites.length === 0 ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <Globe size={40} color="rgba(74,85,120,0.4)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              No website data yet
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto' }}>
              Install the FocusORM browser extension in Chrome or Edge to track educational docs, repositories, and learning platforms.
            </p>
          </div>
        ) : (
          sites.map((site, idx) => {
            const color = CLASS_COLOR[site.classification] || '#6366f1'
            const rgb = hexToRgb(color)
            const pct = Math.min(100, Math.round((site.total_seconds / maxSeconds) * 100))
            const badgeClass = `badge-${(site.classification || 'unknown').toLowerCase()}`

            return (
              <div
                key={idx}
                className="card card-glow"
                style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px', fontWeight: 700, color, flexShrink: 0,
                    }}>
                      {String(idx + 1).padStart(2, '0')}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '14px', fontWeight: 700, color: '#818cf8',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}>
                          {site.domain}
                        </span>
                        <span className={`badge ${badgeClass}`}>
                          {site.category || site.classification}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                        {site.visit_count} visit sessions
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 700, color: '#f0f4ff' }}>
                      {site.total_formatted}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {Math.round(site.active_seconds / 60)}m active
                    </div>
                  </div>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, rgba(${rgb},0.6), ${color})` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

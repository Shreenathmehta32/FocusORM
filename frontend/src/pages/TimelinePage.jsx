import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Clock, Monitor, Globe, ChevronRight, Hash } from 'lucide-react'

function fmt(secs) {
  if (!secs || secs <= 0) return '0s'
  if (secs < 60) return `${Math.round(secs)}s`
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const ACCENT = {
  PRODUCTIVE: '#10b981',
  DISTRACTION: '#f43f5e',
  NEUTRAL: '#f59e0b',
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}

export default function TimelinePage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSessions().then(s => {
      setSessions(s || [])
      setLoading(false)
    })
  }, [])

  const productiveCount = sessions.filter(s => s.classification === 'PRODUCTIVE').length
  const distractionCount = sessions.filter(s => s.classification === 'DISTRACTION').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={16} color="#0ea5e9" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>
              Activity Timeline
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '42px' }}>
            Chronological reconstruction of today's sessions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '7px 12px', borderRadius: '10px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            fontSize: '12px', fontWeight: 600, color: '#34d399',
          }}>
            {productiveCount} productive
          </div>
          <div style={{
            padding: '7px 12px', borderRadius: '10px',
            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
            fontSize: '12px', fontWeight: 600, color: '#fb7185',
          }}>
            {distractionCount} distracting
          </div>
          <div style={{
            padding: '7px 12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
          }}>
            {sessions.length} total
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {loading ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading timeline records...
          </div>
        ) : sessions.length === 0 ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No activity records logged yet today.
          </div>
        ) : (
          sessions.map((s, idx) => {
            const color = ACCENT[s.classification] || '#6366f1'
            const rgb = hexToRgb(color)
            const badgeClass = `badge-${(s.classification || 'unknown').toLowerCase()}`

            return (
              <div
                key={s.id || idx}
                className="card card-lift"
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  borderLeft: `3px solid ${color}`,
                  borderLeftColor: color,
                  borderRadius: '0 12px 12px 0',
                  background: `linear-gradient(90deg, rgba(${rgb},0.04) 0%, var(--bg-card) 30%)`,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
              >
                {/* Left */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  {/* Time */}
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    minWidth: '44px',
                    textAlign: 'right',
                  }}>
                    {fmtTime(s.start_time)}
                  </span>

                  {/* Dot */}
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                    flexShrink: 0,
                  }} />

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#f0f4ff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '220px',
                      }}>
                        {s.application}
                      </span>
                      {s.domain && (
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'JetBrains Mono, monospace',
                          color: '#818cf8',
                          background: 'rgba(99,102,241,0.1)',
                          border: '1px solid rgba(99,102,241,0.2)',
                          padding: '1px 7px',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap',
                        }}>
                          {s.domain}
                        </span>
                      )}
                    </div>
                    {s.window_title && (
                      <p style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '420px',
                      }}>
                        {s.window_title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#f0f4ff' }}>
                      {fmt(s.duration_seconds)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {s.active_seconds > 0 ? `${fmt(s.active_seconds)} active` : 'Passive'}
                    </div>
                  </div>
                  <span className={`badge ${badgeClass}`}>
                    {s.category || s.classification}
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

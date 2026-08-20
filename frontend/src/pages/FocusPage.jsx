import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Crosshair, Sparkles, Clock, ArrowLeftRight, Zap } from 'lucide-react'

export default function FocusPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getFocus().then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  const kpis = [
    { label: 'Total Focus Time', value: data?.total_focus_formatted || '0m', color: '#6366f1', sub: 'Sum of focus blocks' },
    { label: 'Longest Session', value: data?.longest_focus_formatted || '0m', color: '#10b981', sub: 'Max unbroken streak' },
    { label: 'Session Count', value: data?.focus_session_count || 0, color: '#f0f4ff', sub: 'Qualified blocks' },
    { label: 'Context Switches', value: data?.context_switches || 0, color: '#f59e0b', sub: 'App transitions' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Crosshair size={16} color="#8b5cf6" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>
            Focus Sessions
          </h1>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '42px' }}>
          Consecutive productive periods (≥ 15 min) with minimal interruptions
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {kpis.map(({ label, value, color, sub }) => {
          const r = parseInt((color.startsWith('#') ? color : '#6366f1').slice(1,3), 16)
          const g = parseInt((color.startsWith('#') ? color : '#6366f1').slice(3,5), 16)
          const b = parseInt((color.startsWith('#') ? color : '#6366f1').slice(5,7), 16)
          const isWhite = color === '#f0f4ff'
          const displayColor = isWhite ? '#f0f4ff' : color
          return (
            <div key={label} className="card card-glow" style={{ padding: '20px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                {label}
              </span>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '24px', fontWeight: 700, color: displayColor, lineHeight: 1 }}>
                {value}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                {sub}
              </span>
            </div>
          )
        })}
      </div>

      {/* Focus Sessions List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Detected Focus Blocks
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Calculating focus sessions...
            </div>
          ) : !data || data.focus_sessions?.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Sparkles size={24} color="rgba(129,140,248,0.6)" />
              </div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                No focus blocks yet today
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto' }}>
                Focus sessions are detected when you engage productively (VS Code, Docs, Research) for 15+ uninterrupted minutes.
              </p>
            </div>
          ) : (
            data.focus_sessions.map((fs, idx) => (
              <div
                key={idx}
                className="card card-glow"
                style={{
                  padding: '18px 20px',
                  borderLeft: '3px solid #6366f1',
                  borderRadius: '0 12px 12px 0',
                  background: 'linear-gradient(90deg, rgba(99,102,241,0.05) 0%, var(--bg-card) 25%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Zap size={12} color="#818cf8" />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 700, color: '#f0f4ff' }}>
                      {new Date(fs.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' — '}
                      {new Date(fs.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700,
                      background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                      border: '1px solid rgba(99,102,241,0.25)',
                      padding: '2px 7px', borderRadius: '9999px',
                    }}>
                      Block #{idx + 1}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '20px' }}>
                    {fs.applications?.join(' · ') || 'Productive Activity'}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '22px', fontWeight: 700, color: '#818cf8', lineHeight: 1 }}>
                    {fs.duration_formatted}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                    {fs.session_count} sub-sessions
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

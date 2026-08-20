import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { AlertTriangle, Sparkles } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0f1829',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '12px',
    }}>
      <p style={{ color: '#f0f4ff', fontWeight: 600 }}>{payload[0].name}</p>
      <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
        {Math.round(payload[0].value / 60)} minutes
      </p>
    </div>
  )
}

export default function DistractionPage() {
  const [analytics, setAnalytics] = useState(null)
  const [apps, setApps] = useState([])
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [a, ap, ws] = await Promise.all([
          api.getDailyAnalytics(),
          api.getApplications(),
          api.getWebsites(),
        ])
        setAnalytics(a)
        setApps(ap || [])
        setWebsites(ws || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const distractionApps = apps.filter(a => a.classification === 'DISTRACTION')
  const distractionWebsites = websites.filter(s => s.classification === 'DISTRACTION')
  const totalDistractionSecs = analytics?.summary?.distraction_seconds || 0
  const inactivity = analytics?.inactivity || { low_engagement_sessions: [] }

  const pieData = [
    { name: 'Social Media', value: analytics?.summary?.social_media_seconds || 0, color: '#f43f5e' },
    { name: 'Entertainment', value: analytics?.summary?.entertainment_seconds || 0, color: '#fb923c' },
    {
      name: 'Other Distractions',
      value: Math.max(0, totalDistractionSecs
        - (analytics?.summary?.social_media_seconds || 0)
        - (analytics?.summary?.entertainment_seconds || 0)),
      color: '#f97316',
    },
  ].filter(d => d.value > 0)

  const topDistractions = [...distractionApps, ...distractionWebsites]
    .sort((a, b) => b.total_seconds - a.total_seconds)
    .slice(0, 5)

  const kpis = [
    {
      label: 'Total Distraction', value: analytics?.summary?.distraction_formatted || '0m',
      color: '#f43f5e', sub: 'Confirmed distraction time',
    },
    {
      label: 'Low Engagement', value: inactivity.total_potential_inactive_formatted || '0m',
      color: '#f59e0b', sub: 'Open but inactive',
    },
    {
      label: 'Inactive Sessions', value: inactivity.session_count || 0,
      color: '#f0f4ff', sub: `Most: ${inactivity.most_affected_application || 'None'}`,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={16} color="#f43f5e" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>
            Distraction Intelligence
          </h1>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '42px' }}>
          Time sinks, social media, and low-engagement detection
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {kpis.map(({ label, value, color, sub }) => (
          <div key={label} className="card card-glow" style={{
            padding: '20px',
            borderColor: `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},0.15)`,
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
              {label}
            </span>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '24px', fontWeight: 700, color, lineHeight: 1 }}>
              {value}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
              {sub}
            </span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Pie Chart */}
        <div className="card card-glow" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4ff', marginBottom: '4px' }}>
            Distraction Sources
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Category distribution
          </p>

          {pieData.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              🚀 No distractions recorded today. Excellent focus!
            </div>
          ) : (
            <>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                {pieData.map((d, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top Targets */}
        <div className="card card-glow" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4ff', marginBottom: '4px' }}>
            Top Distraction Targets
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Ranked distracting activities
          </p>

          {topDistractions.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No distracting apps or sites logged today.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topDistractions.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.12)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: 'rgba(244,63,94,0.6)', width: '16px' }}>
                      {idx + 1}
                    </span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.application || item.domain}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700, color: '#fb7185', flexShrink: 0 }}>
                    {item.total_formatted}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low Engagement Section */}
      <div className="card card-glow" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sparkles size={16} color="#f59e0b" />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4ff' }}>
            Low Engagement Analysis
          </h3>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          FocusORM detects when tools are open without meaningful interaction, distinguishing between active deep study and passive background windows.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {inactivity.low_engagement_sessions.length === 0 ? (
            <div style={{
              padding: '24px', borderRadius: '10px',
              background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)',
              textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)',
            }}>
              ✅ No low-engagement anomalies detected today.
            </div>
          ) : (
            inactivity.low_engagement_sessions.map((session, i) => (
              <div key={i} style={{
                padding: '16px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4ff' }}>
                      {session.application}
                    </span>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                      background: 'rgba(245,158,11,0.1)', color: '#fbbf24',
                      border: '1px solid rgba(245,158,11,0.2)', padding: '2px 7px', borderRadius: '9999px',
                    }}>
                      {session.engagement_level?.replace('_', ' ')}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {session.duration_formatted}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {session.description}
                </p>
                {session.signals?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {session.signals.map((sig, sIdx) => (
                      <span key={sIdx} style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '6px',
                        background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        {sig}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

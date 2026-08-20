import { useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  Monitor,
  Clock,
  Flame,
  Brain,
  AlertTriangle,
  Crosshair,
  TrendingUp,
  Keyboard,
  Zap,
  Coffee,
  Play,
  Pause,
  Code2,
  BookOpen,
  RefreshCw,
  Activity,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

function fmt(secs) {
  if (!secs || secs <= 0) return '0m'
  if (secs < 60) return `${Math.round(secs)}s`
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm ? `${h}h ${rm}m` : `${h}h`
}

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({ title, value, subtext, icon: Icon, color = '#6366f1', wide }) {
  const rgb = hexToRgb(color)
  return (
    <div
      className="card card-glow"
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        gridColumn: wide ? 'span 2' : 'span 1',
      }}
    >
      {/* Subtle tinted bg */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0,
        width: '80px', height: '80px',
        borderRadius: '0 16px 0 80px',
        background: `radial-gradient(circle, rgba(${rgb},0.1) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </span>
        <div style={{
          width: '32px', height: '32px',
          borderRadius: '10px',
          background: `rgba(${rgb},0.12)`,
          border: `1px solid rgba(${rgb},0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={15} color={color} strokeWidth={2.5} />
        </div>
      </div>

      <div>
        <div className="stat-value" style={{ fontSize: '24px', color: '#f0f4ff' }}>
          {value || '—'}
        </div>
        {subtext && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Live Activity Banner ──────────────────────────────────── */
function LiveBanner({ status, onTogglePause }) {
  const isProductive = status?.current_classification === 'PRODUCTIVE'
  const isDistraction = status?.current_classification === 'DISTRACTION'
  const isNeutral = status?.current_classification === 'NEUTRAL'

  const accentColor = isProductive ? '#10b981'
    : isDistraction ? '#f43f5e'
    : isNeutral ? '#f59e0b'
    : '#6366f1'

  const accentRgb = hexToRgb(accentColor)

  if (!status?.current_application) {
    return (
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="pulse-dot" style={{ color: '#4a5578' }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Waiting for activity data...
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              FocusORM agent is running in the background
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="card"
      style={{
        padding: '20px 24px',
        background: `linear-gradient(135deg, rgba(${accentRgb},0.06) 0%, rgba(13,20,38,0.9) 100%)`,
        borderColor: `rgba(${accentRgb},0.2)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Corner glow */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '200px', height: '100%',
        background: `linear-gradient(90deg, rgba(${accentRgb},0.08) 0%, transparent 100%)`,
        pointerEvents: 'none',
        borderRadius: '16px 0 0 16px',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', position: 'relative' }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
          <div style={{
            width: '44px', height: '44px',
            borderRadius: '12px',
            background: `rgba(${accentRgb},0.12)`,
            border: `1px solid rgba(${accentRgb},0.25)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Monitor size={20} color={accentColor} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#f0f4ff' }}>
                {status.current_application}
              </span>
              <span className={`badge badge-${status.current_classification?.toLowerCase()}`}>
                {status.current_classification || 'UNKNOWN'}
              </span>
              {status.is_idle && (
                <span className="badge badge-idle">Idle</span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '480px' }}>
              {status.current_window_title || 'Foreground window active'}
            </p>
            {status.browser_domain && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '6px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#818cf8',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}>
                🌐 {status.browser_domain}
              </span>
            )}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Session
            </div>
            <div className="stat-value" style={{ fontSize: '26px', color: accentColor }}>
              {fmt(status.current_session_duration)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: '2px' }}>
              {status.current_activity_level} activity
            </div>
          </div>

          <button
            onClick={onTogglePause}
            style={{
              width: '40px', height: '40px',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: status.paused ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
              border: status.paused ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
              color: status.paused ? '#34d399' : 'rgba(139,156,200,0.7)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {status.paused ? <Play size={16} strokeWidth={2.5} /> : <Pause size={16} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Custom Recharts Tooltip ───────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0f1829',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '12px',
    }}>
      <p style={{ color: 'rgba(139,156,200,0.7)', marginBottom: '6px', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.fill, flexShrink: 0 }} />
          <span style={{ color: '#f0f4ff' }}>{p.name}: <b>{p.value}m</b></span>
        </div>
      ))}
    </div>
  )
}

/* ─── Productivity Chart ────────────────────────────────────── */
function ProductivityChart({ hourly }) {
  if (!hourly?.length) {
    return (
      <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={32} color="rgba(74,85,120,0.5)" style={{ margin: '0 auto 10px' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Collecting hourly data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card card-glow" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.01em' }}>
            Hourly Productivity
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
            Activity breakdown per hour
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {[
            { label: 'Productive', color: '#10b981' },
            { label: 'Neutral', color: '#f59e0b' },
            { label: 'Distraction', color: '#f43f5e' },
          ].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourly} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={12}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'rgba(74,85,120,0.9)' }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'rgba(74,85,120,0.9)' }}
              tickLine={false}
              axisLine={false}
              unit="m"
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="productive" name="Productive" stackId="a" fill="#10b981" />
            <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#f59e0b" />
            <Bar dataKey="distraction" name="Distraction" stackId="a" fill="#f43f5e" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ─── Top Apps List ─────────────────────────────────────────── */
function TopApps({ apps }) {
  const topApps = (apps || []).slice(0, 6)
  const max = Math.max(...topApps.map(a => a.total_seconds || 1), 1)

  const classColor = (cls) => cls === 'PRODUCTIVE' ? '#10b981'
    : cls === 'DISTRACTION' ? '#f43f5e'
    : '#f59e0b'

  return (
    <div className="card card-glow" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.01em' }}>
            Top Applications
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
            Most active today
          </p>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
          {topApps.length} apps
        </span>
      </div>

      {topApps.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          No application records yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {topApps.map((app, idx) => {
            const color = classColor(app.classification)
            const pct = Math.min(100, Math.round((app.total_seconds / max) * 100))
            return (
              <div key={idx}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{
                      width: '20px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      fontFamily: 'JetBrains Mono, monospace',
                      flexShrink: 0,
                    }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#f0f4ff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '160px',
                    }}>
                      {app.application}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span className="stat-value" style={{ fontSize: '13px', color: '#f0f4ff' }}>
                      {app.total_formatted}
                    </span>
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: color, flexShrink: 0,
                    }} />
                  </div>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Score Ring ─────────────────────────────────────────────── */
function ScoreRing({ score }) {
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#f43f5e'
  const r = 36
  const circumference = 2 * Math.PI * r
  const dash = (score / 100) * circumference

  return (
    <div style={{ position: 'relative', width: '88px', height: '88px', flexShrink: 0 }}>
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="44" cy="44" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span className="stat-value" style={{ fontSize: '18px', color }}>{score}</span>
        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Score
        </span>
      </div>
    </div>
  )
}

/* ─── Main Dashboard ────────────────────────────────────────── */
export default function Dashboard() {
  const [status, setStatus] = useState(null)
  const [today, setToday] = useState(null)
  const [hourly, setHourly] = useState([])
  const [apps, setApps] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const [s, t, h, a] = await Promise.all([
        api.getStatus(),
        api.getToday(),
        api.getHourly(),
        api.getApplications(),
      ])
      setStatus(s)
      setToday(t)
      setHourly(h || [])
      setApps(a || [])
    } catch (err) {
      console.error('Dashboard load error:', err)
    }
  }

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 4000)
    return () => clearInterval(timer)
  }, [])

  const handleTogglePause = async () => {
    if (status?.paused) await api.resumeTracking()
    else await api.pauseTracking()
    loadData()
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setTimeout(() => setRefreshing(false), 500)
  }

  const score = today?.productivity_score || 0
  const now = new Date()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Intelligence Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Score pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Zap size={13} color="#6366f1" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Productivity Score
            </span>
            <span className="stat-value" style={{
              fontSize: '15px',
              color: score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#f43f5e',
            }}>
              {score}%
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className="btn-glass"
            style={{ padding: '7px 10px', borderRadius: '10px' }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.5s linear' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ── Live Banner ── */}
      <LiveBanner status={status} onTogglePause={handleTogglePause} />

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
        <StatCard title="Screen Time"   value={today?.total_formatted}       subtext="Total time"          icon={Monitor}      color="#6366f1" />
        <StatCard title="Productive"    value={today?.productive_formatted}   subtext="Work / Study"        icon={Flame}        color="#10b981" />
        <StatCard title="Deep Work"     value={today?.deep_work_formatted}    subtext="High engagement"     icon={Brain}        color="#0ea5e9" />
        <StatCard title="Distraction"   value={today?.distraction_formatted}  subtext="Social & entertainment" icon={AlertTriangle} color="#f43f5e" />
        <StatCard title="Idle Time"     value={today?.idle_formatted}         subtext="Away from desk"      icon={Coffee}       color="#64748b" />
        <StatCard title="Efficiency"    value={`${score}%`}                   subtext="Productive / Active" icon={TrendingUp}   color={score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#f43f5e'} />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <ProductivityChart hourly={hourly} />
        <TopApps apps={apps} />
      </div>

      {/* ── Secondary KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
        <StatCard
          title="Longest Focus"
          value={today ? fmt(today.longest_focus_seconds || 0) : '0m'}
          subtext="Best streak"
          icon={Crosshair}
          color="#8b5cf6"
        />
        <StatCard
          title="Keystrokes"
          value={today?.total_keyboard?.toLocaleString() || '0'}
          subtext="Input events"
          icon={Keyboard}
          color="#a855f7"
        />
        <StatCard
          title="Coding Time"
          value={today?.coding_formatted || '0m'}
          subtext="IDE & terminal"
          icon={Code2}
          color="#10b981"
        />
        <StatCard
          title="Learning Time"
          value={today?.learning_formatted || '0m'}
          subtext="Docs & courses"
          icon={BookOpen}
          color="#0ea5e9"
        />
      </div>
    </div>
  )
}

function hexToRgb(hex) {
  if (!hex?.startsWith('#')) return '99,102,241'
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}

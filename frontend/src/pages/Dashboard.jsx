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
  Layers,
  ArrowUpRight,
  Code2,
  BookOpen
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

function formatDuration(secs) {
  if (!secs || secs <= 0) return '0s'
  if (secs < 60) return `${Math.round(secs)}s`
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm ? `${h}h ${rm}m` : `${h}h`
}

function StatTile({ title, value, subtext, icon: Icon, colorClass, borderClass, bgClass }) {
  return (
    <div className={`focus-card p-4 flex flex-col justify-between ${borderClass || 'border-slate-800'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
          {title}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bgClass || 'bg-slate-800'}`}>
          <Icon className={`w-3.5 h-3.5 ${colorClass || 'text-slate-300'}`} />
        </div>
      </div>
      <div className="mt-1">
        <div className="text-xl font-bold font-mono text-white tracking-tight truncate">
          {value || '0m'}
        </div>
        {subtext && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  )
}

function LiveActivityBanner({ status, onTogglePause }) {
  if (!status || !status.current_application) {
    return (
      <div className="focus-card p-5 border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-slate-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Waiting for activity data...</h3>
            <p className="text-xs text-slate-400 mt-0.5">FocusORM agent is active in the background</p>
          </div>
        </div>
      </div>
    )
  }

  const isDistraction = status.current_classification === 'DISTRACTION'
  const isProductive = status.current_classification === 'PRODUCTIVE'
  const isNeutral = status.current_classification === 'NEUTRAL'

  const classificationClass = isProductive
    ? 'badge-productive'
    : isDistraction
      ? 'badge-distraction'
      : isNeutral
        ? 'badge-neutral'
        : 'badge-unknown'

  return (
    <div className="focus-card p-5 relative overflow-hidden border-indigo-500/30 bg-gradient-to-r from-slate-900 via-slate-900/95 to-indigo-950/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Monitor className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-white truncate">
                {status.current_application}
              </span>
              <span className={`badge ${classificationClass}`}>
                {status.current_classification || 'UNKNOWN'}
              </span>
              {status.is_idle && (
                <span className="badge badge-idle">Idle</span>
              )}
            </div>

            <p className="text-xs text-slate-400 truncate max-w-xl mt-1">
              {status.current_window_title || 'Foreground window active'}
            </p>

            {status.browser_domain && (
              <span className="inline-block text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded mt-1.5 border border-indigo-500/20">
                🌐 {status.browser_domain}
              </span>
            )}
          </div>
        </div>

        {/* Right Timer & Status */}
        <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          <div className="text-left md:text-right">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Session
            </div>
            <div className="text-2xl font-mono font-bold text-indigo-300">
              {formatDuration(status.current_session_duration)}
            </div>
            <div className="text-[11px] text-slate-400 capitalize">
              {status.current_activity_level} interaction
            </div>
          </div>

          <button
            onClick={onTogglePause}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${status.paused
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            title={status.paused ? 'Resume tracking' : 'Pause tracking'}
          >
            {status.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductivityChart({ hourly }) {
  if (!hourly || hourly.length === 0) {
    return (
      <div className="focus-card p-6 min-w-0">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
          Hourly Distribution
        </h3>
        <p className="text-xs text-slate-400">Collecting hourly data...</p>
      </div>
    )
  }

  return (
    <div className="focus-card p-6 min-w-0 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Hourly Productivity
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Active minutes categorized per hour</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Productive
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Neutral
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Distraction
          </span>
        </div>
      </div>

      <div className="w-full h-56 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              unit="m"
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '10px',
                fontSize: '12px',
                color: '#f8fafc',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
              }}
              formatter={(value, name) => [`${value} mins`, name]}
            />
            <Bar dataKey="productive" name="Productive" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
            <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
            <Bar dataKey="distraction" name="Distraction" stackId="a" fill="#f87171" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TopAppsList({ apps }) {
  const topApps = (apps || []).slice(0, 6)
  const maxSecs = Math.max(...topApps.map(a => a.total_seconds || 1), 1)

  return (
    <div className="focus-card p-6 min-w-0 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Top Applications
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Most active apps today</p>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {topApps.length} tracked
        </span>
      </div>

      <div className="space-y-3.5">
        {topApps.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No application records logged yet.</p>
        ) : (
          topApps.map((app, idx) => {
            const isProductive = app.classification === 'PRODUCTIVE'
            const isDistraction = app.classification === 'DISTRACTION'
            const barFill = isProductive
              ? 'bg-emerald-400'
              : isDistraction
                ? 'bg-rose-400'
                : 'bg-amber-400'

            const pct = Math.min(100, Math.round((app.total_seconds / maxSecs) * 100))

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                    {app.application}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-300 font-medium">
                      {app.total_formatted}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({app.session_count}s)
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barFill} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
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

export default function Dashboard() {
  const [status, setStatus] = useState(null)
  const [today, setToday] = useState(null)
  const [hourly, setHourly] = useState([])
  const [apps, setApps] = useState([])

  const loadData = async () => {
    try {
      const [s, t, h, a] = await Promise.all([
        api.getStatus(),
        api.getToday(),
        api.getHourly(),
        api.getApplications()
      ])
      setStatus(s)
      setToday(t)
      setHourly(h || [])
      setApps(a || [])
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    }
  }

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 4000)
    return () => clearInterval(timer)
  }, [])

  const handleTogglePause = async () => {
    if (status?.paused) {
      await api.resumeTracking()
    } else {
      await api.pauseTracking()
    }
    loadData()
  }

  const productivityScore = today?.productivity_score || 0
  const scoreColor = productivityScore >= 70
    ? 'text-emerald-400'
    : productivityScore >= 45
      ? 'text-amber-400'
      : 'text-rose-400'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Intelligence Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">Score:</span>
            <span className={`text-sm font-mono font-bold ${scoreColor}`}>
              {productivityScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Hero Live Activity */}
      <LiveActivityBanner status={status} onTogglePause={handleTogglePause} />

      {/* Core KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatTile
          title="Screen Time"
          value={today?.total_formatted}
          subtext="Total session time"
          icon={Monitor}
          colorClass="text-indigo-400"
          bgClass="bg-indigo-500/10"
        />
        <StatTile
          title="Productive"
          value={today?.productive_formatted}
          subtext="Active study/work"
          icon={Flame}
          colorClass="text-emerald-400"
          bgClass="bg-emerald-500/10"
        />
        <StatTile
          title="Deep Work"
          value={today?.deep_work_formatted}
          subtext="High engagement"
          icon={Brain}
          colorClass="text-sky-400"
          bgClass="bg-sky-500/10"
        />
        <StatTile
          title="Distraction"
          value={today?.distraction_formatted}
          subtext="Social & entertainment"
          icon={AlertTriangle}
          colorClass="text-rose-400"
          bgClass="bg-rose-500/10"
        />
        <StatTile
          title="Idle Time"
          value={today?.idle_formatted}
          subtext="Away from keyboard"
          icon={Coffee}
          colorClass="text-slate-400"
          bgClass="bg-slate-500/10"
        />
        <StatTile
          title="Efficiency"
          value={`${productivityScore}%`}
          subtext="Productive / Active"
          icon={TrendingUp}
          colorClass={scoreColor}
          bgClass="bg-slate-800"
        />
      </div>

      {/* Main Visual Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        <ProductivityChart hourly={hourly} />
        <TopAppsList apps={apps} />
      </div>

      {/* Secondary Engagement Insights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatTile
          title="Longest Focus"
          value={today ? formatDuration(today.longest_focus_seconds || 0) : '0m'}
          subtext="Continuous streak"
          icon={Crosshair}
          colorClass="text-indigo-400"
          bgClass="bg-indigo-500/10"
        />
        <StatTile
          title="Keystrokes"
          value={today?.total_keyboard?.toLocaleString() || '0'}
          subtext="Input interactions"
          icon={Keyboard}
          colorClass="text-purple-400"
          bgClass="bg-purple-500/10"
        />
        <StatTile
          title="Coding Time"
          value={today?.coding_formatted || '0m'}
          subtext="IDE & terminal activity"
          icon={Code2}
          colorClass="text-emerald-400"
          bgClass="bg-emerald-500/10"
        />
        <StatTile
          title="Learning Time"
          value={today?.learning_formatted || '0m'}
          subtext="Docs, courses, papers"
          icon={BookOpen}
          colorClass="text-sky-400"
          bgClass="bg-sky-500/10"
        />
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { AppWindow, Keyboard, MousePointer, Clock, CheckCircle2 } from 'lucide-react'

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <AppWindow className="w-6 h-6 text-indigo-400" />
            Application Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked usage, active focus vs idle duration, and interaction metrics
          </p>
        </div>
        <div className="text-xs text-slate-400 font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 self-start">
          {apps.length} applications logged
        </div>
      </div>

      {/* App List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="focus-card p-12 text-center text-slate-400 text-sm">
            Loading application records...
          </div>
        ) : apps.length === 0 ? (
          <div className="focus-card p-12 text-center text-slate-400 text-sm">
            No application records logged yet today.
          </div>
        ) : (
          apps.map((app, idx) => {
            const isProd = app.classification === 'PRODUCTIVE'
            const isDist = app.classification === 'DISTRACTION'
            const isNeut = app.classification === 'NEUTRAL'

            const badgeClass = isProd
              ? 'badge-productive'
              : isDist
              ? 'badge-distraction'
              : isNeut
              ? 'badge-neutral'
              : 'badge-unknown'

            const barColor = isProd
              ? 'bg-emerald-400'
              : isDist
              ? 'bg-rose-400'
              : 'bg-amber-400'

            const pct = Math.min(100, Math.round((app.total_seconds / maxSeconds) * 100))

            return (
              <div key={idx} className="focus-card p-5 space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center font-mono font-bold text-xs text-slate-300">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {app.application}
                        </span>
                        <span className={`badge ${badgeClass}`}>
                          {app.category || app.classification}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {app.session_count} active sessions
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-mono font-bold text-indigo-300">
                      {app.total_formatted}
                    </div>
                    <span className="text-xs text-slate-400">
                      {Math.round(app.active_seconds / 60)}m active • {Math.round(app.idle_seconds / 60)}m idle
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Footer Interaction Stats */}
                <div className="flex items-center gap-6 pt-1 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Keyboard className="w-3.5 h-3.5 text-purple-400" />
                    {app.keyboard_count?.toLocaleString() || 0} keystrokes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MousePointer className="w-3.5 h-3.5 text-sky-400" />
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

import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Clock, Monitor, Globe, ChevronRight, Activity, Calendar } from 'lucide-react'

function fmt(secs) {
  if (!secs || secs <= 0) return '0s'
  if (secs < 60) return `${Math.round(secs)}s`
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-indigo-400" />
            Activity Timeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full chronological reconstruction of sessions recorded today
          </p>
        </div>
        <div className="text-xs text-slate-400 font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 self-start">
          {sessions.length} sessions logged
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-3">
        {loading ? (
          <div className="focus-card p-12 text-center text-slate-400 text-sm">
            Loading timeline records...
          </div>
        ) : sessions.length === 0 ? (
          <div className="focus-card p-12 text-center text-slate-400 text-sm">
            No activity records logged yet today.
          </div>
        ) : (
          sessions.map((s, idx) => {
            const isProd = s.classification === 'PRODUCTIVE'
            const isDist = s.classification === 'DISTRACTION'
            const isNeut = s.classification === 'NEUTRAL'
            const badgeClass = isProd
              ? 'badge-productive'
              : isDist
              ? 'badge-distraction'
              : isNeut
              ? 'badge-neutral'
              : 'badge-unknown'

            const borderAccent = isProd
              ? 'border-l-4 border-l-emerald-500'
              : isDist
              ? 'border-l-4 border-l-rose-500'
              : isNeut
              ? 'border-l-4 border-l-amber-500'
              : 'border-l-4 border-l-purple-500'

            return (
              <div
                key={s.id || idx}
                className={`focus-card focus-card-interactive p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${borderAccent}`}
              >
                {/* Left Block */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-slate-400 shrink-0 w-12 text-right">
                    {fmtTime(s.start_time)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white truncate">
                        {s.application}
                      </span>
                      {s.domain && (
                        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                          {s.domain}
                        </span>
                      )}
                    </div>
                    {s.window_title && (
                      <p className="text-xs text-slate-400 truncate max-w-xl mt-0.5">
                        {s.window_title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Metrics */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <div className="text-left sm:text-right">
                    <div className="font-mono text-sm font-bold text-slate-200">
                      {fmt(s.duration_seconds)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {s.active_seconds > 0 ? `${fmt(s.active_seconds)} active` : 'Passive'}
                    </span>
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

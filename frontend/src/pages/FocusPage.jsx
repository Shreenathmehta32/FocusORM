import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Crosshair, Clock, Zap, ArrowRightLeft, Sparkles, CheckCircle2 } from 'lucide-react'

export default function FocusPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getFocus().then(d => {
      setData(d)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Crosshair className="w-6 h-6 text-indigo-400" />
            Focus Sessions & Deep Work
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Consecutive productive periods (≥ 15 min) with minimal interruptions
          </p>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="focus-card p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Focus Time</span>
          <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
            {data?.total_focus_formatted || '0m'}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Sum of all focus blocks</span>
        </div>

        <div className="focus-card p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Longest Session</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {data?.longest_focus_formatted || '0m'}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Max unbroken streak</span>
        </div>

        <div className="focus-card p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Session Count</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {data?.focus_session_count || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Qualified focus blocks</span>
        </div>

        <div className="focus-card p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Context Switches</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {data?.context_switches || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Application shifts</span>
        </div>
      </div>

      {/* Focus Session List */}
      <div className="space-y-3.5">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Detected Focus Blocks
        </h3>

        {loading ? (
          <div className="focus-card p-12 text-center text-slate-400 text-sm">
            Calculating focus sessions...
          </div>
        ) : !data || data.focus_sessions?.length === 0 ? (
          <div className="focus-card p-12 text-center space-y-2">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto opacity-40" />
            <p className="text-sm font-semibold text-slate-300">No continuous focus blocks logged yet today</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Focus sessions are automatically formed when you engage in productive tasks (VS Code, Docs, Research) for 15+ uninterrupted minutes.
            </p>
          </div>
        ) : (
          data.focus_sessions.map((fs, idx) => (
            <div key={idx} className="focus-card p-5 border-l-4 border-l-indigo-500 space-y-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-bold text-white">
                    {new Date(fs.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' — '}
                    {new Date(fs.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {fs.applications?.join(' • ') || 'Productive Activity'}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xl font-mono font-bold text-indigo-300">
                    {fs.duration_formatted}
                  </div>
                  <span className="text-xs text-slate-400">
                    {fs.session_count} sub-sessions
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

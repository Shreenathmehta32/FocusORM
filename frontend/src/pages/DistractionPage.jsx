import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { AlertTriangle, TrendingDown, Clock, ShieldAlert, Sparkles, PieChart as PieIcon } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts'

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
          api.getWebsites()
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

  const distractionApps = apps.filter(app => app.classification === 'DISTRACTION')
  const distractionWebsites = websites.filter(site => site.classification === 'DISTRACTION')
  const totalDistractionSecs = analytics?.summary?.distraction_seconds || 0

  const pieData = [
    { name: 'Social Media', value: analytics?.summary?.social_media_seconds || 0, color: '#f87171' },
    { name: 'Entertainment', value: analytics?.summary?.entertainment_seconds || 0, color: '#fb923c' },
    {
      name: 'Other Distractions',
      value: Math.max(0, totalDistractionSecs - (analytics?.summary?.social_media_seconds || 0) - (analytics?.summary?.entertainment_seconds || 0)),
      color: '#f43f5e'
    }
  ].filter(d => d.value > 0)

  const inactivity = analytics?.inactivity || { low_engagement_sessions: [] }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
          Distraction & Inactivity Intelligence
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Objective breakdown of time sinks, social media, and low-engagement study periods
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="focus-card p-5 border-rose-500/20">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Distraction Time
          </span>
          <div className="text-2xl font-mono font-bold text-rose-400 mt-1">
            {analytics?.summary?.distraction_formatted || '0m'}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Confirmed distraction apps & websites
          </span>
        </div>

        <div className="focus-card p-5 border-amber-500/20">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Low Engagement Time
          </span>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {inactivity.total_potential_inactive_formatted || '0m'}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Open windows with minimal user interaction
          </span>
        </div>

        <div className="focus-card p-5 border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Inactive Sessions
          </span>
          <div className="text-2xl font-mono font-bold text-white mt-1">
            {inactivity.session_count || 0}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Most affected: {inactivity.most_affected_application || 'None'}
          </span>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Distraction Breakdown */}
        <div className="focus-card p-6 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Distraction Sources
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Category distribution</p>
          </div>

          {pieData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No distractions recorded today. Excellent focus! 🚀
            </div>
          ) : (
            <div className="h-56 min-w-0 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#f8fafc'
                    }}
                    formatter={(value) => [`${Math.round(value / 60)} mins`, 'Time']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs text-slate-400 mt-2">
                {pieData.map((d, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Distraction Targets */}
        <div className="focus-card p-6 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Top Distraction Targets
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranked distracting activities</p>
          </div>

          <div className="space-y-3 mt-4">
            {[...distractionApps, ...distractionWebsites].length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">
                No distracting apps or sites logged today.
              </p>
            ) : (
              [...distractionApps, ...distractionWebsites]
                .sort((a, b) => b.total_seconds - a.total_seconds)
                .slice(0, 5)
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="text-xs font-semibold text-slate-200">
                        {item.application || item.domain}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {item.total_formatted}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Inactivity & Low Engagement Details */}
      <div className="focus-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Low Engagement Detection Analysis
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            FocusORM detects when tools are open without meaningful interaction, distinguishing between active deep study and passive background windows.
          </p>
        </div>

        <div className="space-y-3">
          {inactivity.low_engagement_sessions.length === 0 ? (
            <div className="p-6 bg-slate-900/40 rounded-xl text-center text-xs text-slate-400">
              No low-engagement anomalies detected today.
            </div>
          ) : (
            inactivity.low_engagement_sessions.map((session, i) => (
              <div
                key={i}
                className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {session.application}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase">
                      {session.engagement_level?.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {session.duration_formatted}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{session.description}</p>
                {session.signals && session.signals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {session.signals.map((sig, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md border border-slate-700/50"
                      >
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

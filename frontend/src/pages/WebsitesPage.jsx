import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Globe, ExternalLink, ShieldCheck } from 'lucide-react'

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-indigo-400" />
            Website Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Browser activity captured via privacy-sanitized extension events
          </p>
        </div>
        <div className="text-xs text-slate-400 font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 self-start">
          {sites.length} domains logged
        </div>
      </div>

      {/* Website List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="focus-card p-12 text-center text-slate-400 text-sm">
            Loading website records...
          </div>
        ) : sites.length === 0 ? (
          <div className="focus-card p-12 text-center space-y-2">
            <Globe className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No website data logged yet today</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Install the FocusORM browser extension in Chrome or Edge to track educational docs, repositories, and learning platforms.
            </p>
          </div>
        ) : (
          sites.map((site, idx) => {
            const isProd = site.classification === 'PRODUCTIVE'
            const isDist = site.classification === 'DISTRACTION'
            const isNeut = site.classification === 'NEUTRAL'

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

            const pct = Math.min(100, Math.round((site.total_seconds / maxSeconds) * 100))

            return (
              <div key={idx} className="focus-card p-5 space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center font-mono font-bold text-xs text-slate-300">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-300">
                          {site.domain}
                        </span>
                        <span className={`badge ${badgeClass}`}>
                          {site.category || site.classification}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {site.visit_count} visit sessions
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-mono font-bold text-slate-200">
                      {site.total_formatted}
                    </div>
                    <span className="text-xs text-slate-400">
                      {Math.round(site.active_seconds / 60)}m active
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all duration-700`}
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

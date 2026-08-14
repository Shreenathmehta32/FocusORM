import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Settings, ToggleLeft, ToggleRight, Clock, Database, Brain, Check, Save } from 'lucide-react'

function SettingToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3.5 gap-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-200">{label}</div>
        {description && (
          <div className="text-xs text-slate-400 mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onChange}
        className="text-slate-400 hover:text-white transition-colors shrink-0 p-1"
      >
        {checked ? (
          <ToggleRight className="w-8 h-8 text-emerald-400" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-slate-600" />
        )}
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    api.getSettings().then(s => setSettings(s))
  }, [])

  const update = async (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    setSaving(true)
    await api.updateSettings({ [key]: value })
    setSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  if (!settings) {
    return (
      <div className="focus-card p-12 text-center text-slate-400 text-sm">
        Loading settings...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-indigo-400" />
            System Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage local activity tracking policies, idle timeouts, and AI classification
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Check className="w-3.5 h-3.5" />
            Saved
          </div>
        )}
      </div>

      {/* Tracking Engines */}
      <div className="focus-card p-6 space-y-2">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-indigo-400" />
          Tracking Subsystems
        </h3>
        <div className="divide-y divide-slate-800">
          <SettingToggle
            label="Master Tracking Engine"
            description="Enable or suspend all active window polling and background tracking"
            checked={settings.tracking_enabled}
            onChange={() => update('tracking_enabled', !settings.tracking_enabled)}
          />
          <SettingToggle
            label="Application Monitoring"
            description="Track active desktop processes, title changes, and window focus"
            checked={settings.track_applications}
            onChange={() => update('track_applications', !settings.track_applications)}
          />
          <SettingToggle
            label="Browser Activity"
            description="Receive sanitized domain and tab titles from the browser extension"
            checked={settings.track_websites}
            onChange={() => update('track_websites', !settings.track_websites)}
          />
          <SettingToggle
            label="Interaction Counters"
            description="Aggregate keystroke & mouse counts (No keylogging; privacy-first count only)"
            checked={settings.track_interaction_metrics}
            onChange={() => update('track_interaction_metrics', !settings.track_interaction_metrics)}
          />
          <SettingToggle
            label="Coding & File Activity"
            description="Detect source file creation, editing, and deletion in development folders"
            checked={settings.track_coding_metrics}
            onChange={() => update('track_coding_metrics', !settings.track_coding_metrics)}
          />
        </div>
      </div>

      {/* AI Classification */}
      <div className="focus-card p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          Groq AI Intelligence (Optional)
        </h3>
        <p className="text-xs text-slate-400">
          When enabled, unrecognized apps/sites are categorized via Groq LLM using minimal sanitized metadata.
        </p>
        <div className="pt-2 border-t border-slate-800">
          <SettingToggle
            label="Enable Groq AI Classification"
            description="Only sends application name, domain, and sanitized title"
            checked={settings.enable_groq}
            onChange={() => update('enable_groq', !settings.enable_groq)}
          />
        </div>
      </div>

      {/* Thresholds & Retention */}
      <div className="focus-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          Data Retention & Idle Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Idle Inactivity Threshold</div>
            <p className="text-[11px] text-slate-400">Minutes of zero hardware input before logging as idle</p>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              value={settings.idle_threshold_seconds}
              onChange={(e) => update('idle_threshold_seconds', parseInt(e.target.value))}
            >
              <option value={120}>2 minutes (Strict)</option>
              <option value={300}>5 minutes (Standard)</option>
              <option value={600}>10 minutes (Relaxed)</option>
              <option value={900}>15 minutes (Extended)</option>
            </select>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Local Data Retention</div>
            <p className="text-[11px] text-slate-400">Automatically purge local SQLite records older than</p>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              value={settings.data_retention_days}
              onChange={(e) => update('data_retention_days', parseInt(e.target.value))}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days (Recommended)</option>
              <option value={365}>1 year</option>
              <option value={-1}>Keep indefinitely</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

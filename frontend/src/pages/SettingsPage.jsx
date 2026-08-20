import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Settings, ToggleLeft, ToggleRight, Clock, Database, Brain, Check } from 'lucide-react'

function Toggle({ label, description, checked, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', gap: '16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4ff' }}>{label}</div>
        {description && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onChange}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
      >
        {checked
          ? <ToggleRight size={32} color="#10b981" />
          : <ToggleLeft size={32} color="rgba(74,85,120,0.7)" />
        }
      </button>
    </div>
  )
}

function SectionCard({ title, icon: Icon, color = '#6366f1', children }) {
  const rgb = `${parseInt(color.slice(1,3), 16)},${parseInt(color.slice(3,5), 16)},${parseInt(color.slice(5,7), 16)}`
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={15} color={color} strokeWidth={2.5} />
        </div>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    api.getSettings().then(s => setSettings(s))
  }, [])

  const update = async (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    await api.updateSettings({ [key]: value })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  if (!settings) {
    return (
      <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        Loading settings...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings size={16} color="#6366f1" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>
              System Settings
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '42px' }}>
            Manage tracking policies, idle timeouts, and AI classification
          </p>
        </div>

        {savedSuccess && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 12px', borderRadius: '10px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            fontSize: '12px', fontWeight: 600, color: '#34d399',
          }}>
            <Check size={13} strokeWidth={3} />
            Saved
          </div>
        )}
      </div>

      {/* Tracking Subsystems */}
      <SectionCard title="Tracking Subsystems" icon={Clock} color="#6366f1">
        <div>
          {[
            { key: 'tracking_enabled', label: 'Master Tracking Engine', desc: 'Enable or suspend all active window polling and background tracking' },
            { key: 'track_applications', label: 'Application Monitoring', desc: 'Track active desktop processes, title changes, and window focus' },
            { key: 'track_websites', label: 'Browser Activity', desc: 'Receive sanitized domain and tab titles from the browser extension' },
            { key: 'track_interaction_metrics', label: 'Interaction Counters', desc: 'Aggregate keystroke & mouse counts (No keylogging; privacy-first count only)' },
            { key: 'track_coding_metrics', label: 'Coding & File Activity', desc: 'Detect source file creation, editing, and deletion in development folders' },
          ].map(({ key, label, desc }) => (
            <Toggle
              key={key}
              label={label}
              description={desc}
              checked={settings[key]}
              onChange={() => update(key, !settings[key])}
            />
          ))}
        </div>
      </SectionCard>

      {/* AI Classification */}
      <SectionCard title="Groq AI Intelligence" icon={Brain} color="#8b5cf6">
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
          When enabled, unrecognized apps/sites are categorized via Groq LLM using minimal sanitized metadata.
        </p>
        <Toggle
          label="Enable Groq AI Classification"
          description="Only sends application name, domain, and sanitized title"
          checked={settings.enable_groq}
          onChange={() => update('enable_groq', !settings.enable_groq)}
        />
      </SectionCard>

      {/* Data Retention */}
      <SectionCard title="Data Retention & Idle Configuration" icon={Database} color="#0ea5e9">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{
            padding: '16px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Idle Inactivity Threshold
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>
              Minutes of zero input before logging as idle
            </p>
            <select
              value={settings.idle_threshold_seconds}
              onChange={(e) => update('idle_threshold_seconds', parseInt(e.target.value))}
              style={{ width: '100%' }}
            >
              <option value={120}>2 minutes (Strict)</option>
              <option value={300}>5 minutes (Standard)</option>
              <option value={600}>10 minutes (Relaxed)</option>
              <option value={900}>15 minutes (Extended)</option>
            </select>
          </div>

          <div style={{
            padding: '16px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Local Data Retention
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>
              Automatically purge SQLite records older than
            </p>
            <select
              value={settings.data_retention_days}
              onChange={(e) => update('data_retention_days', parseInt(e.target.value))}
              style={{ width: '100%' }}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days (Recommended)</option>
              <option value={365}>1 year</option>
              <option value={-1}>Keep indefinitely</option>
            </select>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

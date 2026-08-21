import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Settings, ToggleLeft, ToggleRight, Clock, Database, Brain, Check, Key, Zap, AlertCircle, Loader } from 'lucide-react'

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

  // AI Provider state
  const [aiStatus, setAiStatus] = useState(null)       // { provider, configured, masked_key }
  const [aiKeyInput, setAiKeyInput] = useState('')
  const [aiEditing, setAiEditing] = useState(false)    // show the input field
  const [aiSaving, setAiSaving] = useState(false)
  const [aiTesting, setAiTesting] = useState(false)
  const [aiMsg, setAiMsg] = useState(null)              // { type: 'success'|'error', text }

  useEffect(() => {
    api.getSettings().then(s => setSettings(s))
    api.getAISettings().then(s => setAiStatus(s))
  }, [])

  const update = async (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    await api.updateSettings({ [key]: value })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  // ── AI provider handlers ────────────────────────────────
  const clearAiMsg = () => setAiMsg(null)

  const handleAiSave = async () => {
    if (!aiKeyInput.trim()) return
    setAiSaving(true)
    clearAiMsg()
    const result = await api.saveAISettings({ provider: 'groq', api_key: aiKeyInput.trim() })
    setAiSaving(false)
    if (result) {
      setAiStatus(result)
      setAiKeyInput('')
      setAiEditing(false)
      setAiMsg({ type: 'success', text: 'Groq API key saved.' })
    } else {
      setAiMsg({ type: 'error', text: 'Invalid key format. Groq keys start with gsk_.' })
    }
    setTimeout(clearAiMsg, 5000)
  }

  const handleAiTest = async () => {
    setAiTesting(true)
    clearAiMsg()
    const result = await api.testAIConnection()
    setAiTesting(false)
    if (result) {
      setAiMsg({ type: result.success ? 'success' : 'error', text: result.message })
    } else {
      setAiMsg({ type: 'error', text: 'Unable to reach backend. Is FocusORM running?' })
    }
    setTimeout(clearAiMsg, 7000)
  }

  const handleAiRemove = async () => {
    clearAiMsg()
    await api.deleteAISettings()
    setAiStatus({ provider: 'groq', configured: false, masked_key: '' })
    setAiEditing(false)
    setAiKeyInput('')
    setAiMsg({ type: 'success', text: 'Groq API key removed.' })
    setTimeout(clearAiMsg, 4000)
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

      {/* AI Provider Configuration */}
      <SectionCard title="AI Provider" icon={Key} color="#f59e0b">
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
          Configure your Groq API key to enable AI-powered activity classification.
          Your key is stored locally on your machine and never sent to any server except Groq.
        </p>

        {/* Provider row */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Provider</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '8px',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            fontSize: '12px', fontWeight: 600, color: '#fbbf24',
          }}>
            <Zap size={11} strokeWidth={2.5} />
            Groq
          </div>
        </div>

        {/* Key display / input */}
        {aiStatus?.configured && !aiEditing ? (
          /* ── Configured state ── */
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>API Key</div>
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-muted)',
              letterSpacing: '0.05em', marginBottom: '14px',
            }}>
              {aiStatus.masked_key || '••••••••••••••••••••'}
            </div>

            {/* Status badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', borderRadius: '8px',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                fontSize: '11px', fontWeight: 600, color: '#34d399',
              }}>
                <Check size={11} strokeWidth={3} />
                Configured
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                id="ai-test-btn"
                onClick={handleAiTest}
                disabled={aiTesting}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '9px', cursor: 'pointer',
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                  fontSize: '12px', fontWeight: 600, color: '#818cf8',
                  opacity: aiTesting ? 0.6 : 1,
                }}
              >
                {aiTesting ? <Loader size={12} strokeWidth={2.5} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={12} strokeWidth={2.5} />}
                {aiTesting ? 'Testing…' : 'Test Connection'}
              </button>
              <button
                id="ai-change-key-btn"
                onClick={() => { setAiEditing(true); clearAiMsg() }}
                style={{
                  padding: '8px 14px', borderRadius: '9px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                }}
              >
                Change Key
              </button>
              <button
                id="ai-remove-key-btn"
                onClick={handleAiRemove}
                style={{
                  padding: '8px 14px', borderRadius: '9px', cursor: 'pointer',
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: '12px', fontWeight: 600, color: '#f87171',
                }}
              >
                Remove Key
              </button>
            </div>
          </div>
        ) : (
          /* ── Not configured / editing state ── */
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Groq API Key</div>
            {!aiStatus?.configured && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '8px',
                  background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.15)',
                  fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
                }}>
                  <AlertCircle size={11} strokeWidth={2.5} />
                  Not configured
                </div>
              </div>
            )}
            <input
              id="ai-key-input"
              type="password"
              placeholder="gsk_••••••••••••••••••••••••••••••••••••"
              value={aiKeyInput}
              onChange={e => setAiKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiSave()}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '13px', fontFamily: 'monospace', color: '#f0f4ff',
                outline: 'none', boxSizing: 'border-box', marginBottom: '12px',
                letterSpacing: '0.05em',
              }}
              autoComplete="off"
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
              Get your free key at{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                style={{ color: '#818cf8', textDecoration: 'none' }}>
                console.groq.com/keys
              </a>. It stays on your machine.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                id="ai-save-btn"
                onClick={handleAiSave}
                disabled={!aiKeyInput.trim() || aiSaving}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '9px', cursor: 'pointer',
                  background: aiKeyInput.trim() ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${aiKeyInput.trim() ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  fontSize: '12px', fontWeight: 600,
                  color: aiKeyInput.trim() ? '#fbbf24' : 'var(--text-muted)',
                  opacity: aiSaving ? 0.6 : 1,
                }}
              >
                {aiSaving ? <Loader size={12} strokeWidth={2.5} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} strokeWidth={3} />}
                {aiSaving ? 'Saving…' : 'Save'}
              </button>
              {aiEditing && (
                <button
                  id="ai-cancel-btn"
                  onClick={() => { setAiEditing(false); setAiKeyInput(''); clearAiMsg() }}
                  style={{
                    padding: '8px 14px', borderRadius: '9px', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Status message */}
        {aiMsg && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '7px', marginTop: '14px',
            padding: '10px 14px', borderRadius: '10px',
            background: aiMsg.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${aiMsg.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            fontSize: '12px', fontWeight: 500,
            color: aiMsg.type === 'success' ? '#34d399' : '#f87171',
            lineHeight: 1.4,
          }}>
            {aiMsg.type === 'success'
              ? <Check size={13} strokeWidth={3} style={{ flexShrink: 0, marginTop: '1px' }} />
              : <AlertCircle size={13} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '1px' }} />
            }
            {aiMsg.text}
          </div>
        )}
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

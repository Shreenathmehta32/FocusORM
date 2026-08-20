import { useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  Shield,
  Database,
  EyeOff,
  MicOff,
  CameraOff,
  WifiOff,
  Trash2,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react'

function PrivacyRow({ icon: Icon, label, value, description, safe = true }) {
  const color = safe ? '#10b981' : '#f43f5e'
  const rgb = safe ? '16,185,129' : '244,63,94'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', gap: '16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px',
        }}>
          <Icon size={15} color={color} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4ff' }}>{label}</div>
          {description && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{description}</div>
          )}
        </div>
      </div>
      <span style={{
        fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
        padding: '3px 10px', borderRadius: '9999px',
        background: `rgba(${rgb},0.1)`, color, border: `1px solid rgba(${rgb},0.2)`,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {value}
      </span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, color = '#6366f1', children, extra }) {
  const rgb = `${parseInt(color.slice(1,3), 16)},${parseInt(color.slice(3,5), 16)},${parseInt(color.slice(5,7), 16)}`
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        {extra}
      </div>
      {children}
    </div>
  )
}

export default function PrivacyPage() {
  const [privacy, setPrivacy] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  useEffect(() => {
    api.getPrivacy().then(p => setPrivacy(p))
  }, [])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete all activity records? This action cannot be undone.')) return
    setDeleting(true)
    try {
      await api.deleteData()
      setDeleteSuccess(true)
      setTimeout(() => setDeleteSuccess(false), 4000)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={16} color="#34d399" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>
            Privacy & Data Transparency
          </h1>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '42px' }}>
          Complete disclosure of local storage, hardware boundaries, and AI data handling
        </p>
      </div>

      {/* Data Collection Boundaries */}
      <SectionCard title="Hardware & Data Collection Boundaries" icon={Lock} color="#34d399">
        <PrivacyRow icon={Database} label="Activity Database" value="100% LOCAL" description="Stored in ~/.FocusORM/FocusORM.db — never leaves your machine" safe />
        <PrivacyRow icon={CameraOff} label="Visual Surveillance / Screenshots" value="NEVER CAPTURED" description="No screen recording, image buffer, or video frames taken" safe />
        <PrivacyRow icon={EyeOff} label="Keystroke Logging" value="NEVER LOGGED" description="Only aggregate numeric counters; actual keys are discarded immediately" safe />
        <PrivacyRow icon={EyeOff} label="Clipboard Contents" value="NEVER ACCESSED" description="FocusORM never reads, accesses, or monitors your clipboard" safe />
        <PrivacyRow icon={MicOff} label="Microphone & Webcam" value="DISABLED" description="Audio/video hardware APIs are completely unrequested" safe />
        <PrivacyRow icon={WifiOff} label="Identity & Public IP" value="ZERO TELEMETRY" description="No user tracking, cloud accounts, analytics SDKs, or public IP logs" safe />
      </SectionCard>

      {/* AI Disclosure */}
      <SectionCard
        title="Groq AI Sanitization Engine"
        icon={Sparkles}
        color="#8b5cf6"
        extra={
          <span className={`badge ${privacy?.groq_ai?.status === 'ENABLED' ? 'badge-productive' : 'badge-idle'}`}>
            {privacy?.groq_ai?.status || 'DISABLED'}
          </span>
        }
      >
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
          Only invoked for unknown classifications with strict PII filtering.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{
            padding: '16px', borderRadius: '10px',
            background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <CheckCircle2 size={13} color="#10b981" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                What AI Can See
              </span>
            </div>
            <ul style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.5 }}>
              <li>Application name (e.g. "VS Code")</li>
              <li>Clean domain (e.g. "leetcode.com")</li>
              <li>Sanitized page title</li>
            </ul>
          </div>
          <div style={{
            padding: '16px', borderRadius: '10px',
            background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Shield size={13} color="#f43f5e" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                What AI Never Sees
              </span>
            </div>
            <ul style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.5 }}>
              <li>Any keystroke or typed content</li>
              <li>File contents or source code</li>
              <li>URL params, tokens, or cookies</li>
              <li>Username, computer name, or IP</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* Data Purge */}
      <div className="card" style={{
        padding: '24px',
        borderColor: 'rgba(244,63,94,0.2)',
        background: 'linear-gradient(135deg, rgba(244,63,94,0.04) 0%, var(--bg-card) 50%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Trash2 size={14} color="#f43f5e" />
          </div>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4ff' }}>
            Data Control & Purge
          </h3>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
          You have full ownership of your data. Wipe all logged sessions and analytics instantly.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-glass btn-danger"
            style={{ opacity: deleting ? 0.5 : 1 }}
          >
            <Trash2 size={13} />
            {deleting ? 'Purging records...' : 'Purge All Activity Data'}
          </button>

          {deleteSuccess && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#34d399' }}>
              <CheckCircle2 size={13} /> All local records purged
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

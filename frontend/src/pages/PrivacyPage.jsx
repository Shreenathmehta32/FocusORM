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
  AlertCircle
} from 'lucide-react'

function PrivacyRow({ icon: Icon, label, value, description, safe = true }) {
  return (
    <div className="flex items-center justify-between py-3.5 gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${safe ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-200">{label}</div>
          {description && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>
          )}
        </div>
      </div>

      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full shrink-0 ${safe
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
        }`}>
        {value}
      </span>
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
    if (!confirm('Are you sure you want to permanently delete all activity records? This action cannot be undone.')) {
      return
    }
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Shield className="w-6 h-6 text-indigo-400" />
          Privacy & Data Transparency Center
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Complete disclosure of local storage, hardware boundaries, and AI data handling
        </p>
      </div>

      {/* Storage Architecture */}
      <div className="focus-card p-6 space-y-2">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-indigo-400" />
          Hardware & Data Collection Boundaries
        </h3>
        <div className="divide-y divide-slate-800">
          <PrivacyRow
            icon={Database}
            label="Activity Database"
            value="100% LOCAL (SQLite)"
            description="Stored in your user folder (~/.FocusORM/FocusORM.db)"
            safe={true}
          />
          <PrivacyRow
            icon={CameraOff}
            label="Visual Surveillance / Screenshots"
            value="NEVER CAPTURED"
            description="No screen recording, image buffer, or video frames taken"
            safe={true}
          />
          <PrivacyRow
            icon={EyeOff}
            label="Keystroke Logging"
            value="NEVER LOGGED"
            description="Only aggregate numeric counters; actual keys are discarded immediately"
            safe={true}
          />
          <PrivacyRow
            icon={EyeOff}
            label="Clipboard Contents"
            value="NEVER ACCESSED"
            description="FocusORM never reads, accesses, or monitors your clipboard"
            safe={true}
          />
          <PrivacyRow
            icon={MicOff}
            label="Microphone & Webcam"
            value="DISABLED"
            description="Audio/video hardware APIs are completely unrequested"
            safe={true}
          />
          <PrivacyRow
            icon={WifiOff}
            label="Identity & Public IP"
            value="ZERO TELEMETRY"
            description="No user tracking, cloud accounts, analytics SDKs, or public IP logs"
            safe={true}
          />
        </div>
      </div>

      {/* Groq AI Disclosure */}
      <div className="focus-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Groq AI Sanitization Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Only invoked for unknown classifications with strict PII filtering
            </p>
          </div>
          <span className={`badge ${privacy?.groq_ai?.status === 'ENABLED' ? 'badge-productive' : 'badge-idle'
            }`}>
            {privacy?.groq_ai?.status || 'DISABLED'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> What AI Can See (If Enabled)
            </span>
            <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
              <li>Application name (e.g. "Visual Studio Code")</li>
              <li>Clean domain (e.g. "leetcode.com")</li>
              <li>Sanitized page title (tokens & emails removed)</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> What AI Never Sees
            </span>
            <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
              <li>Any keystroke or typed content</li>
              <li>File contents or source code</li>
              <li>URL query parameters, tokens, or cookies</li>
              <li>Your username, computer name, or IP</li>
            </ul>
          </div>
        </div>
      </div>

      {/* User Data Ownership & Deletion */}
      <div className="focus-card p-6 border-rose-500/20 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-400" />
          Data Control & Purge
        </h3>
        <p className="text-xs text-slate-400">
          You have full ownership of your data. You can wipe all logged sessions and analytics instantly with one click.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Purging records...' : 'Purge All Activity Data'}
          </button>

          {deleteSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All local records purged
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

import { ShieldAlert } from 'lucide-react'

export default function ConfidentialityBanner() {
  return (
    <div className="mb-8 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
      <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-600" />
      <div>
        <p className="font-semibold text-amber-800">Keep your API keys private</p>
        <p className="mt-1 text-sm text-amber-700">
          These keys are stored securely in your account and used only on your behalf. Never share
          them with anyone. LyricfyJP staff will never ask for your keys. Each key only grants
          access to that specific service — if you suspect a key has been compromised, revoke it
          directly from that service&apos;s dashboard.
        </p>
      </div>
    </div>
  )
}

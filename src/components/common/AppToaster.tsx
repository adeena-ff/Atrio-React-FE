import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import toast, { Toaster, type Toast } from 'react-hot-toast'

type NotifyKind = 'success' | 'error' | 'warning' | 'info'

const accents: Record<NotifyKind, { bar: string; icon: string; border: string }> = {
  success: { bar: 'bg-emerald-400', icon: 'text-emerald-300', border: 'border-emerald-500/40' },
  error: { bar: 'bg-rose-400', icon: 'text-rose-300', border: 'border-rose-500/40' },
  warning: { bar: 'bg-amber-400', icon: 'text-amber-300', border: 'border-amber-500/40' },
  info: { bar: 'bg-sky-400', icon: 'text-sky-300', border: 'border-sky-500/40' },
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

function ToastCard({ t, kind, message }: { t: Toast; kind: NotifyKind; message: string }) {
  const accent = accents[kind]
  const Icon = icons[kind]
  return (
    <div
      className={`pointer-events-auto flex max-w-sm overflow-hidden rounded-xl border bg-slate-900/90 text-slate-100 shadow-2xl backdrop-blur-md transition-all duration-200 ${
        t.visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      } ${accent.border}`}
    >
      <div className={`w-1.5 shrink-0 ${accent.bar}`} />
      <div className="flex flex-1 items-start gap-3 p-4">
        <Icon className={`mt-0.5 shrink-0 ${accent.icon}`} size={18} />
        <p className="text-sm leading-relaxed text-slate-100">{message}</p>
      </div>
    </div>
  )
}

function show(kind: NotifyKind, message: string) {
  toast.custom((t) => <ToastCard t={t} kind={kind} message={message} />, {
    duration: kind === 'error' ? 5000 : 3200,
    position: 'top-right',
  })
}

export const notify = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  warning: (message: string) => show('warning', message),
  info: (message: string) => show('info', message),
}

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{ top: 16, right: 16 }}
      toastOptions={{
        className: 'bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-100 shadow-2xl rounded-xl p-4',
      }}
    />
  )
}

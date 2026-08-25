import { AlertTriangle, LoaderCircle } from 'lucide-react'

export function LoadingState({ label = 'Loading data...' }: { label?: string }) {
  return <div className="flex items-center gap-2 py-10 text-sm text-slate-400"><LoaderCircle className="animate-spin text-indigo-300" size={20} />{label}</div>
}

export function ErrorBanner({ message, retry }: { message: string; retry?: () => void }) {
  return <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><span className="flex items-center gap-2"><AlertTriangle size={18} />{message}</span>{retry && <button onClick={retry} className="btn-secondary shrink-0">Try again</button>}</div>
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { title?: string; message?: string } } }).response
    return response?.data?.title ?? response?.data?.message ?? fallback
  }
  return fallback
}

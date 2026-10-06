export default function LoadingState({ label = 'Loading your documents…' }) {
  return <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white"><div className="flex items-center gap-3 text-sm font-medium text-slate-500"><span className="spinner h-5 w-5 border-cyan-200 border-t-cyan-600" />{label}</div></div>;
}

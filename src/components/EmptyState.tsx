interface EmptyStateProps {
  onAddBlock: () => void
  onUseExample?: () => void
}

export function EmptyState({ onAddBlock, onUseExample }: EmptyStateProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
      <div className="pointer-events-auto max-w-xs rounded-2xl border border-slate-200 bg-white/95 px-6 py-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-slate-500">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-[15px] font-semibold text-slate-900">Plan your day, one block at a time.</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          Nothing scheduled yet. Add a block for anything — a workout, a meeting, or just quiet time.
        </p>
        <button
          type="button"
          onClick={onAddBlock}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add your first block
        </button>
        {onUseExample && (
          <button
            type="button"
            onClick={onUseExample}
            className="mt-3 block w-full text-[12px] font-medium text-slate-400 hover:text-slate-600"
          >
            Or try an example schedule
          </button>
        )}
      </div>
    </div>
  )
}

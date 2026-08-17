import { useEffect, useState } from 'react'
import { localStorageRepository } from '../lib/storage'

export function Settings() {
  const [counts, setCounts] = useState<{ totalBlocks: number; days: number } | null>(null)
  const [cleared, setCleared] = useState(false)

  const refresh = () => {
    localStorageRepository.countAll().then(setCounts)
  }

  useEffect(refresh, [])

  const handleClearAll = () => {
    if (!counts || counts.totalBlocks === 0) return
    const ok = window.confirm(
      `Delete all ${counts.totalBlocks} saved block${counts.totalBlocks === 1 ? '' : 's'} across ${counts.days} day${counts.days === 1 ? '' : 's'}? This can't be undone.`,
    )
    if (!ok) return
    localStorageRepository.clearAll().then(() => {
      refresh()
      setCleared(true)
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-1 text-[13px] text-slate-500">Manage the data this planner has saved on this device.</p>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-[14px] font-semibold text-slate-900">Your data</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
          {counts === null
            ? 'Loading…'
            : counts.totalBlocks === 0
              ? "You don't have any blocks saved yet."
              : `${counts.totalBlocks} block${counts.totalBlocks === 1 ? '' : 's'} saved across ${counts.days} day${counts.days === 1 ? '' : 's'}.`}
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
          Everything is stored locally in this browser — nothing leaves your device.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={!counts || counts.totalBlocks === 0}
            className="rounded-lg border border-rose-200 px-3.5 py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            Clear all schedule data
          </button>
          {cleared && <span className="text-[12px] text-slate-400">All cleared.</span>}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-[14px] font-semibold text-slate-900">About</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
          Schedule is a simple, fast way to plan your day as flexible time blocks — any duration,
          drag to move or resize, day and week views.
        </p>
      </section>
    </div>
  )
}

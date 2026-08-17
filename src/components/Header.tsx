import { useRef, useState } from 'react'
import { MiniCalendar } from './MiniCalendar'
import type { ViewMode } from '../lib/types'

interface HeaderProps {
  date: Date
  headingTitle: string
  headingSubtitle: string
  view: ViewMode
  isToday: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onPick: (date: Date) => void
  onAddBlock: () => void
  onViewChange: (view: ViewMode) => void
}

export function Header({
  date,
  headingTitle,
  headingSubtitle,
  view,
  isToday,
  onPrev,
  onNext,
  onToday,
  onPick,
  onAddBlock,
  onViewChange,
}: HeaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerBtnRef = useRef<HTMLButtonElement>(null)

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={onPrev}
            aria-label={view === 'week' ? 'Previous week' : 'Previous day'}
            title={view === 'week' ? 'Previous week' : 'Previous day'}
            className="flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-50 active:bg-slate-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label={view === 'week' ? 'Next week' : 'Next day'}
            title={view === 'week' ? 'Next week' : 'Next day'}
            className="flex h-9 w-9 items-center justify-center border-l border-slate-200 text-slate-500 hover:bg-slate-50 active:bg-slate-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {!isToday && (
          <button
            type="button"
            onClick={onToday}
            className="h-9 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
        )}

        <div className="leading-tight">
          <h1 className="text-[15px] font-semibold text-slate-900 sm:text-base">{headingTitle}</h1>
          <p className="text-[12px] text-slate-500">{headingSubtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 text-[13px] font-medium">
          <button
            type="button"
            onClick={() => onViewChange('day')}
            aria-pressed={view === 'day'}
            className={`h-9 px-3 ${view === 'day' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => onViewChange('week')}
            aria-pressed={view === 'week'}
            className={`h-9 border-l border-slate-200 px-3 ${
              view === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Week
          </button>
        </div>

        <div className="relative">
          <button
            ref={pickerBtnRef}
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            aria-label="Pick a date"
            aria-expanded={pickerOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
            </svg>
          </button>
          {pickerOpen && pickerBtnRef.current && (
            <MiniCalendar
              selected={date}
              anchor={pickerBtnRef.current.getBoundingClientRect()}
              onPick={onPick}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>

        <button
          type="button"
          onClick={onAddBlock}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-[13px] font-semibold text-white shadow-sm hover:bg-slate-800 active:bg-slate-900"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add block
        </button>
      </div>
    </header>
  )
}

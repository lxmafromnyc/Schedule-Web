import { useEffect, useRef, useState } from 'react'
import type { CategoryId, NewBlockInput } from '../lib/types'
import { CATEGORIES } from '../lib/types'
import { MINUTES_IN_DAY, clampDuration, clampStart, formatDuration, snapMinutes } from '../lib/time'

const QUICK_DURATIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 60]
const REMINDER_OPTIONS = [
  { label: 'No reminder', value: undefined },
  { label: '5 min before', value: 5 },
  { label: '10 min before', value: 10 },
  { label: '15 min before', value: 15 },
  { label: '30 min before', value: 30 },
]

function toTimeValue(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = Math.round(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fromTimeValue(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

export interface BlockEditorProps {
  mode: 'create' | 'edit'
  initial: {
    title: string
    startMinutes: number
    durationMinutes: number
    category: CategoryId
    notes?: string
    reminderMinutesBefore?: number
  }
  onSave: (data: NewBlockInput) => void
  onDelete?: () => void
  onDuplicate?: () => void
  onClose: () => void
}

export function BlockEditor({ mode, initial, onSave, onDelete, onDuplicate, onClose }: BlockEditorProps) {
  const [title, setTitle] = useState(initial.title)
  const [startMinutes, setStartMinutes] = useState(initial.startMinutes)
  const [durationMinutes, setDurationMinutes] = useState(initial.durationMinutes)
  const [category, setCategory] = useState<CategoryId>(initial.category)
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [reminder, setReminder] = useState<number | undefined>(initial.reminderMinutesBefore)
  const [customDuration, setCustomDuration] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
    titleRef.current?.select()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const endMinutes = Math.min(startMinutes + durationMinutes, MINUTES_IN_DAY)

  const setDuration = (mins: number) => {
    setDurationMinutes(clampDuration(startMinutes, mins))
  }

  const handleStartChange = (value: string) => {
    const next = clampStart(fromTimeValue(value))
    setStartMinutes(next)
    setDurationMinutes((d) => clampDuration(next, d))
  }

  const handleEndChange = (value: string) => {
    const end = fromTimeValue(value)
    const nextDuration = end - startMinutes
    if (nextDuration > 0) {
      setDurationMinutes(clampDuration(startMinutes, nextDuration))
    }
  }

  const handleCustomDurationApply = () => {
    const value = parseInt(customDuration, 10)
    if (!Number.isNaN(value) && value > 0) {
      setDuration(snapMinutes(value, 1))
    }
    setCustomDuration('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title: title.trim() || 'Untitled',
      startMinutes,
      durationMinutes,
      category,
      notes: notes.trim() || undefined,
      reminderMinutesBefore: reminder,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {mode === 'create' ? 'New block' : 'Edit block'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium text-slate-500">What are you doing?</span>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Workout, Study, Lunch"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[15px] text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Start</span>
            <input
              type="time"
              value={toTimeValue(startMinutes)}
              onChange={(e) => handleStartChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[15px] text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">End</span>
            <input
              type="time"
              value={toTimeValue(endMinutes)}
              onChange={(e) => handleEndChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[15px] text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
        </div>

        <div className="mb-4">
          <span className="mb-1.5 block text-xs font-medium text-slate-500">
            Duration · {formatDuration(durationMinutes)}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                aria-pressed={durationMinutes === d}
                className={`rounded-full px-2.5 py-1 text-[13px] font-medium transition-colors ${
                  durationMinutes === d
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d}m
              </button>
            ))}
            <span className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                onBlur={handleCustomDurationApply}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCustomDurationApply()
                  }
                }}
                placeholder="Custom"
                aria-label="Custom duration in minutes"
                className="w-[76px] rounded-full border border-slate-200 px-2.5 py-1 text-[13px] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              <span className="text-[12px] text-slate-400">min</span>
            </span>
          </div>
        </div>

        <div className="mb-4">
          <span className="mb-1.5 block text-xs font-medium text-slate-500">Category</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-label={c.label}
                aria-pressed={category === c.id}
                title={c.label}
                className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-all ${
                  category === c.id ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: c.color + '1a',
                  color: c.color,
                  ['--tw-ring-color' as string]: c.color,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any details you want to remember"
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-[14px] text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Reminder</span>
          <select
            value={reminder ?? ''}
            onChange={(e) => setReminder(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            {REMINDER_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          {mode === 'edit' && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-rose-600 hover:bg-rose-50"
            >
              Delete
            </button>
          )}
          {mode === 'edit' && onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate-600 hover:bg-slate-100"
            >
              Duplicate
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-slate-800"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  )
}

import type { CategoryId } from '../lib/types'
import { CATEGORIES } from '../lib/types'

const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]))

interface PreviewBlock {
  label: string
  time: string
  top: number
  height: number
  category: CategoryId
}

const HOURS = ['7 AM', '8 AM', '9 AM', '10 AM']

const BLOCKS: PreviewBlock[] = [
  { label: 'Morning run', time: '7:00 – 7:35', top: 0, height: 70, category: 'health' },
  { label: 'Breakfast', time: '7:35 – 7:50', top: 70, height: 30, category: 'food' },
  { label: 'Deep work', time: '8:00 – 9:20', top: 120, height: 160, category: 'focus' },
  { label: 'Walk + call', time: '9:20 – 9:45', top: 280, height: 50, category: 'social' },
]

/**
 * A static, non-interactive mock of the day timeline for the marketing page.
 * Mirrors the real Block/Timeline visual language without any of the drag logic.
 */
export function TimelinePreview() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex">
        <div className="relative w-12 shrink-0 sm:w-14">
          {HOURS.map((h, i) => (
            <div
              key={h}
              className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-slate-400 sm:text-[11px]"
              style={{ top: i * 100 }}
            >
              {h}
            </div>
          ))}
        </div>
        <div className="relative flex-1 border-l border-slate-200" style={{ height: 400 }}>
          {HOURS.map((h, i) => (
            <div
              key={h}
              className="absolute inset-x-0 border-t border-slate-100"
              style={{ top: i * 100 }}
            />
          ))}
          {BLOCKS.map((b) => {
            const color = categoryMap.get(b.category)?.color ?? '#6366f1'
            return (
              <div
                key={b.label}
                className="absolute inset-x-1.5 overflow-hidden rounded-lg border py-1 pl-2.5 pr-1.5 sm:inset-x-2"
                style={{
                  top: b.top,
                  height: b.height,
                  backgroundColor: color + '1a',
                  borderColor: color + '55',
                }}
              >
                <div className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: color }} />
                <p className="truncate text-[12px] font-medium text-slate-800 sm:text-[13px]">{b.label}</p>
                {b.height >= 40 && (
                  <p className="truncate text-[10px] text-slate-500 sm:text-[11px]">{b.time}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

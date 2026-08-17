import { Link } from 'react-router-dom'
import { TimelinePreview } from '../components/TimelinePreview'

const FEATURES = [
  {
    title: 'Any duration you want',
    body: '5 minutes or 95 — blocks aren’t locked to presets.',
  },
  {
    title: 'Drag to move or resize',
    body: 'Grab a block to move it, or drag its edge to change how long it is.',
  },
  {
    title: 'Day and week views',
    body: 'Zoom into today, or see your whole week at a glance.',
  },
]

export function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Plan your day by turning your time into flexible blocks.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-600 sm:text-base">
            A calm, calendar-style planner for organizing a single day. Drop in an activity,
            give it any length you like, and drag it around until your day feels right — no
            rigid time slots, no complicated setup.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/planner"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Start planning
            </Link>
            <Link
              to="/calendar"
              className="inline-flex items-center rounded-lg border border-slate-200 px-5 py-3 text-[14px] font-medium text-slate-700 hover:bg-slate-50"
            >
              View calendar
            </Link>
          </div>
        </div>

        <TimelinePreview />
      </div>

      <div className="mt-16 grid gap-6 border-t border-slate-200 pt-10 sm:mt-20 sm:grid-cols-3 sm:pt-12">
        {FEATURES.map((f) => (
          <div key={f.title}>
            <h2 className="text-[14px] font-semibold text-slate-900">{f.title}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

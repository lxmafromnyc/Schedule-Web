import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/calendar', label: 'Calendar' },
  { to: '/planner', label: 'Planner' },
  { to: '/settings', label: 'Settings' },
]

export function NavBar() {
  return (
    <nav className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-6">
      <NavLink to="/" className="flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-slate-900">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Schedule</span>
      </NavLink>

      <ul className="flex min-w-0 items-center gap-0.5 overflow-x-auto sm:gap-1">
        {LINKS.map((link) => (
          <li key={link.to} className="shrink-0">
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block whitespace-nowrap rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors sm:px-3 ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

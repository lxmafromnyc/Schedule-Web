import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'

export function Layout() {
  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900">
      <NavBar />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

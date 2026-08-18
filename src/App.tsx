import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { PlannerPage } from './pages/PlannerPage'
import { Settings } from './pages/Settings'

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-[13px] text-slate-500">That page doesn't exist.</p>
      <Link
        to="/"
        className="mt-5 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-800"
      >
        Back home
      </Link>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<PlannerPage key="calendar" defaultView="week" />} />
          <Route path="/planner" element={<PlannerPage key="planner" defaultView="day" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

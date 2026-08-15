import { useEffect, useState } from 'react'

/** Re-renders roughly every 15s so time-dependent UI (current-time line) stays live. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])

  return now
}

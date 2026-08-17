import { useEffect, useState } from 'react'
import { localStorageRepository } from '../lib/storage'
import type { Block } from '../lib/types'

/** Loads blocks for a set of dates in parallel, keyed by date string. Read-only overview data for Week view. */
export function useWeekBlocks(weekKeys: string[], refreshToken: number) {
  const [map, setMap] = useState<Record<string, Block[]>>({})
  const joined = weekKeys.join(',')

  useEffect(() => {
    let cancelled = false
    Promise.all(weekKeys.map((k) => localStorageRepository.listBlocks(k))).then((results) => {
      if (cancelled) return
      const next: Record<string, Block[]> = {}
      weekKeys.forEach((k, i) => {
        next[k] = results[i]
      })
      setMap(next)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, refreshToken])

  return map
}

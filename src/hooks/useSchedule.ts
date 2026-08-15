import { useCallback, useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { localStorageRepository } from '../lib/storage'
import type { Block, NewBlockInput } from '../lib/types'
import { clampDuration, clampStart } from '../lib/time'

export function useSchedule(dateKey: string) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    localStorageRepository.listBlocks(dateKey).then((loadedBlocks) => {
      if (!cancelled) {
        setBlocks(loadedBlocks.sort((a, b) => a.startMinutes - b.startMinutes))
        setLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [dateKey])

  const persist = useCallback(
    (next: Block[]) => {
      setBlocks(next)
      localStorageRepository.saveBlocks(dateKey, next)
    },
    [dateKey],
  )

  const addBlock = useCallback(
    (input: NewBlockInput): Block => {
      const now = Date.now()
      const start = clampStart(input.startMinutes)
      const block: Block = {
        id: nanoid(),
        date: dateKey,
        title: input.title.trim() || 'Untitled',
        startMinutes: start,
        durationMinutes: clampDuration(start, input.durationMinutes),
        category: input.category,
        notes: input.notes,
        reminderMinutesBefore: input.reminderMinutesBefore,
        createdAt: now,
        updatedAt: now,
      }
      setBlocks((prev) => {
        const next = [...prev, block].sort((a, b) => a.startMinutes - b.startMinutes)
        localStorageRepository.saveBlocks(dateKey, next)
        return next
      })
      return block
    },
    [dateKey],
  )

  const updateBlock = useCallback(
    (id: string, patch: Partial<Omit<Block, 'id' | 'date' | 'createdAt'>>) => {
      setBlocks((prev) => {
        const next = prev
          .map((b) => {
            if (b.id !== id) return b
            const start = patch.startMinutes !== undefined ? clampStart(patch.startMinutes) : b.startMinutes
            const duration = clampDuration(
              start,
              patch.durationMinutes !== undefined ? patch.durationMinutes : b.durationMinutes,
            )
            return {
              ...b,
              ...patch,
              startMinutes: start,
              durationMinutes: duration,
              updatedAt: Date.now(),
            }
          })
          .sort((a, b) => a.startMinutes - b.startMinutes)
        localStorageRepository.saveBlocks(dateKey, next)
        return next
      })
    },
    [dateKey],
  )

  const deleteBlock = useCallback(
    (id: string) => {
      setBlocks((prev) => {
        const next = prev.filter((b) => b.id !== id)
        localStorageRepository.saveBlocks(dateKey, next)
        return next
      })
    },
    [dateKey],
  )

  const duplicateBlock = useCallback(
    (id: string) => {
      setBlocks((prev) => {
        const original = prev.find((b) => b.id === id)
        if (!original) return prev
        const now = Date.now()
        const start = clampStart(original.startMinutes + original.durationMinutes)
        const copy: Block = {
          ...original,
          id: nanoid(),
          startMinutes: start,
          durationMinutes: clampDuration(start, original.durationMinutes),
          createdAt: now,
          updatedAt: now,
        }
        const next = [...prev, copy].sort((a, b) => a.startMinutes - b.startMinutes)
        localStorageRepository.saveBlocks(dateKey, next)
        return next
      })
    },
    [dateKey],
  )

  const replaceAll = useCallback(
    (next: Block[]) => {
      persist([...next].sort((a, b) => a.startMinutes - b.startMinutes))
    },
    [persist],
  )

  return { blocks, loaded, addBlock, updateBlock, deleteBlock, duplicateBlock, replaceAll }
}

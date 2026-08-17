import type { Block } from './types'

/**
 * Storage is accessed through this interface so a real backend can be
 * dropped in later without touching any component code — only
 * `localStorageRepository` (or a new implementation) needs to change.
 */
export interface ScheduleRepository {
  listBlocks(date: string): Promise<Block[]>
  saveBlocks(date: string, blocks: Block[]): Promise<void>
  hasOnboarded(): Promise<boolean>
  setOnboarded(): Promise<void>
  /** Total blocks and number of distinct days that have at least one block. */
  countAll(): Promise<{ totalBlocks: number; days: number }>
  /** Erases every saved block across every date. Does not undo. */
  clearAll(): Promise<void>
}

const STORAGE_PREFIX = 'schedule-web:blocks:'
const ONBOARDED_KEY = 'schedule-web:onboarded'

function readRaw(date: string): Block[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + date)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const localStorageRepository: ScheduleRepository = {
  async listBlocks(date) {
    return readRaw(date)
  },
  async saveBlocks(date, blocks) {
    localStorage.setItem(STORAGE_PREFIX + date, JSON.stringify(blocks))
  },
  async hasOnboarded() {
    return localStorage.getItem(ONBOARDED_KEY) === '1'
  },
  async setOnboarded() {
    localStorage.setItem(ONBOARDED_KEY, '1')
  },
  async countAll() {
    let totalBlocks = 0
    let days = 0
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i)
      if (!storageKey || !storageKey.startsWith(STORAGE_PREFIX)) continue
      const blocks = readRaw(storageKey.slice(STORAGE_PREFIX.length))
      if (blocks.length > 0) {
        days += 1
        totalBlocks += blocks.length
      }
    }
    return { totalBlocks, days }
  },
  async clearAll() {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i)
      if (storageKey && storageKey.startsWith(STORAGE_PREFIX)) keysToRemove.push(storageKey)
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  },
}

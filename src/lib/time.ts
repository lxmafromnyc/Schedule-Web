import type { Block } from './types'

export const MINUTES_IN_DAY = 24 * 60
export const PIXELS_PER_MINUTE = 2
export const PIXELS_PER_HOUR = PIXELS_PER_MINUTE * 60
export const SNAP_MINUTES = 5
export const MIN_BLOCK_MINUTES = 5
export const DEFAULT_DURATION_MINUTES = 30
/** Blocks shorter than this render as a minimum height so they stay tappable. */
export const MIN_BLOCK_HEIGHT_PX = 18

export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b)
}

export function minutesNow(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
}

/** Formats minutes-from-midnight as "8:30 AM". */
export function formatTime(minutes: number): string {
  const m = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY
  const hours24 = Math.floor(m / 60)
  const mins = Math.round(m % 60)
  const period = hours24 >= 12 ? 'PM' : 'AM'
  let hours12 = hours24 % 12
  if (hours12 === 0) hours12 = 12
  const minsStr = mins === 0 ? '00' : String(mins).padStart(2, '0')
  return `${hours12}:${minsStr} ${period}`
}

/** Compact time label that drops :00, e.g. "9 AM" vs "9:30 AM". Used for hour gridlines. */
export function formatHourLabel(minutes: number): string {
  const hours24 = Math.floor(minutes / 60) % 24
  const period = hours24 >= 12 ? 'PM' : 'AM'
  let hours12 = hours24 % 12
  if (hours12 === 0) hours12 = 12
  return `${hours12} ${period}`
}

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatDayHeading(d: Date): { weekday: string; date: string } {
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: 'long' }),
    date: d.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  }
}

export function startOfWeek(d: Date): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() - copy.getDay())
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function formatWeekRange(weekStart: Date): { title: string; subtitle: string } {
  const weekEnd = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
  const startLabel = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const endLabel = weekEnd.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
  })
  return {
    title: 'This week',
    subtitle: `${startLabel} – ${endLabel}, ${weekEnd.getFullYear()}`,
  }
}

export function snapMinutes(minutes: number, step = SNAP_MINUTES): number {
  return Math.round(minutes / step) * step
}

export function clampStart(minutes: number): number {
  return Math.min(Math.max(minutes, 0), MINUTES_IN_DAY - MIN_BLOCK_MINUTES)
}

export function clampDuration(startMinutes: number, durationMinutes: number): number {
  const maxDuration = MINUTES_IN_DAY - startMinutes
  return Math.min(Math.max(durationMinutes, MIN_BLOCK_MINUTES), maxDuration)
}

export function minutesToY(minutes: number): number {
  return minutes * PIXELS_PER_MINUTE
}

export function yToMinutes(y: number): number {
  return y / PIXELS_PER_MINUTE
}

export function blockHeight(durationMinutes: number): number {
  return Math.max(durationMinutes * PIXELS_PER_MINUTE, MIN_BLOCK_HEIGHT_PX)
}

export function blocksOverlap(a: Block, b: Block): boolean {
  const aEnd = a.startMinutes + a.durationMinutes
  const bEnd = b.startMinutes + b.durationMinutes
  return a.startMinutes < bEnd && b.startMinutes < aEnd
}

export interface LaidOutBlock {
  block: Block
  column: number
  columnCount: number
}

/**
 * Lays out overlapping blocks side-by-side, Google Calendar style.
 * Blocks that don't overlap anything get columnCount 1.
 */
export function layoutBlocks(blocks: Block[]): LaidOutBlock[] {
  const sorted = [...blocks].sort((a, b) => a.startMinutes - b.startMinutes)

  // Group into clusters of transitively-overlapping blocks by tracking the
  // running max end-time of the cluster (standard interval-graph grouping).
  const clusters: Block[][] = []
  let currentCluster: Block[] = []
  let currentMaxEnd = -Infinity
  for (const block of sorted) {
    if (currentCluster.length > 0 && block.startMinutes < currentMaxEnd) {
      currentCluster.push(block)
    } else {
      if (currentCluster.length > 0) clusters.push(currentCluster)
      currentCluster = [block]
    }
    currentMaxEnd = Math.max(currentMaxEnd, block.startMinutes + block.durationMinutes)
  }
  if (currentCluster.length > 0) clusters.push(currentCluster)

  const result: LaidOutBlock[] = []
  for (const cluster of clusters) {
    const columns: Block[][] = []
    for (const block of cluster) {
      let placed = false
      for (const col of columns) {
        if (!col.some((b) => blocksOverlap(b, block))) {
          col.push(block)
          placed = true
          break
        }
      }
      if (!placed) columns.push([block])
    }
    const columnCount = columns.length
    columns.forEach((col, colIndex) => {
      for (const block of col) {
        result.push({ block, column: colIndex, columnCount })
      }
    })
  }

  return result
}

export type CategoryId =
  | 'focus'
  | 'health'
  | 'food'
  | 'rest'
  | 'social'
  | 'chores'
  | 'other'

export interface Category {
  id: CategoryId
  label: string
  /** Tailwind-friendly hex values used for the block background/border/text. */
  color: string
}

export const CATEGORIES: Category[] = [
  { id: 'focus', label: 'Focus', color: '#6366f1' },
  { id: 'health', label: 'Health', color: '#10b981' },
  { id: 'food', label: 'Food', color: '#f59e0b' },
  { id: 'rest', label: 'Rest', color: '#0ea5e9' },
  { id: 'social', label: 'Social', color: '#ec4899' },
  { id: 'chores', label: 'Chores', color: '#8b5cf6' },
  { id: 'other', label: 'Other', color: '#64748b' },
]

export const DEFAULT_CATEGORY: CategoryId = 'focus'

/** A single scheduled activity. Times are stored as minutes from midnight. */
export interface Block {
  id: string
  /** Date this block belongs to, formatted as YYYY-MM-DD (local time). */
  date: string
  title: string
  startMinutes: number
  durationMinutes: number
  category: CategoryId
  notes?: string
  reminderMinutesBefore?: number
  createdAt: number
  updatedAt: number
}

export type NewBlockInput = Pick<
  Block,
  'title' | 'startMinutes' | 'durationMinutes' | 'category'
> &
  Partial<Pick<Block, 'notes' | 'reminderMinutesBefore'>>

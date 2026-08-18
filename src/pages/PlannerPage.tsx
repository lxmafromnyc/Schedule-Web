import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { Timeline } from '../components/Timeline'
import { WeekView } from '../components/WeekView'
import { EmptyState } from '../components/EmptyState'
import { BlockEditor } from '../components/BlockEditor'
import type { BlockEditorProps } from '../components/BlockEditor'
import { ContextMenu } from '../components/ContextMenu'
import type { ContextMenuItem } from '../components/ContextMenu'
import { useSchedule } from '../hooks/useSchedule'
import { useWeekBlocks } from '../hooks/useWeekBlocks'
import { localStorageRepository } from '../lib/storage'
import {
  DEFAULT_DURATION_MINUTES,
  addDays,
  clampDuration,
  dateKey,
  formatDayHeading,
  formatWeekRange,
  isSameDay,
  minutesNow,
  snapMinutes,
  startOfWeek,
} from '../lib/time'
import type { Block, CategoryId, NewBlockInput, ViewMode } from '../lib/types'

type EditorState =
  | { mode: 'create'; initial: BlockEditorProps['initial'] }
  | { mode: 'edit'; block: Block }
  | null

type Clipboard = Omit<NewBlockInput, 'startMinutes'>

interface MenuState {
  x: number
  y: number
  items: ContextMenuItem[]
}

const EXAMPLE_BLOCKS: Array<{
  title: string
  startMinutes: number
  durationMinutes: number
  category: CategoryId
}> = [
  { title: 'Study', startMinutes: 8 * 60 + 30, durationMinutes: 30, category: 'focus' },
  { title: 'Breakfast', startMinutes: 9 * 60, durationMinutes: 15, category: 'food' },
  { title: 'Workout', startMinutes: 9 * 60 + 15, durationMinutes: 35, category: 'health' },
  { title: 'Shower', startMinutes: 9 * 60 + 50, durationMinutes: 15, category: 'chores' },
]

const isTypingTarget = (el: EventTarget | null) => {
  const tag = (el as HTMLElement | null)?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

interface PlannerPageProps {
  /** Which view this route lands on by default. The Day/Week toggle still works freely from there. */
  defaultView: ViewMode
}

export function PlannerPage({ defaultView }: PlannerPageProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [view, setView] = useState<ViewMode>(defaultView)
  const [editor, setEditor] = useState<EditorState>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [clipboard, setClipboard] = useState<Clipboard | null>(null)
  const [hasOnboarded, setHasOnboarded] = useState(true)
  const [scrollSignal, setScrollSignal] = useState(0)
  const [dataVersion, setDataVersion] = useState(0)
  const bump = () => setDataVersion((v) => v + 1)

  const key = dateKey(selectedDate)
  const isToday = isSameDay(selectedDate, new Date())
  const { blocks, loaded, addBlock, updateBlock, deleteBlock, duplicateBlock, replaceAll } =
    useSchedule(key)

  const weekStart = startOfWeek(selectedDate)
  const weekKeys = Array.from({ length: 7 }, (_, i) => dateKey(addDays(weekStart, i)))
  const blocksByDate = useWeekBlocks(weekKeys, dataVersion)

  useEffect(() => {
    localStorageRepository.hasOnboarded().then(setHasOnboarded)
  }, [])

  useEffect(() => {
    setScrollSignal((s) => s + 1)
  }, [key, view])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (editor || menu) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(document.activeElement)) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setSelectedDate((d) => addDays(d, view === 'week' ? -7 : -1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setSelectedDate((d) => addDays(d, view === 'week' ? 7 : 1))
      } else if (e.key === 't' || e.key === 'T') {
        setSelectedDate(new Date())
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        handleAddBlockButton()
      } else if (e.key === 'd' || e.key === 'D') {
        setView('day')
      } else if (e.key === 'w' || e.key === 'W') {
        setView('week')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, menu, view, isToday])

  const markOnboarded = () => {
    if (!hasOnboarded) {
      setHasOnboarded(true)
      localStorageRepository.setOnboarded()
    }
  }

  const openCreateAt = (startMinutes: number, durationMinutes: number = DEFAULT_DURATION_MINUTES) => {
    setEditor({
      mode: 'create',
      initial: {
        title: '',
        startMinutes,
        durationMinutes: clampDuration(startMinutes, durationMinutes),
        category: 'focus',
      },
    })
  }

  const handleAddBlockButton = () => {
    const start = isToday ? snapMinutes(minutesNow()) : 9 * 60
    openCreateAt(Math.min(start, 24 * 60 - DEFAULT_DURATION_MINUTES))
  }

  const handleUseExample = () => {
    replaceAll(
      EXAMPLE_BLOCKS.map((b) => ({
        id: crypto.randomUUID(),
        date: key,
        title: b.title,
        startMinutes: b.startMinutes,
        durationMinutes: b.durationMinutes,
        category: b.category,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })),
    )
    markOnboarded()
    bump()
  }

  const handleSave: BlockEditorProps['onSave'] = (data) => {
    if (editor?.mode === 'edit') {
      updateBlock(editor.block.id, data)
    } else {
      addBlock(data)
    }
    markOnboarded()
    bump()
    setEditor(null)
  }

  const openBlockMenu = (block: Block, x: number, y: number) => {
    const items: ContextMenuItem[] = [
      { label: 'Edit', onSelect: () => setEditor({ mode: 'edit', block }) },
      {
        label: 'Duplicate',
        onSelect: () => {
          duplicateBlock(block.id)
          bump()
        },
      },
      {
        label: 'Copy',
        onSelect: () =>
          setClipboard({
            title: block.title,
            durationMinutes: block.durationMinutes,
            category: block.category,
            customColor: block.customColor,
            notes: block.notes,
            reminderMinutesBefore: block.reminderMinutesBefore,
          }),
      },
      {
        label: 'Delete',
        danger: true,
        onSelect: () => {
          deleteBlock(block.id)
          bump()
        },
      },
    ]
    setMenu({ x, y, items })
  }

  const openEmptyMenu = (startMinutes: number, x: number, y: number) => {
    const items: ContextMenuItem[] = [
      { label: 'Add block here', onSelect: () => openCreateAt(startMinutes) },
    ]
    if (clipboard) {
      items.push({
        label: 'Paste',
        onSelect: () => {
          addBlock({ ...clipboard, startMinutes })
          bump()
        },
      })
    }
    setMenu({ x, y, items })
  }

  const dayHeading = formatDayHeading(selectedDate)
  const weekHeading = formatWeekRange(weekStart)
  const headingTitle = view === 'day' ? dayHeading.weekday : weekHeading.title
  const headingSubtitle = view === 'day' ? dayHeading.date : weekHeading.subtitle

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <Header
        date={selectedDate}
        headingTitle={headingTitle}
        headingSubtitle={headingSubtitle}
        view={view}
        isToday={isToday}
        onPrev={() => setSelectedDate((d) => addDays(d, view === 'week' ? -7 : -1))}
        onNext={() => setSelectedDate((d) => addDays(d, view === 'week' ? 7 : 1))}
        onToday={() => setSelectedDate(new Date())}
        onPick={setSelectedDate}
        onAddBlock={handleAddBlockButton}
        onViewChange={setView}
      />

      <main className="relative min-h-0 flex-1">
        {view === 'day' ? (
          <Timeline
            blocks={blocks}
            isToday={isToday}
            onCreateAt={openCreateAt}
            onOpenBlock={(block) => setEditor({ mode: 'edit', block })}
            onContextMenuBlock={openBlockMenu}
            onContextMenuEmpty={openEmptyMenu}
            onCommitBlock={(id, patch) => {
              updateBlock(id, patch)
              bump()
            }}
            scrollToNowSignal={scrollSignal}
          />
        ) : (
          <WeekView
            weekStart={weekStart}
            blocksByDate={blocksByDate}
            onOpenBlock={(date, block) => {
              setSelectedDate(date)
              setView('day')
              setEditor({ mode: 'edit', block })
            }}
            onCreateAt={(date, minutes) => {
              setSelectedDate(date)
              setView('day')
              openCreateAt(minutes)
            }}
            scrollToNowSignal={scrollSignal}
          />
        )}

        {view === 'day' && loaded && blocks.length === 0 && (
          <EmptyState
            onAddBlock={handleAddBlockButton}
            onUseExample={!hasOnboarded ? handleUseExample : undefined}
          />
        )}
      </main>

      {editor && (
        <BlockEditor
          mode={editor.mode}
          initial={
            editor.mode === 'edit'
              ? {
                  title: editor.block.title,
                  startMinutes: editor.block.startMinutes,
                  durationMinutes: editor.block.durationMinutes,
                  category: editor.block.category,
                  customColor: editor.block.customColor,
                  notes: editor.block.notes,
                  reminderMinutesBefore: editor.block.reminderMinutesBefore,
                }
              : editor.initial
          }
          onSave={handleSave}
          onDelete={
            editor.mode === 'edit'
              ? () => {
                  deleteBlock(editor.block.id)
                  bump()
                  setEditor(null)
                }
              : undefined
          }
          onDuplicate={
            editor.mode === 'edit'
              ? () => {
                  duplicateBlock(editor.block.id)
                  bump()
                  setEditor(null)
                }
              : undefined
          }
          onClose={() => setEditor(null)}
        />
      )}

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  )
}

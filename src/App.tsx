import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Timeline } from './components/Timeline'
import { EmptyState } from './components/EmptyState'
import { BlockEditor } from './components/BlockEditor'
import type { BlockEditorProps } from './components/BlockEditor'
import { useSchedule } from './hooks/useSchedule'
import { localStorageRepository } from './lib/storage'
import { addDays, dateKey, isSameDay, minutesNow, snapMinutes } from './lib/time'
import type { Block, CategoryId } from './lib/types'

const DEFAULT_DURATION = 30

type EditorState =
  | { mode: 'create'; initial: BlockEditorProps['initial'] }
  | { mode: 'edit'; block: Block }
  | null

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

function App() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [editor, setEditor] = useState<EditorState>(null)
  const [hasOnboarded, setHasOnboarded] = useState(true)
  const [scrollSignal, setScrollSignal] = useState(0)

  const key = dateKey(selectedDate)
  const isToday = isSameDay(selectedDate, new Date())
  const { blocks, loaded, addBlock, updateBlock, deleteBlock, duplicateBlock, replaceAll } =
    useSchedule(key)

  useEffect(() => {
    localStorageRepository.hasOnboarded().then(setHasOnboarded)
  }, [])

  useEffect(() => {
    setScrollSignal((s) => s + 1)
  }, [key])

  const markOnboarded = () => {
    if (!hasOnboarded) {
      setHasOnboarded(true)
      localStorageRepository.setOnboarded()
    }
  }

  const openCreateAt = (startMinutes: number) => {
    setEditor({
      mode: 'create',
      initial: {
        title: '',
        startMinutes,
        durationMinutes: DEFAULT_DURATION,
        category: 'focus',
      },
    })
  }

  const handleAddBlockButton = () => {
    const start = isToday ? snapMinutes(minutesNow()) : 9 * 60
    openCreateAt(Math.min(start, 24 * 60 - DEFAULT_DURATION))
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
  }

  const handleSave: BlockEditorProps['onSave'] = (data) => {
    if (editor?.mode === 'edit') {
      updateBlock(editor.block.id, data)
    } else {
      addBlock(data)
    }
    markOnboarded()
    setEditor(null)
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900">
      <Header
        date={selectedDate}
        isToday={isToday}
        onPrev={() => setSelectedDate((d) => addDays(d, -1))}
        onNext={() => setSelectedDate((d) => addDays(d, 1))}
        onToday={() => setSelectedDate(new Date())}
        onPick={setSelectedDate}
        onAddBlock={handleAddBlockButton}
      />

      <main className="relative min-h-0 flex-1">
        <Timeline
          blocks={blocks}
          isToday={isToday}
          onCreateAt={openCreateAt}
          onOpenBlock={(block) => setEditor({ mode: 'edit', block })}
          onCommitBlock={(id, patch) => updateBlock(id, patch)}
          scrollToNowSignal={scrollSignal}
        />

        {loaded && blocks.length === 0 && (
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
                  setEditor(null)
                }
              : undefined
          }
          onDuplicate={
            editor.mode === 'edit'
              ? () => {
                  duplicateBlock(editor.block.id)
                  setEditor(null)
                }
              : undefined
          }
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}

export default App

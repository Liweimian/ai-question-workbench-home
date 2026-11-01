import { useEffect, useRef, useState } from 'react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import {
  FileText,
  FolderHeart,
  GripVertical,
  Heading2,
  Heading3,
  Heading4,
  Plus,
  RefreshCw,
  Rows2,
} from 'lucide-react'
import type { AddQuestionMode, OpenAddOptions } from '../prototype/types'
import { aiQuestionEntries, libraryQuestionEntries } from '../data/addQuestionEntries'

export type UtilityAction = 'heading-2' | 'heading-3' | 'heading-4' | 'note' | 'blank-line'

interface BlockAddMenuProps {
  empty?: boolean
  openRequest?: number
  onOpenAdd: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onInsertUtility?: (action: UtilityAction) => void
  onOpenMyResources?: () => void
}

const optionGroups = [
  { title: '基础内容', items: [
    { id: 'heading-2', utility: 'heading-2', title: '二级标题', description: '题型或大题分组', icon: Heading2 },
    { id: 'heading-3', utility: 'heading-3', title: '三级标题', description: '分组下的内容层级', icon: Heading3 },
    { id: 'heading-4', utility: 'heading-4', title: '四级标题', description: '更细一级的内容层级', icon: Heading4 },
    { id: 'note', utility: 'note', title: '说明文字', description: '插入考试说明、作答要求或导语', icon: FileText },
    { id: 'blank-line', utility: 'blank-line', title: '空行', description: '插入一行空白', icon: Rows2 },
  ] },
] as const

function isAiEntry(mode: AddQuestionMode) {
  return mode === 'create' || mode === 'compose'
}

export function BlockAddMenu({ empty = false, openRequest = 0, onOpenAdd, onInsertUtility, onOpenMyResources }: BlockAddMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (openRequest > 0) setOpen(true) }, [openRequest])
  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isInteractive = Boolean(target?.closest('input, textarea, button, a, select, [contenteditable="true"]'))
      const hasBlockingLayer = Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'))
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey || event.shiftKey
      if (event.key === 'Escape') setOpen(false)
      if (event.key === '/' && !event.isComposing && !hasModifier && !event.repeat && !isInteractive && !hasBlockingLayer) {
        event.preventDefault(); setOpen(true)
      }
    }
    window.addEventListener('mousedown', closeOnOutside)
    window.addEventListener('keydown', handleKeyboard)
    return () => { window.removeEventListener('mousedown', closeOnOutside); window.removeEventListener('keydown', handleKeyboard) }
  }, [open])

  const chooseUtility = (action: UtilityAction) => {
    setOpen(false)
    if (onInsertUtility) return onInsertUtility(action)
    MetisMessage.success('已插入内容')
  }

  const openQuestionEntry = (mode: AddQuestionMode, view?: OpenAddOptions['libraryView']) => {
    setOpen(false)
    onOpenAdd(mode, view ? { libraryView: view } : undefined)
  }

  const renderQuestionEntries = (entries: typeof libraryQuestionEntries, groupTitle: string) => (
    <section className="block-command-group" key={groupTitle}>
      <h4>{groupTitle}</h4>
      {entries.map(({ mode, view, label, icon: Icon }) => (
        <button
          type="button"
          role="menuitem"
          key={`${mode}-${view ?? label}`}
          className={isAiEntry(mode) ? 'is-ai' : undefined}
          onClick={() => openQuestionEntry(mode, view)}
        >
          <span className="block-command-icon"><Icon size={16} /></span>
          <span><strong>{label}</strong></span>
        </button>
      ))}
    </section>
  )

  const renderFlatGroup = (group: (typeof optionGroups)[number]) => (
    <section className="block-command-group" key={group.title}>
      <h4>{group.title}</h4>
      {group.items.map(({ id, title, icon: Icon, ...item }) => {
        const utility = 'utility' in item ? item.utility : undefined
        return <button type="button" role="menuitem" key={id} onClick={() => {
          if (utility) chooseUtility(utility)
        }}><span className="block-command-icon"><Icon size={16} /></span><span><strong>{title}</strong></span></button>
      })}
    </section>
  )

  return (
    <div className={`block-add${empty ? ' block-add--empty' : ''}`} ref={rootRef}>
      <div className="block-add-control-row">
        <button type="button" className="block-add-trigger" aria-expanded={open} aria-label="插入内容" onClick={() => setOpen((current) => !current)}><Plus size={18} /></button>
        {!empty ? <button type="button" className="block-drag-handle" draggable aria-label="拖动内容块"><GripVertical size={18} /></button> : null}
      </div>
      {open ? (
        <div className="block-command-menu" role="menu" aria-label="插入内容">
          <div className="block-command-heading"><strong>插入内容</strong><span>与左侧添加入口一致</span></div>
          <div className="block-command-scroll">
            {renderQuestionEntries(libraryQuestionEntries, '题库选题')}
            {renderQuestionEntries(aiQuestionEntries, 'AI 工具')}
            <section className="block-command-group">
              <h4>个人资源</h4>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  if (onOpenMyResources) onOpenMyResources()
                  else MetisMessage.info('请从左侧打开我的资源')
                }}
              >
                <span className="block-command-icon"><FolderHeart size={16} /></span>
                <span><strong>从我的资源选题</strong></span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  MetisMessage.info('近期浏览记录会在这里展示')
                }}
              >
                <span className="block-command-icon"><RefreshCw size={16} /></span>
                <span><strong>继续最近浏览</strong></span>
              </button>
            </section>
            {renderFlatGroup(optionGroups[0])}
          </div>
        </div>
      ) : null}
    </div>
  )
}

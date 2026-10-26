import { useEffect, useRef, useState } from 'react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import { BookOpen, BookOpenCheck, FileImage, FileSearch, FileText, GripVertical, Heading2, Heading3, Heading4, Image, ListChecks, Minus, Network, Plus, ScanSearch, School, Sparkles, Table2, WandSparkles } from 'lucide-react'
import type { AddQuestionMode, OpenAddOptions } from '../prototype/types'

export type UtilityAction = 'image-search' | 'web-search' | 'heading-2' | 'heading-3' | 'heading-4' | 'table' | 'image' | 'note' | 'divider' | 'page-break'

interface BlockAddMenuProps {
  empty?: boolean
  openRequest?: number
  onOpenAdd: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onInsertUtility?: (action: UtilityAction) => void
  onOpenAssistant: () => void
}

const optionGroups = [
  { title: '基础内容', items: [
    { id: 'heading-2', utility: 'heading-2', title: '二级标题', description: '题型或大题分组', icon: Heading2 },
    { id: 'heading-3', utility: 'heading-3', title: '三级标题', description: '分组下的内容层级', icon: Heading3 },
    { id: 'heading-4', utility: 'heading-4', title: '四级标题', description: '更细一级的内容层级', icon: Heading4 },
    { id: 'table', utility: 'table', title: '表格', description: '插入信息栏、评分栏或答题表', icon: Table2 },
    { id: 'image', utility: 'image', title: '图片', description: '插入示意图、材料图或二维码', icon: Image },
    { id: 'note', utility: 'note', title: '说明文字', description: '插入考试说明、作答要求或导语', icon: FileText },
    { id: 'divider', utility: 'divider', title: '分割线', description: '分隔不同题型或内容区域', icon: Minus },
    { id: 'page-break', utility: 'page-break', title: '分页符', description: '控制打印与 PDF 的分页位置', icon: FileImage },
  ] },
] as const

const libraryGroups = [
  { id: 'fly', title: '飞象题库选题', mode: 'resource' as const, items: [
    { title: '章节知识点选题', description: '按教材章节或知识点逐题选择', view: 'chapter', icon: BookOpenCheck },
    { title: '练习册', description: '从配套练习册中选择题目', view: 'workbook', icon: BookOpen },
    { title: '试卷', description: '从月考、期中等试卷中选题', view: 'paper', icon: FileText },
    { title: '专题', description: '按知识模块或能力专题选题', view: 'special', icon: Sparkles },
    { title: '同步练习', description: '按教材章节选择同步练习', view: 'sync', icon: ListChecks },
  ] as const },
  { id: 'school', title: '校本题库选题', mode: 'school' as const, items: [
    { title: '章节知识点选题', description: '从校本章节或知识点题库选题', view: 'chapter', icon: School },
    { title: '练习册', description: '从校本练习册中选择题目', view: 'workbook', icon: BookOpen },
    { title: '试卷', description: '从学校沉淀的试卷中选题', view: 'paper', icon: FileText },
  ] as const },
]

const searchItems = [
  { id: 'image-search', title: '图片搜题', description: '上传或粘贴图片查找原题', icon: ScanSearch },
  { id: 'upload', title: 'AI 录题', description: '识别 PDF、Word 或图片中的题目', icon: FileSearch },
  { id: 'web-search', title: '联网搜题', description: '从公开网络检索可用题目', icon: Network },
] as const

const aiItems = [
  { id: 'assistant', title: 'AI 助手', description: '组题、组卷、找题或找卷', icon: Sparkles },
  { id: 'create', title: 'AI 出题工具', description: '按条件生成原创题目', icon: WandSparkles },
] as const

export function BlockAddMenu({ empty = false, openRequest = 0, onOpenAdd, onInsertUtility, onOpenAssistant }: BlockAddMenuProps) {
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
    if (action === 'image-search') MetisMessage.info('图片搜题入口已打开（原型演示）')
    else if (action === 'web-search') MetisMessage.info('联网搜题入口已打开（原型演示）')
    else MetisMessage.success('已插入试卷结构块（原型演示）')
  }

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
        <button type="button" className="block-drag-handle" draggable aria-label="拖动内容块"><GripVertical size={18} /></button>
        {!empty ? <button type="button" className="block-add-trigger-copy" onClick={() => setOpen((current) => !current)}>按 Space（空格）以启用 AI，或按“/”启用命令</button> : null}
      </div>
      {open ? (
        <div className="block-command-menu" role="menu" aria-label="插入内容">
          <div className="block-command-heading"><strong>插入内容</strong><span>按任务分类</span></div>
          <div className="block-command-scroll">
            {libraryGroups.map(({ id, title, mode, items }) => <section className="block-command-group" key={id}>
              <h4>{title}</h4>
              {items.map(({ title: itemTitle, view, icon: Icon }) => <button type="button" role="menuitem" key={view} onClick={() => { setOpen(false); onOpenAdd(mode, { libraryView: view }) }}>
                <span className="block-command-icon"><Icon size={16} /></span><span><strong>{itemTitle}</strong></span>
              </button>)}
            </section>)}
            <section className="block-command-group">
              <h4>搜题与导入</h4>
              {searchItems.map(({ id, title, icon: Icon }) => <button type="button" role="menuitem" key={id} onClick={() => {
                if (id === 'upload') { setOpen(false); onOpenAdd('upload') }
                else chooseUtility(id)
              }}><span className="block-command-icon"><Icon size={16} /></span><span><strong>{title}</strong></span></button>)}
            </section>
            <section className="block-command-group">
              <h4>飞象 AI</h4>
              {aiItems.map(({ id, title, icon: Icon }) => <button type="button" role="menuitem" className="is-ai" key={id} onClick={() => {
                setOpen(false)
                if (id === 'create') onOpenAdd('create')
                else onOpenAssistant()
              }}><span className="block-command-icon"><Icon size={16} /></span><span><strong>{title}</strong></span></button>)}
            </section>
            {renderFlatGroup(optionGroups[0])}
          </div>
          <div className="block-command-tip">输入 / 快速唤起 · Esc 关闭</div>
        </div>
      ) : null}
    </div>
  )
}

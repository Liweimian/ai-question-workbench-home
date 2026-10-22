import { useEffect, useRef, useState } from 'react'
import { BookOpenCheck, BrainCircuit, FilePenLine, FileUp, GraduationCap, GripVertical, Plus, School, Sparkles } from 'lucide-react'
import type { AddQuestionMode } from '../prototype/types'

interface BlockAddMenuProps {
  empty?: boolean
  onOpenAdd: (mode: AddQuestionMode) => void
}

const blockOptions: Array<{
  mode: Exclude<AddQuestionMode, 'menu'>
  title: string
  description: string
  icon: typeof Sparkles
  ai?: boolean
}> = [
  { mode: 'resource', title: '飞象题库选题', description: '浏览练习册、试卷、同步题单和专题', icon: BookOpenCheck },
  { mode: 'school', title: '校本题库选题', description: '浏览本校试卷、练习册和章节题目', icon: School },
  { mode: 'upload', title: '上传文件 AI 录题', description: '识别 PDF、Word 或图片中的原题', icon: FileUp },
  { mode: 'compose', title: 'AI 组题', description: '从题库智能挑选并组合', icon: BrainCircuit, ai: true },
  { mode: 'create', title: 'AI 命题', description: '描述要求，生成全新题目', icon: Sparkles, ai: true },
  { mode: 'personalized', title: '上传材料生成个性化练习', description: '结合材料与学情生成针对性练习', icon: GraduationCap, ai: true },
  { mode: 'manual', title: '手工录入', description: '添加一道空白题', icon: FilePenLine },
]

export function BlockAddMenu({ empty = false, onOpenAdd }: BlockAddMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isInteractive = Boolean(target?.closest('input, textarea, button, a, select, [contenteditable="true"]'))
      const hasBlockingLayer = Boolean(document.querySelector('[role="dialog"][aria-modal="true"], .inline-ai-dialog'))
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey || event.shiftKey
      if (event.key === 'Escape') setOpen(false)
      if (event.key === '/' && !event.isComposing && !hasModifier && !event.repeat && !isInteractive && !hasBlockingLayer) {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('mousedown', closeOnOutside)
    window.addEventListener('keydown', handleKeyboard)
    return () => {
      window.removeEventListener('mousedown', closeOnOutside)
      window.removeEventListener('keydown', handleKeyboard)
    }
  }, [open])

  return (
    <div className={`block-add${empty ? ' block-add--empty' : ''}`} ref={rootRef}>
      <div className="block-add-control-row">
        <button
          type="button"
          className="block-add-trigger"
          aria-expanded={open}
          aria-label={empty ? '添加第一道题' : '继续添加题目'}
          onClick={() => setOpen((current) => !current)}
        >
          <Plus size={18} />
        </button>
        <button type="button" className="block-drag-handle" draggable aria-label="拖动内容块"><GripVertical size={18} /></button>
        {!empty ? (
          <button type="button" className="block-add-trigger-copy" onClick={() => setOpen((current) => !current)}>
            <strong>继续添加题目</strong>
            <small>点击 + 选择添加方式，也可以输入 /</small>
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="block-command-menu" role="menu" aria-label="添加题目方式">
          <div className="block-command-heading"><strong>添加题目</strong><span>7 种方式</span></div>
          {blockOptions.map(({ mode, title, description, icon: Icon, ai }) => (
            <button
              type="button"
              role="menuitem"
              key={mode}
              className={ai ? 'is-ai' : ''}
              onClick={() => {
                setOpen(false)
                onOpenAdd(mode)
              }}
            >
              <span className="block-command-icon"><Icon size={17} /></span>
              <span><strong>{title}</strong><small>{description}</small></span>
              {ai ? <em>AI</em> : null}
            </button>
          ))}
          <div className="block-command-tip">输入 / 可快速唤起 · Esc 关闭</div>
        </div>
      ) : null}
    </div>
  )
}

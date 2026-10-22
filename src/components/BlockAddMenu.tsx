import { useEffect, useRef, useState } from 'react'
import { BookOpenCheck, BrainCircuit, FilePenLine, FileUp, Plus, Sparkles } from 'lucide-react'
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
  { mode: 'resource', title: '从题库选题', description: '浏览练习册、试卷、同步题单和专题', icon: BookOpenCheck },
  { mode: 'compose', title: 'AI 组题', description: '从题库智能挑选并组合', icon: BrainCircuit, ai: true },
  { mode: 'create', title: 'AI 出题', description: '描述要求，生成全新题目', icon: Sparkles, ai: true },
  { mode: 'upload', title: '上传录题', description: '识别 PDF、Word 或图片', icon: FileUp },
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
      <button
        type="button"
        className="block-add-trigger"
        aria-expanded={open}
        aria-label={empty ? '添加第一道题' : '继续添加题目'}
        onClick={() => setOpen((current) => !current)}
      >
        <span><Plus size={18} /></span>
        <span className="block-add-trigger-copy">
          <strong>{empty ? '添加第一道题' : '继续添加题目'}</strong>
          <small>点击 + 选择添加方式，也可以输入 /</small>
        </span>
      </button>

      {open ? (
        <div className="block-command-menu" role="menu" aria-label="添加题目方式">
          <div className="block-command-heading"><strong>添加题目</strong><span>5 种方式</span></div>
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

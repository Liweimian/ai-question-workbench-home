import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import { Bold, BookOpenCheck, BrainCircuit, ChevronDown, ChevronRight, FileScan, Globe2, GraduationCap, Heading2, Italic, Layers3, School, Send, Sparkles, Strikethrough, Underline } from 'lucide-react'
import type { AddQuestionMode, AsyncStatus, LibraryInitialView, OpenAddOptions, WorkbenchDocument } from '../prototype/types'
import { BlockAddMenu } from './BlockAddMenu'
import type { UtilityAction } from './BlockAddMenu'

interface EmptyCanvasProps {
  document: WorkbenchDocument
  aiOpen: boolean
  aiStatus: AsyncStatus
  aiError: string
  onTitleChange: (title: string) => void
  onAiOpen: () => void
  onAiClose: () => void
  onStartAi: (mode: 'compose' | 'create', prompt: string) => void
  onOpenAdd: (mode: AddQuestionMode, options?: OpenAddOptions) => void
}

const libraryQuickStarts: Array<{
  id: string
  label: string
  mode: 'resource' | 'school'
  icon: typeof BookOpenCheck
  items: Array<{ label: string; view: LibraryInitialView }>
}> = [
  {
    id: 'fly',
    label: '飞象题库',
    mode: 'resource',
    icon: BookOpenCheck,
    items: [
      { label: '章节知识点', view: 'chapter' },
      { label: '练习册', view: 'workbook' },
      { label: '试卷', view: 'paper' },
      { label: '专题', view: 'special' },
      { label: '同步练习', view: 'sync' },
    ],
  },
  {
    id: 'school',
    label: '校本题库',
    mode: 'school',
    icon: School,
    items: [
      { label: '章节知识点', view: 'chapter' },
      { label: '练习册', view: 'workbook' },
      { label: '试卷', view: 'paper' },
    ],
  },
]

const inlineAiCapabilities = [
  { title: 'AI 组题', description: '从题库挑选并组合', icon: BrainCircuit, action: 'compose' as const },
  { title: 'AI 组卷', description: '按考试要求组织试卷', icon: Layers3, action: 'paper' as const },
  { title: '个性化练习', description: '结合材料与学情生成', icon: GraduationCap, action: 'personalized' as const },
  { title: 'AI 录题', description: '识别 PDF、Word、图片', icon: FileScan, action: 'upload' as const },
]

export function EmptyCanvas(props: EmptyCanvasProps) {
  const [prompt, setPrompt] = useState('')
  const [inlineAiMode, setInlineAiMode] = useState<'compose' | 'create'>('compose')
  const [blockIds, setBlockIds] = useState(['initial'])
  const [activeBlockId, setActiveBlockId] = useState('initial')
  const [addMenuRequests, setAddMenuRequests] = useState<Record<string, number>>({})
  const [selectionToolbar, setSelectionToolbar] = useState<{ x: number; y: number; text: string } | null>(null)
  const [aiEditOpen, setAiEditOpen] = useState(false)
  const [customAiInstruction, setCustomAiInstruction] = useState('')
  const blockRefs = useRef(new Map<string, HTMLDivElement>())
  const aiDialogRef = useRef<HTMLElement>(null)
  const selectedRangeRef = useRef<Range | null>(null)

  const closeAi = () => {
    props.onAiClose()
    window.requestAnimationFrame(() => blockRefs.current.get(activeBlockId)?.focus())
  }

  useEffect(() => {
    if (!props.aiOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      if (!aiDialogRef.current?.contains(event.target as Node)) props.onAiClose()
    }
    document.addEventListener('mousedown', closeOnOutside)
    return () => document.removeEventListener('mousedown', closeOnOutside)
  }, [props.aiOpen, props.onAiClose])

  useEffect(() => {
    setBlockIds(['initial'])
    setActiveBlockId('initial')
    setAddMenuRequests({})
    window.requestAnimationFrame(() => blockRefs.current.get('initial')?.focus())
  }, [props.document.id])

  const insertBlockAfter = (blockId: string) => {
    const nextId = `block-${Date.now()}`
    setBlockIds((current) => {
      const index = current.indexOf(blockId)
      const next = [...current]
      next.splice(index + 1, 0, nextId)
      return next
    })
    setActiveBlockId(nextId)
    window.requestAnimationFrame(() => blockRefs.current.get(nextId)?.focus())
  }

  const insertUtility = (action: UtilityAction) => {
    if (action === 'image-search') return MetisMessage.info('图片搜题入口已打开（原型演示）')
    if (action === 'web-search') return MetisMessage.info('联网搜题入口已打开（原型演示）')
    const presets: Record<Exclude<UtilityAction, 'image-search' | 'web-search'>, string> = {
      'heading-2': '一、选择题',
      'heading-3': '（一）单项选择题',
      'heading-4': '基础题组',
      table: '姓名：________　班级：________　得分：________',
      image: '图片占位：点击后上传示意图、材料图或二维码',
      note: '考试说明：请认真审题，并将答案填写在指定位置。',
      divider: '────────────',
      'page-break': '—— 分页符 ——',
    }
    const nextId = `block-${Date.now()}`
    setBlockIds((current) => [...current, nextId])
    setActiveBlockId(nextId)
    window.requestAnimationFrame(() => {
      const node = blockRefs.current.get(nextId)
      if (!node) return
      node.textContent = presets[action]
      node.focus()
    })
    MetisMessage.success('已插入试卷结构内容')
  }

  const activateAiCapability = (action: typeof inlineAiCapabilities[number]['action']) => {
    if (action === 'personalized' || action === 'upload') {
      props.onOpenAdd(action)
      return
    }
    if (action === 'paper') {
      setInlineAiMode('compose')
      setPrompt('按八年级上册教学范围，组一份包含题型与分值配置的试卷')
    }
    if (action === 'compose') {
      setInlineAiMode('compose')
      setPrompt('从题库组一份一次函数练习，包含基础题和提升题')
    }
    props.onAiOpen()
  }

  const updateSelectionToolbar = () => {
    const selection = window.getSelection()
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null
    const selectedText = selection?.toString().trim() ?? ''
    const commonNode = range?.commonAncestorContainer
    const container = commonNode instanceof Element ? commonNode : commonNode?.parentElement
    if (!range || !selectedText || !container?.closest('.empty-block-input')) {
      setSelectionToolbar(null)
      setAiEditOpen(false)
      return
    }
    const rect = range.getBoundingClientRect()
    selectedRangeRef.current = range.cloneRange()
    setSelectionToolbar({ x: rect.left + rect.width / 2, y: rect.bottom + 8, text: selectedText })
  }

  const restoreSelection = () => {
    const range = selectedRangeRef.current
    if (!range) return false
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    return true
  }

  const formatSelection = (command: 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'formatBlock', value?: string) => {
    if (!restoreSelection()) return
    document.execCommand(command, false, value)
    setAiEditOpen(false)
  }

  return (
    <article className="editor-empty" data-sec="3" aria-label="空白题单编辑区">
      <header className="editor-empty-heading">
        <MetisInput
          value={props.document.title}
          onChange={(event) => props.onTitleChange(event.target.value)}
          className="empty-title-input"
          aria-label="题单标题"
        />
        <span>{props.document.gradeSubject} · 0 道题</span>
      </header>

      <div className="editor-empty-content">
        <div className="empty-block-list">
          {blockIds.map((blockId) => (
            <div className="empty-first-block" role="group" aria-label="题单内容块" key={blockId}>
              <BlockAddMenu empty openRequest={addMenuRequests[blockId] ?? 0} onOpenAdd={props.onOpenAdd} onInsertUtility={insertUtility} onOpenAssistant={props.onAiOpen} />
              <div
                className="empty-block-input"
                ref={(node) => {
                  if (node) blockRefs.current.set(blockId, node)
                  else blockRefs.current.delete(blockId)
                }}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label="输入内容，按空格唤起 AI"
                data-placeholder="按 Space（空格）以启用 AI，或按“/”启用命令"
                onFocus={() => setActiveBlockId(blockId)}
                onMouseUp={() => window.requestAnimationFrame(updateSelectionToolbar)}
                onKeyUp={() => window.requestAnimationFrame(updateSelectionToolbar)}
                onKeyDown={(event) => {
                  const isEmpty = !event.currentTarget.textContent?.trim()
                  const hasModifier = event.metaKey || event.ctrlKey || event.altKey || event.shiftKey
                  if (!hasModifier && event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    if (!isEmpty) insertBlockAfter(blockId)
                  }
                  if (isEmpty && !hasModifier && event.code === 'Space' && !event.nativeEvent.isComposing && !event.repeat && !props.aiOpen) {
                    event.preventDefault()
                    props.onAiOpen()
                  }
                  if (isEmpty && !hasModifier && event.key === '/' && !event.nativeEvent.isComposing && !event.repeat) {
                    event.preventDefault()
                    setAddMenuRequests((current) => ({ ...current, [blockId]: (current[blockId] ?? 0) + 1 }))
                  }
                }}
              />
            </div>
          ))}
        </div>

        {selectionToolbar ? (
          <div
            className="text-selection-toolbar"
            style={{ left: selectionToolbar.x, top: selectionToolbar.y }}
            role="toolbar"
            aria-label="选中文本操作"
            onMouseDown={(event) => event.preventDefault()}
          >
            <button type="button" title="设为小标题" aria-label="设为小标题" onClick={() => formatSelection('formatBlock', 'h3')}><Heading2 size={16} /></button>
            <button type="button" title="加粗" aria-label="加粗" onClick={() => formatSelection('bold')}><Bold size={16} /></button>
            <button type="button" title="斜体" aria-label="斜体" onClick={() => formatSelection('italic')}><Italic size={16} /></button>
            <button type="button" title="下划线" aria-label="下划线" onClick={() => formatSelection('underline')}><Underline size={16} /></button>
            <button type="button" title="删除线" aria-label="删除线" onClick={() => formatSelection('strikeThrough')}><Strikethrough size={16} /></button>
            <span />
            <div className="text-selection-ai">
              <button type="button" className="is-ai" aria-expanded={aiEditOpen} onClick={() => setAiEditOpen((open) => !open)}><Sparkles size={15} />AI 帮助修改<ChevronDown size={14} /></button>
              {aiEditOpen ? (
                <div className="text-selection-ai-menu" role="menu" aria-label="AI 文本修改方式">
                  {['润色表述', '校对错字', '精简内容', '改成试卷导语'].map((action) => (
                    <button type="button" role="menuitem" key={action} onClick={() => {
                      setAiEditOpen(false)
                      MetisMessage.info(`“${selectionToolbar.text}”已进入${action}演示`)
                    }}>{action}</button>
                  ))}
                  <div className="text-selection-ai-custom">
                    <MetisInput
                      value={customAiInstruction}
                      onChange={(event) => setCustomAiInstruction(event.target.value)}
                      placeholder="输入修改要求"
                      aria-label="自定义 AI 修改要求"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && customAiInstruction.trim()) {
                          event.stopPropagation()
                          MetisMessage.info(`正在按“${customAiInstruction.trim()}”修改选中文本`)
                          setCustomAiInstruction('')
                          setAiEditOpen(false)
                        }
                      }}
                    />
                    <button type="button" aria-label="提交 AI 修改要求" disabled={!customAiInstruction.trim()} onClick={() => {
                      MetisMessage.info(`正在按“${customAiInstruction.trim()}”修改选中文本`)
                      setCustomAiInstruction('')
                      setAiEditOpen(false)
                    }}><Send size={14} /></button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {props.aiOpen ? (
          <section className="inline-ai-dialog" aria-label="AI 助手" ref={aiDialogRef}>
            <div className="inline-ai-input">
              <span className="inline-ai-input-prefix"><Sparkles size={17} /><strong>{inlineAiMode === 'create' ? 'AI 命题' : '飞象 AI'}</strong><ChevronDown size={14} /></span>
              <MetisInput
                autoFocus
                value={prompt}
                disabled={props.aiStatus === 'loading'}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="告诉 AI 你想怎么组题、组卷或命题…"
                aria-label="AI 组题要求"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') closeAi()
                  if (event.key === 'Enter' && props.aiStatus !== 'loading' && !event.nativeEvent.isComposing && prompt.trim()) props.onStartAi(inlineAiMode, prompt.trim())
                }}
              />
              <MetisButton type="primary" icon={<Send size={15} />} loading={props.aiStatus === 'loading'} disabled={!prompt.trim()} aria-label="发送 AI 要求" onClick={() => props.onStartAi(inlineAiMode, prompt.trim())} />
            </div>
            <div className="inline-ai-capabilities" aria-label="AI 助手能力">
              <span>教学快捷能力</span>
              <div>
                {inlineAiCapabilities.map(({ title, description, icon: Icon, action }) => (
                  <button type="button" key={title} onClick={() => activateAiCapability(action)}>
                    <Icon size={16} /><span><strong>{title}</strong><small>{description}</small></span><ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>
            {props.aiError ? <p className="inline-ai-error" role="alert">{props.aiError}</p> : null}
          </section>
        ) : null}

        <section className="empty-quick-start" aria-label="快速开始">
          <div className="quick-start-heading"><strong>快速开始</strong><span>从具体能力直接开始</span></div>
          <div className="quick-start-groups">
            <div className="quick-start-group quick-start-group--library">
              <span>题库选题</span>
              <div className="quick-library-list">
                {libraryQuickStarts.map(({ id, label, mode, icon: Icon, items }) => (
                  <section className={`quick-library-row quick-library-row--${id}`} key={id}>
                    <div className="quick-library-name"><Icon size={15} /><strong>{label}</strong></div>
                    <div className="quick-start-links">
                      {items.map((item) => (
                        <button
                          type="button"
                          key={item.view}
                          onClick={() => props.onOpenAdd(mode, { libraryView: item.view })}
                          data-track={`/click/aiQuestionHome/quick${id}${item.view} | 快速开始${label}${item.label} | 无`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div className="quick-start-group quick-start-group--import">
              <span>搜题与导入</span>
              <div className="quick-action-list">
                {([
                  { action: 'image-search' as UtilityAction, label: '图片搜题', icon: FileScan },
                  { action: 'web-search' as UtilityAction, label: '联网搜题', icon: Globe2 },
                ]).map(({ action, label, icon: Icon }) => (
                  <button type="button" key={action} onClick={() => insertUtility(action)}>
                    <Icon size={15} /><strong>{label}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className="quick-start-group quick-start-group--ai">
              <span>飞象 AI</span>
              <div className="quick-ai-list">
                {inlineAiCapabilities.map(({ title, icon: Icon, action }) => (
                  <button type="button" key={title} onClick={() => activateAiCapability(action)}>
                    <Icon size={15} /><strong>{title}</strong>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </article>
  )
}

import { useEffect, useRef, useState } from 'react'
import { MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import { Bold, BookOpenCheck, ChevronDown, FileScan, FileText, Heading2, Italic, School, Send, Sparkles, Strikethrough, Underline, WandSparkles } from 'lucide-react'
import type { AddQuestionMode, LibraryInitialView, OpenAddOptions, WorkbenchDocument } from '../prototype/types'
import { BlockAddMenu } from './BlockAddMenu'
import type { UtilityAction } from './BlockAddMenu'

interface EmptyCanvasProps {
  document: WorkbenchDocument
  sidePanelOpen?: boolean
  onTitleChange: (title: string) => void
  onIntroChange: (intro: string) => void
  onOpenAssistant: (prompt?: string) => void
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

export function EmptyCanvas(props: EmptyCanvasProps) {
  const [blockIds, setBlockIds] = useState(['initial'])
  const [hasBlockContent, setHasBlockContent] = useState(Boolean(props.document.intro?.trim()))
  const [addMenuRequests, setAddMenuRequests] = useState<Record<string, number>>({})
  const [selectionToolbar, setSelectionToolbar] = useState<{ x: number; y: number; text: string } | null>(null)
  const [aiEditOpen, setAiEditOpen] = useState(false)
  const [customAiInstruction, setCustomAiInstruction] = useState('')
  const blockRefs = useRef(new Map<string, HTMLDivElement>())
  const blockIdsRef = useRef(blockIds)
  const selectedRangeRef = useRef<Range | null>(null)
  blockIdsRef.current = blockIds

  useEffect(() => {
    blockIdsRef.current = ['initial']
    setBlockIds(['initial'])
    setHasBlockContent(Boolean(props.document.intro?.trim()))
    setAddMenuRequests({})
    window.requestAnimationFrame(() => {
      const initialBlock = blockRefs.current.get('initial')
      if (!initialBlock) return
      initialBlock.textContent = props.document.intro ?? ''
      initialBlock.focus()
    })
  }, [props.document.id])

  const syncBlockContent = () => {
    const intro = blockIdsRef.current
      .map((blockId) => blockRefs.current.get(blockId)?.textContent?.trim() ?? '')
      .filter(Boolean)
      .join('\n')
    setHasBlockContent(Boolean(intro))
    props.onIntroChange(intro)
  }

  const insertBlockAfter = (blockId: string) => {
    const nextId = `block-${Date.now()}`
    setBlockIds((current) => {
      const index = current.indexOf(blockId)
      const next = [...current]
      next.splice(index + 1, 0, nextId)
      return next
    })
    window.requestAnimationFrame(() => blockRefs.current.get(nextId)?.focus())
  }

  const insertUtility = (action: UtilityAction) => {
    if (action === 'image-search') return MetisMessage.info('图片搜题入口已打开（原型演示）')
    const presets: Record<Exclude<UtilityAction, 'image-search'>, string> = {
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
    window.requestAnimationFrame(() => {
      const node = blockRefs.current.get(nextId)
      if (!node) return
      node.textContent = presets[action]
      syncBlockContent()
      node.focus()
    })
    MetisMessage.success('已插入试卷结构内容')
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
    <article className={`editor-empty${props.sidePanelOpen ? ' is-linked-workspace' : ''}`} data-sec="3" aria-label="空白题单编辑区">
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
              <BlockAddMenu empty openRequest={addMenuRequests[blockId] ?? 0} onOpenAdd={props.onOpenAdd} onInsertUtility={insertUtility} onOpenAssistant={() => props.onOpenAssistant()} />
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
                aria-label={props.sidePanelOpen
                  ? '直接输入题稿说明，添加题目请使用右侧工作区'
                  : '直接输入内容，按空格打开 AI 助手，或按斜杠插入内容'}
                data-placeholder={props.sidePanelOpen
                  ? '直接输入内容，题目从右侧添加'
                  : '直接输入内容，按 Space 打开 AI 助手，或按“/”插入内容'}
                onMouseUp={() => window.requestAnimationFrame(updateSelectionToolbar)}
                onKeyUp={() => window.requestAnimationFrame(updateSelectionToolbar)}
                onInput={syncBlockContent}
                onKeyDown={(event) => {
                  const isEmpty = !event.currentTarget.textContent?.trim()
                  const hasModifier = event.metaKey || event.ctrlKey || event.altKey || event.shiftKey
                  if (!hasModifier && event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    if (!isEmpty) insertBlockAfter(blockId)
                  }
                  if (isEmpty && !hasModifier && event.code === 'Space' && !event.nativeEvent.isComposing && !event.repeat) {
                    event.preventDefault()
                    props.onOpenAssistant()
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

        {props.sidePanelOpen && !hasBlockContent ? (
          <div className="empty-result-guide" aria-hidden="true">
            <span><FileText size={24} /></span>
            <strong>题目会出现在这里</strong>
            <small>从右侧选择题库、上传材料，或交给 AI 助手处理</small>
          </div>
        ) : null}

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

        {!hasBlockContent ? <section className="empty-quick-start" aria-label="快速开始">
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
                  { action: 'ai-recording' as const, label: 'AI 录题', icon: FileScan },
                ]).map(({ action, label, icon: Icon }) => (
                  <button type="button" key={action} onClick={() => action === 'ai-recording' ? props.onOpenAdd('upload') : insertUtility(action)}>
                    <Icon size={15} /><strong>{label}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className="quick-start-group quick-start-group--ai">
              <span>飞象 AI</span>
              <div className="quick-ai-list">
                <button type="button" onClick={() => props.onOpenAssistant()}>
                  <Sparkles size={15} /><strong>AI 助手</strong>
                </button>
                <button type="button" onClick={() => props.onOpenAdd('create')}>
                  <WandSparkles size={15} /><strong>AI 出题工具</strong>
                </button>
              </div>
            </div>
          </div>
        </section> : null}
      </div>
    </article>
  )
}

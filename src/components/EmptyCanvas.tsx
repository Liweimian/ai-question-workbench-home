import { useEffect, useRef, useState } from 'react'
import { MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import { ArrowLeft, Bold, ChevronDown, Heading2, Italic, Send, Sparkles, Strikethrough, Underline } from 'lucide-react'
import { defaultDocumentFormat } from '../prototype/types'
import type { AddQuestionMode, DocumentFormat, OpenAddOptions, WorkbenchDocument } from '../prototype/types'
import { BlockAddMenu } from './BlockAddMenu'
import type { UtilityAction } from './BlockAddMenu'
import { DocumentFormatToolbar } from './DocumentFormatToolbar'

interface EmptyCanvasProps {
  document: WorkbenchDocument
  sidePanelOpen?: boolean
  onTitleChange: (title: string) => void
  onIntroChange: (intro: string) => void
  onDocumentFormatChange: (patch: Partial<DocumentFormat>) => void
  onOpenAssistant: (prompt?: string) => void
  onOpenAdd: (mode: AddQuestionMode, options?: OpenAddOptions) => void
}

export function EmptyCanvas(props: EmptyCanvasProps) {
  const [blockIds, setBlockIds] = useState(['initial'])
  const [addMenuRequests, setAddMenuRequests] = useState<Record<string, number>>({})
  const [selectionToolbar, setSelectionToolbar] = useState<{ x: number; y: number; text: string } | null>(null)
  const [aiEditOpen, setAiEditOpen] = useState(false)
  const [customAiInstruction, setCustomAiInstruction] = useState('')
  const [showExampleContent, setShowExampleContent] = useState(true)
  const blockRefs = useRef(new Map<string, HTMLDivElement>())
  const blockIdsRef = useRef(blockIds)
  const selectedRangeRef = useRef<Range | null>(null)
  blockIdsRef.current = blockIds

  useEffect(() => {
    setShowExampleContent(true)
    blockIdsRef.current = ['initial']
    setBlockIds(['initial'])
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
        <DocumentFormatToolbar value={{ ...defaultDocumentFormat, ...props.document.format }} onChange={props.onDocumentFormatChange} />
        <MetisInput
          value={props.document.title}
          onChange={(event) => props.onTitleChange(event.target.value)}
          className="empty-title-input"
          aria-label="题单标题"
        />
      </header>

      <div className="editor-empty-content" onPointerDown={() => setShowExampleContent(false)}>
        <div className="empty-add-guide" role="note">
          <span className="empty-add-guide-icon"><ArrowLeft size={18} /></span>
          <span><strong>从左侧添加题目</strong></span>
        </div>
        <div className="empty-block-list">
          {blockIds.map((blockId) => (
            <div className={`empty-first-block${blockId === 'initial' && !props.document.intro ? ' is-add-only' : ''}`} role="group" aria-label="题单内容块" key={blockId}>
              <BlockAddMenu empty openRequest={addMenuRequests[blockId] ?? 0} onOpenAdd={props.onOpenAdd} onInsertUtility={insertUtility} onOpenAssistant={() => props.onOpenAssistant()} />
              {blockId !== 'initial' || props.document.intro ? (
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
                  aria-label="题稿说明，可输入考试说明或作答要求"
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
              ) : null}
            </div>
          ))}
        </div>

        {showExampleContent ? <div className="empty-question-preview" aria-hidden="true">
          <div className="empty-preview-section-title"><strong>一、选择题</strong></div>
          <div className="empty-preview-question">
            <b>1.</b>
            <div>
              <p>若一次函数 y = 2x - 3，当 x = 2 时，y 的值是（　）</p>
              <div className="empty-preview-options"><span>A. -1</span><span>B. 0</span><span>C. 1</span><span>D. 2</span></div>
            </div>
          </div>
          <div className="empty-preview-question is-secondary">
            <b>2.</b>
            <div>
              <p>下列各式中，是一元二次方程的是（　）</p>
              <div className="empty-preview-options"><span>A. x + 2 = 0</span><span>B. x² - 3x + 2 = 0</span><span>C. 1/x = 2</span><span>D. x + y = 3</span></div>
            </div>
          </div>

          <div className="empty-preview-section-title"><strong>二、填空题</strong></div>
          <div className="empty-preview-question is-compact">
            <b>3.</b>
            <div><p>分解因式：x² - 4 = ______。</p></div>
          </div>
          <div className="empty-preview-question is-compact is-secondary">
            <b>4.</b>
            <div><p>直角三角形两直角边长为 3 和 4，则斜边长为 ______。</p></div>
          </div>

          <div className="empty-preview-section-title"><strong>三、解答题</strong></div>
          <div className="empty-preview-question is-compact">
            <b>5.</b>
            <div><p>解方程：x² - 5x + 6 = 0。</p><i className="is-solution-area" /></div>
          </div>
          <div className="empty-preview-question is-compact is-secondary">
            <b>6.</b>
            <div><p>甲、乙两种图书共 80 本，总费用为 1400 元。若单价分别为 20 元和 15 元，求两种图书各多少本。</p><i className="is-solution-area" /></div>
          </div>
        </div> : null}

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
      </div>
    </article>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { MetisButton, MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import { ArrowDown, ArrowUp, Bold, GripVertical, Italic, Omega, Radical, Sparkles, Trash2, Underline } from 'lucide-react'
import { defaultDocumentFormat } from '../prototype/types'
import type { AddQuestionMode, AiAssistantRun, AsyncStatus, DocumentFormat, Question, QuestionPatch, QuestionType, WorkbenchDocument } from '../prototype/types'
import { BlockAddMenu } from './BlockAddMenu'
import { ContextualAiPopover } from './ContextualAiPopover'
import { DocumentFormatToolbar } from './DocumentFormatToolbar'

interface DocumentCanvasProps {
  document: WorkbenchDocument
  compactPreview: boolean
  selectedQuestionId: string | null
  highlightedQuestionId?: string | null
  onTitleChange: (title: string) => void
  onSelectQuestion: (questionId: string) => void
  onRewriteRequirement: (requirement: string) => void
  rewriteStatus: AsyncStatus
  rewritePreview: Question | null
  onApplyRewrite: (mode: 'replace' | 'append') => void
  onMoveQuestion: (direction: -1 | 1) => void
  onDeleteQuestion: () => void
  onQuestionChange: (questionId: string, patch: QuestionPatch) => void
  onDocumentFormatChange: (patch: Partial<DocumentFormat>) => void
  onSectionTitleChange: (questionType: QuestionType, title: string) => void
  onAdd: (mode?: AddQuestionMode) => void
  assistantStatus: AsyncStatus
  assistantRun: AiAssistantRun | null
  assistantPreviewText: string
  assistantError: string
  onOpenAssistant: (prompt: string) => void
  onConfirmAssistant: () => boolean
}

type QuestionStyle = DocumentFormat & {
  bold: boolean
  italic: boolean
  underline: boolean
}

interface EditableQuestionTextProps {
  value: string
  multiline?: boolean
  ariaLabel: string
  onCommit: (value: string) => void
}

function EditableQuestionText({ value, multiline = false, ariaLabel, onCommit }: EditableQuestionTextProps) {
  const [draft, setDraft] = useState(value)
  const cancelBlurRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => setDraft(value), [value])
  useEffect(() => {
    if (!multiline || !textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }, [draft, multiline])
  const commit = () => {
    if (cancelBlurRef.current) {
      cancelBlurRef.current = false
      setDraft(value)
      return
    }
    const nextValue = draft.trim()
    if (nextValue && nextValue !== value) onCommit(nextValue)
    if (!nextValue) setDraft(value)
  }
  const shared = {
    value: draft,
    'aria-label': ariaLabel,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(event.target.value),
    onBlur: commit,
    onClick: (event: React.MouseEvent) => event.stopPropagation(),
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      event.stopPropagation()
      if (event.key === 'Escape') {
        cancelBlurRef.current = true
        setDraft(value)
        event.currentTarget.blur()
      }
      if (!multiline && event.key === 'Enter') event.currentTarget.blur()
    },
  }
  return multiline
    ? <textarea {...shared} ref={textareaRef} className="editor-question-inline-input is-stem" rows={1} />
    : <input {...shared} className="editor-question-inline-input is-option" />
}

interface EditableSectionTitleProps {
  number: number
  questionType: QuestionType
  value: string
  onCommit: (questionType: QuestionType, title: string) => void
}

const sectionNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

function EditableSectionTitle({ number, questionType, value, onCommit }: EditableSectionTitleProps) {
  const [draft, setDraft] = useState(value)
  const cancelBlurRef = useRef(false)
  useEffect(() => setDraft(value), [value])
  const commit = () => {
    if (cancelBlurRef.current) {
      cancelBlurRef.current = false
      setDraft(value)
      return
    }
    const nextValue = draft.trim()
    if (!nextValue) {
      setDraft(value)
      return
    }
    if (nextValue !== value) onCommit(questionType, nextValue)
  }
  return (
    <div className="editor-question-section" aria-label={`第 ${number} 个题目模块`}>
      <span>{sectionNumbers[number - 1] ?? number}、</span>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') {
            cancelBlurRef.current = true
            setDraft(value)
            event.currentTarget.blur()
          }
        }}
        aria-label={`修改${questionType}模块名称`}
        title="点击修改模块名称"
      />
    </div>
  )
}

export function DocumentCanvas(props: DocumentCanvasProps) {
  const [questionStyles, setQuestionStyles] = useState<Record<string, QuestionStyle>>({})
  const [editRequirement, setEditRequirement] = useState('')
  const [questionAiOpen, setQuestionAiOpen] = useState(false)
  const [questionAiSubmitted, setQuestionAiSubmitted] = useState(false)
  const [answerPreviewQuestionId, setAnswerPreviewQuestionId] = useState<string | null>(null)
  const documentFormat = { ...defaultDocumentFormat, ...props.document.format }
  const questionRows = useMemo(() => {
    let sectionNumber = 0
    return props.document.questions.map((question, index) => {
      const beginsSection = index === 0 || props.document.questions[index - 1]?.type !== question.type
      if (beginsSection) sectionNumber += 1
      return { question, index, sectionNumber: beginsSection ? sectionNumber : null }
    })
  }, [props.document.questions])

  useEffect(() => {
    setQuestionStyles({})
    setAnswerPreviewQuestionId(null)
  }, [props.document.format, props.document.id])
  useEffect(() => {
    setQuestionAiOpen(false)
    setQuestionAiSubmitted(false)
    setEditRequirement('')
  }, [props.selectedQuestionId])

  return (
    <article
      className={`editor-document${questionAiOpen ? ' is-ai-focus' : ''}`}
      data-sec="3"
      aria-label="题单编辑区"
      style={{
        '--document-font-family': documentFormat.fontFamily === 'sans' ? 'var(--fx-font-body)' : documentFormat.fontFamily === 'kaiti' ? '"Kaiti SC", "STKaiti", serif' : '"Songti SC", "STSong", serif',
        '--document-font-size': `${documentFormat.fontSize}px`,
        '--document-line-height': documentFormat.lineHeight,
        '--document-paragraph-spacing': documentFormat.paragraphSpacing,
        '--document-letter-spacing': `${documentFormat.letterSpacing}px`,
      } as React.CSSProperties}
    >
      <header className="editor-document-heading">
        <DocumentFormatToolbar value={documentFormat} onChange={props.onDocumentFormatChange} />
        <MetisInput
          value={props.document.title}
          onChange={(event) => props.onTitleChange(event.target.value)}
          className="editor-title-input"
          aria-label="题单标题"
        />
      </header>

      {props.document.intro?.trim() ? (
        <div className="editor-document-intro">{props.document.intro}</div>
      ) : null}

      <div className="editor-question-list">
        {questionRows.map(({ question, index, sectionNumber }) => {
          const selected = question.id === props.selectedQuestionId
          const editing = selected && !props.compactPreview
          const answerPreviewOpen = answerPreviewQuestionId === question.id
          const questionStyle = questionStyles[question.id] ?? { ...documentFormat }
          const updateQuestionStyle = <Key extends keyof QuestionStyle>(key: Key, value: QuestionStyle[Key]) => {
            setQuestionStyles((current) => ({ ...current, [question.id]: { ...questionStyle, [key]: value } }))
          }
          return (
            <div className={`editor-question-block${answerPreviewOpen ? ' has-answer-popover' : ''}`} key={question.id}>
            {sectionNumber ? (
              <EditableSectionTitle
                number={sectionNumber}
                questionType={question.type}
                value={props.document.sectionTitles?.[question.type] ?? question.type}
                onCommit={props.onSectionTitleChange}
              />
            ) : null}
            <section
              id={`question-${question.id}`}
              className={`editor-question${selected ? ' is-selected' : ''}${selected && questionAiOpen ? ' is-ai-open' : ''}${question.id === props.highlightedQuestionId ? ' is-newly-added' : ''}`}
              onMouseEnter={() => props.onSelectQuestion(question.id)}
              onMouseDown={(event) => {
                if (!props.compactPreview) return
                if ((event.target as HTMLElement).closest('.editor-question-tools, .contextual-ai-popover, .editor-question-answer-popover')) return
                setAnswerPreviewQuestionId((current) => current === question.id ? null : question.id)
              }}
              onClick={(event) => {
                props.onSelectQuestion(question.id)
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  props.onSelectQuestion(question.id)
                }
              }}
              tabIndex={0}
              aria-current={selected ? 'true' : undefined}
              aria-label={`第 ${index + 1} 题`}
              style={{ '--question-font-family': questionStyle.fontFamily === 'sans' ? 'var(--fx-font-body)' : questionStyle.fontFamily === 'kaiti' ? '"Kaiti SC", "STKaiti", serif' : '"Songti SC", "STSong", serif', '--question-font-size': `${questionStyle.fontSize}px`, '--question-line-height': questionStyle.lineHeight, '--question-letter-spacing': `${questionStyle.letterSpacing}px`, '--question-font-weight': questionStyle.bold ? '700' : '400', '--question-font-style': questionStyle.italic ? 'italic' : 'normal', '--question-text-decoration': questionStyle.underline ? 'underline' : 'none', '--question-text-color': questionStyle.textColor, '--question-text-align': questionStyle.textAlign, '--question-indent': `${questionStyle.indentLevel * 16}px` } as React.CSSProperties}
            >
              <button type="button" className="editor-question-drag" draggable aria-label={`拖动第 ${index + 1} 题`} onClick={(event) => event.stopPropagation()}><GripVertical size={16} /></button>
              {selected ? (
                <div className="editor-question-tools" onClick={(event) => event.stopPropagation()}>
                  <div className="editor-question-toolbar">
                    <button type="button" className="editor-question-ai-trigger" onClick={() => { setQuestionAiSubmitted(false); setAnswerPreviewQuestionId(null); setQuestionAiOpen((open) => { const next = !open; if (next) requestAnimationFrame(() => document.getElementById(`question-${question.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })); return next }) }} aria-expanded={questionAiOpen}><Sparkles size={14} />AI 助手</button>
                    <label className="question-format-control" title="字体"><select aria-label="题目字体" value={questionStyle.fontFamily} onChange={(event) => updateQuestionStyle('fontFamily', event.target.value as DocumentFormat['fontFamily'])}><option value="serif">宋体</option><option value="sans">黑体</option><option value="kaiti">楷体</option></select></label>
                    <label className="question-format-control" title="字号"><select aria-label="题目字号" value={questionStyle.fontSize} onChange={(event) => updateQuestionStyle('fontSize', event.target.value as DocumentFormat['fontSize'])}><option value="14">小</option><option value="16">标准</option><option value="18">大</option></select></label>
                    <label className="question-format-control" title="行距"><select aria-label="题目行距" value={questionStyle.lineHeight} onChange={(event) => updateQuestionStyle('lineHeight', event.target.value as DocumentFormat['lineHeight'])}><option value="1.5">1.5</option><option value="1.7">1.7</option><option value="2">2.0</option></select></label>
                    <label className="question-format-control" title="字距"><select aria-label="题目字距" value={questionStyle.letterSpacing} onChange={(event) => updateQuestionStyle('letterSpacing', event.target.value as DocumentFormat['letterSpacing'])}><option value="0">0</option><option value="0.5">0.5</option><option value="1">1.0</option></select></label>
                    <span className="toolbar-divider" />
                    <button type="button" className={`question-inline-tool${questionStyle.bold ? ' is-active' : ''}`} onClick={() => updateQuestionStyle('bold', !questionStyle.bold)} aria-label="加粗" title="加粗"><Bold size={15} /></button>
                    <button type="button" className={`question-inline-tool${questionStyle.italic ? ' is-active' : ''}`} onClick={() => updateQuestionStyle('italic', !questionStyle.italic)} aria-label="斜体" title="斜体"><Italic size={15} /></button>
                    <button type="button" className={`question-inline-tool${questionStyle.underline ? ' is-active' : ''}`} onClick={() => updateQuestionStyle('underline', !questionStyle.underline)} aria-label="下划线" title="下划线"><Underline size={15} /></button>
                    <button type="button" className="question-inline-tool" onClick={() => MetisMessage.info('已打开公式输入演示')} aria-label="插入公式" title="插入公式"><Radical size={15} /></button>
                    <button type="button" className="question-inline-tool" onClick={() => MetisMessage.info('已打开特殊字符面板演示')} aria-label="插入特殊字符" title="插入特殊字符"><Omega size={15} /></button>
                    <MetisButton type="borderless" icon={<ArrowUp size={15} />} onClick={() => props.onMoveQuestion(-1)} aria-label="上移" />
                    <MetisButton type="borderless" icon={<ArrowDown size={15} />} onClick={() => props.onMoveQuestion(1)} aria-label="下移" />
                    <span className="toolbar-divider" />
                    <MetisButton type="borderless" icon={<Trash2 size={15} />} onClick={props.onDeleteQuestion} aria-label="删除题目" />
                  </div>
                </div>
              ) : null}
              {selected && questionAiOpen ? (
                <ContextualAiPopover
                  title={`修改第 ${index + 1} 题`}
                  prompt={editRequirement}
                  placeholder="例如：降低难度，换成生活化情境"
                  status={questionAiSubmitted ? props.rewriteStatus : 'idle'}
                  resultText={questionAiSubmitted ? props.rewritePreview?.stem : undefined}
                  resultVariants={questionAiSubmitted && props.rewritePreview?.stem ? [
                    props.rewritePreview.stem,
                    `保持原考点不变，换一种表达：${props.rewritePreview.stem}`,
                    `结合真实学习情境，重新设计：${props.rewritePreview.stem}`,
                  ] : undefined}
                  resultMeta="已生成改写结果"
                  originalText={question.stem}
                  quickActions={[
                    { label: '润色表达', instruction: '润色题目文案，使表达更准确简洁' },
                    { label: '调整难度', instruction: '调整题目难度' },
                    { label: '增加情境', instruction: '换生活情境' },
                    { label: '同考点变式', instruction: '保持考点不变，生成不同形式的变式题' },
                  ].map((action) => ({
                    label: action.label,
                    onSelect: () => {
                      setEditRequirement(action.label)
                      setQuestionAiSubmitted(true)
                      props.onRewriteRequirement(action.instruction)
                    },
                  }))}
                  onPromptChange={setEditRequirement}
                  onSubmit={() => { setQuestionAiSubmitted(true); props.onRewriteRequirement(editRequirement.trim()) }}
                  onClose={() => { setQuestionAiOpen(false); setQuestionAiSubmitted(false) }}
                  onReplace={() => { props.onApplyRewrite('replace'); setQuestionAiOpen(false); setEditRequirement('') }}
                  onAppend={() => { props.onApplyRewrite('append'); setQuestionAiOpen(false); setEditRequirement('') }}
                />
              ) : null}
              <div className="editor-question-mainline">
                <span className="editor-question-number">{index + 1}.</span>
                {editing ? (
                  <EditableQuestionText
                    value={question.stem}
                    multiline
                    ariaLabel={`编辑第 ${index + 1} 题题干`}
                    onCommit={(stem) => props.onQuestionChange(question.id, { stem })}
                  />
                ) : <div className="editor-question-stem">{question.stem}</div>}
              </div>
              {question.options ? (
                <div className="editor-question-options">
                  {question.options.map((option, optionIndex) => editing ? (
                    <EditableQuestionText
                      key={`${question.id}-option-${optionIndex}`}
                      value={option}
                      ariaLabel={`编辑第 ${index + 1} 题选项 ${optionIndex + 1}`}
                      onCommit={(nextOption) => {
                        const options = [...(question.options ?? [])]
                        options[optionIndex] = nextOption
                        props.onQuestionChange(question.id, { options })
                      }}
                    />
                  ) : <span key={`${question.id}-option-${optionIndex}`}>{option}</span>)}
                </div>
              ) : null}
              {answerPreviewOpen ? (
                <aside className="editor-question-answer-popover" aria-label={`第 ${index + 1} 题答案与解析`} onClick={(event) => event.stopPropagation()}>
                  <div><strong>答案</strong><p>{question.answer || '暂无答案'}</p></div>
                  <div><strong>解析</strong><p>{question.analysis || '暂无解析'}</p></div>
                </aside>
              ) : null}
            </section>
            </div>
          )
        })}
      </div>

      <div className="editor-add-row">
        <BlockAddMenu
          onOpenAdd={props.onAdd}
          assistantStatus={props.assistantStatus}
          assistantRun={props.assistantRun}
          assistantPreviewText={props.assistantPreviewText}
          assistantError={props.assistantError}
          onOpenAssistant={props.onOpenAssistant}
          onConfirmAssistant={props.onConfirmAssistant}
        />
      </div>
    </article>
  )
}

import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import { ArrowDown, ArrowUp, Bold, GripVertical, Italic, Omega, Radical, Send, Sparkles, Trash2, Underline } from 'lucide-react'
import type { AddQuestionMode, QuestionPatch, WorkbenchDocument } from '../prototype/types'
import { BlockAddMenu } from './BlockAddMenu'

interface DocumentCanvasProps {
  document: WorkbenchDocument
  selectedQuestionId: string | null
  onTitleChange: (title: string) => void
  onSelectQuestion: (questionId: string) => void
  onRewriteRequirement: (requirement: string) => void
  onMoveQuestion: (direction: -1 | 1) => void
  onDeleteQuestion: () => void
  onQuestionChange: (questionId: string, patch: QuestionPatch) => void
  onAdd: (mode?: AddQuestionMode) => void
  onOpenAssistant: () => void
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

export function DocumentCanvas(props: DocumentCanvasProps) {
  const [questionStyles, setQuestionStyles] = useState<Record<string, { fontFamily: string; fontSize: string; lineHeight: string; letterSpacing: string; bold: boolean; italic: boolean; underline: boolean }>>({})
  const [editRequirement, setEditRequirement] = useState('')
  return (
    <article className="editor-document" data-sec="3" aria-label="题单编辑区">
      <header className="editor-document-heading">
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
        {props.document.questions.map((question, index) => {
          const selected = question.id === props.selectedQuestionId
          const questionStyle = questionStyles[question.id] ?? { fontFamily: 'serif', fontSize: '16', lineHeight: '1.7', letterSpacing: '0', bold: false, italic: false, underline: false }
          const updateQuestionStyle = (key: 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'bold' | 'italic' | 'underline', value: string | boolean) => {
            setQuestionStyles((current) => ({ ...current, [question.id]: { ...questionStyle, [key]: value } }))
          }
          return (
            <section
              id={`question-${question.id}`}
              key={question.id}
              className={`editor-question${selected ? ' is-selected' : ''}`}
              onClick={() => props.onSelectQuestion(question.id)}
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
              style={{ '--question-font-family': questionStyle.fontFamily === 'sans' ? 'var(--fx-font-body)' : questionStyle.fontFamily === 'kaiti' ? '"Kaiti SC", "STKaiti", serif' : '"Songti SC", "STSong", serif', '--question-font-size': `${questionStyle.fontSize}px`, '--question-line-height': questionStyle.lineHeight, '--question-letter-spacing': `${questionStyle.letterSpacing}px`, '--question-font-weight': questionStyle.bold ? '700' : '400', '--question-font-style': questionStyle.italic ? 'italic' : 'normal', '--question-text-decoration': questionStyle.underline ? 'underline' : 'none' } as React.CSSProperties}
            >
              <button type="button" className="editor-question-drag" draggable aria-label={`拖动第 ${index + 1} 题`} onClick={(event) => event.stopPropagation()}><GripVertical size={16} /></button>
              {selected ? (
                <div className="editor-question-tools" onClick={(event) => event.stopPropagation()}>
                  <div className="editor-question-toolbar">
                    <label className="question-format-control" title="字体"><select aria-label="题目字体" value={questionStyle.fontFamily} onChange={(event) => updateQuestionStyle('fontFamily', event.target.value)}><option value="serif">宋体</option><option value="sans">黑体</option><option value="kaiti">楷体</option></select></label>
                    <label className="question-format-control" title="字号"><select aria-label="题目字号" value={questionStyle.fontSize} onChange={(event) => updateQuestionStyle('fontSize', event.target.value)}><option value="14">小</option><option value="16">标准</option><option value="18">大</option></select></label>
                    <label className="question-format-control" title="行距"><select aria-label="题目行距" value={questionStyle.lineHeight} onChange={(event) => updateQuestionStyle('lineHeight', event.target.value)}><option value="1.5">1.5</option><option value="1.7">1.7</option><option value="2">2.0</option></select></label>
                    <label className="question-format-control" title="字距"><select aria-label="题目字距" value={questionStyle.letterSpacing} onChange={(event) => updateQuestionStyle('letterSpacing', event.target.value)}><option value="0">0</option><option value="0.5">0.5</option><option value="1">1.0</option></select></label>
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
                  <form className="editor-question-requirement" onSubmit={(event) => { event.preventDefault(); const requirement = editRequirement.trim(); if (!requirement) return; props.onRewriteRequirement(requirement) }}>
                    <span className="editor-question-ai-label"><Sparkles size={14} />飞象 AI</span>
                    <input value={editRequirement} onChange={(event) => setEditRequirement(event.target.value)} placeholder="输入你的编辑要求" aria-label="输入你的编辑要求" />
                    <button type="submit" disabled={!editRequirement.trim()} aria-label="提交编辑要求"><Send size={14} /></button>
                  </form>
                </div>
              ) : null}
              <div className="editor-question-mainline">
                <span className="editor-question-number">{index + 1}.</span>
                {selected ? (
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
                  {question.options.map((option, optionIndex) => selected ? (
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
            </section>
          )
        })}
      </div>

      <div className="editor-add-row">
        <BlockAddMenu onOpenAdd={props.onAdd} onOpenAssistant={props.onOpenAssistant} />
      </div>
    </article>
  )
}

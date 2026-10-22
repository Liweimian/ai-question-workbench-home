import { useState } from 'react'
import { MetisButton, MetisInput } from '@yuanfudao/metis-web-component'
import { ArrowDown, ArrowUp, GripVertical, Sparkles, Trash2 } from 'lucide-react'
import type { AddQuestionMode, WorkbenchDocument } from '../prototype/types'
import { BlockAddMenu } from './BlockAddMenu'

interface DocumentCanvasProps {
  document: WorkbenchDocument
  selectedQuestionId: string | null
  onTitleChange: (title: string) => void
  onSelectQuestion: (questionId: string) => void
  onOpenAi: () => void
  onMoveQuestion: (direction: -1 | 1) => void
  onDeleteQuestion: () => void
  onAdd: (mode?: AddQuestionMode) => void
}

export function DocumentCanvas(props: DocumentCanvasProps) {
  const [questionStyles, setQuestionStyles] = useState<Record<string, { fontFamily: string; fontSize: string; lineHeight: string; letterSpacing: string }>>({})
  const totalMinutes = props.document.questions.reduce((sum, question) => sum + question.estimatedMinutes, 0)

  return (
    <article className="editor-document" data-sec="3" aria-label="题单编辑区">
      <header className="editor-document-heading">
        <MetisInput
          value={props.document.title}
          onChange={(event) => props.onTitleChange(event.target.value)}
          className="editor-title-input"
          aria-label="题单标题"
        />
        <p>{props.document.gradeSubject}</p>
        <div className="editor-document-summary">
          <span>{props.document.questions.length} 道题</span>
          <span>预计 {totalMinutes} 分钟</span>
          <span>自动保存 · {props.document.updatedAt}</span>
        </div>
      </header>

      <div className="editor-question-list">
        {props.document.questions.map((question, index) => {
          const selected = question.id === props.selectedQuestionId
          const questionStyle = questionStyles[question.id] ?? { fontFamily: 'serif', fontSize: '16', lineHeight: '1.7', letterSpacing: '0' }
          const updateQuestionStyle = (key: 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing', value: string) => {
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
              style={{ '--question-font-family': questionStyle.fontFamily === 'sans' ? 'var(--fx-font-body)' : questionStyle.fontFamily === 'kaiti' ? '"Kaiti SC", "STKaiti", serif' : '"Songti SC", "STSong", serif', '--question-font-size': `${questionStyle.fontSize}px`, '--question-line-height': questionStyle.lineHeight, '--question-letter-spacing': `${questionStyle.letterSpacing}px` } as React.CSSProperties}
            >
              <button type="button" className="editor-question-drag" draggable aria-label={`拖动第 ${index + 1} 题`} onClick={(event) => event.stopPropagation()}><GripVertical size={16} /></button>
              {selected ? (
                <div className="editor-question-toolbar" onClick={(event) => event.stopPropagation()}>
                  <MetisButton type="borderless" icon={<Sparkles size={15} />} onClick={props.onOpenAi}>飞象 AI 助手</MetisButton>
                  <label className="question-format-control">字体<select aria-label="题目字体" value={questionStyle.fontFamily} onChange={(event) => updateQuestionStyle('fontFamily', event.target.value)}><option value="serif">宋体</option><option value="sans">黑体</option><option value="kaiti">楷体</option></select></label>
                  <label className="question-format-control">字号<select aria-label="题目字号" value={questionStyle.fontSize} onChange={(event) => updateQuestionStyle('fontSize', event.target.value)}><option value="14">小</option><option value="16">标准</option><option value="18">大</option></select></label>
                  <label className="question-format-control">行距<select aria-label="题目行距" value={questionStyle.lineHeight} onChange={(event) => updateQuestionStyle('lineHeight', event.target.value)}><option value="1.5">1.5</option><option value="1.7">1.7</option><option value="2">2.0</option></select></label>
                  <label className="question-format-control">字距<select aria-label="题目字距" value={questionStyle.letterSpacing} onChange={(event) => updateQuestionStyle('letterSpacing', event.target.value)}><option value="0">0</option><option value="0.5">0.5</option><option value="1">1.0</option></select></label>
                  <MetisButton type="borderless" icon={<ArrowUp size={15} />} onClick={() => props.onMoveQuestion(-1)} aria-label="上移" />
                  <MetisButton type="borderless" icon={<ArrowDown size={15} />} onClick={() => props.onMoveQuestion(1)} aria-label="下移" />
                  <span className="toolbar-divider" />
                  <MetisButton type="borderless" icon={<Trash2 size={15} />} onClick={props.onDeleteQuestion} aria-label="删除题目" />
                </div>
              ) : null}
              <div className="editor-question-mainline">
                <span className="editor-question-number">{index + 1}.</span>
                <div className="editor-question-stem">{question.stem}</div>
              </div>
              {question.options ? (
                <div className="editor-question-options">
                  {question.options.map((option) => <span key={option}>{option}</span>)}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>

      <div className="editor-add-row">
        <BlockAddMenu onOpenAdd={props.onAdd} />
      </div>
    </article>
  )
}

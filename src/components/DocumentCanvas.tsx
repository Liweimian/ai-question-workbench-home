import { MetisButton, MetisInput } from '@yuanfudao/metis-web-component'
import { ArrowDown, ArrowUp, GripVertical, Pencil, Sparkles, Trash2 } from 'lucide-react'
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
  onEditQuestion: () => void
  onAdd: (mode?: AddQuestionMode) => void
}

export function DocumentCanvas(props: DocumentCanvasProps) {
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
            >
              {selected ? (
                <div className="editor-question-toolbar" onClick={(event) => event.stopPropagation()}>
                  <MetisButton type="borderless" icon={<Sparkles size={15} />} onClick={props.onOpenAi}>AI 改编</MetisButton>
                  <MetisButton type="borderless" icon={<Pencil size={15} />} onClick={props.onEditQuestion}>编辑</MetisButton>
                  <MetisButton type="borderless" icon={<ArrowUp size={15} />} onClick={() => props.onMoveQuestion(-1)} aria-label="上移" />
                  <MetisButton type="borderless" icon={<ArrowDown size={15} />} onClick={() => props.onMoveQuestion(1)} aria-label="下移" />
                  <span className="toolbar-divider" />
                  <MetisButton type="borderless" icon={<Trash2 size={15} />} onClick={props.onDeleteQuestion} aria-label="删除题目" />
                </div>
              ) : null}
              <div className="editor-question-number">
                <GripVertical size={15} />
                <span>{index + 1}</span>
                <em>{question.type}</em>
                {question.origin === 'ai-original' ? <strong><Sparkles size={12} />AI 原创 · 待校验</strong> : null}
              </div>
              <div className="editor-question-stem">{question.stem}</div>
              {question.options ? (
                <div className="editor-question-options">
                  {question.options.map((option) => <span key={option}>{option}</span>)}
                </div>
              ) : null}
              <div className="editor-question-hint">答案与解析请查看右侧题目信息</div>
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

import { MetisButton, MetisInput } from '@yuanfudao/metis-web-component'
import { ArrowDown, ArrowUp, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { WorkbenchDocument } from '../prototype/types'

interface DocumentCanvasProps {
  document: WorkbenchDocument
  selectedQuestionId: string | null
  onTitleChange: (title: string) => void
  onSelectQuestion: (questionId: string) => void
  onOpenAi: () => void
  onMoveQuestion: (direction: -1 | 1) => void
  onDeleteQuestion: () => void
  onEditQuestion: () => void
  onAdd: () => void
}

export function DocumentCanvas(props: DocumentCanvasProps) {
  const totalMinutes = props.document.questions.reduce((sum, question) => sum + question.estimatedMinutes, 0)

  return (
    <article className="paper-canvas" data-sec="4" aria-label="题单编辑画布">
      <header className="paper-heading">
        <MetisInput
          value={props.document.title}
          onChange={(event) => props.onTitleChange(event.target.value)}
          className="paper-title-input"
          aria-label="文档标题"
        />
        <p>{props.document.gradeSubject}</p>
        <div className="paper-summary">
          <span>{props.document.questions.length} 道题</span>
          <span>预计 {totalMinutes} 分钟</span>
          <span>本地演示草稿 · {props.document.updatedAt}</span>
        </div>
      </header>

      <div className="question-list">
        {props.document.questions.map((question, index) => {
          const selected = question.id === props.selectedQuestionId
          return (
            <section
              key={question.id}
              className={`question-card${selected ? ' is-selected' : ''}`}
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
                <div className="question-toolbar" onClick={(event) => event.stopPropagation()}>
                  <MetisButton type="borderless" icon={<Sparkles size={15} />} onClick={props.onOpenAi}>AI 改编</MetisButton>
                  <MetisButton type="borderless" icon={<Pencil size={15} />} onClick={props.onEditQuestion}>编辑</MetisButton>
                  <MetisButton type="borderless" icon={<ArrowUp size={15} />} onClick={() => props.onMoveQuestion(-1)} aria-label="上移" />
                  <MetisButton type="borderless" icon={<ArrowDown size={15} />} onClick={() => props.onMoveQuestion(1)} aria-label="下移" />
                  <span className="toolbar-divider" />
                  <MetisButton type="borderless" icon={<Trash2 size={15} />} onClick={props.onDeleteQuestion} aria-label="删除题目" />
                </div>
              ) : null}
              <div className="question-meta">
                <span className="question-index">{index + 1}</span>
                <span>{question.type}</span>
                <span>{question.difficulty}</span>
                <span>{question.knowledgePoint}</span>
                <span className="question-source">来自：{question.sourceLabel}</span>
              </div>
              <div className="question-stem">{question.stem}</div>
              {question.options ? (
                <div className="question-options">
                  {question.options.map((option) => <span key={option}>{option}</span>)}
                </div>
              ) : null}
              <div className="question-answer">
                <strong>答案</strong><span>{question.answer}</span>
                <strong>解析</strong><span>{question.analysis}</span>
              </div>
            </section>
          )
        })}
      </div>

      <div className="paper-add-row">
        <MetisButton type="borderless" icon={<Plus size={16} />} onClick={props.onAdd}>继续添加内容</MetisButton>
      </div>
    </article>
  )
}

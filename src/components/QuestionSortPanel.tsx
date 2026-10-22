import { useMemo, useState } from 'react'
import { GripVertical, X } from 'lucide-react'
import type { Question } from '../prototype/types'

interface QuestionSortPanelProps {
  questions: Question[]
  selectedQuestionId: string | null
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  onSelectQuestion: (questionId: string) => void
  onReorderQuestions: (questionIds: string[]) => void
}

const typeOrder = ['选择题', '填空题', '解答题']

export function QuestionSortPanel(props: QuestionSortPanelProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const groups = useMemo(() => typeOrder.map((type) => ({
    type,
    questions: props.questions.filter((question) => question.type === type),
  })).filter((group) => group.questions.length > 0), [props.questions])

  const reorder = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    const nextIds = props.questions.map((question) => question.id)
    const from = nextIds.indexOf(draggedId)
    const to = nextIds.indexOf(targetId)
    if (from < 0 || to < 0) return
    nextIds.splice(to, 0, nextIds.splice(from, 1)[0])
    props.onReorderQuestions(nextIds)
    setDraggedId(null)
  }

  if (props.collapsed) {
    return <div className="question-sort-collapsed"><button type="button" onClick={() => props.onCollapsedChange(false)}>题目排序</button></div>
  }

  return (
    <aside className="question-sort-panel" aria-label="题目排序">
      <header><strong>题目排序</strong><button type="button" aria-label="收起题目排序" onClick={() => props.onCollapsedChange(true)}><X size={15} /></button></header>
      <div className="question-sort-tip"><span>可拖动排序</span><button type="button" onClick={() => props.onReorderQuestions([...props.questions].sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)).map((question) => question.id))}>按题型排序</button></div>
      <div className="question-sort-groups">
        {groups.map((group, groupIndex) => (
          <section key={group.type}>
            <h3>{['一', '二', '三'][groupIndex]}、{group.type}</h3>
            <div>
              {group.questions.map((question) => {
                const number = props.questions.findIndex((item) => item.id === question.id) + 1
                return (
                  <button
                    type="button"
                    draggable
                    key={question.id}
                    className={question.id === props.selectedQuestionId ? 'is-active' : ''}
                    aria-current={question.id === props.selectedQuestionId ? 'true' : undefined}
                    onClick={() => props.onSelectQuestion(question.id)}
                    onDragStart={() => setDraggedId(question.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => reorder(question.id)}
                  >
                    <GripVertical size={11} />{number}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  )
}

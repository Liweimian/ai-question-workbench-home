import { useMemo, useState } from 'react'
import { baseQuestions } from '../data/workbenchData'
import type { MyResourceSummary, Question, ResourceType, SourceRecord } from '../prototype/types'
import { LegacyResourceDetail } from './LibraryPicker'

interface MyResourceQuestionDetailProps {
  resource: MyResourceSummary
  contentBusy: boolean
  onAddSource: (type: ResourceType, sourceId: string, count: number, selectedQuestions?: Question[]) => Promise<boolean>
}

const resourceTypeByKind: Record<Exclude<MyResourceSummary['kind'], '文件'>, ResourceType> = {
  试卷: 'paper',
  题单: 'special',
  题目: 'special',
  练习册: 'workbook',
}

export function MyResourceQuestionDetail({ resource, contentBusy, onAddSource }: MyResourceQuestionDetailProps) {
  const sourceType = resource.kind === '文件' ? 'special' : resourceTypeByKind[resource.kind]
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [pendingQuestionIds, setPendingQuestionIds] = useState<Set<string>>(new Set())
  const [showAnswers, setShowAnswers] = useState(false)

  const questions = useMemo(() => {
    const count = Math.min(baseQuestions.length, Math.max(1, resource.questionCount ?? 4))
    return baseQuestions.slice(0, count).map((question) => ({
      ...question,
      id: `${resource.id}-${question.id}`,
      sourceLabel: resource.title,
      sourceDetail: resource.detail,
    }))
  }, [resource])

  const record: SourceRecord = {
    id: resource.id,
    sourceType,
    title: resource.title,
    meta: resource.detail,
    questionCount: resource.questionCount ?? questions.length,
    highlight: resource.kind,
    updatedAt: resource.updatedAt,
  }

  const addQuestions = async (targets: Question[]) => {
    const unadded = targets.filter((question) => !selectedQuestionIds.has(question.id))
    if (unadded.length === 0 || pendingQuestionIds.size > 0 || contentBusy) return
    const pendingIds = unadded.map((question) => question.id)
    setPendingQuestionIds(new Set(pendingIds))
    const added = await onAddSource(sourceType, resource.id, unadded.length, unadded)
    if (added) setSelectedQuestionIds((current) => new Set([...current, ...pendingIds]))
    setPendingQuestionIds(new Set())
  }

  return <LegacyResourceDetail
    record={record}
    embedded
    questions={questions}
    selectedQuestionIds={selectedQuestionIds}
    pendingQuestionIds={pendingQuestionIds}
    showAnswers={showAnswers}
    contentBusy={contentBusy}
    addStatus={pendingQuestionIds.size > 0 ? 'loading' : 'idle'}
    showReturnNavigation={false}
    onReturnHome={() => undefined}
    onToggleAnswers={() => setShowAnswers((current) => !current)}
    onToggleQuestion={async (question) => addQuestions([question])}
    onAddQuestionGroup={addQuestions}
    onUseAll={async () => addQuestions(questions)}
  />
}

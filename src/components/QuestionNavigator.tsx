import { MetisButton, MetisInput } from '@yuanfudao/metis-web-component'
import { Clock3, FileText, History, ListOrdered, Plus, RefreshCw, Search } from 'lucide-react'
import type {
  AsyncStatus,
  HistoryDocumentSummary,
  NavigatorView,
  WorkbenchDocument,
} from '../prototype/types'

interface QuestionNavigatorProps {
  document: WorkbenchDocument
  selectedQuestionId: string | null
  view: NavigatorView
  query: string
  historyStatus: AsyncStatus
  histories: HistoryDocumentSummary[]
  contentBusy: boolean
  onViewChange: (view: NavigatorView) => void
  onQueryChange: (value: string) => void
  onSelectQuestion: (questionId: string) => void
  onOpenHistory: (documentId: string) => void
  onReloadHistory: () => void
  onAdd: () => void
}

export function QuestionNavigator(props: QuestionNavigatorProps) {
  const totalMinutes = props.document.questions.reduce((sum, question) => sum + question.estimatedMinutes, 0)
  const normalizedQuery = props.query.trim().toLowerCase()
  const histories = props.histories.filter((item) => (
    !normalizedQuery
    || item.title.toLowerCase().includes(normalizedQuery)
    || item.gradeSubject.toLowerCase().includes(normalizedQuery)
  ))

  return (
    <aside className="question-navigator" data-sec="2" aria-label="题目与历史题单">
      <div className="navigator-tabs" role="tablist" aria-label="工作台导航">
        <button
          type="button"
          className={props.view === 'questions' ? 'is-active' : ''}
          onClick={() => props.onViewChange('questions')}
          role="tab"
          aria-selected={props.view === 'questions'}
        >
          <ListOrdered size={16} />题目 {props.document.questions.length}
        </button>
        <button
          type="button"
          className={props.view === 'history' ? 'is-active' : ''}
          onClick={() => props.onViewChange('history')}
          role="tab"
          aria-selected={props.view === 'history'}
          data-track="/click/aiQuestionHome/openHistory | 查看历史组题 | 无"
        >
          <History size={16} />历史
        </button>
      </div>

      {props.view === 'questions' ? (
        <>
          <div className="navigator-document-summary">
            <strong>{props.document.title}</strong>
            <span>{props.document.questions.length} 道题 · 预计 {totalMinutes} 分钟</span>
          </div>
          <div className="navigator-scroll question-outline">
            {props.document.questions.length === 0 ? (
              <div className="navigator-empty">
                <FileText size={24} />
                <strong>还没有题目</strong>
                <span>添加后可在这里快速定位和排序</span>
              </div>
            ) : props.document.questions.map((question, index) => (
              <button
                type="button"
                key={question.id}
                className={`outline-item${props.selectedQuestionId === question.id ? ' is-active' : ''}`}
                onClick={() => props.onSelectQuestion(question.id)}
                aria-current={props.selectedQuestionId === question.id ? 'true' : undefined}
                data-track="/click/aiQuestionHome/selectOutlineQuestion | 从左栏定位题目 | questionId#STRING"
              >
                <span className="outline-index">{index + 1}</span>
                <span className="outline-copy">
                  <strong>{question.type}<em>{question.difficulty}</em></strong>
                  <small>{question.stem}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="navigator-footer">
            <MetisButton type="bordered" block icon={<Plus size={16} />} onClick={props.onAdd}>
              添加题目
            </MetisButton>
          </div>
        </>
      ) : (
        <>
          <div className="history-search">
            <Search size={15} />
            <MetisInput
              value={props.query}
              onChange={(event) => props.onQueryChange(event.target.value)}
              placeholder="搜索历史题单"
              aria-label="搜索历史题单"
            />
          </div>
          <div className="history-helper">最近编辑</div>
          <div className="navigator-scroll history-list">
            {props.historyStatus === 'loading' ? (
              <div className="history-loading"><RefreshCw size={18} />正在加载历史题单…</div>
            ) : null}
            {props.historyStatus === 'error' ? (
              <div className="navigator-empty">
                <strong>历史题单加载失败</strong>
                <span>当前题单不受影响</span>
                <MetisButton onClick={props.onReloadHistory}>重新加载</MetisButton>
              </div>
            ) : null}
            {props.historyStatus === 'success' && histories.length === 0 ? (
              <div className="navigator-empty"><strong>没有找到相关题单</strong><span>换个关键词试试</span></div>
            ) : null}
            {props.historyStatus === 'success' ? histories.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`history-item${props.document.id === item.id ? ' is-current' : ''}`}
                onClick={() => props.onOpenHistory(item.id)}
                disabled={props.contentBusy}
                data-track="/click/aiQuestionHome/openHistoryDocument | 打开历史题单 | documentId#STRING"
              >
                <span className="history-item-heading">
                  <strong>{item.title}</strong>
                  <em>{item.status}</em>
                </span>
                <span>{item.gradeSubject}</span>
                <span className="history-item-meta">
                  <small>{item.origin} · {item.questionCount} 题</small>
                  <small><Clock3 size={12} />{item.updatedAt}</small>
                </span>
              </button>
            )) : null}
          </div>
        </>
      )}
    </aside>
  )
}

import { MetisButton } from '@yuanfudao/metis-web-component'
import { ChevronRight, Clock3, FolderHeart, RefreshCw } from 'lucide-react'
import type { AddQuestionMode, AsyncStatus, HistoryDocumentSummary, OpenAddOptions } from '../prototype/types'
import { addQuestionEntries } from '../data/addQuestionEntries'

interface TaskFirstNavigationProps {
  disabled?: boolean
  histories: HistoryDocumentSummary[]
  historyStatus: AsyncStatus
  onOpenDocument: (documentId: string) => void
  onOpenMyResources: () => void
  onOpenSource: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onOpenRecentBrowse: () => void
  onReload: () => void
}

const flatEntries = addQuestionEntries

export function TaskFirstNavigation({ disabled = false, histories, historyStatus, onOpenDocument, onOpenMyResources, onOpenSource, onOpenRecentBrowse, onReload }: TaskFirstNavigationProps) {
  const recentDocuments = histories.slice(0, 3)
  const historyPending = historyStatus === 'idle' || historyStatus === 'loading'
  const libraryEntries = flatEntries.slice(0, 6)
  const aiEntries = flatEntries.slice(6)

  return (
    <nav className="document-layout-four" aria-label="题目来源导航">
      <section className="document-layout-four-group" aria-labelledby="library-selection-title" data-sec="1">
        <h1 id="library-selection-title">题库选题</h1>
        <div className="document-layout-four-flat-grid" aria-label="题库选题入口">
          {libraryEntries.map(({ mode, view, label, source, description, icon: Icon }) => (
            <button
              type="button"
              key={`${mode}-${view ?? label}`}
              disabled={disabled}
              title={description ?? label}
              aria-label={`${source}：${label}`}
              onClick={() => onOpenSource(mode, view ? { libraryView: view } : undefined)}
              data-track="/click/aiQuestionHome/openFlatEntry | 打开平铺添加入口 | source#STRING,resourceType#STRING"
            >
              <span className="document-layout-four-entry-icon"><Icon size={21} /></span>
              <span className="document-layout-four-entry-copy"><strong>{label}</strong></span>
            </button>
          ))}
        </div>
      </section>

      <section className="document-layout-four-group" aria-labelledby="ai-tools-title">
        <h2 id="ai-tools-title">AI 工具</h2>
        <div className="document-layout-four-flat-grid is-ai" aria-label="AI 工具入口">
          {aiEntries.map(({ mode, view, label, description, icon: Icon }) => (
            <button
              type="button"
              key={`${mode}-${view ?? label}`}
              disabled={disabled}
              title={description ?? label}
              aria-label={description ? `${label}：${description}` : label}
              onClick={() => onOpenSource(mode, view ? { libraryView: view } : undefined)}
              data-track="/click/aiQuestionHome/openFlatEntry | 打开平铺添加入口 | source#STRING,resourceType#STRING"
            >
              <span className="document-layout-four-entry-icon"><Icon size={21} /></span>
              <span className="document-layout-four-entry-copy"><strong>{label}</strong></span>
            </button>
          ))}
        </div>
      </section>

      <section className="document-layout-four-group" aria-labelledby="personal-resource-title">
        <h2 id="personal-resource-title">个人资源</h2>
        <div className="document-layout-four-quick-links" aria-label="个人资源入口">
          <button type="button" disabled={disabled} onClick={onOpenMyResources} data-track="/click/aiQuestionHome/openMyResources | 打开我的资源 | 无"><span className="document-layout-four-entry-icon"><FolderHeart size={21} /></span><span className="document-layout-four-entry-copy"><strong>从我的资源选题</strong></span></button>
          <button type="button" disabled={disabled} onClick={onOpenRecentBrowse} data-track="/click/aiQuestionHome/openRecentBrowse | 打开最近浏览 | 无"><span className="document-layout-four-entry-icon"><RefreshCw size={21} /></span><span className="document-layout-four-entry-copy"><strong>继续最近浏览</strong></span></button>
        </div>
      </section>

      <section className="document-layout-four-recent-strip is-bottom" aria-label="最近编辑题单" data-sec="2">
        <header><Clock3 size={18} /><strong>最近编辑</strong></header>
        <div className="document-layout-four-recent-list">
          {historyPending ? Array.from({ length: 3 }, (_, index) => <span className="document-layout-four-recent-skeleton" key={index} aria-hidden="true" />)
            : historyStatus === 'error' ? (
              <div className="document-layout-four-recent-state is-error"><span>最近题单加载失败</span><MetisButton type="bordered" onClick={onReload}>重新加载</MetisButton></div>
            ) : recentDocuments.length ? recentDocuments.map((item) => (
              <button
                type="button"
                key={item.id}
                disabled={disabled}
                onClick={() => onOpenDocument(item.id)}
                data-track="/click/aiQuestionHome/openRecentDocument | 打开最近编辑题单 | documentId#STRING"
              >
                <strong>{item.title}</strong>
                <span className="document-layout-four-recent-meta"><Clock3 size={15} /><small>{item.updatedAt}</small><ChevronRight size={16} /></span>
              </button>
            )) : <div className="document-layout-four-recent-state">暂无最近题单</div>}
        </div>
      </section>
    </nav>
  )
}

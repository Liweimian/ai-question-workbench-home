import { useEffect, useMemo } from 'react'
import { MetisButton } from '@yuanfudao/metis-web-component'
import { FilePlus2, FileText, FolderHeart, Sparkles } from 'lucide-react'
import type {
  AsyncStatus,
  HistoryDocumentSummary,
  ResourceType,
  SourceRecord,
  WorkbenchDocument,
} from '../prototype/types'
import { LibraryPicker } from './LibraryPicker'

interface WorkbenchLandingPageProps {
  document: WorkbenchDocument
  histories: HistoryDocumentSummary[]
  historyStatus: AsyncStatus
  contentBusy: boolean
  resourceType: ResourceType
  sourceRecords: SourceRecord[]
  sourceListStatus: AsyncStatus
  sourceAddStatus: AsyncStatus
  onCreateNew: () => void
  onOpenResources: () => void
  onOpenDocument: (documentId: string) => void
  onReloadHistory: () => void
  onResourceTypeChange: (type: ResourceType) => void
  onAddSource: (type: ResourceType, sourceId: string, count: number) => void
}

const toCurrentSummary = (document: WorkbenchDocument): HistoryDocumentSummary => ({
  id: document.id,
  title: document.title.trim() || '未命名组题',
  gradeSubject: document.gradeSubject,
  questionCount: document.questions.length,
  updatedAt: document.updatedAt,
  status: '草稿',
  origin: '手工组题',
})

export function WorkbenchLandingPage(props: WorkbenchLandingPageProps) {
  const recentDocuments = useMemo(() => {
    const current = toCurrentSummary(props.document)
    return [current, ...props.histories.filter((item) => item.id !== current.id)]
  }, [props.document, props.histories])

  useEffect(() => {
    if (props.sourceListStatus === 'idle') props.onResourceTypeChange(props.resourceType)
  }, [props.onResourceTypeChange, props.resourceType, props.sourceListStatus])

  return (
    <section className="workbench-landing" aria-label="组题首页">
      <header className="landing-header" data-sec="1">
        <div className="landing-brand">
          <span><Sparkles size={17} /></span>
          <div><strong>李老师的组题空间</strong><small>初中数学 · 八年级上</small></div>
        </div>
        <div className="landing-actions">
          <MetisButton type="bordered" icon={<FolderHeart size={17} />} onClick={props.onOpenResources} data-track="/click/aiQuestionHome/openMyResources | 打开我的资源 | 无">我的资源</MetisButton>
          <MetisButton type="primary" icon={<FilePlus2 size={17} />} disabled={props.contentBusy} onClick={props.onCreateNew} data-track="/click/aiQuestionHome/createDocument | 新建组题 | 无">新建组题</MetisButton>
        </div>
      </header>

      <div className="landing-scroll">
        <main className="landing-content">
          <section className="landing-recent" data-sec="2">
            <div className="landing-section-heading">
              <div><h1>最近组题</h1><p>继续编辑最近使用的题单或试卷</p></div>
            </div>

            <div className="recent-document-grid">
              {recentDocuments.slice(0, 4).map((item, index) => (
                <button
                  type="button"
                  className="recent-document-card"
                  key={item.id}
                  disabled={props.contentBusy}
                  onClick={() => props.onOpenDocument(item.id)}
                  data-track="/click/aiQuestionHome/openRecentDocument | 打开最近组题 | documentId#STRING"
                >
                  <span className={`recent-document-icon preview-${index + 1}`} aria-hidden="true">
                    <FileText size={18} />
                  </span>
                  <span className="recent-document-copy">
                    <strong>{item.title}</strong>
                    <small>{item.questionCount} 题 · {item.status} · {item.updatedAt}</small>
                  </span>
                </button>
              ))}
              {props.historyStatus === 'loading' && recentDocuments.length < 4
                ? Array.from({ length: 4 - recentDocuments.length }, (_, index) => <span className="recent-document-skeleton" key={`skeleton-${index}`} />)
                : null}
            </div>

            {props.historyStatus === 'error' ? (
              <button type="button" className="landing-inline-retry" onClick={props.onReloadHistory}>最近组题加载失败，点击重试</button>
            ) : null}
          </section>

          <section className="landing-library" data-sec="3">
            <div className="landing-section-heading">
              <div><h2>飞象题库</h2><p>浏览资源并选题，内容会加入当前组题</p></div>
            </div>
            <LibraryPicker
              variant="home"
              libraryKind="fly"
              resourceType={props.resourceType}
              records={props.sourceRecords}
              listStatus={props.sourceListStatus}
              addStatus={props.sourceAddStatus}
              contentBusy={props.contentBusy}
              onResourceTypeChange={props.onResourceTypeChange}
              onAddSource={props.onAddSource}
            />
          </section>
        </main>
      </div>
    </section>
  )
}

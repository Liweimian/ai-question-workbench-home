import { useEffect, useMemo, useState } from 'react'
import { MetisButton } from '@yuanfudao/metis-web-component'
import { FileText, FolderHeart, Plus, Sparkles } from 'lucide-react'
import { formatDefaultDocumentTitle } from '../data/workbenchData'
import type {
  AsyncStatus,
  HistoryDocumentSummary,
  Question,
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
  onCreateNew: (scheme: 'classic' | 'split') => void
  onOpenResources: () => void
  onOpenDocument: (documentId: string) => void
  onReloadHistory: () => void
  onResourceTypeChange: (type: ResourceType) => void
  onAddSource: (type: ResourceType, sourceId: string, count: number, selectedQuestions?: Question[]) => Promise<boolean>
}

const toCurrentSummary = (document: WorkbenchDocument): HistoryDocumentSummary => ({
  id: document.id,
  title: document.title.trim() || formatDefaultDocumentTitle(),
  gradeSubject: document.gradeSubject,
  questionCount: document.questions.length,
  updatedAt: document.updatedAt,
  status: '草稿',
  origin: '手工组题',
})

export function WorkbenchLandingPage(props: WorkbenchLandingPageProps) {
  const [showAllResources, setShowAllResources] = useState(true)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
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
          <div><strong>飞象AI题库</strong><small>初中数学 · 八年级上</small></div>
        </div>
        <div className="landing-actions">
          <MetisButton type="bordered" icon={<FolderHeart size={17} />} onClick={props.onOpenResources} data-track="/click/aiQuestionHome/openMyResources | 打开我的资源 | 无">我的资源</MetisButton>
        </div>
      </header>

      <div className="landing-scroll">
        <main className="landing-content">
          <section className="landing-recent" data-sec="2">
            <div className="landing-section-heading">
              <div><h1>最近组题</h1></div>
            </div>

            <div className="recent-document-grid">
              <div className="recent-create-wrap">
                <button
                  type="button"
                  className="recent-create-card"
                  aria-label="新建组题"
                  title="新建组题"
                  aria-expanded={createMenuOpen}
                  disabled={props.contentBusy}
                  onClick={() => setCreateMenuOpen((open) => !open)}
                  data-track="/click/aiQuestionHome/createDocument | 新建组题 | 无"
                >
                  <Plus size={26} strokeWidth={1.8} />
                </button>
                {createMenuOpen ? (
                  <div className="create-scheme-menu" role="menu" aria-label="选择新建方案">
                    <button type="button" role="menuitem" onClick={() => { setCreateMenuOpen(false); props.onCreateNew('classic') }}>
                      <strong>方案一</strong><span>沉浸编辑，选题时使用大弹窗</span>
                    </button>
                    <button type="button" role="menuitem" onClick={() => { setCreateMenuOpen(false); props.onCreateNew('split') }}>
                      <strong>方案二</strong><span>题单与题库左右分屏，边选边看</span>
                    </button>
                  </div>
                ) : null}
              </div>
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
              <div><h2>精选</h2></div>
            </div>
            <LibraryPicker
              variant="home"
              libraryKind="fly"
              resourceType={props.resourceType}
              records={props.sourceRecords}
              listStatus={props.sourceListStatus}
              addStatus={props.sourceAddStatus}
              contentBusy={props.contentBusy}
              showAll={showAllResources}
              onShowAllChange={setShowAllResources}
              onResourceTypeChange={props.onResourceTypeChange}
              onAddSource={props.onAddSource}
            />
          </section>
        </main>
      </div>
    </section>
  )
}

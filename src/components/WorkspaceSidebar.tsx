import { MetisInput } from '@yuanfudao/metis-web-component'
import { ChevronsLeft, ChevronsRight, FilePlus2, FileText, FolderHeart, LoaderCircle, Search, Sparkles } from 'lucide-react'
import type { AsyncStatus, HistoryDocumentSummary, WorkbenchDocument } from '../prototype/types'

interface WorkspaceSidebarProps {
  collapsed: boolean
  document: WorkbenchDocument
  histories: HistoryDocumentSummary[]
  historyStatus: AsyncStatus
  query: string
  contentBusy: boolean
  onCollapsedChange: (collapsed: boolean) => void
  onQueryChange: (value: string) => void
  onCreateNew: () => void
  onOpenMyResources: () => void
  onOpenDocument: (documentId: string) => void
  onReload: () => void
}

export function WorkspaceSidebar(props: WorkspaceSidebarProps) {
  const normalized = props.query.trim().toLowerCase()
  const currentSummary: HistoryDocumentSummary = {
    id: props.document.id,
    title: props.document.title.trim() || '未命名题单',
    gradeSubject: props.document.gradeSubject,
    questionCount: props.document.questions.length,
    updatedAt: props.document.updatedAt,
    status: '草稿',
    origin: '手工组题',
  }
  const recentDocuments = [currentSummary, ...props.histories.filter((item) => item.id !== props.document.id)]
    .filter((item) => !normalized || item.title.toLowerCase().includes(normalized) || item.gradeSubject.toLowerCase().includes(normalized))
    .slice(0, 6)

  if (props.collapsed) {
    return (
      <aside className="workspace-space-nav is-collapsed" aria-label="组题空间导航">
        <button type="button" aria-label="展开组题空间" onClick={() => props.onCollapsedChange(false)}><ChevronsRight size={17} /></button>
        <button type="button" className="is-primary" aria-label="新建题单" disabled={props.contentBusy} onClick={props.onCreateNew}><FilePlus2 size={17} /></button>
        <button type="button" aria-label="我的资源" disabled={props.contentBusy} onClick={props.onOpenMyResources}><FolderHeart size={17} /></button>
      </aside>
    )
  }

  return (
    <aside className="workspace-space-nav" aria-label="组题空间导航">
      <header className="space-nav-heading">
        <span className="space-nav-logo"><Sparkles size={16} /></span>
        <div><strong>李老师的组题空间</strong><small>AI 题库</small></div>
        <button type="button" aria-label="收起组题空间" onClick={() => props.onCollapsedChange(true)}><ChevronsLeft size={16} /></button>
      </header>

      <nav className="space-nav-actions" aria-label="组题空间操作">
        <button type="button" className="is-primary" disabled={props.contentBusy} onClick={props.onCreateNew}><FilePlus2 size={16} /><span>新建题单</span></button>
        <button type="button" disabled={props.contentBusy} onClick={props.onOpenMyResources}><FolderHeart size={16} /><span>我的资源</span></button>
      </nav>

      <div className="space-nav-search">
        <Search size={14} />
        <MetisInput value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} placeholder="搜索题单" aria-label="搜索题单" />
      </div>

      <section className="space-nav-documents">
        <div className="space-nav-section-title"><strong>最近题单</strong><span>{recentDocuments.length}</span></div>
        {props.historyStatus === 'loading' ? <div className="space-nav-status"><LoaderCircle size={15} />正在加载</div> : null}
        {props.historyStatus === 'error' ? <button type="button" className="space-nav-status" onClick={props.onReload}>加载失败，点击重试</button> : null}
        {props.historyStatus !== 'loading' && recentDocuments.length === 0 ? <div className="space-nav-status">没有匹配的题单</div> : null}
        {props.historyStatus !== 'loading' ? recentDocuments.map((item) => {
          const current = item.id === props.document.id
          return (
            <button
              type="button"
              key={item.id}
              className={`space-document-item${current ? ' is-current' : ''}`}
              aria-current={current ? 'page' : undefined}
              disabled={props.contentBusy}
              onClick={() => { if (!current) props.onOpenDocument(item.id) }}
            >
              <FileText size={15} />
              <span><strong>{item.title}</strong><small>{item.questionCount} 题 · {item.updatedAt}</small></span>
            </button>
          )
        }) : null}
      </section>
    </aside>
  )
}

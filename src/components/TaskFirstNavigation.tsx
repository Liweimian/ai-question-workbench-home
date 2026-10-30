import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import {
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Clock3,
  FileInput,
  FileText,
  FolderHeart,
  Layers3,
  ListTree,
  RefreshCw,
  School,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'
import type { AddQuestionMode, AsyncStatus, HistoryDocumentSummary, LibraryInitialView, OpenAddOptions } from '../prototype/types'

interface TaskFirstNavigationProps {
  disabled?: boolean
  histories: HistoryDocumentSummary[]
  historyStatus: AsyncStatus
  onOpenDocument: (documentId: string) => void
  onOpenMyResources: () => void
  onOpenSource: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onReload: () => void
}

interface FlatEntry {
  description?: string
  icon: LucideIcon
  label: string
  mode: AddQuestionMode
  source: string
  view?: LibraryInitialView
}

const flatEntries: FlatEntry[] = [
  { mode: 'resource', view: 'chapter', label: '章节知识点选题', source: '飞象题库', icon: ListTree },
  { mode: 'resource', view: 'workbook', label: '练习册', source: '飞象题库', icon: BookOpen },
  { mode: 'resource', view: 'paper', label: '试卷', source: '飞象题库', icon: FileText },
  { mode: 'resource', view: 'sync', label: '同步练习', source: '飞象题库', icon: Layers3 },
  { mode: 'resource', view: 'special', label: '专题练习', source: '飞象题库', icon: Target },
  { mode: 'school', label: '校本题库', source: '校本资源', icon: School },
  { mode: 'upload', label: 'AI 录题', source: 'AI 工具', description: '上传 Word、PDF 或图片，识别并录入题目', icon: FileInput },
  { mode: 'create', label: 'AI 生题', source: 'AI 工具', description: '设置教材、知识点、难度和题量，生成几道新题', icon: Sparkles },
  { mode: 'compose', label: 'AI 组题', source: 'AI 工具', description: '说一句组题要求，从题库生成一整套题', icon: BrainCircuit },
]

export function TaskFirstNavigation({ disabled = false, histories, historyStatus, onOpenDocument, onOpenMyResources, onOpenSource, onReload }: TaskFirstNavigationProps) {
  const recentDocuments = histories.slice(0, 3)
  const historyPending = historyStatus === 'idle' || historyStatus === 'loading'

  return (
    <nav className="document-layout-four" aria-label="添加题目导航">
      <h1 data-sec="1">添加题目</h1>

      <section className="document-layout-four-flat-grid" aria-label="添加题目入口">
        {flatEntries.map(({ mode, view, label, source, description, icon: Icon }) => (
          <button
            type="button"
            key={`${mode}-${view ?? label}`}
            disabled={disabled}
            title={description ?? label}
            aria-label={description ? `${label}：${description}` : `${source}：${label}`}
            onClick={() => onOpenSource(mode, view ? { libraryView: view } : undefined)}
            data-track="/click/aiQuestionHome/openFlatEntry | 打开平铺添加入口 | source#STRING,resourceType#STRING"
          >
            <span className="document-layout-four-entry-icon"><Icon size={21} /></span>
            <span className="document-layout-four-entry-copy"><strong>{label}</strong></span>
          </button>
        ))}
      </section>

      <div className="document-layout-four-quick-links">
        <button type="button" disabled={disabled} onClick={onOpenMyResources} data-track="/click/aiQuestionHome/openMyResources | 打开我的资源 | 无"><span className="document-layout-four-entry-icon"><FolderHeart size={21} /></span><span className="document-layout-four-entry-copy"><strong>我的资源</strong></span></button>
        <button type="button" onClick={() => MetisMessage.info('近期浏览记录会在这里展示')} data-track="/click/aiQuestionHome/openRecentBrowse | 打开最近浏览 | 无"><span className="document-layout-four-entry-icon"><RefreshCw size={21} /></span><span className="document-layout-four-entry-copy"><strong>最近浏览</strong></span></button>
      </div>

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

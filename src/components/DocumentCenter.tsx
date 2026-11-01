import { MetisButton } from '@yuanfudao/metis-web-component'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BrainCircuit,
  BookOpen,
  FileInput,
  FileText,
  FolderHeart,
  ListTree,
  Layers3,
  LoaderCircle,
  RefreshCw,
  School,
  Sparkles,
  Target,
  Clock3,
  X,
} from 'lucide-react'
import type { AddQuestionMode, AsyncStatus, HistoryDocumentSummary, OpenAddOptions } from '../prototype/types'
import { FeixiangAiLibraryLogo } from './ElephantIcon'
import { formatRecentEditedMeta, selectRecentEditedSummaries } from '../utils/recentEditedDocuments'
import { isRecentEditedPanelClosed, setRecentEditedPanelClosed } from '../utils/recentEditedPanelPreference'

interface DocumentCenterProps {
  embedded?: boolean
  draftContent?: ReactNode
  histories: HistoryDocumentSummary[]
  historyStatus: AsyncStatus
  onOpenDocument: (documentId: string) => void
  onOpenMyResources: () => void
  onOpenSource: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onOpenRecentBrowse: () => void
  onReload: () => void
}

const aiTaskEntries: Array<{ mode: AddQuestionMode; label: string; description: string; icon: typeof BrainCircuit }> = [
  { mode: 'upload', label: '上传文件 AI 录题', description: '上传 Word、PDF 或图片，识别并录入题目', icon: FileInput },
  { mode: 'create', label: 'AI 出题', description: '设置教材、知识点、题型和题量，生成几道新题', icon: Sparkles },
  { mode: 'compose', label: 'AI 组题', description: '直接说作业或试卷要求，从题库配题组卷', icon: BrainCircuit },
]

export function DocumentCenter({ embedded = false, draftContent, histories, historyStatus, onOpenDocument, onOpenMyResources, onOpenSource, onOpenRecentBrowse, onReload }: DocumentCenterProps) {
  const [recentPanelClosed, setRecentPanelClosed] = useState(() => isRecentEditedPanelClosed())

  useEffect(() => {
    setRecentPanelClosed(isRecentEditedPanelClosed())
  }, [])

  const recentDocuments = useMemo(() => selectRecentEditedSummaries(histories), [histories])
  const hasRecentContent = historyStatus === 'error' || recentDocuments.length > 0
  const panelDismissed = recentPanelClosed || isRecentEditedPanelClosed()
  const showRecentPanel = hasRecentContent && !panelDismissed

  const closeRecentPanel = () => {
    setRecentEditedPanelClosed(true)
    setRecentPanelClosed(true)
  }

  const openRecentPanel = () => {
    setRecentEditedPanelClosed(false)
    setRecentPanelClosed(false)
  }

  const recentPanel = showRecentPanel ? (
    <section className="document-center-recent" aria-label="最近编辑">
      <div className="document-center-section-title">
        <div><h2>最近编辑</h2></div>
        <div className="document-center-section-actions">
          {recentDocuments.length ? <span>{recentDocuments.length} 份</span> : null}
          <button type="button" className="document-center-recent-close" aria-label="关闭最近编辑" onClick={closeRecentPanel}>
            <X size={16} />
          </button>
        </div>
      </div>
      {historyStatus === 'loading' ? (
        <div className="document-center-state"><LoaderCircle className="is-spinning" size={18} />正在加载最近题单…</div>
      ) : historyStatus === 'error' ? (
        <div className="document-center-state is-error"><span>最近题单加载失败</span><MetisButton type="bordered" onClick={onReload}>重新加载</MetisButton></div>
      ) : (
        <div className="document-center-list">
          {recentDocuments.map((item) => (
            <button type="button" className="document-recent-item" key={item.id} onClick={() => onOpenDocument(item.id)}>
              <span className="document-file-icon"><FileText size={22} /></span>
              <span className="document-recent-item-copy">
                <strong>{item.title}</strong>
                <small>{formatRecentEditedMeta(item)}</small>
              </span>
              <time>{item.updatedAt}</time>
            </button>
          ))}
        </div>
      )}
    </section>
  ) : null

  return (
    <div className={`document-center${embedded ? ' is-embedded' : ''} is-layout-2`}>
      <aside className="document-center-sidebar">
        {!embedded ? <div className="document-center-brand"><FeixiangAiLibraryLogo /><strong>AI 题单</strong></div> : null}
        <nav className="document-center-nav" aria-label="题单导航">
          <p>添加题目</p>
          <button type="button" className="is-library-task" onClick={() => onOpenSource('resource', { libraryView: 'chapter' })}><ListTree size={17} /><span>按章节/知识点选题</span></button>
          <button type="button" className="is-library-task" onClick={() => onOpenSource('resource', { libraryView: 'workbook' })}><BookOpen size={17} /><span>从练习册选题</span></button>
          <button type="button" className="is-library-task" onClick={() => onOpenSource('resource', { libraryView: 'paper' })}><FileText size={17} /><span>从试卷选题</span></button>
          <button type="button" className="is-library-task" onClick={() => onOpenSource('resource', { libraryView: 'sync' })}><Layers3 size={17} /><span>从同步练习选题</span></button>
          <button type="button" className="is-library-task" onClick={() => onOpenSource('resource', { libraryView: 'special' })}><Target size={17} /><span>从专题练习选题</span></button>
          <button type="button" className="is-library-task" onClick={() => onOpenSource('school')}><School size={17} /><span>从校本题库选题</span></button>
          {aiTaskEntries.map(({ mode, label, description, icon: Icon }) => (
            <button type="button" className="is-ai-task" key={mode} title={description} aria-label={label} onClick={() => onOpenSource(mode)}><Icon size={17} /><span>{label}</span></button>
          ))}
          <button type="button" className="is-personal-task" onClick={onOpenMyResources} data-track="/click/aiQuestionHome/openMyResources | 打开我的资源 | 无"><FolderHeart size={17} /><span>从我的资源选题</span></button>
          <button type="button" className="is-personal-task" onClick={onOpenRecentBrowse} data-track="/click/aiQuestionHome/openRecentBrowse | 打开最近浏览 | 无"><RefreshCw size={17} /><span>继续最近浏览</span></button>
          {hasRecentContent && panelDismissed ? (
            <button type="button" className="is-personal-task is-recent-edited-reopen" onClick={openRecentPanel}>
              <Clock3 size={17} /><span>最近编辑</span>
            </button>
          ) : null}
        </nav>
      </aside>

      <main className="document-center-main">
        <header className="document-center-heading">
          <div>{!embedded ? <span>题单工作台</span> : null}<h1>最近编辑</h1>{!embedded ? <p>继续上次的题单，或创建一份新题单。</p> : null}</div>
          {!embedded ? <MetisButton type="borderless" icon={<RefreshCw size={16} />} onClick={onReload}>刷新</MetisButton> : null}
        </header>

        <div className={`document-layout-two${showRecentPanel ? '' : ' is-recent-hidden'}`}>
          <div className="document-center-draft">{draftContent}</div>
          {recentPanel}
        </div>
      </main>
    </div>
  )
}

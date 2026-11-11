import { MetisButton } from '@yuanfudao/metis-web-component'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BrainCircuit,
  BookOpen,
  FileInput,
  FilePenLine,
  FileText,
  FolderHeart,
  ListTree,
  Layers3,
  LoaderCircle,
  RefreshCw,
  Search,
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

export interface DocumentCenterNavigationProps {
  activeKey?: DocumentCenterNavigationKey
  hasRecentContent?: boolean
  recentPanelDismissed?: boolean
  onOpenRecentPanel?: () => void
  onOpenMyResources: () => void
  onOpenSource: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onOpenAiSearch: () => void
  onOpenRecentBrowse: () => void
  onNavigate?: () => void
}

export type DocumentCenterNavigationKey =
  | 'chapter'
  | 'workbook'
  | 'paper'
  | 'sync'
  | 'special'
  | 'district'
  | 'school'
  | 'my-resources'
  | 'recent'
  | 'upload'
  | 'create'
  | 'compose'
  | 'ai-search'

interface DocumentCenterProps extends Omit<DocumentCenterNavigationProps, 'hasRecentContent' | 'recentPanelDismissed' | 'onOpenRecentPanel'> {
  embedded?: boolean
  draftContent?: ReactNode
  histories: HistoryDocumentSummary[]
  currentDocumentId?: string
  historyStatus: AsyncStatus
  onOpenDocument: (documentId: string) => void
  onOpenMyResources: () => void
  onOpenSource: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onOpenAiSearch: () => void
  onOpenRecentBrowse: () => void
  onReload: () => void
}

const aiTaskEntries: Array<{ mode: AddQuestionMode; label: string; description: string; icon: typeof BrainCircuit }> = [
  { mode: 'upload', label: '上传文件 AI 录题', description: '上传 Word、PDF 或图片，识别并录入题目', icon: FileInput },
  { mode: 'create', label: 'AI 出题', description: '生成题库中原本不存在的新题', icon: Sparkles },
  { mode: 'compose', label: 'AI 组题', description: '根据作业或试卷要求，从题库挑选并组合', icon: BrainCircuit },
]

const aiSearchDescription = '搜索题库中的已有题目、练习和试卷'

export function DocumentCenterNavigation({ activeKey, hasRecentContent = false, recentPanelDismissed = false, onOpenRecentPanel, onOpenMyResources, onOpenSource, onOpenAiSearch, onOpenRecentBrowse, onNavigate }: DocumentCenterNavigationProps) {
  const run = (action: () => void) => () => {
    onNavigate?.()
    action()
  }

  return (
    <nav className="document-center-nav" aria-label="添加题目导航">
      <div className="document-center-nav-title">添加题目</div>
      <section className="document-center-nav-group is-feixiang" aria-label="飞象资源">
        <button type="button" className={`is-library-task${activeKey === 'chapter' ? ' is-active' : ''}`} onClick={run(() => onOpenSource('resource', { libraryView: 'chapter' }))}><ListTree size={17} /><span>按章节/知识点选题</span></button>
        <button type="button" className={`is-library-task${activeKey === 'sync' ? ' is-active' : ''}`} onClick={run(() => onOpenSource('resource', { libraryView: 'sync' }))}><Layers3 size={17} /><span>从同步练习选题</span></button>
        <button type="button" className={`is-library-task${activeKey === 'workbook' ? ' is-active' : ''}`} onClick={run(() => onOpenSource('resource', { libraryView: 'workbook' }))}><BookOpen size={17} /><span>从练习册选题</span></button>
        <button type="button" className={`is-library-task${activeKey === 'special' ? ' is-active' : ''}`} onClick={run(() => onOpenSource('resource', { libraryView: 'special' }))}><Target size={17} /><span>从专题练习选题</span></button>
        <button type="button" className={`is-library-task${activeKey === 'paper' ? ' is-active' : ''}`} onClick={run(() => onOpenSource('resource', { libraryView: 'paper' }))}><FileText size={17} /><span>从试卷选题</span></button>
      </section>
      <section className="document-center-nav-group is-school" aria-label="区本与校本资源">
        <button type="button" className={`is-library-task${activeKey === 'district' ? ' is-active' : ''}`} onClick={run(() => onOpenSource('district'))}><School size={17} /><span>从区本题库选题</span></button>
        <button type="button" className={`is-library-task${activeKey === 'school' ? ' is-active' : ''}`} onClick={run(() => onOpenSource('school'))}><School size={17} /><span>从校本题库选题</span></button>
      </section>
      <section className="document-center-nav-group is-ai" aria-label="AI 工具">
        {aiTaskEntries.map(({ mode, label, description, icon: Icon }) => (
          <button type="button" className={`is-ai-task${activeKey === mode ? ' is-active' : ''}`} key={mode} title={description} aria-label={label} onClick={run(() => onOpenSource(mode))}><Icon size={17} /><span>{label}</span></button>
        ))}
        <button type="button" className={`is-ai-task${activeKey === 'ai-search' ? ' is-active' : ''}`} title={aiSearchDescription} aria-label="AI智搜" onClick={run(onOpenAiSearch)} data-track="/click/aiQuestionHome/openAiSearch | 打开AI智搜 | 无"><Search size={17} /><span>AI智搜</span></button>
      </section>
      <section className="document-center-nav-group is-personal" aria-label="个人资源">
        <button type="button" className={`is-personal-task${activeKey === 'my-resources' ? ' is-active' : ''}`} onClick={run(onOpenMyResources)} data-track="/click/aiQuestionHome/openMyResources | 打开我的资源 | 无"><FolderHeart size={17} /><span>从我的资源选题</span></button>
        <button type="button" className={`is-personal-task${activeKey === 'recent' ? ' is-active' : ''}`} onClick={run(onOpenRecentBrowse)} data-track="/click/aiQuestionHome/openRecentBrowse | 打开最近浏览 | 无"><RefreshCw size={17} /><span>继续最近浏览</span></button>
        {hasRecentContent && recentPanelDismissed && onOpenRecentPanel ? (
          <button type="button" className="is-personal-task is-recent-edited-reopen" onClick={run(onOpenRecentPanel)}><Clock3 size={17} /><span>最近编辑</span></button>
        ) : null}
      </section>
    </nav>
  )
}

interface DocumentCenterIconNavigationProps extends Omit<DocumentCenterNavigationProps, 'hasRecentContent' | 'recentPanelDismissed' | 'onOpenRecentPanel' | 'onNavigate'> {
  activeKey?: DocumentCenterNavigationKey
  onExpand?: () => void
}

export function DocumentCenterIconNavigation({ activeKey, onExpand, onOpenMyResources, onOpenSource, onOpenAiSearch, onOpenRecentBrowse }: DocumentCenterIconNavigationProps) {
  const item = (key: DocumentCenterNavigationKey, label: string, shortLabel: ReactNode, icon: ReactNode, action: () => void, description?: string) => (
    <button
      key={key}
      type="button"
      className={`source-navigation-icon-button${activeKey === key ? ' is-active' : ''}`}
      aria-label={label}
      title={description ?? label}
      aria-current={activeKey === key ? 'page' : undefined}
      data-tooltip={description ? `${label}：${description}` : label}
      onClick={() => activeKey === key && onExpand ? onExpand() : action()}
    >
      <span className="source-navigation-short-icon" aria-hidden="true">{icon}</span>
      <span className="source-navigation-short-label">{shortLabel}</span>
    </button>
  )

  return (
    <nav className="source-navigation-icon-nav" aria-label="添加题目快捷导航">
      <section className="is-feixiang" aria-label="飞象资源">
        {item('chapter', '章节/知识点选题', <>章节<br />知识点</>, <ListTree size={16} />, () => onOpenSource('resource', { libraryView: 'chapter' }))}
        {item('sync', '同步练习选题', '同步', <Layers3 size={16} />, () => onOpenSource('resource', { libraryView: 'sync' }))}
        {item('workbook', '练习册选题', '练习册', <BookOpen size={16} />, () => onOpenSource('resource', { libraryView: 'workbook' }))}
        {item('special', '专题练习选题', '专题', <Target size={16} />, () => onOpenSource('resource', { libraryView: 'special' }))}
        {item('paper', '试卷选题', '试卷', <FileText size={16} />, () => onOpenSource('resource', { libraryView: 'paper' }))}
      </section>
      <section className="is-school" aria-label="区本与校本资源">
        {item('district', '区本题库选题', '区本', <School size={16} />, () => onOpenSource('district'))}
        {item('school', '校本题库选题', '校本', <School size={16} />, () => onOpenSource('school'))}
      </section>
      <section className="is-ai" aria-label="AI 工具">
        {item('upload', '上传文件 AI 录题', '录题', <FileInput size={16} />, () => onOpenSource('upload'), '上传 Word、PDF 或图片，识别并录入题目')}
        {item('create', 'AI 出题', '出题', <Sparkles size={16} />, () => onOpenSource('create'), '生成题库中原本不存在的新题')}
        {item('compose', 'AI 组题', '组题', <BrainCircuit size={16} />, () => onOpenSource('compose'), '根据作业或试卷要求，从题库挑选并组合')}
        {item('ai-search', 'AI智搜', '智搜', <Search size={16} />, onOpenAiSearch, aiSearchDescription)}
      </section>
      <section className="is-personal" aria-label="个人资源">
        {item('my-resources', '我的资源选题', '我的', <FolderHeart size={16} />, onOpenMyResources)}
        {item('recent', '最近浏览', '最近', <RefreshCw size={16} />, onOpenRecentBrowse)}
      </section>
    </nav>
  )
}

export function DocumentCenter({ embedded = false, draftContent, histories, currentDocumentId, historyStatus, onOpenDocument, onOpenMyResources, onOpenSource, onOpenAiSearch, onOpenRecentBrowse, onNavigate, onReload }: DocumentCenterProps) {
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
          {recentDocuments.map((item) => {
            const editing = item.id === currentDocumentId
            return (
            <button type="button" className={`document-recent-item${editing ? ' is-editing' : ''}`} key={item.id} onClick={() => onOpenDocument(item.id)} aria-current={editing ? 'true' : undefined}>
              <span className="document-file-icon" title={editing ? '正在编辑' : undefined}>{editing ? <FilePenLine size={22} /> : <FileText size={22} />}</span>
              <span className="document-recent-item-copy">
                <span className="document-recent-item-title">
                  <strong>{item.title}</strong>
                  {editing ? <em className="document-editing-label">正在编辑</em> : null}
                </span>
                <small>{formatRecentEditedMeta(item)}</small>
              </span>
              <time>{item.updatedAt}</time>
            </button>
            )
          })}
        </div>
      )}
    </section>
  ) : null

  return (
    <div className={`document-center${embedded ? ' is-embedded' : ''} is-layout-2`}>
      <aside className="document-center-sidebar">
        {!embedded ? <div className="document-center-brand"><FeixiangAiLibraryLogo /><strong>AI 题单</strong></div> : null}
        <DocumentCenterNavigation
          hasRecentContent={hasRecentContent}
          recentPanelDismissed={panelDismissed}
          onOpenRecentPanel={openRecentPanel}
          onOpenMyResources={onOpenMyResources}
          onOpenSource={onOpenSource}
          onOpenAiSearch={onOpenAiSearch}
          onOpenRecentBrowse={onOpenRecentBrowse}
          onNavigate={onNavigate}
        />
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

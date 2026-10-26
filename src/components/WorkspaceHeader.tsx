import { useEffect, useMemo, useRef, useState } from 'react'
import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import {
  ChevronRight,
  Clock3,
  FileDown,
  FilePlus2,
  LoaderCircle,
  MoreHorizontal,
  PanelRightOpen,
  Save,
  Send,
  Sparkles,
  Undo2,
} from 'lucide-react'
import type { AsyncStatus, DocumentStatus, DocumentSyncState, HistoryDocumentSummary } from '../prototype/types'

interface WorkspaceHeaderProps {
  documentId: string
  documentTitle: string
  questionCount: number
  canSave: boolean
  canUndo: boolean
  contentBusy: boolean
  documentStatus: DocumentStatus
  syncState: DocumentSyncState
  assignmentOutdated: boolean
  histories: HistoryDocumentSummary[]
  historyStatus: AsyncStatus
  onUndo: () => void
  onCreateNew: () => void
  onSave: () => void
  onAssign: () => void
  onOpenDocument: (documentId: string) => void
  onReloadHistory: () => void
  onOpenAllDocuments: () => void
  sidePanelOpen: boolean
  onSidePanelOpen: () => void
}

export function WorkspaceHeader({
  documentId,
  documentTitle,
  questionCount,
  canSave,
  canUndo,
  contentBusy,
  documentStatus,
  syncState,
  assignmentOutdated,
  histories,
  historyStatus,
  onUndo,
  onCreateNew,
  onSave,
  onAssign,
  onOpenDocument,
  onReloadHistory,
  onOpenAllDocuments,
  sidePanelOpen,
  onSidePanelOpen,
}: WorkspaceHeaderProps) {
  const hasQuestions = questionCount > 0
  const [recentOpen, setRecentOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const recentRef = useRef<HTMLDivElement>(null)
  const assignRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  const recentDocuments = useMemo(
    () => histories.filter((item) => item.id !== documentId).slice(0, 5),
    [documentId, histories],
  )

  const syncLabel = syncState === 'saving'
    ? '正在保存…'
    : syncState === 'dirty'
      ? '有未保存修改'
      : syncState === 'error'
        ? '保存失败'
        : documentStatus === '已布置'
          ? assignmentOutdated ? '已布置 · 有新修改' : '已布置'
          : documentStatus === '已保存'
            ? '题单已保存'
            : syncState === 'saved'
              ? '草稿已自动保存'
              : '尚未保存'

  useEffect(() => {
    if (!recentOpen && !assignOpen && !moreOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!recentRef.current?.contains(target)) setRecentOpen(false)
      if (!assignRef.current?.contains(target)) setAssignOpen(false)
      if (!moreRef.current?.contains(target)) setMoreOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setRecentOpen(false)
      setAssignOpen(false)
      setMoreOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [assignOpen, moreOpen, recentOpen])

  const exportDocument = () => {
    if (!hasQuestions) {
      MetisMessage.error('请先添加题目')
      return
    }
    MetisMessage.success('已生成打印 / PDF 预览（原型演示）')
  }

  return (
    <header className={`fx-page-header workspace-header${sidePanelOpen ? ' is-split' : ''}`} data-sec="1">
      <div className="header-workbench-brand" aria-label="飞象AI题库">
        <span className="header-workbench-mark"><Sparkles size={17} /></span>
        <div><strong>飞象AI题库</strong></div>
        <span className="header-document-state" title={`${documentTitle || '未命名组题'} · ${syncLabel}`}>
          <span className="header-current-document">{documentTitle?.trim() || '未命名组题'}</span>
          <small className={`header-sync-state is-${syncState}`}>{syncLabel}</small>
        </span>
      </div>
      <div className="header-actions">
        {!sidePanelOpen ? (
          <MetisButton
            type="bordered"
            icon={<PanelRightOpen size={17} />}
            onClick={onSidePanelOpen}
            data-track="/click/aiQuestionHome/openCompositionHub | 打开添加题目工作区 | 无"
          >添加题目</MetisButton>
        ) : null}
        <div className="header-recent" ref={recentRef}>
          <MetisButton
            type="borderless"
            icon={<Clock3 size={17} />}
            aria-expanded={recentOpen}
            onClick={() => {
              setRecentOpen((open) => !open)
              setAssignOpen(false)
              setMoreOpen(false)
            }}
            data-track="/click/aiQuestionHome/recentDocuments | 打开最近题单 | 无"
          >最近题单</MetisButton>
          {recentOpen ? (
            <div className="header-recent-menu" role="dialog" aria-label="最近题单">
              <div className="header-recent-title"><strong>最近题单</strong><span>自动保存的题稿也会出现在这里</span></div>
              <div className="header-recent-list">
                <button type="button" className="is-current" disabled>
                  <span><strong>{documentTitle?.trim() || '未命名组题'}</strong><small>{questionCount} 道题 · {syncLabel}</small></span>
                  <em>正在编辑</em>
                </button>
                {historyStatus === 'loading' ? (
                  <div className="header-recent-state"><LoaderCircle size={15} />正在加载最近题单…</div>
                ) : historyStatus === 'error' ? (
                  <div className="header-recent-state is-error"><span>最近题单加载失败</span><button type="button" onClick={onReloadHistory}>重新加载</button></div>
                ) : recentDocuments.length ? recentDocuments.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    disabled={contentBusy || syncState === 'saving' || syncState === 'dirty'}
                    onClick={() => {
                      onOpenDocument(item.id)
                      setRecentOpen(false)
                    }}
                  >
                    <span><strong>{item.title}</strong><small>{item.questionCount} 道题 · {item.status} · {item.updatedAt}</small></span>
                    <ChevronRight size={15} />
                  </button>
                )) : <div className="header-recent-state">暂无最近题单</div>}
              </div>
              <button type="button" className="header-recent-all" disabled={contentBusy || syncState === 'saving' || syncState === 'dirty'} onClick={() => { onOpenAllDocuments(); setRecentOpen(false) }}>查看全部题单<ChevronRight size={14} /></button>
            </div>
          ) : null}
        </div>
        <MetisButton
          type="borderless"
          icon={<FilePlus2 size={17} />}
          disabled={contentBusy || syncState === 'saving' || syncState === 'dirty'}
          onClick={onCreateNew}
          data-track="/click/aiQuestionHome/createBlank | 新建空白题单 | 无"
        >新建</MetisButton>
        <MetisButton
          type="borderless"
          icon={syncState === 'saving' ? <LoaderCircle className="is-spinning" size={17} /> : <Save size={17} />}
          disabled={!canSave || syncState === 'saving' || contentBusy}
          onClick={onSave}
          data-track="/click/aiQuestionHome/save | 保存当前草稿 | 无"
        >{syncState === 'saving' ? '保存中' : '保存'}</MetisButton>
        <div className="header-assign" ref={assignRef}>
          <MetisButton
            type="borderless"
            icon={<Send size={17} />}
            disabled={!hasQuestions || syncState === 'saving' || contentBusy}
            aria-expanded={assignOpen}
            onClick={() => {
              setAssignOpen((open) => !open)
              setRecentOpen(false)
              setMoreOpen(false)
            }}
            data-track="/click/aiQuestionHome/assign | 布置当前内容 | 无"
          >{assignmentOutdated ? '更新布置' : '布置'}</MetisButton>
          {assignOpen ? (
            <div className="header-assign-menu" role="dialog" aria-label="确认布置题单">
              <strong>{assignmentOutdated ? '确认更新布置' : '确认布置题单'}</strong>
              <span>{assignmentOutdated ? `将保存 ${questionCount} 道题的最新修改，并更新已布置版本。` : `当前共 ${questionCount} 道题，确认后将保存最新内容并进入布置状态。`}</span>
              <div><button type="button" onClick={() => setAssignOpen(false)}>取消</button><button type="button" className="is-primary" onClick={() => { onAssign(); setAssignOpen(false) }}>确认布置</button></div>
            </div>
          ) : null}
        </div>
        <div className="header-more" ref={moreRef}>
          <MetisButton
            type="borderless"
            icon={<MoreHorizontal size={18} />}
            aria-label="更多操作"
            aria-expanded={moreOpen}
            onClick={() => {
              setMoreOpen((open) => !open)
              setRecentOpen(false)
              setAssignOpen(false)
            }}
          />
          {moreOpen ? (
            <div className="header-more-menu" role="menu" aria-label="更多题单操作">
              <button type="button" role="menuitem" disabled={!canUndo} onClick={() => { onUndo(); setMoreOpen(false) }} data-track="/click/aiQuestionHome/undo | 撤销上一步 | 无"><Undo2 size={16} /><span>撤销</span></button>
              <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { exportDocument(); setMoreOpen(false) }} data-track="/click/aiQuestionHome/export | 打印或导出PDF | 无"><FileDown size={16} /><span>打印 / PDF</span></button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

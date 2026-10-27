import { useEffect, useMemo, useRef, useState } from 'react'
import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import {
  ChevronRight,
  Clock3,
  Download,
  FileDown,
  LoaderCircle,
  Maximize2,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Save,
  Send,
  Share2,
  Undo2,
} from 'lucide-react'
import { formatDefaultDocumentTitle } from '../data/workbenchData'
import type { AsyncStatus, DocumentStatus, DocumentSyncState, HistoryDocumentSummary } from '../prototype/types'
import { ElephantIcon } from './ElephantIcon'

interface WorkspaceHeaderProps {
  documentId: string
  documentTitle: string
  documentUpdatedAt: string
  questionCount: number
  canSave: boolean
  canUndo: boolean
  contentBusy: boolean
  documentStatus: DocumentStatus
  syncState: DocumentSyncState
  assignmentOutdated: boolean
  hasPersistedDraft: boolean
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
  onEnterEdit: () => void
  draftCollapsed: boolean
  onDraftCollapse: () => void
  onDraftExpand: () => void
}

export function WorkspaceHeader({
  documentId,
  documentTitle,
  documentUpdatedAt,
  questionCount,
  canSave,
  canUndo,
  contentBusy,
  documentStatus,
  syncState,
  assignmentOutdated,
  hasPersistedDraft,
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
  onEnterEdit,
  draftCollapsed,
  onDraftCollapse,
  onDraftExpand,
}: WorkspaceHeaderProps) {
  const hasQuestions = questionCount > 0
  const fallbackTitle = formatDefaultDocumentTitle()
  const [recentOpen, setRecentOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
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
              : hasPersistedDraft
                ? '草稿已保存'
                : '尚未保存'

  useEffect(() => {
    if (syncState !== 'saved') return
    setLastSavedAt(new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()))
  }, [syncState])

  const saveSummary = syncState === 'saving'
    ? '保存中…'
    : syncState === 'dirty'
      ? hasPersistedDraft ? `未保存 · 最后保存 ${lastSavedAt ?? documentUpdatedAt}` : '未保存'
      : lastSavedAt
        ? `最后保存 ${lastSavedAt}`
        : hasPersistedDraft
          ? `最后保存 ${documentUpdatedAt}`
          : '未保存'

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

  useEffect(() => {
    if (draftCollapsed) setRecentOpen(false)
  }, [draftCollapsed])

  const exportDocument = () => {
    if (!hasQuestions) {
      MetisMessage.error('请先添加题目')
      return
    }
    MetisMessage.success('已生成打印 / PDF 预览（原型演示）')
  }

  const downloadWord = () => {
    if (!hasQuestions) return MetisMessage.error('请先添加题目')
    const safeTitle = (documentTitle?.trim() || fallbackTitle).replace(/[\\/:*?"<>|]/g, '-')
    const wordHtml = `<html><meta charset="utf-8"><body><h1>${safeTitle}</h1><p>共 ${questionCount} 道题</p></body></html>`
    const url = URL.createObjectURL(new Blob([wordHtml], { type: 'application/msword' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${safeTitle}.doc`
    anchor.click()
    URL.revokeObjectURL(url)
    MetisMessage.success('Word 已开始下载')
  }

  const shareDocument = async () => {
    if (!hasQuestions) return MetisMessage.error('请先添加题目')
    const shareText = `${documentTitle?.trim() || fallbackTitle}（共 ${questionCount} 道题）`
    try {
      await navigator.clipboard.writeText(shareText)
      MetisMessage.success('题单分享信息已复制')
    } catch {
      MetisMessage.info('分享面板已打开（原型演示）')
    }
  }

  return (
    <header className={`fx-page-header workspace-header${sidePanelOpen ? ' is-split' : ''}${draftCollapsed ? ' is-draft-collapsed' : ''}`} data-sec="1">
      {draftCollapsed ? (
        <MetisButton
          type="borderless"
          icon={<PanelRightOpen size={18} />}
          aria-label="展开组题画布"
          title="展开组题画布"
          onClick={onDraftExpand}
        />
      ) : (
      <>
      <div className="header-workbench-brand" aria-label="当前题单">
        <span className="header-workbench-mark"><ElephantIcon /></span>
        <div className="header-title-summary" title={`${documentTitle || fallbackTitle} · ${syncLabel}`}>
          <strong>{documentTitle?.trim() || fallbackTitle}</strong>
          <small className="header-save-summary">{saveSummary}</small>
        </div>
      </div>
      <div className="header-actions">
        {!sidePanelOpen ? (
          <MetisButton
            type="bordered"
            icon={<PanelRightOpen size={17} />}
            aria-label="展开题库选题"
            title="展开题库选题"
            onClick={onSidePanelOpen}
            data-track="/click/aiQuestionHome/openCompositionHub | 打开添加题目工作区 | 无"
          >展开题库选题</MetisButton>
        ) : null}
        <div className="header-recent header-icon-action" data-tooltip="最近编辑" ref={recentRef}>
          <MetisButton
            type="borderless"
            icon={<Clock3 size={17} />}
            aria-label="最近编辑"
            title="最近编辑"
            aria-expanded={recentOpen}
            onClick={() => {
              setRecentOpen((open) => !open)
              setAssignOpen(false)
              setMoreOpen(false)
            }}
            data-track="/click/aiQuestionHome/recentDocuments | 打开最近编辑 | 无"
          />
          {recentOpen ? (
            <div className="header-recent-menu" role="dialog" aria-label="最近编辑">
              <div className="header-recent-title"><strong>最近编辑</strong><span>快速切换题单</span></div>
              <div className="header-recent-list">
                <button type="button" className="is-current" disabled>
                  <span><strong>{documentTitle?.trim() || fallbackTitle}</strong><small>{questionCount} 道题 · {syncLabel}</small></span>
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
                )) : <div className="header-recent-state">暂无最近编辑</div>}
              </div>
              <button type="button" className="header-recent-all" disabled={contentBusy || syncState === 'saving' || syncState === 'dirty'} onClick={() => { onOpenAllDocuments(); setRecentOpen(false) }}>查看全部题单<ChevronRight size={14} /></button>
            </div>
          ) : null}
        </div>
        <span className="header-icon-action" data-tooltip="新建题单">
          <MetisButton
            type="borderless"
            icon={<Plus size={18} />}
            aria-label="新建题单"
            disabled={contentBusy || syncState === 'saving' || syncState === 'dirty'}
            onClick={() => { setRecentOpen(false); onCreateNew() }}
            data-track="/click/aiQuestionHome/createBlank | 新建空白题单 | 无"
          />
        </span>
        <span className="header-icon-action" data-tooltip={syncState === 'saving' ? '保存中' : '保存题单'}>
          <MetisButton
            type="borderless"
            icon={syncState === 'saving' ? <LoaderCircle className="is-spinning" size={17} /> : <Save size={17} />}
            aria-label={syncState === 'saving' ? '保存中' : '保存题单'}
            disabled={!canSave || syncState === 'saving' || contentBusy}
            onClick={onSave}
            data-track="/click/aiQuestionHome/save | 保存当前草稿 | 无"
          />
        </span>
        <div className="header-assign header-icon-action" data-tooltip={assignmentOutdated ? '更新布置' : '布置题单'} ref={assignRef}>
          <MetisButton
            type="borderless"
            icon={<Send size={17} />}
            aria-label={assignmentOutdated ? '更新布置' : '布置题单'}
            title={assignmentOutdated ? '更新布置' : '布置题单'}
            disabled={!hasQuestions || syncState === 'saving' || contentBusy}
            aria-expanded={assignOpen}
            onClick={() => {
              setAssignOpen((open) => !open)
              setRecentOpen(false)
              setMoreOpen(false)
            }}
            data-track="/click/aiQuestionHome/assign | 布置当前内容 | 无"
          />
          {assignOpen ? (
            <div className="header-assign-menu" role="dialog" aria-label="确认布置题单">
              <strong>{assignmentOutdated ? '确认更新布置' : '确认布置题单'}</strong>
              <span>{assignmentOutdated ? `将保存 ${questionCount} 道题的最新修改，并更新已布置版本。` : `当前共 ${questionCount} 道题，确认后将保存最新内容并进入布置状态。`}</span>
              <div><button type="button" onClick={() => setAssignOpen(false)}>取消</button><button type="button" className="is-primary" onClick={() => { onAssign(); setAssignOpen(false) }}>确认布置</button></div>
            </div>
          ) : null}
        </div>
        <span className="header-icon-action" data-tooltip="展开编辑">
          <MetisButton
            type="borderless"
            icon={<Maximize2 size={17} />}
            aria-label="展开编辑"
            onClick={() => {
              setRecentOpen(false)
              setAssignOpen(false)
              setMoreOpen(false)
              onEnterEdit()
            }}
            data-track="/click/aiQuestionHome/enterFocusEditor | 展开题单编辑 | 无"
          />
        </span>
        <div className="header-more header-icon-action" data-tooltip="更多" ref={moreRef}>
          <MetisButton
            type="borderless"
            icon={<MoreHorizontal size={18} />}
            aria-label="更多"
            title="更多"
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
              <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { downloadWord(); setMoreOpen(false) }} data-track="/click/aiQuestionHome/downloadWord | 下载Word | 无"><Download size={16} /><span>下载 Word</span></button>
              <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { void shareDocument(); setMoreOpen(false) }} data-track="/click/aiQuestionHome/share | 分享题单 | 无"><Share2 size={16} /><span>分享</span></button>
              <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { exportDocument(); setMoreOpen(false) }} data-track="/click/aiQuestionHome/export | 打印或导出PDF | 无"><FileDown size={16} /><span>打印 / PDF</span></button>
            </div>
          ) : null}
        </div>
        {sidePanelOpen ? (
          <MetisButton
            type="borderless"
            icon={<PanelRightClose size={17} />}
            aria-label="收起组题画布"
            title="收起组题画布，扩大左侧浏览区"
            onClick={() => { setRecentOpen(false); onDraftCollapse() }}
          />
        ) : null}
      </div>
      </>
      )}
    </header>
  )
}

import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import {
  FileDown,
  FilePlus2,
  LoaderCircle,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Send,
  Sparkles,
  Undo2,
} from 'lucide-react'
import type { DocumentStatus, DocumentSyncState } from '../prototype/types'

interface WorkspaceHeaderProps {
  documentTitle: string
  questionCount: number
  canSave: boolean
  canUndo: boolean
  contentBusy: boolean
  documentStatus: DocumentStatus
  syncState: DocumentSyncState
  assignmentOutdated: boolean
  hasPersistedDraft: boolean
  onUndo: () => void
  onCreateNew: () => void
  onSave: () => void
  onAssign: () => void
  sidePanelOpen: boolean
  onSidePanelOpen: () => void
  draftCollapsed: boolean
  onDraftCollapse: () => void
  onDraftExpand: () => void
}

export function WorkspaceHeader({
  documentTitle,
  questionCount,
  canSave,
  canUndo,
  contentBusy,
  documentStatus,
  syncState,
  assignmentOutdated,
  hasPersistedDraft,
  onUndo,
  onCreateNew,
  onSave,
  onAssign,
  sidePanelOpen,
  onSidePanelOpen,
  draftCollapsed,
  onDraftCollapse,
  onDraftExpand,
}: WorkspaceHeaderProps) {
  const hasQuestions = questionCount > 0
  const [assignOpen, setAssignOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const assignRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

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
    if (!assignOpen && !moreOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!assignRef.current?.contains(target)) setAssignOpen(false)
      if (!moreRef.current?.contains(target)) setMoreOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setAssignOpen(false)
      setMoreOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [assignOpen, moreOpen])

  const exportDocument = () => {
    if (!hasQuestions) {
      MetisMessage.error('请先添加题目')
      return
    }
    MetisMessage.success('已生成打印 / PDF 预览（原型演示）')
  }

  return (
    <header className={`fx-page-header workspace-header${sidePanelOpen ? ' is-split' : ''}${draftCollapsed ? ' is-draft-collapsed' : ''}`} data-sec="1">
      {draftCollapsed ? (
        <MetisButton
          type="borderless"
          icon={<PanelRightOpen size={18} />}
          aria-label="展开题稿"
          title="展开题稿"
          onClick={onDraftExpand}
        />
      ) : (
      <>
      <div className="header-workbench-brand" aria-label="飞象AI题库">
        <span className="header-workbench-mark"><Sparkles size={17} /></span>
        <div><strong>飞象AI题库</strong></div>
        <span className="header-document-state" title={`${documentTitle || '未命名组题'} · ${syncLabel}`}>
          <span className="header-current-document">{documentTitle?.trim() || '未命名组题'}</span>
          <small className={`header-sync-state is-${syncState}`}>{syncLabel}</small>
        </span>
      </div>
      <div className="header-actions">
        {sidePanelOpen ? (
          <MetisButton
            type="borderless"
            icon={<PanelRightClose size={17} />}
            aria-label="收起题稿"
            title="收起题稿，扩大左侧浏览区"
            onClick={onDraftCollapse}
          />
        ) : null}
        {!sidePanelOpen ? (
          <MetisButton
            type="bordered"
            icon={<PanelRightOpen size={17} />}
            onClick={onSidePanelOpen}
            data-track="/click/aiQuestionHome/openCompositionHub | 打开添加题目工作区 | 无"
          >添加题目</MetisButton>
        ) : null}
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
      </>
      )}
    </header>
  )
}

import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import {
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
import type { DocumentOutputLock, DocumentStatus, DocumentSyncState, WorkbenchDocumentKind } from '../prototype/types'
import { ElephantIcon } from './ElephantIcon'
import { SaveAsDialog } from './SaveAsDialog'
import { EditorStudioFooter } from './EditorStudioFooter'
import type { WorkbenchDocument } from '../prototype/types'

interface WorkspaceHeaderProps {
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
  onUndo: () => void
  onCreateNew: () => void
  onSave: (kind?: WorkbenchDocumentKind) => void | Promise<boolean | void>
  onSaveAndCreateNew?: () => Promise<boolean>
  hasUnsavedChanges?: boolean
  onAssign: () => void
  onMarkOutput?: (lock: DocumentOutputLock) => void
  sidePanelOpen: boolean
  onSidePanelOpen: () => void
  onEnterEdit: () => void
  studioEditorOpen?: boolean
  studioDocument?: WorkbenchDocument
  onStudioSave?: () => void
  onStudioAssign?: () => void
  onStudioGenerateAnswerSheet?: () => void
  onRequirePaperScores?: (action: 'assign' | 'download' | 'print') => boolean
  draftCollapsed: boolean
  onDraftCollapse: () => void
  onDraftExpand: () => void
}

export function WorkspaceHeader({
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
  onUndo,
  onCreateNew,
  onSave,
  onSaveAndCreateNew,
  hasUnsavedChanges = false,
  onAssign,
  onMarkOutput,
  sidePanelOpen,
  onSidePanelOpen,
  onEnterEdit,
  studioEditorOpen = false,
  studioDocument,
  onStudioSave,
  onStudioAssign,
  onStudioGenerateAnswerSheet,
  onRequirePaperScores,
  draftCollapsed,
  onDraftCollapse,
  onDraftExpand,
}: WorkspaceHeaderProps) {
  const hasQuestions = questionCount > 0
  const fallbackTitle = formatDefaultDocumentTitle()
  const [assignOpen, setAssignOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [newDocumentDialogOpen, setNewDocumentDialogOpen] = useState(false)
  const [saveBeforeNewPending, setSaveBeforeNewPending] = useState(false)
  const [saveAsDialogOpen, setSaveAsDialogOpen] = useState(false)
  const [saveAsPending, setSaveAsPending] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const assignRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const saveRef = useRef<HTMLSpanElement>(null)
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
    if (!assignOpen && !moreOpen && !saveAsDialogOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!assignRef.current?.contains(target)) setAssignOpen(false)
      if (!moreRef.current?.contains(target)) setMoreOpen(false)
      if (!saveRef.current?.contains(target) && !saveAsPending && syncState !== 'saving') setSaveAsDialogOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setAssignOpen(false)
      setMoreOpen(false)
      if (!saveAsPending && syncState !== 'saving') setSaveAsDialogOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [assignOpen, moreOpen, saveAsDialogOpen, saveAsPending, syncState])

  useEffect(() => {
    if (!newDocumentDialogOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saveBeforeNewPending) setNewDocumentDialogOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [newDocumentDialogOpen, saveBeforeNewPending])

  const shouldConfirmBeforeNew = sidePanelOpen && hasUnsavedChanges

  const handleCreateNewClick = () => {
    if (contentBusy || syncState === 'saving') return
    setAssignOpen(false)
    setMoreOpen(false)
    if (shouldConfirmBeforeNew) {
      setNewDocumentDialogOpen(true)
      return
    }
    onCreateNew()
  }

  const handleCreateNewDirectly = () => {
    setNewDocumentDialogOpen(false)
    onCreateNew()
  }

  const shouldChooseSaveKind = sidePanelOpen && hasQuestions

  const handleSaveClick = () => {
    if (!canSave || syncState === 'saving' || contentBusy || saveAsPending) return
    setAssignOpen(false)
    setMoreOpen(false)
    if (shouldChooseSaveKind) {
      setSaveAsDialogOpen((open) => !open)
      return
    }
    void onSave()
  }

  const handleSaveAsSelect = async (kind: WorkbenchDocumentKind) => {
    setSaveAsPending(true)
    try {
      const saved = await onSave(kind)
      setSaveAsDialogOpen(false)
      return saved
    } finally {
      setSaveAsPending(false)
    }
  }

  const handleSaveAndCreateNew = async () => {
    if (!onSaveAndCreateNew) {
      handleCreateNewDirectly()
      return
    }
    setSaveBeforeNewPending(true)
    try {
      const saved = await onSaveAndCreateNew()
      if (!saved) return
      setNewDocumentDialogOpen(false)
      onCreateNew()
    } finally {
      setSaveBeforeNewPending(false)
    }
  }

  const exportDocument = () => {
    if (!hasQuestions) {
      MetisMessage.error('请先添加题目')
      return
    }
    if (onRequirePaperScores && !onRequirePaperScores('print')) return
    onMarkOutput?.('print')
    MetisMessage.success('已生成打印 / PDF 预览（原型演示）')
  }

  const downloadWord = () => {
    if (!hasQuestions) return MetisMessage.error('请先添加题目')
    if (onRequirePaperScores && !onRequirePaperScores('download')) return
    onMarkOutput?.('download')
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
      onMarkOutput?.('share')
      await navigator.clipboard.writeText(shareText)
      MetisMessage.success('题单分享信息已复制')
    } catch {
      MetisMessage.info('分享面板已打开（原型演示）')
    }
  }

  return (
    <header className={`fx-page-header workspace-header${sidePanelOpen ? ' is-split' : ''}${studioEditorOpen ? ' is-studio-editor' : ''}${draftCollapsed ? ' is-draft-collapsed' : ''}`} data-sec="1">
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
            className={studioEditorOpen ? 'header-browse-back' : undefined}
            icon={<PanelRightOpen size={17} />}
            aria-label="添加题目"
            title="添加题目"
            onClick={onSidePanelOpen}
            data-track="/click/aiQuestionHome/openCompositionHub | 打开添加题目工作区 | 无"
          >添加题目</MetisButton>
        ) : null}
        <span className="header-icon-action" data-tooltip="新建题单">
          <MetisButton
            type="borderless"
            className={studioEditorOpen ? 'header-create-with-label' : undefined}
            icon={<Plus size={18} />}
            aria-label="新建题单"
            title="新建题单"
            disabled={contentBusy || syncState === 'saving' || saveBeforeNewPending}
            onClick={handleCreateNewClick}
            data-track="/click/aiQuestionHome/createBlank | 新建空白题单 | 无"
          >
            {studioEditorOpen ? '新建' : undefined}
          </MetisButton>
        </span>
        {!studioEditorOpen ? (
          <>
            <span className="header-save header-icon-action" data-tooltip={syncState === 'saving' ? '保存中' : '保存题单'} ref={saveRef}>
              <MetisButton
                type="borderless"
                icon={syncState === 'saving' ? <LoaderCircle className="is-spinning" size={17} /> : <Save size={17} />}
                aria-label={syncState === 'saving' ? '保存中' : '保存题单'}
                aria-expanded={saveAsDialogOpen}
                disabled={!canSave || syncState === 'saving' || contentBusy || saveAsPending}
                onClick={handleSaveClick}
                data-track="/click/aiQuestionHome/save | 保存当前草稿 | 无"
              />
              <SaveAsDialog
                open={saveAsDialogOpen}
                pending={saveAsPending || syncState === 'saving'}
                onClose={() => { if (!saveAsPending && syncState !== 'saving') setSaveAsDialogOpen(false) }}
                onSelect={(kind) => { void handleSaveAsSelect(kind) }}
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
                  if (onRequirePaperScores && !onRequirePaperScores('assign')) return
                  setAssignOpen((open) => !open)
                  setMoreOpen(false)
                  setSaveAsDialogOpen(false)
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
          </>
        ) : null}
        {!studioEditorOpen ? (
          <span className="header-icon-action" data-tooltip="展开编辑">
            <MetisButton
              type="borderless"
              icon={<Maximize2 size={17} />}
              aria-label="展开编辑"
              onClick={() => {
                setAssignOpen(false)
                setMoreOpen(false)
                onEnterEdit()
              }}
              data-track="/click/aiQuestionHome/enterFocusEditor | 展开题单编辑 | 无"
            />
          </span>
        ) : null}
        {!studioEditorOpen ? (
          <div className="header-more header-icon-action" data-tooltip="更多" ref={moreRef}>
            <MetisButton
              type="borderless"
              icon={<MoreHorizontal size={18} />}
              aria-label="更多"
              title="更多"
              aria-expanded={moreOpen}
              onClick={() => {
                setMoreOpen((open) => !open)
                setAssignOpen(false)
                setSaveAsDialogOpen(false)
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
        ) : null}
        {studioEditorOpen && studioDocument && onStudioSave && onStudioAssign ? (
          <EditorStudioFooter
            placement="header"
            document={studioDocument}
            canSave={canSave}
            contentBusy={contentBusy}
            syncState={syncState}
            assignmentOutdated={assignmentOutdated}
            onSave={onStudioSave}
            onAssign={onStudioAssign}
            onGenerateAnswerSheet={onStudioGenerateAnswerSheet}
            onRequirePaperScores={onRequirePaperScores}
          />
        ) : null}
        {sidePanelOpen ? (
          <MetisButton
            type="borderless"
            icon={<PanelRightClose size={17} />}
            aria-label="收起组题画布"
            title="收起组题画布，扩大左侧浏览区"
            onClick={onDraftCollapse}
          />
        ) : null}
      </div>
      </>
      )}
      {newDocumentDialogOpen ? (
        <div className="workspace-confirm-overlay" role="presentation" onClick={() => { if (!saveBeforeNewPending) setNewDocumentDialogOpen(false) }}>
          <div
            className="workspace-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-new-document-title"
            onClick={(event) => event.stopPropagation()}
          >
            <strong id="workspace-new-document-title">当前题单尚未保存</strong>
            <span>题单里的题目和修改还没保存。直接新建会丢失这些内容，你可以先保存再新建空白题单。</span>
            <div>
              <button type="button" disabled={saveBeforeNewPending} onClick={() => setNewDocumentDialogOpen(false)}>取消</button>
              <button type="button" disabled={saveBeforeNewPending} onClick={handleCreateNewDirectly}>直接新建</button>
              <button
                type="button"
                className="is-primary"
                disabled={saveBeforeNewPending || !canSave}
                onClick={() => { void handleSaveAndCreateNew() }}
              >
                {saveBeforeNewPending ? '保存中…' : '先保存再新建'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}

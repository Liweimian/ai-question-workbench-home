import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import { Check, Download, Eye, FileText, History, Maximize2, MoreHorizontal, Plus, Printer, Save, Send, Share2 } from 'lucide-react'
import type { DocumentOutputLock, DocumentSyncState, HistoryDocumentSummary, PaperAnswerMode, WorkbenchDocument, WorkbenchDocumentKind } from '../prototype/types'
import { getDocumentKind, getPaperAnswerMode } from '../utils/documentEditorUtils'
import { formatRecentEditedMeta, selectRecentEditedSummaries } from '../utils/recentEditedDocuments'
import { DocumentEditorControls } from './DocumentEditorControls'

interface DocumentActionToolbarProps {
  document: WorkbenchDocument
  canSave: boolean
  contentBusy: boolean
  syncState: DocumentSyncState
  assignmentOutdated: boolean
  onSave: (kind?: WorkbenchDocumentKind) => void | Promise<boolean | void>
  onKindChange: (kind: WorkbenchDocumentKind) => void
  onAnswerModeChange: (mode: PaperAnswerMode) => void
  onAssign: () => void
  onMarkOutput: (lock: DocumentOutputLock) => void
  onRequirePaperScores?: (action: 'preview' | 'assign' | 'download' | 'print' | 'share') => boolean
  onExpand?: () => void
  onCreateNew?: (rememberCurrent?: boolean) => void
  onSaveAndCreateNew?: (kind?: WorkbenchDocumentKind) => Promise<boolean>
  onGenerateAnswerSheet?: () => void
  recentDocuments?: HistoryDocumentSummary[]
  onOpenRecentDocument?: (documentId: string) => void
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function DocumentActionToolbar({ document, canSave, contentBusy, syncState, assignmentOutdated, onSave, onKindChange, onAnswerModeChange, onAssign, onMarkOutput, onRequirePaperScores, onExpand, onCreateNew, onSaveAndCreateNew, onGenerateAnswerSheet, recentDocuments = [], onOpenRecentDocument }: DocumentActionToolbarProps) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [newDocumentOpen, setNewDocumentOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [documentSwitcherOpen, setDocumentSwitcherOpen] = useState(false)
  const assignRef = useRef<HTMLSpanElement>(null)
  const moreRef = useRef<HTMLSpanElement>(null)
  const documentSwitcherRef = useRef<HTMLDivElement>(null)
  const documentSwitcherCloseTimerRef = useRef<number | null>(null)
  const hasQuestions = document.questions.length > 0
  const saving = syncState === 'saving'
  const hasUnsavedChanges = syncState === 'dirty' || syncState === 'error' || assignmentOutdated
  const answerSheetPaper = getDocumentKind(document) === '试卷'
    && getPaperAnswerMode(document) === '答题卡作答'
    && hasQuestions

  useEffect(() => {
    if (!assignOpen && !moreOpen && !documentSwitcherOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      if (!assignRef.current?.contains(event.target as Node)) setAssignOpen(false)
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false)
      if (!documentSwitcherRef.current?.contains(event.target as Node)) setDocumentSwitcherOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAssignOpen(false)
      if (event.key === 'Escape') setMoreOpen(false)
      if (event.key === 'Escape') setDocumentSwitcherOpen(false)
    }
    window.document.addEventListener('mousedown', closeOnOutside)
    window.document.addEventListener('keydown', closeOnEscape)
    return () => {
      window.document.removeEventListener('mousedown', closeOnOutside)
      window.document.removeEventListener('keydown', closeOnEscape)
    }
  }, [assignOpen, moreOpen, documentSwitcherOpen])

  const recentEditedDocuments = selectRecentEditedSummaries(recentDocuments).slice(0, 8)

  const openDocumentSwitcher = () => {
    if (documentSwitcherCloseTimerRef.current !== null) window.clearTimeout(documentSwitcherCloseTimerRef.current)
    setDocumentSwitcherOpen(true)
  }

  const scheduleDocumentSwitcherClose = () => {
    if (documentSwitcherCloseTimerRef.current !== null) window.clearTimeout(documentSwitcherCloseTimerRef.current)
    documentSwitcherCloseTimerRef.current = window.setTimeout(() => {
      setDocumentSwitcherOpen(false)
      documentSwitcherCloseTimerRef.current = null
    }, 180)
  }

  useEffect(() => () => {
    if (documentSwitcherCloseTimerRef.current !== null) window.clearTimeout(documentSwitcherCloseTimerRef.current)
  }, [])

  const saveDocument = async (kind = getDocumentKind(document), forNew = false) => {
    setSavePending(true)
    try {
      const saved = forNew && onSaveAndCreateNew ? await onSaveAndCreateNew(kind) : await onSave(kind)
      if (saved !== false) {
        if (forNew) onCreateNew?.(true)
      }
    } finally {
      setSavePending(false)
    }
  }

  const saveAndCreateNew = () => {
    setNewDocumentOpen(false)
    void saveDocument(getDocumentKind(document), true)
  }

  const saveBeforeOutput = async () => {
    const saved = await onSave(getDocumentKind(document))
    return saved !== false
  }

  const previewDocument = () => {
    if (!hasQuestions) return MetisMessage.error('请先添加题目')
    if (onRequirePaperScores && !onRequirePaperScores('preview')) return
    MetisMessage.info('预览面板已打开（原型演示）')
  }

  const downloadDocument = async () => {
    if (!hasQuestions) return
    if (onRequirePaperScores && !onRequirePaperScores('download')) return
    if (!(await saveBeforeOutput())) return
    const title = document.title.trim() || '未命名练习'
    const safeTitle = title.replace(/[\\/:*?"<>|]/g, '-')
    const questions = document.questions.map((question, index) => {
      const options = question.options?.length
        ? `<ol type="A">${question.options.map((option) => `<li>${escapeHtml(option)}</li>`).join('')}</ol>`
        : ''
      return `<section><p><strong>${index + 1}.</strong> ${escapeHtml(question.stem)}</p>${options}</section>`
    }).join('')
    const wordHtml = `<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>${questions}</body></html>`
    const url = URL.createObjectURL(new Blob([wordHtml], { type: 'application/msword' }))
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = `${safeTitle}.doc`
    anchor.click()
    URL.revokeObjectURL(url)
    MetisMessage.success('练习已开始下载')
    onMarkOutput('download')
  }

  const printDocument = async () => {
    if (!hasQuestions) return
    if (onRequirePaperScores && !onRequirePaperScores('print')) return
    if (!(await saveBeforeOutput())) return
    window.print()
    onMarkOutput('print')
  }

  const shareDocument = async () => {
    if (!hasQuestions) return
    if (onRequirePaperScores && !onRequirePaperScores('share')) return
    if (!(await saveBeforeOutput())) return
    const shareText = `${document.title.trim() || '未命名练习'}（共 ${document.questions.length} 道题）`
    try {
      await navigator.clipboard.writeText(shareText)
      MetisMessage.success('已共享到校本库')
    } catch {
      MetisMessage.info('共享到校本库面板已打开（原型演示）')
    }
    onMarkOutput('share')
  }

  return (
    <div className="document-action-toolbar" role="toolbar" aria-label="练习操作">
      <div className="document-action-context">
        <div className="document-switcher" ref={documentSwitcherRef} onMouseEnter={openDocumentSwitcher} onMouseLeave={scheduleDocumentSwitcherClose}>
          <button type="button" className="document-recent-trigger" aria-label="最近编辑" title="最近编辑" aria-haspopup="menu" aria-expanded={documentSwitcherOpen} onFocus={openDocumentSwitcher} onClick={openDocumentSwitcher}>
            <History size={17} />
          </button>
          <span className="document-switcher-current">{document.title.trim() || '未命名练习'}</span>
          {documentSwitcherOpen ? (
            <div className="document-switcher-menu" role="menu" aria-label="切换最近练习">
              <strong>最近编辑</strong>
              {recentEditedDocuments.length ? recentEditedDocuments.map((item) => {
                const current = item.id === document.id
                return (
                  <button type="button" role="menuitem" className={current ? 'is-current' : undefined} key={item.id} onClick={() => {
                    setDocumentSwitcherOpen(false)
                    if (!current) onOpenRecentDocument?.(item.id)
                  }}>
                    <span className="document-switcher-file"><FileText size={16} /></span>
                    <span><b>{item.title}</b><small>{formatRecentEditedMeta(item)}</small></span>
                    {current ? <Check size={15} /> : null}
                  </button>
                )
              }) : <div className="document-switcher-empty">暂无最近编辑的练习</div>}
            </div>
          ) : null}
        </div>
        <DocumentEditorControls document={document} variant="compact" onKindChange={onKindChange} onAnswerModeChange={onAnswerModeChange} />
      </div>
      {answerSheetPaper ? (
        <>
          {onExpand ? (
            <span className="document-action-item is-expand">
              <MetisButton type="borderless" icon={<Maximize2 size={16} />} onClick={onExpand}>展开</MetisButton>
            </span>
          ) : null}
          <span className="document-action-item is-preview">
            <MetisButton type="borderless" icon={<Eye size={16} />} disabled={!hasQuestions || saving || contentBusy} onClick={previewDocument}>预览</MetisButton>
          </span>
          <span className="document-action-item is-save">
            <MetisButton type="borderless" icon={<Save size={16} />} disabled={!canSave || saving || contentBusy || savePending} onClick={() => { setMoreOpen(false); void saveDocument() }}>
              {saving ? '保存中…' : '保存'}
            </MetisButton>
          </span>
          {onCreateNew ? (
            <span className="document-action-item">
              <MetisButton type="borderless" icon={<Plus size={16} />} disabled={contentBusy || saving || savePending} onClick={() => {
                setMoreOpen(false)
                if (hasUnsavedChanges) setNewDocumentOpen(true)
                else onCreateNew(true)
              }} data-track="/click/aiQuestionHome/createBlank | 新建空白草稿 | 无">新建</MetisButton>
            </span>
          ) : null}
          <span className="document-action-item is-more" ref={moreRef}>
            <MetisButton type="borderless" icon={<MoreHorizontal size={17} />} aria-label="更多" aria-expanded={moreOpen} disabled={saving || contentBusy} onClick={() => setMoreOpen((open) => !open)}>更多</MetisButton>
            {moreOpen ? (
              <div className="document-action-popover document-action-more-menu" role="menu" aria-label="更多答题卡操作">
                <button type="button" role="menuitem" onClick={() => { onGenerateAnswerSheet?.(); setMoreOpen(false) }}>生成答题卡</button>
              </div>
            ) : null}
          </span>
        </>
      ) : (
        <>
      {onExpand ? (
        <span className="document-action-item is-expand">
          <MetisButton
            type="borderless"
            icon={<Maximize2 size={16} />}
            onClick={onExpand}
            data-track="/click/aiQuestionHome/enterFocusEditor | 展开练习编辑 | 无"
          >展开</MetisButton>
        </span>
      ) : null}
      {getDocumentKind(document) === '试卷' ? (
        <span className="document-action-item is-preview">
          <MetisButton type="borderless" icon={<Eye size={16} />} disabled={!hasQuestions || saving || contentBusy} onClick={previewDocument}>预览</MetisButton>
        </span>
      ) : null}
      <span className="document-action-item is-save">
        <MetisButton
          type="borderless"
          icon={<Save size={16} />}
          disabled={!canSave || saving || contentBusy || savePending}
          onClick={() => {
            setAssignOpen(false)
            setMoreOpen(false)
            void saveDocument()
          }}
          data-track="/click/aiQuestionHome/save | 保存当前草稿 | 无"
        >{saving ? '保存中…' : '保存'}</MetisButton>
      </span>
      {getDocumentKind(document) !== '试卷' ? <span className="document-action-item is-assign" ref={assignRef}>
        <MetisButton
          type="borderless"
          icon={<Send size={16} />}
          disabled={!hasQuestions || saving || contentBusy}
          aria-expanded={assignOpen}
          onClick={() => {
            if (onRequirePaperScores && !onRequirePaperScores('assign')) return
            setAssignOpen((open) => !open)
            setMoreOpen(false)
          }}
          data-track="/click/aiQuestionHome/assign | 布置当前内容 | 无"
        >布置</MetisButton>
        {assignOpen ? (
          <div className="document-action-popover" role="dialog" aria-label="确认布置练习">
            <strong>{assignmentOutdated ? '确认更新布置' : '确认布置练习'}</strong>
            <span>{assignmentOutdated ? `将保存 ${document.questions.length} 道题的最新修改，并更新已布置版本。` : `当前共 ${document.questions.length} 道题，确认后将保存最新内容并进入布置状态。`}</span>
            <div><button type="button" onClick={() => setAssignOpen(false)}>取消</button><button type="button" className="is-primary" onClick={() => { onAssign(); setAssignOpen(false) }}>确认布置</button></div>
          </div>
        ) : null}
      </span> : null}
      {hasQuestions && onCreateNew ? (
        <span className="document-action-item">
          <MetisButton type="borderless" icon={<Plus size={16} />} disabled={contentBusy || saving || savePending} onClick={() => {
            setAssignOpen(false)
            setMoreOpen(false)
            if (hasUnsavedChanges) setNewDocumentOpen(true)
            else onCreateNew(true)
          }} data-track="/click/aiQuestionHome/createBlank | 新建空白草稿 | 无">新建</MetisButton>
        </span>
      ) : null}
      <span className="document-action-item is-more" ref={moreRef}>
        <MetisButton type="borderless" icon={<MoreHorizontal size={17} />} aria-label="更多" aria-expanded={moreOpen} disabled={!hasQuestions || saving || contentBusy} onClick={() => { setMoreOpen((open) => !open); setAssignOpen(false) }}>更多</MetisButton>
        {moreOpen ? (
          <div className="document-action-popover document-action-more-menu" role="menu" aria-label="更多练习操作">
            <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { void downloadDocument(); setMoreOpen(false) }}><Download size={16} />下载</button>
            <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { void printDocument(); setMoreOpen(false) }}><Printer size={16} />打印</button>
            <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { void shareDocument(); setMoreOpen(false) }}><Share2 size={16} />共享到校本库</button>
          </div>
        ) : null}
      </span>
        </>
      )}
      {newDocumentOpen ? (
        <div className="workspace-confirm-overlay" role="presentation" onClick={() => { if (!savePending) setNewDocumentOpen(false) }}>
          <div className="workspace-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="toolbar-new-document-title" onClick={(event) => event.stopPropagation()}>
            <strong id="toolbar-new-document-title">当前内容尚未保存</strong>
            <span>是否保存当前内容后再新建？不保存将直接放弃本次修改。</span>
            <div>
              <button type="button" disabled={savePending} onClick={() => setNewDocumentOpen(false)}>取消</button>
              <button type="button" disabled={savePending} onClick={() => { setNewDocumentOpen(false); onCreateNew?.(false) }}>不保存，直接新建</button>
              <button type="button" className="is-primary" disabled={savePending || !canSave} onClick={saveAndCreateNew}>{savePending ? '保存中…' : '保存并新建'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

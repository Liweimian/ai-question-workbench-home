import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import { Download, Maximize2, MoreHorizontal, Plus, Printer, Save, Send, Share2 } from 'lucide-react'
import type { DocumentOutputLock, DocumentSyncState, WorkbenchDocument, WorkbenchDocumentKind } from '../prototype/types'
import { getDocumentKind } from '../utils/documentEditorUtils'
import { SaveAsDialog } from './SaveAsDialog'

interface DocumentActionToolbarProps {
  document: WorkbenchDocument
  canSave: boolean
  contentBusy: boolean
  syncState: DocumentSyncState
  assignmentOutdated: boolean
  onSave: (kind?: WorkbenchDocumentKind) => void | Promise<boolean | void>
  requiresSaveKind?: boolean
  onAssign: () => void
  onMarkOutput: (lock: DocumentOutputLock) => void
  onRequirePaperScores?: (action: 'preview' | 'assign' | 'download' | 'print' | 'share') => boolean
  onExpand?: () => void
  onCreateNew?: (rememberCurrent?: boolean) => void
  onSaveAndCreateNew?: (kind?: WorkbenchDocumentKind) => Promise<boolean>
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function DocumentActionToolbar({ document, canSave, contentBusy, syncState, assignmentOutdated, onSave, requiresSaveKind = false, onAssign, onMarkOutput, onRequirePaperScores, onExpand, onCreateNew, onSaveAndCreateNew }: DocumentActionToolbarProps) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [saveAsOpen, setSaveAsOpen] = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [saveForNew, setSaveForNew] = useState(false)
  const [newDocumentOpen, setNewDocumentOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const assignRef = useRef<HTMLSpanElement>(null)
  const saveRef = useRef<HTMLSpanElement>(null)
  const moreRef = useRef<HTMLSpanElement>(null)
  const hasQuestions = document.questions.length > 0
  const saving = syncState === 'saving'
  const hasUnsavedChanges = syncState === 'dirty' || syncState === 'error' || assignmentOutdated

  useEffect(() => {
    if (!assignOpen && !saveAsOpen && !moreOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      if (!assignRef.current?.contains(event.target as Node)) setAssignOpen(false)
      if (!saveRef.current?.contains(event.target as Node) && !savePending) setSaveAsOpen(false)
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAssignOpen(false)
      if (event.key === 'Escape' && !savePending) setSaveAsOpen(false)
      if (event.key === 'Escape') setMoreOpen(false)
    }
    window.document.addEventListener('mousedown', closeOnOutside)
    window.document.addEventListener('keydown', closeOnEscape)
    return () => {
      window.document.removeEventListener('mousedown', closeOnOutside)
      window.document.removeEventListener('keydown', closeOnEscape)
    }
  }, [assignOpen, saveAsOpen, savePending, moreOpen])

  const saveDocument = async (kind?: WorkbenchDocumentKind, forNew = saveForNew) => {
    setSavePending(true)
    try {
      const saved = forNew && onSaveAndCreateNew ? await onSaveAndCreateNew(kind) : await onSave(kind)
      if (saved !== false) {
        setSaveAsOpen(false)
        if (forNew) onCreateNew?.(true)
        setSaveForNew(false)
      }
    } finally {
      setSavePending(false)
    }
  }

  const saveAndCreateNew = () => {
    setNewDocumentOpen(false)
    setSaveForNew(true)
    if (requiresSaveKind) {
      setSaveAsOpen(true)
      return
    }
    void saveDocument(undefined, true)
  }

  const downloadDocument = () => {
    if (!hasQuestions) return
    if (onRequirePaperScores && !onRequirePaperScores('download')) return
    const title = document.title.trim() || '未命名题单'
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
    MetisMessage.success('题单已开始下载')
    onMarkOutput('download')
  }

  const printDocument = () => {
    if (!hasQuestions) return
    if (onRequirePaperScores && !onRequirePaperScores('print')) return
    window.print()
    onMarkOutput('print')
  }

  const shareDocument = async () => {
    if (!hasQuestions) return
    if (onRequirePaperScores && !onRequirePaperScores('share')) return
    const saved = await onSave(getDocumentKind(document))
    if (saved === false) return
    const shareText = `${document.title.trim() || '未命名题单'}（共 ${document.questions.length} 道题）`
    try {
      await navigator.clipboard.writeText(shareText)
      MetisMessage.success('已共享到校本库')
    } catch {
      MetisMessage.info('共享到校本库面板已打开（原型演示）')
    }
    onMarkOutput('share')
  }

  return (
    <div className="document-action-toolbar" role="toolbar" aria-label="题单操作">
      {onExpand ? (
        <span className="document-action-item is-expand">
          <MetisButton
            type="borderless"
            icon={<Maximize2 size={16} />}
            onClick={onExpand}
            data-track="/click/aiQuestionHome/enterFocusEditor | 展开题单编辑 | 无"
          >展开</MetisButton>
        </span>
      ) : null}
      <span className="document-action-item is-save" ref={saveRef}>
        <MetisButton
          type="borderless"
          icon={<Save size={16} />}
          disabled={!canSave || saving || contentBusy || savePending}
          aria-expanded={saveAsOpen}
          onClick={() => {
            setAssignOpen(false)
            setMoreOpen(false)
            setSaveForNew(false)
            if (requiresSaveKind) setSaveAsOpen((open) => !open)
            else void saveDocument()
          }}
          data-track="/click/aiQuestionHome/save | 保存当前草稿 | 无"
        >{saving ? '保存中…' : '保存'}</MetisButton>
        <SaveAsDialog
          open={saveAsOpen}
          pending={savePending || saving}
          onClose={() => { if (!savePending && !saving) setSaveAsOpen(false) }}
          onSelect={(kind) => { void saveDocument(kind) }}
        />
      </span>
      <span className="document-action-item is-assign" ref={assignRef}>
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
          <div className="document-action-popover" role="dialog" aria-label="确认布置题单">
            <strong>{assignmentOutdated ? '确认更新布置' : '确认布置题单'}</strong>
            <span>{assignmentOutdated ? `将保存 ${document.questions.length} 道题的最新修改，并更新已布置版本。` : `当前共 ${document.questions.length} 道题，确认后将保存最新内容并进入布置状态。`}</span>
            <div><button type="button" onClick={() => setAssignOpen(false)}>取消</button><button type="button" className="is-primary" onClick={() => { onAssign(); setAssignOpen(false) }}>确认布置</button></div>
          </div>
        ) : null}
      </span>
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
        <MetisButton type="borderless" icon={<MoreHorizontal size={17} />} aria-label="更多" aria-expanded={moreOpen} onClick={() => { setMoreOpen((open) => !open); setAssignOpen(false) }}>更多</MetisButton>
        {moreOpen ? (
          <div className="document-action-popover document-action-more-menu" role="menu" aria-label="更多题单操作">
            <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { downloadDocument(); setMoreOpen(false) }}><Download size={16} />下载</button>
            <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { printDocument(); setMoreOpen(false) }}><Printer size={16} />打印</button>
            <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { void shareDocument(); setMoreOpen(false) }}><Share2 size={16} />共享到校本库</button>
          </div>
        ) : null}
      </span>
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

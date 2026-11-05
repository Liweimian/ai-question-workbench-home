import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import { Download, Eye, MoreHorizontal, Printer, Save, Send, Share2 } from 'lucide-react'
import type { DocumentOutputLock, DocumentSyncState, WorkbenchDocument, WorkbenchDocumentKind } from '../prototype/types'
import { getDocumentKind, getPaperAnswerMode } from '../utils/documentEditorUtils'
import { SaveAsDialog } from './SaveAsDialog'

interface EditorStudioFooterProps {
  document: WorkbenchDocument
  canSave: boolean
  contentBusy: boolean
  syncState: DocumentSyncState
  assignmentOutdated: boolean
  onSave: (kind?: WorkbenchDocumentKind) => void | Promise<boolean | void>
  requiresSaveKind?: boolean
  onAssign: () => void
  onMarkOutput: (lock: DocumentOutputLock) => void
  onGenerateAnswerSheet?: () => void
  onRequirePaperScores?: (action: 'preview' | 'assign' | 'download' | 'print' | 'share') => boolean
  placement?: 'header' | 'footer'
}

export function EditorStudioFooter({
  document,
  canSave,
  contentBusy,
  syncState,
  assignmentOutdated,
  onSave,
  requiresSaveKind = false,
  onAssign,
  onMarkOutput,
  onGenerateAnswerSheet,
  onRequirePaperScores,
  placement = 'footer',
}: EditorStudioFooterProps) {
  const showAnswerSheetAction = getDocumentKind(document) === '试卷'
    && getPaperAnswerMode(document) === '答题卡作答'
    && Boolean(onGenerateAnswerSheet)
    && document.questions.length > 0
  const answerSheetLabel = document.answerSheet?.generatedAt ? '重新生成答题卡' : '生成答题卡'
  const [assignOpen, setAssignOpen] = useState(false)
  const [saveAsOpen, setSaveAsOpen] = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const assignRef = useRef<HTMLSpanElement>(null)
  const saveRef = useRef<HTMLSpanElement>(null)
  const moreRef = useRef<HTMLSpanElement>(null)
  const hasQuestions = document.questions.length > 0
  const saving = syncState === 'saving'

  useEffect(() => {
    if (!assignOpen && !moreOpen && !saveAsOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!assignRef.current?.contains(target)) setAssignOpen(false)
      if (!moreRef.current?.contains(target)) setMoreOpen(false)
      if (!saveRef.current?.contains(target) && !savePending) setSaveAsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAssignOpen(false)
        setMoreOpen(false)
        if (!savePending) setSaveAsOpen(false)
      }
    }
    window.document.addEventListener('mousedown', closeOnOutside)
    window.document.addEventListener('keydown', closeOnEscape)
    return () => {
      window.document.removeEventListener('mousedown', closeOnOutside)
      window.document.removeEventListener('keydown', closeOnEscape)
    }
  }, [assignOpen, moreOpen, saveAsOpen, savePending])

  const saveDocument = async (kind?: WorkbenchDocumentKind) => {
    setSavePending(true)
    try {
      const saved = await onSave(kind)
      if (saved !== false) setSaveAsOpen(false)
    } finally {
      setSavePending(false)
    }
  }

  const previewDocument = () => {
    if (!hasQuestions) {
      MetisMessage.error('请先添加题目')
      return
    }
    if (onRequirePaperScores && !onRequirePaperScores('preview')) return
    MetisMessage.info('预览面板已打开（原型演示）')
  }

  const printDocument = () => {
    if (!hasQuestions) return
    if (onRequirePaperScores && !onRequirePaperScores('print')) return
    window.print()
    onMarkOutput('print')
  }

  const downloadDocument = () => {
    if (!hasQuestions) return
    if (onRequirePaperScores && !onRequirePaperScores('download')) return
    MetisMessage.success('Word 已开始下载（原型演示）')
    onMarkOutput('download')
  }

  const shareDocument = async () => {
    if (!hasQuestions) return
    if (onRequirePaperScores && !onRequirePaperScores('share')) return
    try {
      await navigator.clipboard.writeText(`${document.title.trim() || '未命名'}（共 ${document.questions.length} 道题）`)
      MetisMessage.success('已共享到校本库')
    } catch {
      MetisMessage.info('共享到校本库面板已打开（原型演示）')
    }
    onMarkOutput('share')
  }

  const Tag = placement === 'header' ? 'div' : 'footer'

  if (showAnswerSheetAction) {
    return (
      <Tag className={`editor-studio-actions${placement === 'header' ? ' is-header' : ' is-footer'}`} aria-label="试卷答题卡操作">
        <MetisButton type="borderless" className="editor-studio-footer-btn" icon={<Eye size={17} />} disabled={!hasQuestions} onClick={previewDocument}>
          预览
        </MetisButton>
        <MetisButton
          type="borderless"
          className="editor-studio-footer-btn editor-studio-footer-answer-sheet"
          disabled={!hasQuestions || saving || contentBusy}
          onClick={onGenerateAnswerSheet}
        >
          {answerSheetLabel}
        </MetisButton>
      </Tag>
    )
  }

  return (
    <Tag className={`editor-studio-actions${placement === 'header' ? ' is-header' : ' is-footer'}`} aria-label="题单操作">
      <span className="editor-studio-footer-save" ref={saveRef}>
        <MetisButton
          type="borderless"
          className="editor-studio-footer-btn"
          icon={<Save size={17} />}
          disabled={!canSave || saving || contentBusy || savePending}
          aria-expanded={saveAsOpen}
          onClick={() => {
            setAssignOpen(false)
            setMoreOpen(false)
            if (requiresSaveKind) setSaveAsOpen((open) => !open)
            else void saveDocument()
          }}
        >{saving ? '保存中…' : '保存'}</MetisButton>
        <SaveAsDialog
          open={saveAsOpen}
          pending={savePending || saving}
          onClose={() => { if (!savePending && !saving) setSaveAsOpen(false) }}
          onSelect={(kind) => { void saveDocument(kind) }}
        />
      </span>
      <MetisButton type="borderless" className="editor-studio-footer-btn" icon={<Eye size={17} />} disabled={!hasQuestions} onClick={previewDocument}>
        预览
      </MetisButton>
      {getDocumentKind(document) !== '试卷' ? <span className="editor-studio-footer-assign" ref={assignRef}>
        <MetisButton
          type="borderless"
          className="editor-studio-footer-btn"
          icon={<Send size={17} />}
          disabled={!hasQuestions || saving || contentBusy}
          aria-expanded={assignOpen}
          onClick={() => {
            if (onRequirePaperScores && !onRequirePaperScores('assign')) return
            setAssignOpen((open) => !open)
            setMoreOpen(false)
          }}
        >
          布置
        </MetisButton>
        {assignOpen ? (
          <div className="document-action-popover editor-studio-footer-popover" role="dialog" aria-label="确认布置题单">
            <strong>{assignmentOutdated ? '确认更新布置' : '确认布置题单'}</strong>
            <span>
              {assignmentOutdated
                ? `将保存 ${document.questions.length} 道题的最新修改，并更新已布置版本。`
                : `当前共 ${document.questions.length} 道题，确认后将保存最新内容并进入布置状态。`}
            </span>
            <div>
              <button type="button" onClick={() => setAssignOpen(false)}>取消</button>
              <button type="button" className="is-primary" onClick={() => { onAssign(); setAssignOpen(false) }}>确认布置</button>
            </div>
          </div>
        ) : null}
      </span> : null}
      <span className="editor-studio-footer-more" ref={moreRef}>
        <MetisButton
          type="borderless"
          className="editor-studio-footer-btn"
          icon={<MoreHorizontal size={17} />}
          aria-expanded={moreOpen}
          onClick={() => {
            setMoreOpen((open) => !open)
            setAssignOpen(false)
          }}
        >
          更多
        </MetisButton>
        {moreOpen ? (
          <div className="editor-studio-footer-menu" role="menu">
            <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { downloadDocument(); setMoreOpen(false) }}><Download size={16} />下载</button>
            <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { printDocument(); setMoreOpen(false) }}><Printer size={16} />打印</button>
            <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { void shareDocument(); setMoreOpen(false) }}><Share2 size={16} />共享到校本库</button>
          </div>
        ) : null}
      </span>
    </Tag>
  )
}

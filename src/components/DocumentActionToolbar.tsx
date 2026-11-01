import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import { ClipboardList, Download, LoaderCircle, Printer, Save, Send, Share2 } from 'lucide-react'
import type { DocumentSyncState, WorkbenchDocument } from '../prototype/types'
import { getDocumentKind } from '../utils/documentEditorUtils'

interface DocumentActionToolbarProps {
  document: WorkbenchDocument
  canSave: boolean
  contentBusy: boolean
  syncState: DocumentSyncState
  assignmentOutdated: boolean
  onSave: () => void
  onAssign: () => void
  onGenerateAnswerSheet?: () => void
  onRequirePaperScores?: (action: 'assign' | 'download' | 'print') => boolean
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function DocumentActionToolbar({ document, canSave, contentBusy, syncState, assignmentOutdated, onSave, onAssign, onGenerateAnswerSheet, onRequirePaperScores }: DocumentActionToolbarProps) {
  const [assignOpen, setAssignOpen] = useState(false)
  const assignRef = useRef<HTMLSpanElement>(null)
  const hasQuestions = document.questions.length > 0
  const saving = syncState === 'saving'
  const showGenerateAnswerSheet = getDocumentKind(document) === '试卷' && hasQuestions && Boolean(onGenerateAnswerSheet)

  useEffect(() => {
    if (!assignOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      if (!assignRef.current?.contains(event.target as Node)) setAssignOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAssignOpen(false)
    }
    window.document.addEventListener('mousedown', closeOnOutside)
    window.document.addEventListener('keydown', closeOnEscape)
    return () => {
      window.document.removeEventListener('mousedown', closeOnOutside)
      window.document.removeEventListener('keydown', closeOnEscape)
    }
  }, [assignOpen])

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
  }

  const printDocument = () => {
    if (!hasQuestions) return
    if (onRequirePaperScores && !onRequirePaperScores('print')) return
    window.print()
  }

  const shareDocument = async () => {
    if (!hasQuestions) return
    const shareText = `${document.title.trim() || '未命名题单'}（共 ${document.questions.length} 道题）`
    try {
      await navigator.clipboard.writeText(shareText)
      MetisMessage.success('题单分享信息已复制')
    } catch {
      MetisMessage.info('分享面板已打开（原型演示）')
    }
  }

  return (
    <div className="document-action-toolbar" role="toolbar" aria-label="题单操作">
      <span className="document-action-item is-save">
        <MetisButton
          type="borderless"
          icon={saving ? <LoaderCircle className="is-spinning" size={16} /> : <Save size={16} />}
          disabled={!canSave || saving || contentBusy}
          onClick={onSave}
          data-track="/click/aiQuestionHome/save | 保存当前草稿 | 无"
        >保存</MetisButton>
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
      {showGenerateAnswerSheet ? (
        <span className="document-action-item">
          <MetisButton
            type="borderless"
            icon={<ClipboardList size={16} />}
            disabled={saving || contentBusy}
            onClick={onGenerateAnswerSheet}
            data-track="/click/aiQuestionHome/generateAnswerSheet | 生成答题卡 | 无"
          >生成答题卡</MetisButton>
        </span>
      ) : null}
      <span className="document-action-item">
        <MetisButton type="borderless" icon={<Download size={16} />} disabled={!hasQuestions} onClick={downloadDocument} data-track="/click/aiQuestionHome/downloadWord | 下载Word | 无">下载</MetisButton>
      </span>
      <span className="document-action-item">
        <MetisButton type="borderless" icon={<Printer size={16} />} disabled={!hasQuestions} onClick={printDocument} data-track="/click/aiQuestionHome/print | 打印题单 | 无">打印</MetisButton>
      </span>
      <span className="document-action-item">
        <MetisButton type="borderless" icon={<Share2 size={16} />} disabled={!hasQuestions} onClick={() => { void shareDocument() }} data-track="/click/aiQuestionHome/share | 分享题单 | 无">分享</MetisButton>
      </span>
    </div>
  )
}

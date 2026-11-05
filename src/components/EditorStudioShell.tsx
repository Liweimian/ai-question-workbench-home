import { useState, type ReactNode } from 'react'
import { Trash2, X } from 'lucide-react'
import { defaultDocumentFormat } from '../prototype/types'
import type { DocumentFormat, PaperAnswerMode, WorkbenchDocument, WorkbenchDocumentKind } from '../prototype/types'
import { ExpandedDocumentToolbar } from './ExpandedDocumentToolbar'

interface EditorStudioShellProps {
  document: WorkbenchDocument
  onDocumentFormatChange: (patch: Partial<DocumentFormat>) => void
  onKindChange: (kind: WorkbenchDocumentKind) => void
  onAnswerModeChange: (mode: PaperAnswerMode) => void
  onOpenScoreSettings?: () => void
  sortPanel: ReactNode
  inspector: ReactNode
  children: ReactNode
}

export function EditorStudioShell({
  document,
  onDocumentFormatChange,
  onKindChange,
  onAnswerModeChange,
  onOpenScoreSettings,
  sortPanel,
  inspector,
  children,
}: EditorStudioShellProps) {
  const documentFormat = { ...defaultDocumentFormat, ...document.format }
  const [deletedPanelOpen, setDeletedPanelOpen] = useState(false)

  return (
    <div className="editor-studio" aria-label="线上题单编辑器">
      <div className="editor-studio-toolbar-row">
        <ExpandedDocumentToolbar
          document={document}
          value={documentFormat}
          onChange={onDocumentFormatChange}
          onKindChange={onKindChange}
          onAnswerModeChange={onAnswerModeChange}
          onOpenScoreSettings={onOpenScoreSettings}
        />
      </div>

      <div className="editor-studio-body">
        {sortPanel}
        <div className="editor-studio-canvas">{children}</div>
        {inspector}
      </div>

      <button
        type="button"
        className={`editor-studio-deleted-trigger${deletedPanelOpen ? ' is-open' : ''}`}
        aria-label="查看已删除题目"
        aria-expanded={deletedPanelOpen}
        aria-controls="editor-studio-deleted-panel"
        onClick={() => setDeletedPanelOpen((open) => !open)}
      >
        <Trash2 size={17} aria-hidden="true" />
        <span>已删除题目</span>
      </button>

      {deletedPanelOpen ? (
        <aside id="editor-studio-deleted-panel" className="editor-studio-deleted-panel" aria-label="已删除题目">
          <header>
            <strong>已删除题目</strong>
            <button type="button" aria-label="关闭已删除题目" onClick={() => setDeletedPanelOpen(false)}>
              <X size={17} />
            </button>
          </header>
          <div className="editor-studio-deleted-empty">
            <Trash2 size={28} aria-hidden="true" />
            <p>暂无已删除题目</p>
          </div>
        </aside>
      ) : null}
    </div>
  )
}

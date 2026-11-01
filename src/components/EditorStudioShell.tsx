import type { ReactNode } from 'react'
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
    </div>
  )
}

import { ChevronRight, X } from 'lucide-react'
import type { WorkbenchDocumentKind } from '../prototype/types'

interface SaveAsDialogProps {
  open: boolean
  pending?: boolean
  onClose: () => void
  onSelect: (kind: WorkbenchDocumentKind) => void
}

const saveAsOptions: Array<{
  kind: WorkbenchDocumentKind
  glyph: string
  title: string
  description: string
  tone: 'list' | 'paper'
}> = [
  {
    kind: '题单',
    glyph: '题',
    title: '保存为题单',
    description: '平时练习、布置作业，无需分值',
    tone: 'list',
  },
  {
    kind: '试卷',
    glyph: '卷',
    title: '保存为试卷',
    description: '测验、考试，需完成分值设置',
    tone: 'paper',
  },
]

export function SaveAsDialog({ open, pending = false, onClose, onSelect }: SaveAsDialogProps) {
  if (!open) return null

  return (
    <div
      className="save-as-popover"
      role="dialog"
      aria-modal="false"
      aria-labelledby="save-as-dialog-title"
    >
      <header className="save-as-dialog-header">
        <strong id="save-as-dialog-title">保存为</strong>
        <button type="button" className="save-as-dialog-close" aria-label="关闭" disabled={pending} onClick={onClose}>
          <X size={14} />
        </button>
      </header>
      <div className="save-as-dialog-options">
        {saveAsOptions.map(({ kind, glyph, title, description, tone }) => (
          <button
            type="button"
            key={kind}
            className="save-as-option"
            disabled={pending}
            onClick={() => onSelect(kind)}
            data-track="/click/aiQuestionHome/saveAs | 选择保存类型 | kind#STRING"
          >
            <span className={`save-as-option-icon is-${tone}`} aria-hidden="true">{glyph}</span>
            <span className="save-as-option-copy">
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <ChevronRight size={16} className="save-as-option-arrow" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}

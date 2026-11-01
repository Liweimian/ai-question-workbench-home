import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import type { PaperAnswerMode, WorkbenchDocument, WorkbenchDocumentKind } from '../prototype/types'
import { canSwitchAnswerMode, canSwitchDocumentKind, countUnsetScores, getDocumentKind, getPaperAnswerMode, sumQuestionScores } from '../utils/documentEditorUtils'

interface DocumentEditorControlsProps {
  document: WorkbenchDocument
  variant?: 'expanded'
  hideScoreHint?: boolean
  onKindChange: (kind: WorkbenchDocumentKind) => void
  onAnswerModeChange: (mode: PaperAnswerMode) => void
}

const answerModes: PaperAnswerMode[] = ['原卷作答', '答题卡作答']

export function DocumentEditorControls({ document, variant, hideScoreHint = false, onKindChange, onAnswerModeChange }: DocumentEditorControlsProps) {
  const kind = getDocumentKind(document)
  const answerMode = getPaperAnswerMode(document)
  const typeLocked = !canSwitchDocumentKind(document)
  const answerModeLocked = !canSwitchAnswerMode(document)
  const unsetScores = countUnsetScores(document.questions)
  const totalScore = sumQuestionScores(document.questions)
  const [answerMenuOpen, setAnswerMenuOpen] = useState(false)
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!answerMenuOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if ((event.target as HTMLElement).closest?.('.document-answer-mode-menu')) return
      setAnswerMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAnswerMenuOpen(false)
    }
    window.document.addEventListener('mousedown', closeOnOutside)
    window.document.addEventListener('keydown', closeOnEscape)
    return () => {
      window.document.removeEventListener('mousedown', closeOnOutside)
      window.document.removeEventListener('keydown', closeOnEscape)
    }
  }, [answerMenuOpen])

  const openAnswerMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setMenuRect({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 174) })
    setAnswerMenuOpen(true)
  }

  const trySwitchKind = (nextKind: WorkbenchDocumentKind) => {
    if (typeLocked && kind !== nextKind) {
      MetisMessage.info('已下载或布置后，不能再切换题单 / 试卷类型')
      return
    }
    onKindChange(nextKind)
  }

  const trySwitchAnswerMode = (mode: PaperAnswerMode) => {
    if (mode !== answerMode && answerModeLocked) {
      MetisMessage.info('已生成答题卡后，不能再切换作答方式')
      setAnswerMenuOpen(false)
      return
    }
    onAnswerModeChange(mode)
    setAnswerMenuOpen(false)
  }

  return (
    <div className={`document-editor-controls${variant === 'expanded' ? ' is-expanded document-editor-mode-zone' : ''}`} aria-label="题单类型与试卷设置">
      <div className={`document-type-switch${variant === 'expanded' ? ' is-ole-type-switch' : ''}`} role="tablist" aria-label="保存类型">
        <button
          type="button"
          role="tab"
          aria-selected={kind === '题单'}
          className={kind === '题单' ? 'is-active' : undefined}
          disabled={typeLocked && kind !== '题单'}
          onClick={() => trySwitchKind('题单')}
        >
          题单
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === '试卷'}
          className={kind === '试卷' ? 'is-active' : undefined}
          disabled={typeLocked && kind !== '试卷'}
          onClick={() => trySwitchKind('试卷')}
        >
          试卷
        </button>
      </div>
      {kind === '试卷' ? (
        <>
          <div className={`document-answer-mode${answerMenuOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              ref={triggerRef}
              className="document-answer-mode-trigger"
              aria-label="作答方式"
              aria-expanded={answerMenuOpen}
              onClick={() => (answerMenuOpen ? setAnswerMenuOpen(false) : openAnswerMenu())}
            >
              <span className="document-answer-mode-icon" aria-hidden="true">▣</span>
              {answerMode}
              <ChevronDown size={14} />
            </button>
            {answerMenuOpen && menuRect
              ? createPortal(
                  <div
                    className="document-answer-mode-menu is-portal"
                    role="listbox"
                    aria-label="作答方式"
                    style={{ top: menuRect.top, left: menuRect.left, minWidth: menuRect.width }}
                  >
                    {answerModes.map((mode) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={mode === answerMode}
                        className={mode === answerMode ? 'is-selected' : undefined}
                        key={mode}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          trySwitchAnswerMode(mode)
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>,
                  window.document.body,
                )
              : null}
          </div>
          {!hideScoreHint ? (
            <div className="document-paper-score-hint" aria-live="polite">
              {document.questions.length === 0
                ? '添加题目后可设置分值'
                : unsetScores > 0
                  ? `还有 ${unsetScores} 道题未设置分值`
                  : `满分 ${totalScore} 分`}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import type { PaperAnswerMode, WorkbenchDocument, WorkbenchDocumentKind } from '../prototype/types'
import { canSwitchAnswerMode, canSwitchDocumentKind, countUnsetScores, getDocumentKind, getPaperAnswerMode, needsPaperScoreSettings, sumQuestionScores } from '../utils/documentEditorUtils'

interface DocumentEditorControlsProps {
  document: WorkbenchDocument
  variant?: 'expanded' | 'compact'
  hideScoreHint?: boolean
  onKindChange: (kind: WorkbenchDocumentKind) => void
  onAnswerModeChange?: (mode: PaperAnswerMode) => void
}

const answerModes: PaperAnswerMode[] = ['原卷作答', '答题卡作答']

export function DocumentEditorControls({ document, variant, hideScoreHint = false, onKindChange, onAnswerModeChange }: DocumentEditorControlsProps) {
  const kind = getDocumentKind(document)
  const answerMode = getPaperAnswerMode(document)
  const typeLocked = !canSwitchDocumentKind(document)
  const answerModeLocked = !canSwitchAnswerMode(document)
  const unsetScores = countUnsetScores(document.questions)
  const totalScore = sumQuestionScores(document.questions)
  const scoreSettingsPending = needsPaperScoreSettings(document, kind)
  const [kindMenuOpen, setKindMenuOpen] = useState(false)
  const [compactMenuLevel, setCompactMenuLevel] = useState<'kind' | 'answer-mode'>('kind')
  const [answerMenuOpen, setAnswerMenuOpen] = useState(false)
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const kindTriggerRef = useRef<HTMLButtonElement>(null)
  const kindMenuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!answerMenuOpen && !kindMenuOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !(event.target as HTMLElement).closest?.('.document-answer-mode-menu')) {
        setAnswerMenuOpen(false)
      }
      const insideCompactKindMenu = kindMenuRef.current?.contains(target)
        || Boolean((event.target as HTMLElement).closest?.('.document-kind-answer-submenu'))
      if (!kindTriggerRef.current?.contains(target) && !insideCompactKindMenu) {
        setKindMenuOpen(false)
        setCompactMenuLevel('kind')
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAnswerMenuOpen(false)
        setKindMenuOpen(false)
        setCompactMenuLevel('kind')
      }
    }
    window.document.addEventListener('mousedown', closeOnOutside)
    window.document.addEventListener('keydown', closeOnEscape)
    return () => {
      window.document.removeEventListener('mousedown', closeOnOutside)
      window.document.removeEventListener('keydown', closeOnEscape)
    }
  }, [answerMenuOpen, kindMenuOpen])

  const openAnswerMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setMenuRect({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 174) })
    setAnswerMenuOpen(true)
  }

  const trySwitchKind = (nextKind: WorkbenchDocumentKind) => {
    if (typeLocked && kind !== nextKind) {
      MetisMessage.info('当前文档已输出或生成答题卡，不能再切换练习 / 试卷类型')
      return
    }
    onKindChange(nextKind)
    setKindMenuOpen(false)
    setCompactMenuLevel('kind')
  }

  const trySwitchAnswerMode = (mode: PaperAnswerMode) => {
    if (mode !== answerMode && answerModeLocked) {
      MetisMessage.info('当前不能切换作答方式')
      setAnswerMenuOpen(false)
      return
    }
    onAnswerModeChange?.(mode)
    setAnswerMenuOpen(false)
    setKindMenuOpen(false)
    setCompactMenuLevel('kind')
  }

  const openCompactKindMenu = () => {
    setCompactMenuLevel('kind')
    setKindMenuOpen((open) => !open)
  }

  const openCompactAnswerModes = () => {
    if (typeLocked && kind !== '试卷') {
      MetisMessage.info('当前文档已输出或生成答题卡，不能再切换练习 / 试卷类型')
      return
    }
    setCompactMenuLevel('answer-mode')
  }

  const selectCompactAnswerMode = (mode: PaperAnswerMode) => {
    if (mode !== answerMode && answerModeLocked) {
      MetisMessage.info('当前不能切换作答方式')
      return
    }
    if (kind !== '试卷') onKindChange('试卷')
    onAnswerModeChange?.(mode)
    setKindMenuOpen(false)
    setCompactMenuLevel('kind')
  }

  if (variant === 'compact') {
    return (
      <div className="document-editor-controls is-compact" aria-label="当前文档类型">
        <button
          type="button"
          ref={kindTriggerRef}
          className={`document-kind-compact-trigger${scoreSettingsPending ? ' has-pending-settings' : ''}`}
          aria-label={kind === '试卷' ? `当前为试卷，${answerMode}` : '当前为练习，点击切换'}
          aria-haspopup="listbox"
          aria-expanded={kindMenuOpen}
          title={scoreSettingsPending ? '试卷分值将在保存或输出时设置' : `当前为${kind}`}
          onClick={openCompactKindMenu}
        >
          <span>{kind === '试卷' ? `试卷 · ${answerMode === '答题卡作答' ? '答题卡' : '原卷'}` : '练习'}</span>
          {scoreSettingsPending ? <i aria-hidden="true" /> : null}
          <ChevronDown size={13} />
        </button>
        {kindMenuOpen ? (
          <div className="document-kind-compact-menu" role="listbox" aria-label="切换文档类型" ref={kindMenuRef}>
            <button type="button" role="option" aria-selected={kind === '练习'} className={kind === '练习' ? 'is-selected' : undefined} onClick={() => trySwitchKind('练习')}>
              <span className="document-kind-menu-copy"><b>练习</b><small>日常练习，保存无需设置分值</small></span>
              {kind === '练习' ? <Check size={15} aria-hidden="true" /> : null}
            </button>
            <button type="button" role="option" aria-selected={kind === '试卷'} className={`${kind === '试卷' ? 'is-selected ' : ''}${compactMenuLevel === 'answer-mode' ? 'is-submenu-open' : ''}`.trim() || undefined} onClick={openCompactAnswerModes}>
              <span className="document-kind-menu-copy"><b>试卷</b><small>继续选择作答方式</small></span>
              <ChevronRight size={15} aria-hidden="true" />
            </button>
            {compactMenuLevel === 'answer-mode' ? (
              <div className="document-kind-answer-submenu" role="listbox" aria-label="选择作答方式">
                {answerModes.map((mode) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={kind === '试卷' && mode === answerMode}
                    className={kind === '试卷' && mode === answerMode ? 'is-selected' : undefined}
                    key={mode}
                    onClick={(event) => {
                      event.stopPropagation()
                      selectCompactAnswerMode(mode)
                    }}
                  >
                    <span className="document-kind-menu-copy"><b>{mode}</b></span>
                    {kind === '试卷' && mode === answerMode ? <Check size={15} aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`document-editor-controls${variant === 'expanded' ? ' is-expanded document-editor-mode-zone' : ''}`} aria-label="练习类型与试卷设置">
      <div className={`document-type-switch${variant === 'expanded' ? ' is-ole-type-switch' : ''}`} role="tablist" aria-label="保存类型">
        <button
          type="button"
          role="tab"
          aria-selected={kind === '练习'}
          className={kind === '练习' ? 'is-active' : undefined}
          disabled={typeLocked && kind !== '练习'}
          onClick={() => trySwitchKind('练习')}
        >
          练习
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

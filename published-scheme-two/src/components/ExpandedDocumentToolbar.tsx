import { useState } from 'react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import { AlignJustify, MoveHorizontal, Rows3 } from 'lucide-react'
import type { DocumentFormat, PaperAnswerMode, WorkbenchDocument, WorkbenchDocumentKind } from '../prototype/types'
import { getDocumentKind } from '../utils/documentEditorUtils'
import { DocumentEditorControls } from './DocumentEditorControls'

interface ExpandedDocumentToolbarProps {
  document: WorkbenchDocument
  value: DocumentFormat
  onChange: (patch: Partial<DocumentFormat>) => void
  onKindChange: (kind: WorkbenchDocumentKind) => void
  onAnswerModeChange: (mode: PaperAnswerMode) => void
  onOpenScoreSettings?: () => void
}

export function ExpandedDocumentToolbar({
  document,
  value,
  onChange,
  onKindChange,
  onAnswerModeChange,
  onOpenScoreSettings,
}: ExpandedDocumentToolbarProps) {
  const kind = getDocumentKind(document)
  const [pageLayout, setPageLayout] = useState('a4-portrait-single')
  const [aiGrading, setAiGrading] = useState('on')
  const [questionFrame, setQuestionFrame] = useState('hidden')

  const analysisLabel = kind === '试卷' ? '试卷分析' : '题单分析'

  return (
    <div className="document-editor-toolbar is-expanded-studio" role="toolbar" aria-label="整份编辑工具栏">
      <DocumentEditorControls
        document={document}
        variant="expanded"
        hideScoreHint
        onKindChange={onKindChange}
        onAnswerModeChange={onAnswerModeChange}
      />
      <span className="document-studio-divider" aria-hidden="true" />
      <label title="字号">
        <span className="document-format-size-icon" aria-hidden="true">T</span>
        <select
          value={value.fontSize}
          aria-label="字号"
          onChange={(event) => onChange({ fontSize: event.target.value as DocumentFormat['fontSize'] })}
        >
          <option value="14">小五</option>
          <option value="16">五号</option>
          <option value="18">小四</option>
        </select>
      </label>
      <label title="段落间距">
        <AlignJustify size={15} aria-hidden="true" />
        <select
          value={value.paragraphSpacing}
          aria-label="段落间距"
          onChange={(event) => onChange({ paragraphSpacing: event.target.value as DocumentFormat['paragraphSpacing'] })}
        >
          <option value="1">1.0</option>
          <option value="1.5">1.5</option>
          <option value="2">2.0</option>
        </select>
      </label>
      <label title="行距">
        <Rows3 size={15} aria-hidden="true" />
        <select
          value={value.lineHeight}
          aria-label="行距"
          onChange={(event) => onChange({ lineHeight: event.target.value as DocumentFormat['lineHeight'] })}
        >
          <option value="1.5">1.5</option>
          <option value="1.7">1.7</option>
          <option value="2">2.0</option>
        </select>
      </label>
      <label title="字距">
        <MoveHorizontal size={15} aria-hidden="true" />
        <select
          value={value.letterSpacing}
          aria-label="字距"
          onChange={(event) => onChange({ letterSpacing: event.target.value as DocumentFormat['letterSpacing'] })}
        >
          <option value="0">1.0</option>
          <option value="0.5">1.5</option>
          <option value="1">2.0</option>
        </select>
      </label>
      <label className="document-studio-wide" title="页面布局">
        <select
          value={pageLayout}
          aria-label="页面布局"
          onChange={(event) => setPageLayout(event.target.value)}
        >
          <option value="a4-portrait-single">A4竖向单面</option>
          <option value="a4-portrait-double">A4 竖向双面</option>
          <option value="a4-landscape-single">A4 横向单面</option>
        </select>
      </label>
      <label className="document-studio-wide" title="AI 辅助批改">
        <select
          value={aiGrading}
          aria-label="AI 辅助批改"
          onChange={(event) => setAiGrading(event.target.value)}
        >
          <option value="on">AI辅助批改：开启</option>
          <option value="off">AI辅助批改：关闭</option>
        </select>
      </label>
      {kind === '试卷' ? (
        <button
          type="button"
          className="document-studio-action"
          onClick={() => onOpenScoreSettings?.()}
        >
          分数设置
        </button>
      ) : null}
      <label title="题目框">
        <select
          value={questionFrame}
          aria-label="题目框"
          onChange={(event) => setQuestionFrame(event.target.value)}
        >
          <option value="hidden">题目框：隐藏</option>
          <option value="visible">题目框：显示</option>
        </select>
      </label>
      <button
        type="button"
        className="document-studio-action"
        onClick={() => MetisMessage.info(`${analysisLabel}面板已打开（原型演示）`)}
      >
        {analysisLabel}
      </button>
    </div>
  )
}

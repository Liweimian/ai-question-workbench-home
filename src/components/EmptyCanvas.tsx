import { MetisButton } from '@yuanfudao/metis-web-component'
import { BookOpenCheck, ChevronRight, FileUp, Sparkles } from 'lucide-react'
import type { AsyncStatus } from '../prototype/types'
import { AiComposer } from './AiComposer'

interface EmptyCanvasProps {
  prompt: string
  promptError: string
  generateStatus: AsyncStatus
  loadingRecent: boolean
  contentBusy: boolean
  onPromptChange: (value: string) => void
  onGenerate: () => void
  onOpenResource: () => void
  onOpenUpload: () => void
  onOpenGenerate: () => void
  onContinueRecent: () => void
}

export function EmptyCanvas(props: EmptyCanvasProps) {
  return (
    <div className="empty-canvas" data-sec="2">
      <div className="empty-canvas-visual" aria-hidden="true">
        <div className="empty-visual-sheet empty-visual-sheet--back" />
        <div className="empty-visual-sheet empty-visual-sheet--front">
          <Sparkles size={24} />
        </div>
      </div>
      <h1>开始制作一份题单或试卷</h1>
      <p>先添加题目，保存或布置时再确定类型。</p>

      <div className="empty-primary-actions">
        <MetisButton
          type="primary"
          icon={<BookOpenCheck size={18} />}
          onClick={props.onOpenResource}
          data-track="/click/aiQuestionHome/startResource | 从资源库开始 | 无"
        >
          从资源库选题
        </MetisButton>
        <MetisButton
          type="bordered"
          icon={<FileUp size={18} />}
          onClick={props.onOpenUpload}
          data-track="/click/aiQuestionHome/startUpload | 从上传材料开始 | 无"
        >
          上传材料
        </MetisButton>
        <MetisButton
          type="borderless"
          icon={<Sparkles size={18} />}
          onClick={props.onOpenGenerate}
          data-track="/click/aiQuestionHome/startGenerate | 从AI组题开始 | 无"
        >
          让 AI 组题
        </MetisButton>
      </div>

      <div className="empty-source-note">
        可从练习册、试卷、题单、章节或知识点中添加，也可上传 PDF、Word 和图片。
      </div>

      <div className="empty-composer-wrap">
        <AiComposer
          value={props.prompt}
          error={props.promptError}
          status={props.generateStatus}
          disabled={props.contentBusy}
          onChange={props.onPromptChange}
          onSubmit={props.onGenerate}
        />
      </div>

      <button className="continue-link" type="button" onClick={props.onContinueRecent} disabled={props.contentBusy}>
        {props.loadingRecent ? '正在打开最近文档…' : '继续上次编辑 · 八年级数学一次函数随堂练习'}
        {!props.loadingRecent ? <ChevronRight size={15} /> : null}
      </button>
    </div>
  )
}

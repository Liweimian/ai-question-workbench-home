import { MetisButton } from '@yuanfudao/metis-web-component'
import { BookOpenCheck, BrainCircuit, FileQuestion, FileUp, Sparkles } from 'lucide-react'
import type { AddQuestionMode } from '../prototype/types'

interface EmptyCanvasProps {
  onOpenAdd: (mode: AddQuestionMode) => void
}

export function EmptyCanvas({ onOpenAdd }: EmptyCanvasProps) {
  return (
    <div className="editor-empty" data-sec="3">
      <header className="editor-empty-heading">
        <strong>未命名题单</strong>
        <span>初中数学 · 八年级上册 · 人教版　·0 道题</span>
      </header>
      <div className="editor-empty-content">
        <div className="editor-empty-icon"><FileQuestion size={28} /></div>
        <h1>题单还是空的</h1>
        <p>先从飞象题库选题，也可以让 AI 组题、出题或上传材料录题。</p>
        <MetisButton
          type="primary"
          icon={<BookOpenCheck size={17} />}
          onClick={() => onOpenAdd('resource')}
          data-track="/click/aiQuestionHome/openBankFromEmpty | 空题单从题库选题 | 无"
        >
          从题库选题
        </MetisButton>
        <div className="editor-empty-shortcuts" aria-label="其他添加方式">
          <button type="button" onClick={() => onOpenAdd('compose')}><BrainCircuit size={15} />AI 组题</button>
          <button type="button" onClick={() => onOpenAdd('create')}><Sparkles size={15} />AI 出题</button>
          <button type="button" onClick={() => onOpenAdd('upload')}><FileUp size={15} />上传录题</button>
        </div>
      </div>
    </div>
  )
}

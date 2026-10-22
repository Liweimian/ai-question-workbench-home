import type { AddQuestionMode } from '../prototype/types'
import { BlockAddMenu } from './BlockAddMenu'

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
        <h1>开始制作这份题单</h1>
        <p>像编辑文档一样，从页面中的加号开始添加题目。</p>
        <BlockAddMenu empty onOpenAdd={onOpenAdd} />
      </div>
    </div>
  )
}

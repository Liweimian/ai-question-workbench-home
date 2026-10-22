import { MetisButton } from '@yuanfudao/metis-web-component'
import { FileQuestion, Plus } from 'lucide-react'

interface EmptyCanvasProps {
  onAdd: () => void
}

export function EmptyCanvas({ onAdd }: EmptyCanvasProps) {
  return (
    <div className="editor-empty" data-sec="3">
      <div className="editor-empty-icon"><FileQuestion size={28} /></div>
      <h1>开始制作一份题单或试卷</h1>
      <p>所有来源统一从“添加题目”进入，保存时再确定为题单或试卷。</p>
      <MetisButton
        type="primary"
        icon={<Plus size={17} />}
        onClick={onAdd}
        data-track="/click/aiQuestionHome/addFirstQuestion | 添加第一道题 | 无"
      >
        添加第一道题
      </MetisButton>
    </div>
  )
}

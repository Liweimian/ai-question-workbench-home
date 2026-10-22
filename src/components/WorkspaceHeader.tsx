import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import { FileDown, MoreHorizontal, Save, Send, Undo2 } from 'lucide-react'

interface WorkspaceHeaderProps {
  documentTitle: string
  questionCount: number
  canUndo: boolean
  onUndo: () => void
}

export function WorkspaceHeader({
  documentTitle,
  questionCount,
  canUndo,
  onUndo,
}: WorkspaceHeaderProps) {
  const hasQuestions = questionCount > 0
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moreOpen) return
    const closeOnOutside = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [moreOpen])

  const output = (action: string) => {
    if (!hasQuestions) {
      MetisMessage.error('请先添加题目')
      return
    }
    MetisMessage.success(`${action}已进入演示流程，本轮不连接线上服务`)
  }

  return (
    <header className="fx-page-header workspace-header" data-sec="1">
      <div className="header-document-path" aria-label="当前题单路径">
        <span>题单</span>
        <span className="header-document-divider">/</span>
        <strong>{documentTitle?.trim() || '未命名题单'}</strong>
      </div>
      <div className="header-actions">
        <MetisButton
          type="borderless"
          icon={<Save size={17} />}
          disabled={!hasQuestions}
          onClick={() => output('保存')}
          data-track="/click/aiQuestionHome/save | 保存当前草稿 | 无"
        >
          保存
        </MetisButton>
        <MetisButton
          type="borderless"
          icon={<Send size={17} />}
          disabled={!hasQuestions}
          onClick={() => output('布置')}
          data-track="/click/aiQuestionHome/assign | 布置当前内容 | 无"
        >
          布置
        </MetisButton>
        <div className="header-more" ref={moreRef}>
          <MetisButton
            type="borderless"
            icon={<MoreHorizontal size={18} />}
            aria-label="更多操作"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((open) => !open)}
          />
          {moreOpen ? (
            <div className="header-more-menu" role="menu" aria-label="更多题单操作">
              <button type="button" role="menuitem" disabled={!canUndo} onClick={() => { onUndo(); setMoreOpen(false) }} data-track="/click/aiQuestionHome/undo | 撤销上一步 | 无">
                <Undo2 size={16} /><span>撤销</span>
              </button>
              <button type="button" role="menuitem" disabled={!hasQuestions} onClick={() => { output('打印 / PDF'); setMoreOpen(false) }} data-track="/click/aiQuestionHome/export | 打印或导出PDF | 无">
                <FileDown size={16} /><span>打印 / PDF</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

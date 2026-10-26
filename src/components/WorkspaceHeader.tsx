import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import { FileDown, FilePlus2, MoreHorizontal, PanelRightOpen, Save, Send, Sparkles, Undo2 } from 'lucide-react'

interface WorkspaceHeaderProps {
  documentTitle: string
  questionCount: number
  canUndo: boolean
  onUndo: () => void
  onCreateNew: () => void
  sidePanelOpen: boolean
  onSidePanelOpen: () => void
}

export function WorkspaceHeader({
  documentTitle,
  questionCount,
  canUndo,
  onUndo,
  onCreateNew,
  sidePanelOpen,
  onSidePanelOpen,
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
    <header className={`fx-page-header workspace-header${sidePanelOpen ? ' is-split' : ''}`} data-sec="1">
      <div className="header-workbench-brand" aria-label="飞象组题工作台">
        <span className="header-workbench-mark"><Sparkles size={17} /></span>
        <div><strong>飞象组题</strong><small>本地草稿</small></div>
        <span className="header-current-document">{documentTitle?.trim() || '未命名组题'}</span>
      </div>
      <div className="header-actions">
        {!sidePanelOpen ? (
          <MetisButton
            type="bordered"
            icon={<PanelRightOpen size={17} />}
            onClick={onSidePanelOpen}
            data-track="/click/aiQuestionHome/openCompositionHub | 打开添加题目工作区 | 无"
          >
            添加题目
          </MetisButton>
        ) : null}
        <MetisButton
          type="borderless"
          icon={<FilePlus2 size={17} />}
          onClick={onCreateNew}
          data-track="/click/aiQuestionHome/createBlank | 新建空白题单 | 无"
        >
          新建
        </MetisButton>
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

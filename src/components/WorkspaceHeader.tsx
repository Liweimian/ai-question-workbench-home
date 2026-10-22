import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import { ChevronDown, FileDown, Plus, Save, Send, Undo2 } from 'lucide-react'

interface WorkspaceHeaderProps {
  questionCount: number
  canUndo: boolean
  onUndo: () => void
  onAdd: () => void
}

export function WorkspaceHeader({ questionCount, canUndo, onUndo, onAdd }: WorkspaceHeaderProps) {
  const hasQuestions = questionCount > 0
  const output = (action: string) => {
    if (!hasQuestions) {
      MetisMessage.error('请先添加题目')
      return
    }
    MetisMessage.success(`${action}已进入演示流程，本轮不连接线上服务`)
  }

  return (
    <header className="fx-page-header workspace-header" data-sec="1">
      <div className="header-identity">
        <div className="breadcrumb-row">
          <span>首页</span>
          <span className="breadcrumb-divider">/</span>
          <strong>AI 题库工作台</strong>
        </div>
        <button
          className="scope-switch"
          type="button"
          aria-label="切换任教范围"
          onClick={() => MetisMessage.info('任教范围切换已进入演示流程')}
        >
          初中数学 · 八年级上册 · 人教版 <ChevronDown size={14} />
        </button>
      </div>

      <div className="header-actions">
        <MetisButton
          type="borderless"
          icon={<Undo2 size={17} />}
          disabled={!canUndo}
          onClick={onUndo}
          data-track="/click/aiQuestionHome/undo | 撤销上一步 | 无"
        >
          撤销
        </MetisButton>
        <MetisButton
          type="bordered"
          icon={<Plus size={17} />}
          onClick={onAdd}
          data-track="/click/aiQuestionHome/openAddContent | 打开添加内容 | 无"
        >
          添加内容
        </MetisButton>
        <span className="header-action-divider" />
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
          type="bordered"
          icon={<FileDown size={17} />}
          disabled={!hasQuestions}
          onClick={() => output('打印 / PDF')}
          data-track="/click/aiQuestionHome/export | 打印或导出PDF | 无"
        >
          打印 / PDF
        </MetisButton>
        <MetisButton
          type="primary"
          icon={<Send size={17} />}
          disabled={!hasQuestions}
          onClick={() => output('布置')}
          data-track="/click/aiQuestionHome/assign | 布置当前内容 | 无"
        >
          布置
        </MetisButton>
      </div>
    </header>
  )
}

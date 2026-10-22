import { MetisButton } from '@yuanfudao/metis-web-component'
import { ArrowDownToLine, RefreshCw, Sparkles, WandSparkles, X } from 'lucide-react'
import type { AsyncStatus, Question, RewriteRequest } from '../prototype/types'

interface AiInspectorProps {
  question: Question
  questionNumber: number
  status: AsyncStatus
  preview: Question | null
  onRewrite: (instruction: RewriteRequest['instruction']) => void
  onApply: (mode: 'replace' | 'append') => void
  onClose: () => void
}

const actions: Array<{ label: RewriteRequest['instruction']; description: string }> = [
  { label: '换生活情境', description: '保留考点，改成真实场景' },
  { label: '降低难度', description: '减少步骤或运算复杂度' },
  { label: '提高难度', description: '增加推理与综合性' },
  { label: '同考点换题', description: '生成一道不同题目' },
  { label: '优化解析', description: '补全关键步骤和提醒' },
]

export function AiInspector(props: AiInspectorProps) {
  return (
    <aside className="side-panel ai-inspector" data-sec="5" aria-label="AI 改编面板">
      <div className="side-panel-header">
        <div>
          <h2><Sparkles size={19} /> AI 改编</h2>
          <p>目标：第 {props.questionNumber} 题 · {props.question.knowledgePoint}</p>
        </div>
        <MetisButton type="borderless" icon={<X size={18} />} aria-label="关闭 AI 改编" onClick={props.onClose} />
      </div>

      <div className="inspector-target">
        <span>原题</span>
        <p>{props.question.stem}</p>
      </div>

      <div className="side-panel-body inspector-body">
        <div className="inspector-section-heading">
          <strong>选择改编方式</strong>
          <span>结果会先预览，不会直接覆盖</span>
        </div>
        <div className="rewrite-action-list">
          {actions.map((action) => (
            <button
              type="button"
              key={action.label}
              disabled={props.status === 'loading'}
              onClick={() => props.onRewrite(action.label)}
              data-track="/click/aiQuestionHome/rewrite | 选择AI改编方式 | instruction#STRING"
            >
              <WandSparkles size={17} />
              <span><strong>{action.label}</strong><small>{action.description}</small></span>
            </button>
          ))}
        </div>

        {props.status === 'loading' ? (
          <div className="rewrite-loading"><RefreshCw size={18} /> AI 正在生成预览…</div>
        ) : null}

        {props.preview ? (
          <div className="rewrite-preview">
            <div className="rewrite-preview-label"><Sparkles size={16} /> 改编结果</div>
            <p>{props.preview.stem}</p>
            <div><span>{props.preview.difficulty}</span><span>{props.preview.knowledgePoint}</span></div>
            <div className="rewrite-preview-actions">
              <MetisButton type="bordered" icon={<RefreshCw size={16} />} onClick={() => props.onApply('replace')}>替换原题</MetisButton>
              <MetisButton type="primary" icon={<ArrowDownToLine size={16} />} onClick={() => props.onApply('append')}>新增到下方</MetisButton>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

import { MetisButton } from '@yuanfudao/metis-web-component'
import {
  ArrowDownToLine,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileQuestion,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import type {
  AsyncStatus,
  InspectorView,
  Question,
  RewriteRequest,
  WorkbenchDocument,
} from '../prototype/types'

interface QuestionInspectorProps {
  document: WorkbenchDocument
  question: Question | null
  questionNumber: number
  view: InspectorView
  status: AsyncStatus
  preview: Question | null
  onViewChange: (view: InspectorView) => void
  onRewrite: (instruction: RewriteRequest['instruction']) => void
  onApply: (mode: 'replace' | 'append') => void
}

const actions: Array<{ label: RewriteRequest['instruction']; description: string }> = [
  { label: '换生活情境', description: '考点不变，换真实场景' },
  { label: '降低难度', description: '减少步骤或运算复杂度' },
  { label: '提高难度', description: '增加推理与综合性' },
  { label: '同考点换题', description: '生成一道同类变式题' },
  { label: '优化解析', description: '补全步骤与易错提醒' },
]

const originLabel: Record<Question['origin'], string> = {
  'question-bank': '题库原题',
  'ai-original': 'AI 原创',
  upload: '上传识别',
  manual: '手工录入',
}

export function QuestionInspector(props: QuestionInspectorProps) {
  const totalMinutes = props.document.questions.reduce((sum, question) => sum + question.estimatedMinutes, 0)
  const difficultyCounts = props.document.questions.reduce<Record<string, number>>((counts, question) => {
    counts[question.difficulty] = (counts[question.difficulty] ?? 0) + 1
    return counts
  }, {})

  return (
    <aside className="question-inspector" data-sec="4" aria-label="题目辅助信息">
      <div className="inspector-tabs" role="tablist" aria-label="右侧辅助面板">
        <button
          type="button"
          className={props.view === 'info' ? 'is-active' : ''}
          onClick={() => props.onViewChange('info')}
          role="tab"
          aria-selected={props.view === 'info'}
        >
          题目信息
        </button>
        <button
          type="button"
          className={props.view === 'ai' ? 'is-active' : ''}
          onClick={() => props.onViewChange('ai')}
          role="tab"
          aria-selected={props.view === 'ai'}
          disabled={!props.question}
        >
          <Sparkles size={15} />AI 辅助
        </button>
      </div>

      {!props.question ? (
        <div className="inspector-scroll document-inspector-empty">
          <div className="document-inspector-icon"><FileQuestion size={24} /></div>
          <h2>{props.document.title}</h2>
          <p>选择一道题后，这里会显示来源、答案、解析和 AI 改编。</p>
          <div className="document-stat-grid">
            <span><strong>{props.document.questions.length}</strong>题目</span>
            <span><strong>{totalMinutes}</strong>分钟</span>
            <span><strong>{difficultyCounts['基础'] ?? 0}</strong>基础</span>
            <span><strong>{difficultyCounts['提升'] ?? 0}</strong>提升</span>
          </div>
        </div>
      ) : props.view === 'info' ? (
        <div className="inspector-scroll">
          <section className="inspector-source-summary">
            <span className={`origin-badge origin-badge--${props.question.origin}`}>
              {props.question.origin === 'ai-original' ? <Sparkles size={13} /> : <BookOpenCheck size={13} />}
              {originLabel[props.question.origin]}
            </span>
            <strong>{props.question.sourceLabel}</strong>
            <p>{props.question.sourceDetail ?? '当前组题资源'}</p>
            <div className="inspector-meta-line">初中 / 数学 / {props.question.type} / {props.question.difficulty} / {props.question.estimatedMinutes} 分钟</div>
            <div className="inspector-detail-line"><span>知识点：</span>{props.question.knowledgePoint}</div>
            <div className="inspector-detail-line"><span>核心素养：</span>运算能力、模型观念</div>
            {props.question.verifyStatus ? <span className="verify-status"><CheckCircle2 size={13} />{props.question.verifyStatus}</span> : null}
          </section>

          <section className="inspector-section answer-section">
            <h3>答案</h3>
            <p>{props.question.answer}</p>
          </section>
          <section className="inspector-section answer-section">
            <h3>解析</h3>
            <p>{props.question.analysis}</p>
          </section>
        </div>
      ) : (
        <div className="inspector-scroll ai-assistant-view">
          <div className="ai-target-card">
            <span><Sparkles size={14} />基于第 {props.questionNumber} 题改编</span>
            <p>{props.question.stem}</p>
          </div>
          <div className="inspector-section-heading">
            <strong>选择改编方式</strong>
            <span>先生成预览，不会直接覆盖原题</span>
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
                <WandSparkles size={16} />
                <span><strong>{action.label}</strong><small>{action.description}</small></span>
              </button>
            ))}
          </div>

          {props.status === 'loading' ? (
            <div className="rewrite-loading"><RefreshCw size={18} />AI 正在生成预览…</div>
          ) : null}

          {props.preview ? (
            <div className="rewrite-preview">
              <div className="rewrite-preview-label"><Sparkles size={16} />改编结果 · 待校验</div>
              <p>{props.preview.stem}</p>
              <div><span>{props.preview.difficulty}</span><span>{props.preview.knowledgePoint}</span></div>
              <div className="rewrite-preview-actions">
                <MetisButton type="bordered" icon={<RefreshCw size={16} />} onClick={() => props.onApply('replace')}>替换原题</MetisButton>
                <MetisButton type="primary" icon={<ArrowDownToLine size={16} />} onClick={() => props.onApply('append')}>新增到下方</MetisButton>
              </div>
            </div>
          ) : (
            <div className="ai-assistant-note"><Clock3 size={15} />生成结果会锁定当前题，切换题目后自动取消。</div>
          )}
        </div>
      )}
    </aside>
  )
}

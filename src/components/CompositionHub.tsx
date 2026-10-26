import {
  BookOpenCheck,
  BrainCircuit,
  ChevronRight,
  FileScan,
  GraduationCap,
  Library,
  School,
  Sparkles,
} from 'lucide-react'
import type {
  AddQuestionMode,
  AsyncStatus,
  HistoryDocumentSummary,
  OpenAddOptions,
} from '../prototype/types'
import { AiComposer } from './AiComposer'

interface CompositionHubProps {
  currentDocumentId: string
  histories: HistoryDocumentSummary[]
  historyStatus: AsyncStatus
  contentBusy: boolean
  composePrompt: string
  composeError: string
  composeStatus: AsyncStatus
  onOpenAdd: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onOpenDocument: (documentId: string) => void
  onReloadHistory: () => void
  onComposePromptChange: (value: string) => void
  onCompose: () => void
  onCollapse: () => void
}

const sourceEntries = [
  {
    mode: 'resource' as const,
    title: '飞象题库',
    description: '按知识点、题型和难度查找平台题目',
    action: '打开',
    icon: Library,
  },
  {
    mode: 'school' as const,
    title: '校本题库',
    description: '从学校和个人沉淀的资料中继续选题',
    action: '打开',
    icon: School,
  },
  {
    mode: 'upload' as const,
    title: '上传文件或图片',
    description: '直接拖入 Word、PDF 或图片，AI 自动拆题',
    action: '导入',
    icon: FileScan,
  },
]

export function CompositionHub(props: CompositionHubProps) {
  return (
    <aside className="composition-hub" data-sec="2" aria-label="添加题目工作区">
      <div className="composition-hub-scroll">
        <section className="composition-source-section" aria-labelledby="source-heading">
          <div className="composition-section-heading">
            <div><BookOpenCheck size={17} /><strong id="source-heading">添加题目</strong></div>
            <span>所有方式共用当前题稿</span>
          </div>
          <div className="composition-source-list">
            {sourceEntries.map(({ mode, title, description, action, icon: Icon }) => (
              <button
                type="button"
                className="composition-source-card"
                key={mode}
                disabled={props.contentBusy}
                onClick={() => props.onOpenAdd(mode)}
                data-track={`/click/aiQuestionHome/hub${mode} | 从添加区打开${title} | 无`}
              >
                <span className={`composition-source-icon is-${mode}`}><Icon size={19} /></span>
                <div><strong>{title}</strong><span>{description}</span></div>
                <span className="composition-source-action">{action}</span>
              </button>
            ))}
          </div>
        </section>

      </div>

      <footer className="composition-hub-composer">
        <div className="composition-ai-capabilities" aria-label="AI 添加能力">
          <button type="button" className="is-active" aria-current="true">
            <BrainCircuit size={16} />
            <span><strong>AI 组题</strong><small>对话描述要求，从题库挑题</small></span>
          </button>
          <button type="button" disabled={props.contentBusy} onClick={() => props.onOpenAdd('create')}>
            <Sparkles size={16} />
            <span><strong>AI 出题工具</strong><small>按教材、知识点与题量生成</small></span>
            <ChevronRight size={14} />
          </button>
          <button type="button" disabled={props.contentBusy} onClick={() => props.onOpenAdd('personalized')}>
            <GraduationCap size={16} />
            <span><strong>个性化练习</strong><small>结合材料与学情生成</small></span>
            <ChevronRight size={14} />
          </button>
        </div>
        <AiComposer
          compact
          kind="compose"
          value={props.composePrompt}
          error={props.composeError}
          status={props.composeStatus}
          disabled={props.contentBusy}
          onChange={props.onComposePromptChange}
          onSubmit={props.onCompose}
        />
      </footer>
    </aside>
  )
}

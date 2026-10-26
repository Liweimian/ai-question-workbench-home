import { MetisButton } from '@yuanfudao/metis-web-component'
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

const aiEntries = [
  { mode: 'compose' as const, title: 'AI 组题', description: '从题库智能挑题', icon: BrainCircuit },
  { mode: 'create' as const, title: 'AI 出题', description: '生成原创题并预览', icon: Sparkles },
  { mode: 'personalized' as const, title: '个性化练习', description: '结合材料与学情生成', icon: GraduationCap },
]

export function CompositionHub(props: CompositionHubProps) {
  return (
    <aside className="composition-hub" data-sec="2" aria-label="添加题目工作区">
      <div className="composition-hub-scroll">
        <section className="composition-source-section" aria-labelledby="source-heading">
          <div className="composition-section-heading">
            <div><BookOpenCheck size={17} /><strong id="source-heading">选择题目来源</strong></div>
            <span>所有方式共用当前题稿</span>
          </div>
          <div className="composition-source-list">
            {sourceEntries.map(({ mode, title, description, action, icon: Icon }) => (
              <article className="composition-source-card" key={mode}>
                <span className={`composition-source-icon is-${mode}`}><Icon size={19} /></span>
                <div><strong>{title}</strong><span>{description}</span></div>
                <MetisButton
                  type="borderless"
                  disabled={props.contentBusy}
                  onClick={() => props.onOpenAdd(mode)}
                  data-track={`/click/aiQuestionHome/hub${mode} | 从添加区打开${title} | 无`}
                >
                  {action}
                </MetisButton>
              </article>
            ))}
          </div>
        </section>

        <section className="composition-ai-section" aria-labelledby="ai-heading">
          <div className="composition-section-heading">
            <div><Sparkles size={17} /><strong id="ai-heading">飞象 AI</strong></div>
            <span>与题库选题并列的添加方式</span>
          </div>
          <div className="composition-ai-actions">
            {aiEntries.map(({ mode, title, description, icon: Icon }) => (
              <button type="button" key={mode} disabled={props.contentBusy} onClick={() => props.onOpenAdd(mode)}>
                <Icon size={17} />
                <span><strong>{title}</strong><small>{description}</small></span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </section>

      </div>

      <footer className="composition-hub-composer">
        <div><Sparkles size={15} /><strong>一句话组题</strong><span>从题库中挑选并直接加入左侧</span></div>
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

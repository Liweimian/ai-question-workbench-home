import {
  BookOpenCheck,
  BrainCircuit,
  FileScan,
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
  {
    mode: 'create' as const,
    title: 'AI 出题工具',
    description: '按教材、知识点与题量配置生成原创题',
    action: '设置',
    icon: Sparkles,
  },
]

const aiShortcuts = [
  {
    id: 'personalized',
    label: '个性化练习',
    prompt: '根据本班一次函数常见错因，从题库挑选 6 道针对性练习',
  },
  {
    id: 'compose',
    label: 'AI 组题',
    prompt: '从题库挑选 6 道一次函数基础题',
  },
  {
    id: 'paper',
    label: 'AI 组卷',
    prompt: '从题库组成一份 10 道题的一次函数单元练习卷，兼顾基础与提升',
  },
  {
    id: 'find-question',
    label: 'AI 找题',
    prompt: '从题库找 3 道一次函数图象与性质选择题，并加入当前题稿',
  },
  {
    id: 'find-paper',
    label: 'AI 找卷',
    prompt: '从题库找一份八年级上册一次函数单元测试卷，并将其中 10 道题加入当前题稿',
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

        <section className="composition-hub-composer" aria-labelledby="assistant-heading">
          <div className="composition-chat-heading">
            <div><BrainCircuit size={16} /><strong id="assistant-heading">AI 助手</strong></div>
            <span>发送后在 AI 助手 Tab 查看处理过程</span>
          </div>
          <div className="composition-chat-shortcuts" role="group" aria-label="AI 助手快捷方式">
            {aiShortcuts.map(({ id, label, prompt }) => {
              const selected = props.composePrompt === prompt
              return (
                <button
                  type="button"
                  key={id}
                  className={selected ? 'is-selected' : undefined}
                  aria-pressed={selected}
                  aria-label={`${label}，填入示例要求`}
                  disabled={props.contentBusy || props.composeStatus === 'loading'}
                  onClick={() => props.onComposePromptChange(prompt)}
                  data-track={`/click/aiQuestionHome/assistantShortcut${id} | 选择${label}快捷方式 | 无`}
                >
                  {label}
                </button>
              )
            })}
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
        </section>
      </div>
    </aside>
  )
}

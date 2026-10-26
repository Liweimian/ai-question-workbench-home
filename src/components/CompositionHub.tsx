import {
  BookOpenCheck,
  BrainCircuit,
  FileScan,
  FolderHeart,
  Library,
  School,
  Sparkles,
} from 'lucide-react'
import type {
  AddQuestionMode,
  AsyncStatus,
  OpenAddOptions,
} from '../prototype/types'
import { AiComposer } from './AiComposer'

interface CompositionHubProps {
  contentBusy: boolean
  composePrompt: string
  composeError: string
  composeStatus: AsyncStatus
  onOpenAdd: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onOpenMyResources: () => void
  onComposePromptChange: (value: string) => void
  onCompose: () => void
  onCollapse: () => void
}

const sourceEntries = [
  {
    mode: 'resource' as const,
    title: '飞象题库',
    description: '从平台题库按教材、知识点或题型选题',
    action: '去选题',
    icon: Library,
  },
  {
    mode: 'school' as const,
    title: '校本题库',
    description: '从学校和个人沉淀的资源中选题',
    action: '去选题',
    icon: School,
  },
  {
    mode: 'upload' as const,
    title: 'AI 智能录题',
    description: '上传 Word、PDF 或图片，自动识别并拆分题目',
    action: '去上传',
    icon: FileScan,
  },
  {
    mode: 'create' as const,
    title: 'AI 出题工具',
    description: '设置知识点、难度和题量，生成原创题',
    action: '去出题',
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
            <div><BookOpenCheck size={17} /><strong id="source-heading">先添加题目</strong></div>
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
            <button
              type="button"
              className="composition-source-card"
              disabled={props.contentBusy}
              onClick={props.onOpenMyResources}
              data-track="/click/aiQuestionHome/openMyResources | 从添加区打开我的资源 | 无"
            >
              <span className="composition-source-icon is-my-resources"><FolderHeart size={19} /></span>
              <div><strong>我的资源</strong><span>查看自己创建、上传和收藏的资源</span></div>
              <span className="composition-source-action">去查看</span>
            </button>
          </div>
        </section>

        <section className="composition-hub-composer" aria-labelledby="assistant-heading">
          <div className="composition-chat-heading">
            <div><BrainCircuit size={16} /><strong id="assistant-heading">或者，直接告诉 AI 你想要什么</strong></div>
            <span>AI 可以帮你找题、组题或组卷</span>
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

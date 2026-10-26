import { useState } from 'react'
import { MetisButton } from '@yuanfudao/metis-web-component'
import {
  BookOpenCheck,
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
  Question,
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
  createPrompt: string
  createError: string
  createStatus: AsyncStatus
  createPreview: Question[]
  onOpenAdd: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onOpenDocument: (documentId: string) => void
  onReloadHistory: () => void
  onComposePromptChange: (value: string) => void
  onCompose: () => void
  onCreatePromptChange: (value: string) => void
  onCreate: () => void
  onPersonalize: () => void
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

type AiAddMode = 'compose' | 'create' | 'personalized'

const aiModeDescriptions: Record<AiAddMode, string> = {
  compose: '从题库挑选并直接加入左侧',
  create: '生成原创题，预览确认后加入',
  personalized: '导入材料与学情，生成针对性练习',
}

export function CompositionHub(props: CompositionHubProps) {
  const [aiMode, setAiMode] = useState<AiAddMode>('compose')

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
        <div className="composition-ai-mode-bar">
          <Sparkles size={15} />
          <select aria-label="AI 添加方式" value={aiMode} disabled={props.contentBusy} onChange={(event) => setAiMode(event.target.value as AiAddMode)}>
            <option value="compose">题库组题</option>
            <option value="create">AI 出题</option>
            <option value="personalized">个性化练习</option>
          </select>
          <span>{aiModeDescriptions[aiMode]}</span>
        </div>
        {aiMode === 'compose' ? (
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
        ) : null}
        {aiMode === 'create' ? (
          <div className="composition-create-mode">
            <AiComposer
              compact
              kind="create"
              value={props.createPrompt}
              error={props.createError}
              status={props.createStatus}
              disabled={props.contentBusy}
              onChange={props.onCreatePromptChange}
              onSubmit={props.onCreate}
            />
            {props.createPreview.length > 0 ? (
              <button type="button" className="composition-create-preview" onClick={() => props.onOpenAdd('create')}>
                <span><strong>已生成 {props.createPreview.length} 道原创题</strong><small>待校验，查看预览后加入题稿</small></span>
                查看并确认
              </button>
            ) : null}
          </div>
        ) : null}
        {aiMode === 'personalized' ? (
          <div className="composition-personalized-mode">
            <MetisButton
              type="primary"
              block
              icon={<GraduationCap size={17} />}
              loading={props.contentBusy}
              disabled={props.contentBusy}
              onClick={props.onPersonalize}
              data-track="/click/aiQuestionHome/personalizeFromFile | 从统一AI入口生成个性化练习 | 无"
            >
              选择材料并生成练习
            </MetisButton>
          </div>
        ) : null}
      </footer>
    </aside>
  )
}

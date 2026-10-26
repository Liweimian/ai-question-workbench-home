import { useState } from 'react'
import { BrainCircuit, ChevronRight, Clock3, FileScan, FolderHeart, Library, School, Sparkles } from 'lucide-react'
import type { AddQuestionMode, AsyncStatus, HistoryDocumentSummary, OpenAddOptions } from '../prototype/types'
import { AiComposer } from './AiComposer'

interface CompositionHubProps {
  contentBusy: boolean
  composePrompt: string
  composeError: string
  composeStatus: AsyncStatus
  currentDocumentId: string
  histories: HistoryDocumentSummary[]
  historyStatus: AsyncStatus
  historyDisabled: boolean
  onOpenAdd: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onOpenMyResources: () => void
  onOpenAssistant: () => void
  onComposePromptChange: (value: string) => void
  onCompose: () => void
  onOpenDocument: (documentId: string) => void
}

const aiShortcuts = [
  { id: 'find', label: '找几道题', prompt: '从题库找 6 道适合当前教学进度的基础题' },
  { id: 'exercise', label: '组一份练习', prompt: '组成一份适合当前教学进度的 8 道题课堂练习' },
  { id: 'paper', label: '组一份试卷', prompt: '组成一份适合当前教学进度的 10 道题测试卷' },
  { id: 'layered', label: '分层练习', prompt: '按基础、巩固、提升组成一份分层练习' },
]

const libraryEntries = [
  { mode: 'resource' as const, title: '飞象题库', icon: Library },
  { mode: 'school' as const, title: '校本题库', icon: School },
]

export function CompositionHub(props: CompositionHubProps) {
  const [layout, setLayout] = useState<'compact' | 'flat'>('compact')
  const recentDocuments = props.histories.filter((item) => item.id !== props.currentDocumentId).slice(0, 3)

  const recentSection = (
    <section className="composition-action-section composition-recent-section" aria-labelledby={`recent-heading-${layout}`}>
      <h3 id={`recent-heading-${layout}`}>最近编辑</h3>
      {props.historyStatus === 'loading' && recentDocuments.length === 0 ? (
        <div className="composition-recent-skeleton" aria-label="正在加载最近题单"><span /><span /><span /></div>
      ) : null}
      {props.historyStatus !== 'loading' && recentDocuments.length === 0 ? <div className="composition-recent-state">暂无最近编辑的题单</div> : null}
      {recentDocuments.length > 0 ? <div className="composition-recent-list">
        {recentDocuments.map((item) => (
          <button type="button" key={item.id} disabled={props.historyDisabled} onClick={() => props.onOpenDocument(item.id)}>
            <span><strong>{item.title}</strong><small>{item.questionCount} 道题 · {item.status}</small></span>
            <small><Clock3 size={12} /> {item.updatedAt}</small>
          </button>
        ))}
      </div> : null}
    </section>
  )

  const flatEntries = [
    { id: 'resource', title: '飞象题库', description: '从平台题库按教材、知识点或题型选题', action: '去选题', icon: Library, onClick: () => props.onOpenAdd('resource') },
    { id: 'school', title: '校本题库', description: '从学校和个人沉淀的资源中选题', action: '去选题', icon: School, onClick: () => props.onOpenAdd('school') },
    { id: 'upload', title: 'AI 智能录题', description: '上传 Word、PDF 或图片，自动识别并拆分题目', action: '去上传', icon: FileScan, onClick: () => props.onOpenAdd('upload') },
    { id: 'create', title: 'AI 原创出题', description: '选择章节、设置题量和难度，生成原创题', action: '去出题', icon: Sparkles, onClick: () => props.onOpenAdd('create') },
    { id: 'resources', title: '我的资源', description: '查看自己创建、上传和收藏的资源', action: '去查看', icon: FolderHeart, onClick: props.onOpenMyResources },
    { id: 'assistant', title: 'AI 助手', description: '用一句话描述找题、组题或组卷需求', action: '去对话', icon: BrainCircuit, onClick: props.onOpenAssistant },
  ]

  return (
    <aside className="composition-hub is-ai-first" data-sec="2" aria-label="添加题目工作区">
      <div className="composition-hub-scroll">
        <div className={`composition-hub-content is-${layout}`}>
        <div className="composition-layout-switch" role="group" aria-label="首页布局方案">
          <button type="button" className={layout === 'compact' ? 'is-active' : undefined} aria-pressed={layout === 'compact'} onClick={() => setLayout('compact')}>方案一</button>
          <button type="button" className={layout === 'flat' ? 'is-active' : undefined} aria-pressed={layout === 'flat'} onClick={() => setLayout('flat')}>方案二</button>
        </div>
        {layout === 'flat' ? (
          <>
            <section className="composition-flat-section" aria-labelledby="flat-source-heading">
              <h3 id="flat-source-heading">添加题目</h3>
              <div className="composition-flat-list">
                {flatEntries.map(({ id, title, description, action, icon: Icon, onClick }) => (
                  <button type="button" key={id} disabled={props.contentBusy} onClick={onClick}>
                    <span><Icon size={20} /></span>
                    <div><strong>{title}</strong><small>{description}</small></div>
                    <em>{action}<ChevronRight size={15} /></em>
                  </button>
                ))}
              </div>
            </section>
            {recentSection}
          </>
        ) : (
          <>
        <section className="composition-ai-hero" aria-labelledby="assistant-heading">
          <div className="composition-ai-title"><Sparkles size={18} /><strong id="assistant-heading">想组一份什么样的练习？</strong></div>
          <AiComposer compact kind="compose" value={props.composePrompt} error={props.composeError} status={props.composeStatus} disabled={props.contentBusy} onChange={props.onComposePromptChange} onSubmit={props.onCompose} />
          <div className="composition-chat-shortcuts" role="group" aria-label="AI 助手快捷方式">
            {aiShortcuts.map(({ id, label, prompt }) => (
              <button type="button" key={id} className={props.composePrompt === prompt ? 'is-selected' : undefined} aria-pressed={props.composePrompt === prompt} disabled={props.contentBusy || props.composeStatus === 'loading'} onClick={() => props.onComposePromptChange(prompt)}>{label}</button>
            ))}
          </div>
        </section>

        <section className="composition-action-section" aria-labelledby="library-heading">
          <h3 id="library-heading">从题库选题</h3>
          <div className="composition-library-grid">
            {libraryEntries.map(({ mode, title, icon: Icon }) => (
              <button type="button" key={mode} className="is-primary-source" disabled={props.contentBusy} onClick={() => props.onOpenAdd(mode)}><span><Icon size={20} /></span><div><strong>{title}</strong><small>{mode === 'resource' ? '练习册、试卷、同步练习等' : '学校与个人沉淀的题目资源'}</small></div></button>
            ))}
            <button type="button" disabled={props.contentBusy} onClick={props.onOpenMyResources}><span><FolderHeart size={18} /></span><div><strong>我的资源</strong><small>查看已创建、上传和收藏</small></div></button>
          </div>
        </section>

        <section className="composition-action-section" aria-labelledby="generate-heading">
          <h3 id="generate-heading">按条件生成</h3>
          <div className="composition-generate-grid">
            <button type="button" disabled={props.contentBusy} onClick={() => props.onOpenAdd('upload')}><span className="composition-generate-icon"><FileScan size={20} /></span><div><strong>AI 智能录题</strong><small>上传 Word / PDF / 图片，自动拆题</small></div></button>
            <button type="button" disabled={props.contentBusy} onClick={() => props.onOpenAdd('create')}><span className="composition-generate-icon"><Sparkles size={20} /></span><div><strong>AI 原创出题</strong><small>选章节、设题量和难度，生成预览</small></div></button>
          </div>
        </section>

        {recentSection}
          </>
        )}
        </div>
      </div>
    </aside>
  )
}

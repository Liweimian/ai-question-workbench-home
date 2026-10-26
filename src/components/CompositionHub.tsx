import { Clock3, FileScan, FolderHeart, Library, School, Sparkles } from 'lucide-react'
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
  const recentDocuments = props.histories.filter((item) => item.id !== props.currentDocumentId).slice(0, 3)

  return (
    <aside className="composition-hub is-ai-first" data-sec="2" aria-label="添加题目工作区">
      <div className="composition-hub-scroll">
        <div className="composition-hub-content">
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

        <section className="composition-action-section composition-recent-section" aria-labelledby="recent-heading">
          <h3 id="recent-heading">最近编辑</h3>
          {props.historyStatus === 'loading' && recentDocuments.length === 0 ? <div className="composition-recent-state">正在加载题单…</div> : null}
          {props.historyStatus !== 'loading' && recentDocuments.length === 0 ? <div className="composition-recent-state">暂无最近编辑的题单</div> : null}
          <div className="composition-recent-list">
            {recentDocuments.map((item) => (
              <button type="button" key={item.id} disabled={props.historyDisabled} onClick={() => props.onOpenDocument(item.id)}>
                <span><strong>{item.title}</strong><small>{item.questionCount} 道题 · {item.status}</small></span>
                <small><Clock3 size={12} /> {item.updatedAt}</small>
              </button>
            ))}
          </div>
        </section>
        </div>
      </div>
    </aside>
  )
}

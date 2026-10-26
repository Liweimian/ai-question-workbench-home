import { useState } from 'react'
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
  { id: 'find', label: '找几道题', prompt: (scope: string) => `从题库找 6 道${scope}基础题` },
  { id: 'exercise', label: '组一份练习', prompt: (scope: string) => `围绕${scope}，组成一份 8 道题的课堂练习` },
  { id: 'paper', label: '组一份试卷', prompt: (scope: string) => `围绕${scope}，组成一份 10 道题的单元测试卷` },
  { id: 'layered', label: '分层练习', prompt: (scope: string) => `围绕${scope}，按基础、巩固、提升组成一份分层练习` },
]

const contextOptions = [
  { value: 'chapter-4', label: '八上 · 数学 · 人教版 · 第四章 一次函数', promptScope: '八年级第四章一次函数' },
  { value: 'chapter-5', label: '八上 · 数学 · 人教版 · 第五章 二元一次方程组', promptScope: '八年级第五章二元一次方程组' },
  { value: 'all', label: '八上 · 数学 · 人教版 · 全册', promptScope: '八年级上册数学' },
]

const libraryEntries = [
  { mode: 'resource' as const, title: '飞象题库', icon: Library },
  { mode: 'school' as const, title: '校本题库', icon: School },
]

export function CompositionHub(props: CompositionHubProps) {
  const [contextValue, setContextValue] = useState('chapter-4')
  const context = contextOptions.find((item) => item.value === contextValue) ?? contextOptions[0]
  const recentDocuments = props.histories.filter((item) => item.id !== props.currentDocumentId).slice(0, 3)

  return (
    <aside className="composition-hub is-ai-first" data-sec="2" aria-label="添加题目工作区">
      <div className="composition-hub-scroll">
        <section className="composition-ai-hero" aria-labelledby="assistant-heading">
          <label className="composition-context-select">
            <span>当前范围</span>
            <select aria-label="切换 AI 使用的教材章节" value={contextValue} onChange={(event) => setContextValue(event.target.value)}>
              {contextOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <div className="composition-ai-title"><Sparkles size={18} /><strong id="assistant-heading">想组一份什么样的练习？</strong></div>
          <AiComposer compact kind="compose" value={props.composePrompt} error={props.composeError} status={props.composeStatus} disabled={props.contentBusy} onChange={props.onComposePromptChange} onSubmit={props.onCompose} />
          <div className="composition-chat-shortcuts" role="group" aria-label="AI 助手快捷方式">
            {aiShortcuts.map(({ id, label, prompt }) => {
              const promptValue = prompt(context.promptScope)
              return <button type="button" key={id} className={props.composePrompt === promptValue ? 'is-selected' : undefined} aria-pressed={props.composePrompt === promptValue} disabled={props.contentBusy || props.composeStatus === 'loading'} onClick={() => props.onComposePromptChange(promptValue)}>{label}</button>
            })}
          </div>
        </section>

        <section className="composition-action-section" aria-labelledby="library-heading">
          <h3 id="library-heading">从题库选题</h3>
          <div className="composition-library-grid">
            {libraryEntries.map(({ mode, title, icon: Icon }) => (
              <button type="button" key={mode} className="is-primary-source" disabled={props.contentBusy} onClick={() => props.onOpenAdd(mode)}><span><Icon size={20} /></span><div><strong>{title}</strong><small>{mode === 'resource' ? '平台教材、试卷与同步练习' : '学校与个人沉淀的题目资源'}</small></div></button>
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
    </aside>
  )
}

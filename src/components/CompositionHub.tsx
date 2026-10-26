import { BookOpen, ChevronDown, FileScan, FolderHeart, Library, School, Sparkles } from 'lucide-react'
import type { AddQuestionMode, AsyncStatus, OpenAddOptions, QuestionType } from '../prototype/types'
import { AiComposer } from './AiComposer'

interface CompositionHubProps {
  contentBusy: boolean
  composePrompt: string
  composeError: string
  composeStatus: AsyncStatus
  questionCounts: Record<QuestionType, number>
  onOpenAdd: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onOpenMyResources: () => void
  onComposePromptChange: (value: string) => void
  onCompose: () => void
}

const aiShortcuts = [
  { id: 'find', label: '找几道题', prompt: '从题库找 6 道八年级一次函数基础题' },
  { id: 'exercise', label: '组一份练习', prompt: '围绕第四章一次函数，组成一份 8 道题的课堂练习' },
  { id: 'paper', label: '组一份试卷', prompt: '围绕第四章一次函数，组成一份 10 道题的单元测试卷' },
  { id: 'layered', label: '分层练习', prompt: '围绕第四章一次函数，按基础、巩固、提升组成一份分层练习' },
]

const libraryEntries = [
  { mode: 'resource' as const, title: '飞象题库', icon: Library },
  { mode: 'school' as const, title: '校本题库', icon: School },
]

export function CompositionHub(props: CompositionHubProps) {
  const missingAnswerCount = Math.max(0, 2 - props.questionCounts.解答题)
  const draftSummary = `选择 ${props.questionCounts.选择题} · 填空 ${props.questionCounts.填空题}${props.questionCounts.解答题 ? ` · 解答 ${props.questionCounts.解答题}` : '，还没有解答题'}`

  return (
    <aside className="composition-hub is-ai-first" data-sec="2" aria-label="添加题目工作区">
      <div className="composition-hub-scroll">
        <button type="button" className="composition-context" aria-label="切换当前教材范围">
          <BookOpen size={16} /><strong>八上 · 数学 · 人教版</strong><ChevronDown size={15} />
        </button>

        <section className="composition-ai-hero" aria-labelledby="assistant-heading">
          <div className="composition-ai-title"><Sparkles size={18} /><strong id="assistant-heading">想组一份什么样的练习？</strong></div>
          <AiComposer compact kind="compose" value={props.composePrompt} error={props.composeError} status={props.composeStatus} disabled={props.contentBusy} onChange={props.onComposePromptChange} onSubmit={props.onCompose} />
          <div className="composition-ai-scope">基于：<strong>第四章 一次函数</strong></div>
          <div className="composition-chat-shortcuts" role="group" aria-label="AI 助手快捷方式">
            {aiShortcuts.map(({ id, label, prompt }) => (
              <button type="button" key={id} className={props.composePrompt === prompt ? 'is-selected' : undefined} aria-pressed={props.composePrompt === prompt} disabled={props.contentBusy || props.composeStatus === 'loading'} onClick={() => props.onComposePromptChange(prompt)}>{label}</button>
            ))}
          </div>
          <div className="composition-draft-advice">
            <span>💡 当前题稿：{draftSummary}</span>
            {missingAnswerCount ? <button type="button" disabled={props.contentBusy || props.composeStatus === 'loading'} onClick={() => props.onComposePromptChange(`补充 ${missingAnswerCount} 道一次函数解答题，加入当前题稿`)}>补 {missingAnswerCount} 道解答题</button> : null}
          </div>
        </section>

        <section className="composition-action-section" aria-labelledby="library-heading">
          <h3 id="library-heading">从题库选题</h3>
          <div className="composition-library-grid">
            {libraryEntries.map(({ mode, title, icon: Icon }) => (
              <button type="button" key={mode} disabled={props.contentBusy} onClick={() => props.onOpenAdd(mode)}><span><Icon size={18} /></span><strong>{title}</strong></button>
            ))}
            <button type="button" disabled={props.contentBusy} onClick={props.onOpenMyResources}><span><FolderHeart size={18} /></span><strong>我的资源</strong></button>
          </div>
        </section>

        <section className="composition-action-section" aria-labelledby="generate-heading">
          <h3 id="generate-heading">按条件生成</h3>
          <div className="composition-generate-grid">
            <button type="button" disabled={props.contentBusy} onClick={() => props.onOpenAdd('upload')}><span className="composition-generate-icon"><FileScan size={20} /></span><strong>AI 智能录题</strong><small>上传 → 识别拆题</small></button>
            <button type="button" disabled={props.contentBusy} onClick={() => props.onOpenAdd('create')}><span className="composition-generate-icon"><Sparkles size={20} /></span><strong>AI 原创出题</strong><small>选章节 → 设题量 → 生成预览</small></button>
          </div>
        </section>
      </div>
    </aside>
  )
}

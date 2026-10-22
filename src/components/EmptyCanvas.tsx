import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisInput } from '@yuanfudao/metis-web-component'
import { BookOpenCheck, BrainCircuit, FilePenLine, FileUp, Send, Sparkles, X } from 'lucide-react'
import type { AddQuestionMode, AsyncStatus, WorkbenchDocument } from '../prototype/types'
import { BlockAddMenu } from './BlockAddMenu'

interface EmptyCanvasProps {
  document: WorkbenchDocument
  aiOpen: boolean
  aiStatus: AsyncStatus
  aiError: string
  onTitleChange: (title: string) => void
  onAiOpen: () => void
  onAiClose: () => void
  onStartAi: (mode: 'compose' | 'create', prompt: string) => void
  onOpenAdd: (mode: AddQuestionMode) => void
}

const quickStarts: Array<{
  mode: Exclude<AddQuestionMode, 'menu'>
  label: string
  icon: typeof Sparkles
  primary?: boolean
}> = [
  { mode: 'resource', label: '从题库选题', icon: BookOpenCheck, primary: true },
  { mode: 'compose', label: 'AI 智能组题', icon: BrainCircuit },
  { mode: 'create', label: 'AI 出题', icon: Sparkles },
  { mode: 'upload', label: '上传录题', icon: FileUp },
  { mode: 'manual', label: '手工录入', icon: FilePenLine },
]

const promptSuggestions = [
  '组一份 20 分钟的一次函数随堂练习',
  '从题库找 8 道一次函数基础题',
  '按基础 6 题、提升 4 题做分层作业',
]

export function EmptyCanvas(props: EmptyCanvasProps) {
  const [prompt, setPrompt] = useState('')
  const emptyBlockRef = useRef<HTMLDivElement>(null)

  const closeAi = () => {
    props.onAiClose()
    window.requestAnimationFrame(() => emptyBlockRef.current?.focus())
  }

  useEffect(() => {
    emptyBlockRef.current?.focus()
  }, [props.document.id])

  return (
    <article className="editor-empty" data-sec="3" aria-label="空白题单编辑区">
      <header className="editor-empty-heading">
        <MetisInput
          value={props.document.title}
          onChange={(event) => props.onTitleChange(event.target.value)}
          className="empty-title-input"
          aria-label="题单标题"
        />
        <span>{props.document.gradeSubject} · 0 道题</span>
      </header>

      <div className="editor-empty-content">
        <div
          className="empty-first-block"
          ref={emptyBlockRef}
          tabIndex={0}
          role="group"
          aria-label="题单空白编辑块"
          onKeyDown={(event) => {
            const isBlankBlock = event.target === event.currentTarget
            const hasModifier = event.metaKey || event.ctrlKey || event.altKey || event.shiftKey
            if (isBlankBlock && !hasModifier && event.code === 'Space' && !event.nativeEvent.isComposing && !event.repeat && !props.aiOpen) {
              event.preventDefault()
              props.onAiOpen()
            }
          }}
        >
          <BlockAddMenu empty onOpenAdd={props.onOpenAdd} />
          <span className="empty-block-hint"><strong>按 Space 唤起 AI</strong>，或按 / 添加题目</span>
        </div>

        {props.aiOpen ? (
          <section className="inline-ai-dialog" aria-label="AI 组题助手">
            <header>
              <span><Sparkles size={17} /></span>
              <div><strong>AI 组题助手</strong><small>优先使用题库原题，并保留来源</small></div>
              <button type="button" aria-label="关闭 AI 组题助手" onClick={closeAi}><X size={16} /></button>
            </header>
            <div className="inline-ai-input">
              <MetisInput
                autoFocus
                value={prompt}
                disabled={props.aiStatus === 'loading'}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="描述年级、知识点、难度、题量或作答时长"
                aria-label="AI 组题要求"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') closeAi()
                  if (event.key === 'Enter' && props.aiStatus !== 'loading' && !event.nativeEvent.isComposing && prompt.trim()) props.onStartAi('compose', prompt.trim())
                }}
              />
              <MetisButton type="primary" icon={<Send size={15} />} loading={props.aiStatus === 'loading'} disabled={!prompt.trim()} onClick={() => props.onStartAi('compose', prompt.trim())}>发送</MetisButton>
            </div>
            <div className="inline-ai-suggestions">
              {promptSuggestions.map((suggestion) => <button type="button" key={suggestion} disabled={props.aiStatus === 'loading'} onClick={() => setPrompt(suggestion)}>{suggestion}</button>)}
            </div>
            {props.aiError ? <p className="inline-ai-error" role="alert">{props.aiError}</p> : null}
            <footer>
              <span>Enter 发送 · Esc 关闭</span>
              <button type="button" disabled={!prompt.trim() || props.aiStatus === 'loading'} onClick={() => props.onStartAi('create', prompt.trim())}><Sparkles size={13} />改为 AI 原创出题</button>
            </footer>
          </section>
        ) : null}

        <section className="empty-quick-start" aria-label="快速开始">
          <span>快速开始</span>
          <div>
            {quickStarts.map(({ mode, label, icon: Icon, primary }) => (
              <button type="button" key={mode} className={primary ? 'is-primary' : ''} onClick={() => props.onOpenAdd(mode)}><Icon size={15} />{label}</button>
            ))}
          </div>
        </section>
      </div>
    </article>
  )
}

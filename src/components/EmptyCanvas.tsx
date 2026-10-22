import { useEffect, useRef, useState } from 'react'
import { MetisButton, MetisInput } from '@yuanfudao/metis-web-component'
import { BookOpenCheck, BrainCircuit, FileUp, GraduationCap, School, Send, Sparkles, X } from 'lucide-react'
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

const quickStartGroups: Array<{
  title: string
  items: Array<{
    mode: Exclude<AddQuestionMode, 'menu' | 'manual'>
    label: string
    description: string
    icon: typeof Sparkles
    primary?: boolean
  }>
}> = [
  {
    title: '添加已有内容',
    items: [
      { mode: 'resource', label: '飞象题库选题', description: '平台题库', icon: BookOpenCheck, primary: true },
      { mode: 'school', label: '校本题库选题', description: '本校资源', icon: School },
      { mode: 'upload', label: '上传文件 AI 录题', description: '材料转题目', icon: FileUp },
    ],
  },
  {
    title: 'AI 创作',
    items: [
      { mode: 'compose', label: 'AI 组题', description: '从题库智能挑题', icon: BrainCircuit },
      { mode: 'create', label: 'AI 命题', description: '生成全新题目', icon: Sparkles },
      { mode: 'personalized', label: '生成个性化练习', description: '上传材料与学情', icon: GraduationCap },
    ],
  },
]

const promptSuggestions = [
  '组一份 20 分钟的一次函数随堂练习',
  '从题库找 8 道一次函数基础题',
  '根据班级错题生成一份分层练习',
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
          <section className="inline-ai-dialog" aria-label="AI 助手">
            <header>
              <span><Sparkles size={17} /></span>
              <div><strong>AI 助手</strong><small>默认从题库组题，也可以继续进入 AI 命题</small></div>
              <button type="button" aria-label="关闭 AI 助手" onClick={closeAi}><X size={16} /></button>
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
              <button type="button" disabled={!prompt.trim() || props.aiStatus === 'loading'} onClick={() => props.onStartAi('create', prompt.trim())}><Sparkles size={13} />转为 AI 命题</button>
            </footer>
          </section>
        ) : null}

        <section className="empty-quick-start" aria-label="快速开始">
          <div className="quick-start-heading"><strong>快速开始</strong><span>也可以直接选择一种方式开始</span></div>
          <div className="quick-start-groups">
            {quickStartGroups.map((group) => (
              <div className="quick-start-group" key={group.title}>
                <span>{group.title}</span>
                <div>
                  {group.items.map(({ mode, label, description, icon: Icon, primary }) => (
                    <button type="button" key={mode} className={primary ? 'is-primary' : ''} onClick={() => props.onOpenAdd(mode)}>
                      <Icon size={16} /><span><strong>{label}</strong><small>{description}</small></span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  )
}

import { useState } from 'react'
import { ArrowUp, BrainCircuit, FileScan, GraduationCap, Layers3, Sparkles } from 'lucide-react'
import type { AddQuestionMode } from '../prototype/types'

type AiCapability = 'compose' | 'paper' | 'create' | 'personalized' | 'upload'

interface FeixiangAiPageProps {
  onStart: (mode: AddQuestionMode, prompt: string) => void
}

const capabilities: Array<{
  id: AiCapability
  title: string
  description: string
  icon: typeof BrainCircuit
  mode: AddQuestionMode
}> = [
  { id: 'compose', title: 'AI 组题', description: '从题库智能挑选题目', icon: BrainCircuit, mode: 'compose' },
  { id: 'paper', title: 'AI 组卷', description: '按考试要求组织完整试卷', icon: Layers3, mode: 'compose' },
  { id: 'create', title: 'AI 命题', description: '生成原创题目并预览', icon: Sparkles, mode: 'create' },
  { id: 'personalized', title: '生成个性化练习', description: '结合材料与学情生成练习', icon: GraduationCap, mode: 'personalized' },
  { id: 'upload', title: 'AI 录题', description: '识别 PDF、Word 或图片', icon: FileScan, mode: 'upload' },
]

export function FeixiangAiPage({ onStart }: FeixiangAiPageProps) {
  const [selected, setSelected] = useState<AiCapability>('compose')
  const [prompt, setPrompt] = useState('')
  const current = capabilities.find((item) => item.id === selected) ?? capabilities[0]
  const CurrentIcon = current.icon
  const submit = () => {
    const instruction = prompt.trim()
    if (!instruction) return
    onStart(current.mode, current.id === 'paper' ? `请按以下要求组成一份试卷：${instruction}` : instruction)
  }

  return (
    <section className="feixiang-ai-page" aria-label="飞象 AI">
      <div className="feixiang-ai-hero">
        <span className="feixiang-ai-mark"><Sparkles size={24} /></span>
        <h1>今天想怎么组题？</h1>
        <p>告诉飞象 AI 你的教学目标，快速完成选题、组卷与命题。</p>
      </div>

      <div className="feixiang-ai-capabilities" role="tablist" aria-label="飞象 AI 能力">
        {capabilities.map(({ id, title, icon: Icon }) => (
          <button type="button" role="tab" aria-selected={selected === id} className={selected === id ? 'is-active' : ''} key={id} onClick={() => setSelected(id)}>
            <Icon size={17} /><span>{title}</span>
          </button>
        ))}
      </div>

      <div className="feixiang-ai-composer">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              submit()
            }
          }}
          placeholder={`描述你的${current.title}要求，例如：${current.description}`}
          aria-label={`${current.title}要求`}
        />
        <div className="feixiang-ai-composer-footer">
          <span><CurrentIcon size={16} />{current.title}</span>
          <button type="button" aria-label={`开始${current.title}`} disabled={!prompt.trim()} onClick={submit}><ArrowUp size={18} /></button>
        </div>
      </div>

      <div className="feixiang-ai-suggestions">
        <span>试试这样说</span>
        {['一次函数基础练习，10 道题', '按八年级期中难度组一份试卷', '根据错题生成针对性练习'].map((item) => (
          <button type="button" key={item} onClick={() => setPrompt(item)}>{item}</button>
        ))}
      </div>
    </section>
  )
}

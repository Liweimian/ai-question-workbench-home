import { Check, LoaderCircle, Send, Sparkles, X } from 'lucide-react'
import type { AsyncStatus } from '../prototype/types'

interface ContextualAiPopoverProps {
  title: string
  prompt: string
  placeholder: string
  status: AsyncStatus
  error?: string
  resultText?: string
  resultMeta?: string
  onPromptChange: (value: string) => void
  onSubmit: () => void
  onClose: () => void
  onReplace?: () => void
  onAppend?: () => void
}

export function ContextualAiPopover(props: ContextualAiPopoverProps) {
  return (
    <aside className="contextual-ai-popover" role="dialog" aria-label={props.title} onClick={(event) => event.stopPropagation()}>
      <header><span><Sparkles size={15} />{props.title}</span><button type="button" aria-label="关闭 AI 弹窗" onClick={props.onClose}><X size={15} /></button></header>
      {props.status === 'loading' ? (
        <div className="contextual-ai-thinking" aria-live="polite"><LoaderCircle size={17} /><div><strong>正在按要求处理</strong><span>理解要求 · 匹配内容 · 校验结果</span></div></div>
      ) : props.status === 'success' && props.resultText ? (
        <div className="contextual-ai-result" aria-live="polite">
          <span><Check size={15} /></span>
          <div>
            <strong>{props.resultMeta ?? '已生成结果'}</strong>
            <p>{props.resultText}</p>
            {props.onReplace || props.onAppend ? <footer>{props.onAppend ? <button type="button" className="is-primary" onClick={props.onAppend}>确认加入题稿</button> : null}{props.onReplace ? <button type="button" className="is-primary" onClick={props.onReplace}>替换原题</button> : null}</footer> : null}
          </div>
        </div>
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); if (props.prompt.trim()) props.onSubmit() }}>
          <textarea autoFocus value={props.prompt} onChange={(event) => props.onPromptChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (props.prompt.trim()) props.onSubmit() } }} placeholder={props.placeholder} aria-label={props.placeholder} rows={3} />
          {props.error ? <span className="contextual-ai-error" role="alert">{props.error}</span> : null}
          <div><span>Enter 发送，Shift + Enter 换行</span><button type="submit" disabled={!props.prompt.trim()} aria-label="发送 AI 要求"><Send size={15} /></button></div>
        </form>
      )}
    </aside>
  )
}

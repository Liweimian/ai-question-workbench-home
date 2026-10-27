import { Check, LoaderCircle, Send, Sparkles, X } from 'lucide-react'
import type { AsyncStatus } from '../prototype/types'
import { animateQuestionToDraft } from '../utils/animateQuestionToDraft'

interface ContextualAiPopoverProps {
  title: string
  prompt: string
  placeholder: string
  status: AsyncStatus
  error?: string
  resultText?: string
  resultVariants?: string[]
  resultMeta?: string
  originalText?: string
  quickActions?: Array<{ label: string; onSelect: () => void }>
  onPromptChange: (value: string) => void
  onSubmit: () => void
  onClose: () => void
  onReplace?: () => void
  onAppend?: (variantIndex?: number) => void
}

export function ContextualAiPopover(props: ContextualAiPopoverProps) {
  const hasAssistantActions = Boolean(props.quickActions?.length)
  return (
    <aside className="contextual-ai-popover" role="dialog" aria-label={props.title} onClick={(event) => event.stopPropagation()}>
      {!hasAssistantActions || props.status !== 'idle' ? <header><span><Sparkles size={15} />{props.title}</span><button type="button" aria-label="关闭 AI 弹窗" onClick={props.onClose}><X size={15} /></button></header> : null}
      {props.status === 'loading' ? (
        <div className="contextual-ai-thinking" aria-live="polite"><LoaderCircle size={17} /><div><strong>正在按要求处理</strong><span>理解要求 · 匹配内容 · 校验结果</span></div></div>
      ) : props.status === 'success' && props.resultText ? (
        <div className="contextual-ai-result" aria-live="polite">
          <span><Check size={15} /></span>
          <div>
            <div className="contextual-ai-result-heading"><strong>{props.resultMeta ?? '已生成结果'}</strong><button type="button" onClick={props.onSubmit}>重新生成</button></div>
            {props.resultVariants?.length ? <div className="contextual-ai-variants">{props.resultVariants.map((variant, index) => <section key={`${index}-${variant.slice(0, 16)}`}><small>方案 {index + 1}</small><p>{variant}</p>{props.onAppend ? <button type="button" onClick={(event) => { animateQuestionToDraft(event.currentTarget); props.onAppend?.(index) }}>添加到题单</button> : null}</section>)}</div> : <div className="contextual-ai-compare">
              {props.originalText ? <section><small>原题</small><p>{props.originalText}</p></section> : null}
              <section className="is-new"><small>新题</small><p>{props.resultText}</p></section>
            </div>}
            {!props.resultVariants?.length && (props.onReplace || props.onAppend) ? <footer>{props.onAppend ? <button type="button" className="is-primary" onClick={(event) => { animateQuestionToDraft(event.currentTarget); props.onAppend?.() }}>添加</button> : null}{props.onReplace ? <button type="button" className="is-primary" onClick={props.onReplace}>替换原题</button> : null}</footer> : null}
          </div>
        </div>
      ) : (
        <form className="contextual-ai-form" onSubmit={(event) => { event.preventDefault(); if (props.prompt.trim()) props.onSubmit() }}>
          {props.quickActions?.length ? (
            <section className="contextual-ai-action-section">
              <div className="contextual-ai-section-title"><span><strong><Sparkles size={15} />AI 助手</strong><em># {props.title}</em></span><button type="button" aria-label="关闭 AI 弹窗" onClick={props.onClose}><X size={15} /></button></div>
              <div className="contextual-ai-quick-actions" aria-label="常用 AI 加工方式">
                {props.quickActions.map((action) => <button type="button" key={action.label} onClick={action.onSelect}>{action.label}</button>)}
              </div>
            </section>
          ) : null}
          <label className={`contextual-ai-requirement${props.quickActions?.length ? ' is-assistant-input' : ''}`}><span>{props.quickActions?.length ? null : '描述你的要求'}</span><textarea autoFocus value={props.prompt} onChange={(event) => props.onPromptChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (props.prompt.trim()) props.onSubmit() } }} placeholder={props.quickActions?.length ? '描述如何修改这道题…' : props.placeholder} aria-label={props.placeholder} rows={props.quickActions?.length ? 2 : 3} />{props.quickActions?.length ? <button type="submit" disabled={!props.prompt.trim()} aria-label="生成 AI 预览"><Send size={17} /></button> : null}</label>
          {props.error ? <span className="contextual-ai-error" role="alert">{props.error}</span> : null}
          {!props.quickActions?.length ? <div className="contextual-ai-submit-row"><span>Enter 生成 · Shift + Enter 换行</span><button type="submit" disabled={!props.prompt.trim()} aria-label="生成 AI 预览"><Send size={14} /><strong>生成预览</strong></button></div> : null}
        </form>
      )}
    </aside>
  )
}

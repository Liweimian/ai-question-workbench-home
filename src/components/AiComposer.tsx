import { MetisButton, MetisInput } from '@yuanfudao/metis-web-component'
import { ArrowUp, Sparkles } from 'lucide-react'
import type { AsyncStatus } from '../prototype/types'

interface AiComposerProps {
  value: string
  error: string
  status: AsyncStatus
  compact?: boolean
  disabled?: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

const suggestions = ['生成 6 道一次函数基础题', '按基础 6 / 提升 4 分层组题', '围绕实际应用出 3 道题']

export function AiComposer({ value, error, status, compact, disabled, onChange, onSubmit }: AiComposerProps) {
  const blocked = disabled || status === 'loading'

  return (
    <div className={`ai-composer${compact ? ' ai-composer--compact' : ''}`}>
      <div className="ai-composer-input">
        <Sparkles className="ai-composer-icon" size={19} />
        <MetisInput
          value={value}
          disabled={blocked}
          placeholder="告诉 AI 你想要什么题，例如：生成 6 道一次函数基础题"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing && !blocked) onSubmit()
          }}
          aria-label="AI 组题要求"
        />
        <MetisButton
          type="primary"
          className="ai-composer-submit"
          icon={<ArrowUp size={17} />}
          loading={status === 'loading'}
          disabled={!value.trim() || blocked}
          onClick={onSubmit}
          aria-label="生成题目"
          data-track="/click/aiQuestionHome/generate | 提交AI组题要求 | prompt#STRING"
        />
      </div>
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {!compact ? (
        <div className="composer-suggestions" aria-label="快捷组题要求">
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" disabled={blocked} onClick={() => onChange(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

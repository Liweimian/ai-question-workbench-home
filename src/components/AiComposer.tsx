import { MetisButton, MetisInput } from '@yuanfudao/metis-web-component'
import { ArrowUp, Sparkles } from 'lucide-react'
import type { AsyncStatus } from '../prototype/types'

interface AiComposerProps {
  value: string
  error: string
  status: AsyncStatus
  compact?: boolean
  disabled?: boolean
  kind?: 'compose' | 'create'
  onChange: (value: string) => void
  onSubmit: () => void
}

const suggestions = {
  compose: ['挑选 6 道一次函数基础题', '基础 6 / 提升 4 分层组题', '筛选 3 道实际应用题'],
  create: ['原创 2 道校园情境应用题', '生成 3 道开放性探究题', '出 4 道中等难度填空题'],
}

export function AiComposer({ value, error, status, compact, disabled, kind = 'compose', onChange, onSubmit }: AiComposerProps) {
  const blocked = disabled || status === 'loading'
  const isCreate = kind === 'create'

  return (
    <div className={`ai-composer${compact ? ' ai-composer--compact' : ''}`}>
      <div className="ai-composer-input">
        <Sparkles className="ai-composer-icon" size={19} />
        <MetisInput
          value={value}
          disabled={blocked}
          placeholder={isCreate ? '描述想原创的题目，例如：出 2 道校园情境应用题' : '描述组题要求，例如：挑选 6 道一次函数基础题'}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing && !blocked) onSubmit()
          }}
          aria-label={isCreate ? 'AI 命题要求' : 'AI 组题要求'}
        />
        <MetisButton
          type="primary"
          className="ai-composer-submit"
          icon={<ArrowUp size={17} />}
          loading={status === 'loading'}
          disabled={!value.trim() || blocked}
          onClick={onSubmit}
          aria-label={isCreate ? '生成原创题' : '从题库组题'}
          data-track={isCreate
            ? '/click/aiQuestionHome/createQuestion | 提交AI出题要求 | prompt#STRING'
            : '/click/aiQuestionHome/composeQuestion | 提交AI组题要求 | prompt#STRING'}
        />
      </div>
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      {!compact ? (
        <div className="composer-suggestions" aria-label="快捷组题要求">
          {suggestions[kind].map((suggestion) => (
            <button key={suggestion} type="button" disabled={blocked} onClick={() => onChange(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

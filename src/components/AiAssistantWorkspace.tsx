import { AlertCircle, BrainCircuit, Check, Circle, LoaderCircle } from 'lucide-react'
import type { AiAssistantRun, AsyncStatus } from '../prototype/types'
import { animateQuestionToDraft } from '../utils/animateQuestionToDraft'
import { AiComposer } from './AiComposer'

interface AiAssistantWorkspaceProps {
  run: AiAssistantRun | null
  prompt: string
  error: string
  status: AsyncStatus
  contentBusy: boolean
  previewText: string
  onPromptChange: (value: string) => void
  onSubmit: () => void
  onConfirm: () => boolean
}

function getThinkingSteps(prompt: string) {
  const isPaperTask = prompt.includes('组卷') || prompt.includes('试卷') || prompt.includes('找卷')
  return isPaperTask
    ? ['理解试卷范围与题量要求', '检索题库并筛选匹配题目', '编排题型与难度并生成预览']
    : ['理解知识点、题型与难度要求', '检索题库并匹配候选题目', '校验题量与重复项并生成预览']
}

export function AiAssistantWorkspace(props: AiAssistantWorkspaceProps) {
  const run = props.run
  const steps = getThinkingSteps(run?.prompt ?? '')

  return (
    <aside className="ai-assistant-workspace" aria-label="AI 助手任务">
      <div className="ai-assistant-conversation" aria-live="polite">
        {run ? (
          <>
            <div className="ai-assistant-user-message">
              <span>你的需求</span>
              <p>{run.prompt}</p>
            </div>

            <section className="ai-assistant-response" aria-label="AI 助手处理过程">
              <span className="ai-assistant-avatar"><BrainCircuit size={19} /></span>
              <div className="ai-assistant-response-body">
                <div className="ai-assistant-response-heading">
                  <strong>{run.status === 'loading' ? '正在处理' : run.status === 'success' ? '处理完成' : '处理遇到问题'}</strong>
                  <span>{run.status === 'loading' ? '生成后需要确认才会添加到题稿' : run.status === 'success' ? run.confirmed ? '已添加到当前题稿' : '请确认预览结果' : '可修改要求后重试'}</span>
                </div>

                <ol className="ai-assistant-steps">
                  {steps.map((step, index) => {
                    const completed = run.status === 'success' || index < run.activeStep
                    const active = run.status === 'loading' && index === run.activeStep
                    const failed = run.status === 'error' && index === run.activeStep
                    return (
                      <li className={completed ? 'is-complete' : active ? 'is-active' : failed ? 'is-error' : undefined} key={step}>
                        <span aria-hidden="true">
                          {completed ? <Check size={14} /> : active ? <LoaderCircle size={14} /> : failed ? <AlertCircle size={14} /> : <Circle size={11} />}
                        </span>
                        <span>{step}</span>
                      </li>
                    )
                  })}
                </ol>

                {run.status === 'success' ? (
                  <div className="ai-assistant-result" role="status">
                    <span><Check size={16} /></span>
                    <div>
                      <strong>{run.confirmed ? '已添加到右侧题稿' : `已生成 ${run.resultCount} 道题`}</strong>
                      <p>{run.confirmed ? '可继续在右侧调整顺序、编辑或删除。' : props.previewText}</p>
                      {!run.confirmed ? <button type="button" className="ai-assistant-confirm" onClick={(event) => { animateQuestionToDraft(event.currentTarget); props.onConfirm() }}>添加</button> : null}
                    </div>
                  </div>
                ) : null}

                {run.status === 'error' ? (
                  <div className="ai-assistant-run-error" role="alert">{run.errorMessage}</div>
                ) : null}
              </div>
            </section>
          </>
        ) : (
          <div className="ai-assistant-empty">
            <span><BrainCircuit size={22} /></span>
            <strong>描述你的组题需求</strong>
            <p>AI 会展示处理过程，老师确认结果后再添加到右侧题稿。</p>
          </div>
        )}
      </div>

      <footer className="ai-assistant-followup">
        <AiComposer
          compact
          kind="compose"
          value={props.prompt}
          error={props.error}
          status={props.status}
          disabled={props.contentBusy}
          onChange={props.onPromptChange}
          onSubmit={props.onSubmit}
        />
      </footer>
    </aside>
  )
}

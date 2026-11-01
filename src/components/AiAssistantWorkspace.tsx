import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BrainCircuit, Check, Circle, FileText, LoaderCircle, Plus, SquarePlus } from 'lucide-react'
import type { AiAssistantRun, AsyncStatus, Question } from '../prototype/types'
import { animateQuestionToDraft } from '../utils/animateQuestionToDraft'
import { AiComposer } from './AiComposer'

interface AiAssistantWorkspaceProps {
  run: AiAssistantRun | null
  prompt: string
  error: string
  status: AsyncStatus
  contentBusy: boolean
  questions: Question[]
  addedQuestionIds: Set<string>
  onPromptChange: (value: string) => void
  onSubmit: () => void
  onAddQuestions: (questions: Question[]) => boolean
}

function getThinkingSteps(prompt: string) {
  const isPaperTask = prompt.includes('组卷') || prompt.includes('试卷') || prompt.includes('找卷')
  return isPaperTask
    ? ['理解试卷范围与题量要求', '检索题库并筛选匹配题目', '编排题型与难度并生成预览']
    : ['理解知识点、题型与难度要求', '检索题库并匹配候选题目', '校验题量与重复项并生成预览']
}

function paperTitleFromPrompt(prompt: string) {
  const compact = prompt.replace(/\s+/g, '').slice(0, 28)
  return compact.length > 0 ? compact : 'AI 组题结果'
}

export function AiAssistantWorkspace(props: AiAssistantWorkspaceProps) {
  const run = props.run
  const steps = getThinkingSteps(run?.prompt ?? '')
  const [history, setHistory] = useState<Array<{ id: string; prompt: string }>>([])

  const unaddedQuestions = useMemo(
    () => props.questions.filter((question) => !props.addedQuestionIds.has(question.id)),
    [props.addedQuestionIds, props.questions],
  )

  useEffect(() => {
    if (run?.status !== 'success' || !run.prompt) return
    setHistory((current) => {
      if (current.some((item) => item.id === run.id)) return current
      return [{ id: run.id, prompt: run.prompt }, ...current.filter((item) => item.prompt !== run.prompt)].slice(0, 12)
    })
  }, [run?.id, run?.prompt, run?.status])

  const addQuestions = (questions: Question[], event?: { currentTarget: HTMLElement }) => {
    if (questions.length === 0 || props.contentBusy) return
    if (event) animateQuestionToDraft(event.currentTarget)
    props.onAddQuestions(questions)
  }

  return (
    <aside className="ai-assistant-workspace" aria-label="AI 组题">
      <div className="ai-compose-shell">
        <nav className="ai-compose-history" aria-label="组题记录">
          <button
            type="button"
            className={!run ? 'is-active' : undefined}
            onClick={() => props.onPromptChange('')}
          >
            新对话
          </button>
          {history.map((item) => (
            <button
              type="button"
              key={item.id}
              className={run?.id === item.id ? 'is-active' : undefined}
              onClick={() => props.onPromptChange(item.prompt)}
              title={item.prompt}
            >
              {item.prompt}
            </button>
          ))}
          {history.length === 0 ? <p>发送一次组题需求后，记录会留在这里。</p> : null}
        </nav>

        <div className="ai-compose-main">
          <div className="ai-assistant-conversation" aria-live="polite">
            {run ? (
              <>
                <div className="ai-assistant-user-message">
                  <span>你的需求</span>
                  <p>{run.prompt}</p>
                </div>

                <section className="ai-assistant-response" aria-label="AI 组题处理过程">
                  <span className="ai-assistant-avatar"><BrainCircuit size={19} /></span>
                  <div className="ai-assistant-response-body">
                    <div className="ai-assistant-response-heading">
                      <strong>{run.status === 'loading' ? '正在生成' : run.status === 'success' ? '已生成预览' : '处理遇到问题'}</strong>
                      <span>{run.status === 'loading' ? '生成过程同线上 AI 组题' : run.status === 'success' ? '可单题或批量加入右侧题单' : '可修改要求后重试'}</span>
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
                    {run.status === 'error' ? <div className="ai-assistant-run-error" role="alert">{run.errorMessage}</div> : null}
                  </div>
                </section>

                {run.status === 'success' && props.questions.length > 0 ? (
                  <article className="ai-compose-paper" aria-label="生成结果">
                    <header className="ai-compose-paper-header">
                      <div>
                        <h3>{paperTitleFromPrompt(run.prompt)}</h3>
                        <p>共 {props.questions.length} 道题 · 生成内容同线上 AI 组题</p>
                      </div>
                      <button
                        type="button"
                        className="is-primary"
                        disabled={props.contentBusy || unaddedQuestions.length === 0}
                        onClick={(event) => addQuestions(unaddedQuestions, event)}
                      >
                        <SquarePlus size={15} />
                        {unaddedQuestions.length === 0 ? '已全部添加' : `全部添加（${unaddedQuestions.length}）`}
                      </button>
                    </header>

                    <div className="ai-compose-question-list">
                      {props.questions.map((question, index) => {
                        const added = props.addedQuestionIds.has(question.id)
                        return (
                          <article key={question.id} className={`ai-compose-question${added ? ' is-added' : ''}`}>
                            <div className="ai-compose-question-body">
                              <small>{question.sourceDetail ?? question.sourceLabel}</small>
                              <p><b>{index + 1}.</b> {question.stem}</p>
                              {question.options ? <ul>{question.options.map((option) => <li key={option}>{option}</li>)}</ul> : null}
                            </div>
                            <button
                              type="button"
                              className={`ai-compose-add${added ? ' is-added' : ''}`}
                              disabled={added || props.contentBusy}
                              aria-label={added ? '已添加' : `添加第 ${index + 1} 题`}
                              onClick={(event) => addQuestions([question], event)}
                            >
                              {added ? <Check size={16} /> : <Plus size={16} />}
                            </button>
                          </article>
                        )
                      })}
                    </div>

                    <footer className="ai-compose-files" aria-label="生成文件">
                      <button type="button" className="ai-compose-file">
                        <FileText size={16} />
                        <span>{paperTitleFromPrompt(run.prompt)}.docx</span>
                      </button>
                      <button type="button" className="ai-compose-file">
                        <FileText size={16} />
                        <span>答案解析.docx</span>
                      </button>
                    </footer>
                  </article>
                ) : null}
              </>
            ) : (
              <div className="ai-assistant-empty">
                <span><BrainCircuit size={22} /></span>
                <strong>直接说出作业或试卷要求</strong>
                <p>生成过程与结果复用线上 AI 组题；题目在左侧预览，可单题或批量加入右侧当前题单。</p>
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
        </div>
      </div>
    </aside>
  )
}

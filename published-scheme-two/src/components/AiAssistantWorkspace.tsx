import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import { AlertCircle, BrainCircuit, Check, Circle, Download, FileText, History, Link2, LoaderCircle, SquarePen, SquarePlus, X } from 'lucide-react'
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
  onSubmit: (currentQuestions?: Question[]) => void
  onAddQuestions: (questions: Question[]) => boolean
}

function getThinkingSteps(prompt: string) {
  const isPaperTask = prompt.includes('组卷') || prompt.includes('试卷') || prompt.includes('找卷')
  return isPaperTask
    ? ['理解试卷范围与题量要求', '检索题库并筛选匹配题目', '编排题型与难度并生成预览']
    : ['理解知识点、题型与难度要求', '检索题库并匹配候选题目', '校验题量与重复项并生成预览']
}

function downloadGeneratedFile(filename: string, mime: string) {
  const blob = new Blob([filename], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
  MetisMessage.success(`已开始下载 ${filename}`)
}

function paperTitleFromPrompt(prompt: string) {
  const compact = prompt.replace(/\s+/g, '').slice(0, 28)
  return compact.length > 0 ? compact : 'AI 组题结果'
}

const paperSections = [
  { type: '选择题', label: '单选题' },
  { type: '填空题', label: '填空题' },
  { type: '解答题', label: '解答题' },
] as const

type ConversationRecord = { run: AiAssistantRun; questions: Question[] }

export function AiAssistantWorkspace(props: AiAssistantWorkspaceProps) {
  const [history, setHistory] = useState<ConversationRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<ConversationRecord>()
  const historyMenu = useRef<HTMLDetailsElement>(null)
  const run = selectedRecord?.run ?? props.run
  const sourceQuestions = selectedRecord?.questions ?? props.questions
  const steps = getThinkingSteps(run?.prompt ?? '')
  const [newConversation, setNewConversation] = useState(false)
  const previewRef = useRef<HTMLDialogElement>(null)
  const [previewTitle, setPreviewTitle] = useState<string>()
  useEffect(() => {
    if (previewTitle && !previewRef.current?.open) previewRef.current?.showModal()
  }, [previewTitle])
  const questions = sourceQuestions
  const references = useMemo(() => {
    const groups = new Map<string, Question[]>()
    for (const question of sourceQuestions) {
      const title = question.sourceDetail ?? question.sourceLabel
      groups.set(title, [...(groups.get(title) ?? []), question])
    }
    return groups
  }, [sourceQuestions])
  const submitFollowUp = () => {
    const instruction = props.prompt.trim()
    if (newConversation || run?.status !== 'success' || !instruction) {
      if (instruction) {
        setNewConversation(false)
        setSelectedRecord(undefined)
      }
      props.onSubmit()
      return
    }
    setSelectedRecord(undefined)
    props.onSubmit(paperQuestions)
  }

  const sections = paperSections
    .map((section) => ({ ...section, questions: questions.filter((question) => question.type === section.type) }))
    .filter((section) => section.questions.length > 0)
  const paperQuestions = sections.flatMap((section) => section.questions)
  const unaddedQuestions = paperQuestions.filter((question) => !props.addedQuestionIds.has(question.id))

  useEffect(() => {
    if (run?.status !== 'success' || !run.prompt || questions.length === 0) return
    setHistory((current) => {
      const record = { run, questions }
      const index = current.findIndex((item) => item.run.id === run.id)
      if (index < 0) return [record, ...current].slice(0, 12)
      return current.map((item, position) => position === index ? record : item)
    })
  }, [run, questions])

  const addQuestions = (questions: Question[], event?: { currentTarget: HTMLElement }) => {
    if (questions.length === 0 || props.contentBusy) return
    if (event) animateQuestionToDraft(event.currentTarget)
    props.onAddQuestions(questions)
  }

  return (
    <aside className="ai-assistant-workspace" aria-label="AI 组题">
      <div className="ai-compose-shell">
        <div className="ai-compose-main">
        <nav className="ai-compose-conversation-toolbar" aria-label="组题对话">
          <button
            type="button"
            title="新建对话"
            aria-label="新建对话"
            disabled={props.contentBusy}
            onClick={() => {
              setNewConversation(true)
              setSelectedRecord(undefined)
              if (historyMenu.current) historyMenu.current.open = false
              props.onPromptChange('')
            }}
          >
            <SquarePen size={18} />
          </button>
          <details ref={historyMenu} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false
          }} onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.currentTarget.open = false
              event.currentTarget.querySelector('summary')?.focus()
            }
          }}>
            <summary title="历史对话" aria-label="历史对话"><History size={19} /></summary>
            <div className="ai-compose-history-dropdown">
              {history.length === 0 ? <p>暂无历史对话</p> : history.map((item) => (
                <button type="button" key={item.run.id} title={item.run.prompt} disabled={props.contentBusy} onClick={() => {
                  setSelectedRecord(item)
                  setNewConversation(false)
                  props.onPromptChange('')
                  if (historyMenu.current) {
                    historyMenu.current.open = false
                    historyMenu.current.querySelector('summary')?.focus()
                  }
                }}>{item.run.prompt}</button>
              ))}
            </div>
          </details>
          <strong>{run && !newConversation ? paperTitleFromPrompt(run.prompt) : '新对话'}</strong>
        </nav>

          <div className="ai-assistant-conversation" aria-live="polite">
            {run && !newConversation ? (
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
                      <span>{run.status === 'loading' ? '生成过程同线上 AI 组题' : run.status === 'success' ? '可单题或批量加入右侧练习' : '可修改要求后重试'}</span>
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
                            {index === 1 && run.status === 'success' && references.size > 0 ? (
                              <details className="ai-compose-references" open>
                                <summary>题库检索与初筛</summary>
                                {[...references.keys()].map((title) => (
                                  <button key={title} type="button" title={title} onClick={() => setPreviewTitle(title)}>
                                    <Link2 size={13} /><span>{title}</span>
                                  </button>
                                ))}
                              </details>
                            ) : <span>{step}</span>}
                          </li>
                        )
                      })}
                    </ol>
                    {run.status === 'error' ? <div className="ai-assistant-run-error" role="alert">{run.errorMessage}</div> : null}
                  </div>
                </section>

                {run.status === 'success' && sourceQuestions.length > 0 ? (
                  <article id={run.id} className="ai-compose-paper" aria-label="生成结果">
                    <header className="ai-compose-paper-header">
                      <div>
                        <h3>{paperTitleFromPrompt(run.prompt)}</h3>
                      </div>
                      <div className="ai-compose-paper-actions">
                      <button
                        type="button"
                        className="ai-compose-paper-download"
                        onClick={() => downloadGeneratedFile(`${paperTitleFromPrompt(run.prompt)}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
                      >
                        <Download size={15} />下载
                      </button>
                      <button
                        type="button"
                        className="is-primary"
                        disabled={props.contentBusy || unaddedQuestions.length === 0}
                        onClick={(event) => addQuestions(unaddedQuestions, event)}
                      >
                        <SquarePlus size={15} />
                        {unaddedQuestions.length === 0 ? '已添加整卷' : `添加整卷（${unaddedQuestions.length}）`}
                      </button>
                      </div>
                    </header>

                    <div className="ai-compose-question-list">
                      {paperQuestions.map((question, index) => {
                        const sectionIndex = sections.findIndex((section) => section.questions[0] === question)
                        const section = sections[sectionIndex]
                        const added = props.addedQuestionIds.has(question.id)
                        return (
                          <Fragment key={question.id}>
                          {section ? (
                            <h4 className="ai-compose-section-title">
                              {['一', '二', '三'][sectionIndex]}、{section.label}（共 {section.questions.length} 题，合计 {section.questions.reduce((total, item) => total + item.score, 0)} 分）
                            </h4>
                          ) : null}
                          <article className={`ai-compose-question${added ? ' is-added' : ''}`}>
                            <div className="ai-compose-question-body">
                              <small>{question.sourceDetail ?? question.sourceLabel}</small>
                              <p>{index + 1}.（{question.score}分）{question.stem}</p>
                              {question.options ? <ul>{question.options.map((option) => <li key={option}>{option}</li>)}</ul> : null}
                            </div>
                            <footer className="ai-compose-question-footer">
                              <span>{question.knowledgePoint ? `知识点：${question.knowledgePoint}` : ''}</span>
                              <button
                                type="button"
                                className={`ai-compose-add${added ? ' is-added' : ''}`}
                                disabled={added || props.contentBusy}
                                aria-label={added ? '已添加' : `添加第 ${index + 1} 题`}
                                onClick={(event) => addQuestions([question], event)}
                              >
                                {added ? '已添加' : '＋ 添加'}
                              </button>
                            </footer>
                          </article>
                          </Fragment>
                        )
                      })}
                    </div>

                    <footer className="ai-compose-files" aria-label="生成文件">
                      {[
                        `${paperTitleFromPrompt(run.prompt)}.docx`,
                        '答案解析.docx',
                        '命题说明书.pdf',
                      ].map((filename) => (
                        <div className="ai-compose-file" key={filename}>
                          <FileText size={16} />
                          <span>{filename}</span>
                        </div>
                      ))}
                    </footer>
                  </article>
                ) : null}
              </>
            ) : (
              <div className="ai-assistant-empty">
                <span><BrainCircuit size={22} /></span>
                <strong>直接说出作业或试卷要求</strong>
                <p>生成过程与结果复用线上 AI 组题；题目在左侧预览，可单题或批量加入右侧当前练习。</p>
              </div>
            )}
          </div>

          <footer className="ai-assistant-followup">
            {!newConversation && run?.status === 'success' ? <small className="ai-compose-followup-hint">可继续输入修改要求，例如「换第 2 题」或「改成 8 道题」。</small> : null}
            <AiComposer
              compact
              kind="compose"
              value={props.prompt}
              error={props.error}
              status={props.status}
              disabled={props.contentBusy}
              onChange={props.onPromptChange}
              onSubmit={submitFollowUp}
            />
          </footer>
        </div>
      </div>
      <dialog ref={previewRef} className="ai-reference-word" aria-labelledby="ai-reference-filename" onClose={() => setPreviewTitle(undefined)}>
        <header>
          <span className="ai-reference-word-icon" aria-hidden="true">W</span>
          <strong id="ai-reference-filename">{previewTitle}.docx</strong>
          <button type="button" aria-label="关闭预览" onClick={() => previewRef.current?.close()}><X size={18} /></button>
        </header>
        <div className="ai-reference-paper" tabIndex={0} aria-label="只读卷面预览">
          <h2>{previewTitle}</h2>
          <ol>
            {(previewTitle ? references.get(previewTitle) ?? [] : []).map((question) => (
              <li key={question.id}>
                {question.stem}
                {question.options?.length ? <ul>{question.options.map((option, index) => <li key={index}>{option}</li>)}</ul> : null}
              </li>
            ))}
          </ol>
        </div>
      </dialog>
    </aside>
  )
}

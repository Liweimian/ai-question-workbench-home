import { useEffect, useRef, useState } from 'react'
import { QuestionInspector } from '../components/AiInspector'
import { CompositionHub } from '../components/CompositionHub'
import { QuestionSortPanel } from '../components/QuestionSortPanel'
import { DocumentCanvas } from '../components/DocumentCanvas'
import { EmptyCanvas } from '../components/EmptyCanvas'
import { SourceDrawer } from '../components/SourceDrawer'
import { WorkspaceHeader } from '../components/WorkspaceHeader'
import { useWorkbench } from '../hooks/useWorkbench'
import type { AddQuestionMode } from '../prototype/types'
import { House, PanelRightClose, X } from 'lucide-react'

type AddTabMode = Exclude<AddQuestionMode, 'menu' | 'compose' | 'personalized'>

const addTabLabels: Record<AddTabMode, string> = {
  resource: '飞象题库',
  school: '校本题库',
  upload: '上传录题',
  create: 'AI 出题',
  manual: '手工录入',
}

export function WorkbenchHomePage() {
  const workbench = useWorkbench()
  const previousQuestionCount = useRef(workbench.document.questions.length)
  const [sortCollapsed, setSortCollapsed] = useState(false)
  const [sidePanelOpen, setSidePanelOpen] = useState(true)
  const [openAddTabs, setOpenAddTabs] = useState<AddTabMode[]>([])
  const hasQuestions = workbench.document.questions.length > 0

  useEffect(() => {
    if (workbench.document.questions.length > previousQuestionCount.current && workbench.selectedQuestionId) {
      window.requestAnimationFrame(() => {
        document.getElementById(`question-${workbench.selectedQuestionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
    previousQuestionCount.current = workbench.document.questions.length
  }, [workbench.document.questions.length, workbench.selectedQuestionId])

  const questionNumber = workbench.selectedQuestion
    ? workbench.document.questions.findIndex((question) => question.id === workbench.selectedQuestion?.id) + 1
    : 0

  const openAssistant = (prompt?: string) => {
    setSidePanelOpen(true)
    workbench.closeAdd()
    if (prompt !== undefined) workbench.setComposePrompt(prompt)
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>('[aria-label="AI 助手要求"]')?.focus()
    })
  }

  const openAdd = (
    mode: Parameters<typeof workbench.openAdd>[0] = 'menu',
    options?: Parameters<typeof workbench.openAdd>[1],
  ) => {
    if (mode === 'compose') {
      openAssistant('从题库挑选 6 道一次函数基础题')
      return
    }
    if (mode === 'personalized') {
      openAssistant('根据本班一次函数常见错因，从题库挑选 6 道针对性练习')
      return
    }
    setSidePanelOpen(true)
    if (mode !== 'menu') {
      setOpenAddTabs((current) => current.includes(mode) ? current : [...current, mode])
    }
    workbench.openAdd(mode, options)
  }

  const activateAddHome = () => {
    setSidePanelOpen(true)
    workbench.closeAdd()
  }

  const closeAddTab = (mode: AddTabMode) => {
    setOpenAddTabs((current) => current.filter((item) => item !== mode))
    if (workbench.isAddOpen && workbench.addMode === mode) workbench.closeAdd()
  }

  const collapseSidePanel = () => {
    workbench.closeAdd()
    setSidePanelOpen(false)
  }

  const shellClassName = sidePanelOpen
    ? 'workspace-shell is-split-source'
    : `workspace-shell${hasQuestions ? ` has-inspector${sortCollapsed ? ' is-sort-collapsed' : ''}` : ' is-empty'}`

  return (
    <div className="fx-app metis-theme-aiq">
      <main className="fx-content workbench-page">
        <div className="fx-zoom-area workbench-zoom-area">
          <WorkspaceHeader
            documentTitle={workbench.document.title}
            questionCount={workbench.document.questions.length}
            canUndo={workbench.canUndo && !workbench.isContentBusy}
            onUndo={workbench.undo}
            onCreateNew={() => {
              workbench.createNewDocument()
              setSidePanelOpen(true)
            }}
            sidePanelOpen={sidePanelOpen}
            onSidePanelOpen={() => setSidePanelOpen(true)}
          />

          <section className={shellClassName} aria-label="飞象组题编辑器">
            {!sidePanelOpen && hasQuestions ? (
              <QuestionSortPanel
                questions={workbench.document.questions}
                selectedQuestionId={workbench.selectedQuestionId}
                collapsed={sortCollapsed}
                onCollapsedChange={setSortCollapsed}
                onSelectQuestion={workbench.selectQuestion}
                onReorderQuestions={workbench.reorderQuestions}
              />
            ) : null}

            <div className={`editor-scroll${hasQuestions ? '' : ' is-empty'}`}>
              {!hasQuestions ? (
                <EmptyCanvas
                  document={workbench.document}
                  sidePanelOpen={sidePanelOpen}
                  onTitleChange={workbench.setTitle}
                  onOpenAssistant={openAssistant}
                  onOpenAdd={openAdd}
                />
              ) : (
                <DocumentCanvas
                  document={workbench.document}
                  selectedQuestionId={workbench.selectedQuestionId}
                  onTitleChange={workbench.setTitle}
                  onSelectQuestion={workbench.selectQuestion}
                  onRewriteRequirement={(requirement) => {
                    workbench.closeAdd()
                    setSidePanelOpen(false)
                    workbench.setInspectorView('ai')
                    void workbench.rewrite('自定义要求', requirement)
                  }}
                  onMoveQuestion={workbench.moveQuestion}
                  onDeleteQuestion={workbench.deleteQuestion}
                  onAdd={openAdd}
                  onOpenAssistant={() => openAssistant()}
                />
              )}
            </div>

            {sidePanelOpen ? (
              <div className="add-workspace" aria-label="添加题目多任务工作区">
                <nav className="add-workspace-tabs" aria-label="已打开的添加方式">
                  <button
                    type="button"
                    role="tab"
                    aria-label="添加题目首页"
                    title="添加题目首页"
                    aria-selected={!workbench.isAddOpen}
                    className={`add-workspace-home${!workbench.isAddOpen ? ' is-active' : ''}`}
                    onClick={activateAddHome}
                  ><House size={17} /></button>
                  {openAddTabs.map((mode) => (
                    <span className={`add-workspace-tab${workbench.isAddOpen && workbench.addMode === mode ? ' is-active' : ''}`} key={mode}>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={workbench.isAddOpen && workbench.addMode === mode}
                        onClick={() => openAdd(mode)}
                      >{addTabLabels[mode]}</button>
                      <button type="button" className="add-workspace-tab-close" aria-label={`关闭${addTabLabels[mode]}`} onClick={() => closeAddTab(mode)}>
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    className="add-workspace-collapse"
                    aria-label="收起添加题目工作区"
                    title="专注编辑"
                    onClick={collapseSidePanel}
                  ><PanelRightClose size={17} /></button>
                </nav>
                {workbench.isAddOpen ? (
                <SourceDrawer
                  presentation="docked"
                  mode={workbench.addMode}
                  libraryInitialView={workbench.libraryInitialView}
                  resourceType={workbench.resourceType}
                  records={workbench.sourceRecords}
                  listStatus={workbench.sourceListStatus}
                  addStatus={workbench.sourceAddStatus}
                  contentBusy={workbench.isContentBusy}
                  createConfig={workbench.createConfig}
                  createError={workbench.createError}
                  createStatus={workbench.createStatus}
                  createPreview={workbench.createPreview}
                  onModeChange={workbench.setAddMode}
                  onResourceTypeChange={(type) => void workbench.loadSources(type)}
                  onAddSource={(type, sourceId, count) => void workbench.addSource(type, sourceId, count)}
                  onCreateConfigChange={workbench.setCreateConfig}
                  onCreate={(requestOverride) => void workbench.createQuestions(requestOverride)}
                  onAddCreated={workbench.addCreatedQuestions}
                  onUpload={() => void workbench.recognizeUpload()}
                  onAddManual={() => void workbench.addManualQuestion()}
                  onClose={activateAddHome}
                />
              ) : (
                <CompositionHub
                  currentDocumentId={workbench.document.id}
                  histories={workbench.historyDocuments}
                  historyStatus={workbench.historyStatus}
                  contentBusy={workbench.isContentBusy}
                  composePrompt={workbench.composePrompt}
                  composeError={workbench.composeError}
                  composeStatus={workbench.composeStatus}
                  onOpenAdd={openAdd}
                  onOpenDocument={(documentId) => void workbench.openHistoryDocument(documentId)}
                  onReloadHistory={() => void workbench.reloadHistory()}
                  onComposePromptChange={workbench.setComposePrompt}
                  onCompose={() => void workbench.composeFromBank()}
                  onCollapse={collapseSidePanel}
                />
              )}
              </div>
            ) : hasQuestions ? (
              <QuestionInspector
                document={workbench.document}
                question={workbench.selectedQuestion}
                questionNumber={questionNumber}
                view={workbench.inspectorView}
                status={workbench.rewriteStatus}
                preview={workbench.rewritePreview}
                onViewChange={workbench.setInspectorView}
                onRewrite={(instruction) => void workbench.rewrite(instruction)}
                onApply={workbench.applyRewrite}
              />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  )
}

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

const addTabLabels: Record<Exclude<AddQuestionMode, 'menu'>, string> = {
  resource: '飞象题库',
  school: '校本题库',
  upload: '上传录题',
  compose: 'AI 组题',
  create: 'AI 出题',
  personalized: '个性化练习',
  manual: '手工录入',
}

export function WorkbenchHomePage() {
  const workbench = useWorkbench()
  const previousQuestionCount = useRef(workbench.document.questions.length)
  const [quickAiOpen, setQuickAiOpen] = useState(false)
  const [sortCollapsed, setSortCollapsed] = useState(false)
  const [sidePanelOpen, setSidePanelOpen] = useState(true)
  const [openAddTabs, setOpenAddTabs] = useState<Array<Exclude<AddQuestionMode, 'menu'>>>([])
  const hasQuestions = workbench.document.questions.length > 0

  useEffect(() => {
    if (workbench.document.questions.length > previousQuestionCount.current && workbench.selectedQuestionId) {
      window.requestAnimationFrame(() => {
        document.getElementById(`question-${workbench.selectedQuestionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
    previousQuestionCount.current = workbench.document.questions.length
  }, [workbench.document.questions.length, workbench.selectedQuestionId])

  useEffect(() => {
    if (hasQuestions) setQuickAiOpen(false)
  }, [hasQuestions])

  const questionNumber = workbench.selectedQuestion
    ? workbench.document.questions.findIndex((question) => question.id === workbench.selectedQuestion?.id) + 1
    : 0

  const openAdd = (
    mode: Parameters<typeof workbench.openAdd>[0] = 'menu',
    options?: Parameters<typeof workbench.openAdd>[1],
  ) => {
    setSidePanelOpen(true)
    setQuickAiOpen(false)
    if (mode !== 'menu') {
      setOpenAddTabs((current) => current.includes(mode) ? current : [...current, mode])
    }
    workbench.openAdd(mode, options)
  }

  const activateAddHome = () => {
    setSidePanelOpen(true)
    setQuickAiOpen(false)
    workbench.closeAdd()
  }

  const closeAddTab = (mode: Exclude<AddQuestionMode, 'menu'>) => {
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
            canUndo={workbench.canUndo}
            onUndo={workbench.undo}
            onCreateNew={() => {
              workbench.createNewDocument()
              setSidePanelOpen(true)
              setQuickAiOpen(false)
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
                  aiOpen={quickAiOpen}
                  aiStatus={workbench.composeStatus}
                  aiError={workbench.composeError}
                  onTitleChange={workbench.setTitle}
                  onAiOpen={() => setQuickAiOpen(true)}
                  onAiClose={() => setQuickAiOpen(false)}
                  onStartAi={(mode, prompt) => {
                    if (mode === 'compose') {
                      void workbench.composeFromBank(prompt)
                      return
                    }
                    setQuickAiOpen(false)
                    openAdd('create')
                  }}
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
                  composePrompt={workbench.composePrompt}
                  composeError={workbench.composeError}
                  composeStatus={workbench.composeStatus}
                  createConfig={workbench.createConfig}
                  createError={workbench.createError}
                  createStatus={workbench.createStatus}
                  createPreview={workbench.createPreview}
                  onModeChange={workbench.setAddMode}
                  onResourceTypeChange={(type) => void workbench.loadSources(type)}
                  onAddSource={(type, sourceId, count) => void workbench.addSource(type, sourceId, count)}
                  onComposePromptChange={workbench.setComposePrompt}
                  onCompose={() => void workbench.composeFromBank()}
                  onCreateConfigChange={workbench.setCreateConfig}
                  onCreate={(requestOverride) => void workbench.createQuestions(requestOverride)}
                  onAddCreated={workbench.addCreatedQuestions}
                  onUpload={() => void workbench.recognizeUpload()}
                  onPersonalize={() => void workbench.personalizeFromUpload()}
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

import { useEffect, useRef, useState } from 'react'
import { QuestionInspector } from '../components/AiInspector'
import { CompositionHub } from '../components/CompositionHub'
import { QuestionSortPanel } from '../components/QuestionSortPanel'
import { DocumentCanvas } from '../components/DocumentCanvas'
import { EmptyCanvas } from '../components/EmptyCanvas'
import { SourceDrawer } from '../components/SourceDrawer'
import { WorkspaceHeader } from '../components/WorkspaceHeader'
import { useWorkbench } from '../hooks/useWorkbench'

export function WorkbenchHomePage() {
  const workbench = useWorkbench()
  const previousQuestionCount = useRef(workbench.document.questions.length)
  const [quickAiOpen, setQuickAiOpen] = useState(false)
  const [sortCollapsed, setSortCollapsed] = useState(false)
  const [sidePanelOpen, setSidePanelOpen] = useState(true)
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
    workbench.openAdd(mode, options)
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
                    workbench.setCreatePrompt(prompt)
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
              workbench.isAddOpen ? (
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
                  createPrompt={workbench.createPrompt}
                  createError={workbench.createError}
                  createStatus={workbench.createStatus}
                  createPreview={workbench.createPreview}
                  onModeChange={workbench.setAddMode}
                  onResourceTypeChange={(type) => void workbench.loadSources(type)}
                  onAddSource={(type, sourceId, count) => void workbench.addSource(type, sourceId, count)}
                  onComposePromptChange={workbench.setComposePrompt}
                  onCompose={() => void workbench.composeFromBank()}
                  onCreatePromptChange={workbench.setCreatePrompt}
                  onCreate={() => void workbench.createQuestions()}
                  onAddCreated={workbench.addCreatedQuestions}
                  onUpload={() => void workbench.recognizeUpload()}
                  onPersonalize={() => void workbench.personalizeFromUpload()}
                  onAddManual={() => void workbench.addManualQuestion()}
                  onClose={workbench.closeAdd}
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
              )
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

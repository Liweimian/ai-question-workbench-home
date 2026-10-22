import { useEffect, useRef, useState } from 'react'
import { QuestionInspector } from '../components/AiInspector'
import { QuestionSortPanel } from '../components/QuestionSortPanel'
import { DocumentCanvas } from '../components/DocumentCanvas'
import { EmptyCanvas } from '../components/EmptyCanvas'
import { MyResourcesPanel } from '../components/MyResourcesPanel'
import { SourceDrawer } from '../components/SourceDrawer'
import { WorkbenchLandingPage } from '../components/WorkbenchLandingPage'
import { WorkspaceHeader } from '../components/WorkspaceHeader'
import { useWorkbench } from '../hooks/useWorkbench'

export function WorkbenchHomePage() {
  const workbench = useWorkbench()
  const previousQuestionCount = useRef(workbench.document.questions.length)
  const [quickAiOpen, setQuickAiOpen] = useState(false)
  const [sortCollapsed, setSortCollapsed] = useState(false)
  const [workspaceView, setWorkspaceView] = useState<'home' | 'editor' | 'resources'>('home')
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

  const openAdd = (mode: Parameters<typeof workbench.openAdd>[0] = 'menu') => {
    setWorkspaceView('editor')
    setQuickAiOpen(false)
    workbench.openAdd(mode)
  }

  const openHome = () => {
    setQuickAiOpen(false)
    workbench.closeAdd()
    setWorkspaceView('home')
  }

  return (
    <div className="fx-app metis-theme-aiq">
      <main className="fx-content workbench-page">
        <div className="fx-zoom-area workbench-zoom-area">
          {workspaceView === 'home' ? (
            <WorkbenchLandingPage
              document={workbench.document}
              histories={workbench.historyDocuments}
              historyStatus={workbench.historyStatus}
              contentBusy={workbench.isContentBusy}
              resourceType={workbench.resourceType}
              sourceRecords={workbench.sourceRecords}
              sourceListStatus={workbench.sourceListStatus}
              sourceAddStatus={workbench.sourceAddStatus}
              onCreateNew={() => {
                setQuickAiOpen(false)
                workbench.createNewDocument()
                setWorkspaceView('editor')
              }}
              onOpenResources={() => setWorkspaceView('resources')}
              onOpenDocument={(documentId) => {
                setQuickAiOpen(false)
                setWorkspaceView('editor')
                if (documentId !== workbench.document.id) void workbench.openHistoryDocument(documentId)
              }}
              onReloadHistory={() => void workbench.reloadHistory()}
              onResourceTypeChange={(type) => void workbench.loadSources(type)}
              onAddSource={(type, sourceId, count) => {
                void workbench.addSource(type, sourceId, count)
              }}
            />
          ) : (
            <>
              <WorkspaceHeader
                sectionLabel="组题首页"
                documentTitle={workspaceView === 'resources' ? '我的资源' : workbench.document.title}
                questionCount={workbench.document.questions.length}
                canUndo={workbench.canUndo}
                onUndo={workbench.undo}
                onHome={openHome}
                showActions={workspaceView === 'editor'}
              />

              <section className={`workspace-shell${workspaceView === 'editor' && hasQuestions ? ` has-inspector${sortCollapsed ? ' is-sort-collapsed' : ''}` : ' is-empty'}`} aria-label="AI 题库组题工作区">
                {workspaceView === 'editor' && hasQuestions ? (
                  <QuestionSortPanel
                    questions={workbench.document.questions}
                    selectedQuestionId={workbench.selectedQuestionId}
                    collapsed={sortCollapsed}
                    onCollapsedChange={setSortCollapsed}
                    onSelectQuestion={workbench.selectQuestion}
                    onReorderQuestions={workbench.reorderQuestions}
                  />
                ) : null}
                <div className={`editor-scroll${workspaceView === 'resources' ? ' is-resources' : hasQuestions ? '' : ' is-empty'}`}>
                  {workspaceView === 'resources' ? <MyResourcesPanel /> : !hasQuestions ? (
                    <EmptyCanvas
                      document={workbench.document}
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
                      onRewriteRequirement={(requirement) => { workbench.setInspectorView('ai'); void workbench.rewrite('自定义要求', requirement) }}
                      onMoveQuestion={workbench.moveQuestion}
                      onDeleteQuestion={workbench.deleteQuestion}
                      onAdd={openAdd}
                    />
                  )}
                </div>

                {workspaceView === 'editor' && hasQuestions ? (
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
            </>
          )}

          {workbench.isAddOpen ? (
            <SourceDrawer
              mode={workbench.addMode}
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
          ) : null}

        </div>
      </main>
    </div>
  )
}

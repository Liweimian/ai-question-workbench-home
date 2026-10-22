import { useEffect, useRef, useState } from 'react'
import { QuestionInspector } from '../components/AiInspector'
import { DocumentCanvas } from '../components/DocumentCanvas'
import { EmptyCanvas } from '../components/EmptyCanvas'
import { MyResourcesPanel } from '../components/MyResourcesPanel'
import { SourceDrawer } from '../components/SourceDrawer'
import { WorkspaceHeader } from '../components/WorkspaceHeader'
import { WorkspaceSidebar } from '../components/WorkspaceSidebar'
import { useWorkbench } from '../hooks/useWorkbench'

export function WorkbenchHomePage() {
  const workbench = useWorkbench()
  const previousQuestionCount = useRef(workbench.document.questions.length)
  const [spaceCollapsed, setSpaceCollapsed] = useState(false)
  const [quickAiOpen, setQuickAiOpen] = useState(false)
  const [myResourcesOpen, setMyResourcesOpen] = useState(false)
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
    setMyResourcesOpen(false)
    setQuickAiOpen(false)
    workbench.openAdd(mode)
  }

  return (
    <div className="fx-app metis-theme-aiq">
      <main className="fx-content workbench-page">
        <div className="fx-zoom-area workbench-zoom-area">
          <WorkspaceHeader
            questionCount={workbench.document.questions.length}
            canUndo={workbench.canUndo}
            onUndo={workbench.undo}
          />

          <section className={`workspace-shell${spaceCollapsed ? ' is-space-collapsed' : ''}${hasQuestions ? ' has-inspector' : ' is-empty'}`} aria-label="AI 题库题单编辑">
            <WorkspaceSidebar
              collapsed={spaceCollapsed}
              document={workbench.document}
              histories={workbench.historyDocuments}
              historyStatus={workbench.historyStatus}
              query={workbench.historyQuery}
              contentBusy={workbench.isContentBusy}
              onCollapsedChange={setSpaceCollapsed}
              onQueryChange={workbench.setHistoryQuery}
              onCreateNew={() => {
                setQuickAiOpen(false)
                workbench.createNewDocument()
              }}
              onOpenMyResources={() => {
                setQuickAiOpen(false)
                workbench.closeAdd()
                setMyResourcesOpen(true)
              }}
              onOpenDocument={(documentId) => {
                setQuickAiOpen(false)
                void workbench.openHistoryDocument(documentId)
              }}
              onReload={() => void workbench.reloadHistory()}
            />

            <div className={`editor-scroll${hasQuestions ? '' : ' is-empty'}`}>
              {!hasQuestions ? (
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
                  onOpenAi={() => workbench.setInspectorView('ai')}
                  onMoveQuestion={workbench.moveQuestion}
                  onDeleteQuestion={workbench.deleteQuestion}
                  onEditQuestion={workbench.editQuestion}
                  onAdd={openAdd}
                />
              )}
            </div>

            {hasQuestions ? (
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

          {myResourcesOpen ? <MyResourcesPanel onClose={() => setMyResourcesOpen(false)} /> : null}
        </div>
      </main>
    </div>
  )
}

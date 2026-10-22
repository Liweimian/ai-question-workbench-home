import { useCallback, useEffect, useRef } from 'react'
import { AppSider } from '../components/AppSider'
import { QuestionInspector } from '../components/AiInspector'
import { DocumentCanvas } from '../components/DocumentCanvas'
import { EmptyCanvas } from '../components/EmptyCanvas'
import { QuestionNavigator } from '../components/QuestionNavigator'
import { SourceDrawer } from '../components/SourceDrawer'
import { WorkspaceHeader } from '../components/WorkspaceHeader'
import { useWorkbench } from '../hooks/useWorkbench'

export function WorkbenchHomePage() {
  const workbench = useWorkbench()
  const editorScrollRef = useRef<HTMLDivElement>(null)
  const previousQuestionCount = useRef(workbench.document.questions.length)

  const revealQuestion = useCallback((questionId: string) => {
    workbench.selectQuestion(questionId)
    window.requestAnimationFrame(() => {
      document.getElementById(`question-${questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [workbench])

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

  return (
    <div className="fx-app metis-theme-aiq">
      <AppSider />
      <main className="fx-content workbench-page">
        <div className="fx-zoom-area workbench-zoom-area">
          <WorkspaceHeader
            questionCount={workbench.document.questions.length}
            canUndo={workbench.canUndo}
            onUndo={workbench.undo}
            onAdd={() => workbench.openAdd('menu')}
          />

          <section className="workspace-shell" aria-label="AI 题库组题工作台">
            <QuestionNavigator
              document={workbench.document}
              selectedQuestionId={workbench.selectedQuestionId}
              view={workbench.navigatorView}
              query={workbench.historyQuery}
              historyStatus={workbench.historyStatus}
              histories={workbench.historyDocuments}
              contentBusy={workbench.isContentBusy}
              onViewChange={workbench.setNavigatorView}
              onQueryChange={workbench.setHistoryQuery}
              onSelectQuestion={revealQuestion}
              onOpenHistory={(documentId) => void workbench.openHistoryDocument(documentId)}
              onReloadHistory={() => void workbench.reloadHistory()}
              onAdd={() => workbench.openAdd('menu')}
            />

            <div className="editor-scroll" ref={editorScrollRef}>
              {workbench.document.questions.length === 0 ? (
                <EmptyCanvas onAdd={() => workbench.openAdd('menu')} />
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
                  onAdd={() => workbench.openAdd('menu')}
                />
              )}
            </div>

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
              onAddSource={(type, sourceId) => void workbench.addSource(type, sourceId)}
              onComposePromptChange={workbench.setComposePrompt}
              onCompose={() => void workbench.composeFromBank()}
              onCreatePromptChange={workbench.setCreatePrompt}
              onCreate={() => void workbench.createQuestions()}
              onAddCreated={workbench.addCreatedQuestions}
              onUpload={() => void workbench.recognizeUpload()}
              onAddManual={() => void workbench.addManualQuestion()}
              onClose={workbench.closeAdd}
            />
          ) : null}
        </div>
      </main>
    </div>
  )
}

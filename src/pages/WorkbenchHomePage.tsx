import { useEffect, useRef } from 'react'
import { AppSider } from '../components/AppSider'
import { AiInspector } from '../components/AiInspector'
import { DocumentCanvas } from '../components/DocumentCanvas'
import { EmptyCanvas } from '../components/EmptyCanvas'
import { SourceDrawer } from '../components/SourceDrawer'
import { WorkspaceHeader } from '../components/WorkspaceHeader'
import { useWorkbench } from '../hooks/useWorkbench'

export function WorkbenchHomePage() {
  const workbench = useWorkbench()
  const canvasScrollRef = useRef<HTMLDivElement>(null)
  const previousQuestionCount = useRef(workbench.document.questions.length)

  useEffect(() => {
    if (previousQuestionCount.current === 0 && workbench.document.questions.length > 0) {
      canvasScrollRef.current?.scrollTo({ top: 0 })
    }
    previousQuestionCount.current = workbench.document.questions.length
  }, [workbench.document.questions.length])

  const questionNumber = workbench.selectedQuestion
    ? workbench.document.questions.findIndex((question) => question.id === workbench.selectedQuestion?.id) + 1
    : 0

  const handleModeChange = (mode: 'resource' | 'upload' | 'generate') => {
    workbench.setSourceMode(mode)
    if (mode === 'resource') void workbench.loadSources(workbench.resourceType)
  }

  const panelClass = workbench.activePanel === 'source'
    ? ' has-left-panel'
    : workbench.activePanel === 'ai'
      ? ' has-right-panel'
      : ''

  return (
    <div className="fx-app metis-theme-aiq">
      <AppSider />
      <main className="fx-content workbench-page">
        <div className="fx-zoom-area workbench-zoom-area">
          <WorkspaceHeader
            questionCount={workbench.document.questions.length}
            canUndo={workbench.canUndo}
            onUndo={workbench.undo}
            onAdd={() => workbench.openSourcePanel('resource')}
          />

          <section className={`workspace-stage${panelClass}`} aria-label="AI 题库工作台">
            {workbench.activePanel === 'source' ? (
              <SourceDrawer
                mode={workbench.sourceMode}
                resourceType={workbench.resourceType}
                records={workbench.sourceRecords}
                listStatus={workbench.sourceListStatus}
                addStatus={workbench.sourceAddStatus}
                contentBusy={workbench.isContentBusy}
                prompt={workbench.prompt}
                promptError={workbench.promptError}
                generateStatus={workbench.generateStatus}
                onModeChange={handleModeChange}
                onResourceTypeChange={(type) => void workbench.loadSources(type)}
                onAddSource={(type, sourceId) => void workbench.addSource(type, sourceId)}
                onPromptChange={workbench.setPrompt}
                onGenerate={() => void workbench.generate()}
                onClose={workbench.closePanel}
              />
            ) : null}

            {workbench.activePanel === 'ai' && workbench.selectedQuestion ? (
              <AiInspector
                question={workbench.selectedQuestion}
                questionNumber={questionNumber}
                status={workbench.rewriteStatus}
                preview={workbench.rewritePreview}
                onRewrite={(instruction) => void workbench.rewrite(instruction)}
                onApply={workbench.applyRewrite}
                onClose={workbench.closePanel}
              />
            ) : null}

            <div className="canvas-scroll" ref={canvasScrollRef}>
              {workbench.document.questions.length === 0 ? (
                <article className="paper-canvas paper-canvas--empty" aria-label="空白题单画布">
                  <EmptyCanvas
                    prompt={workbench.prompt}
                    promptError={workbench.promptError}
                    generateStatus={workbench.generateStatus}
                    loadingRecent={workbench.recentStatus === 'loading'}
                    contentBusy={workbench.isContentBusy}
                    onPromptChange={workbench.setPrompt}
                    onGenerate={() => void workbench.generate()}
                    onOpenResource={() => workbench.openSourcePanel('resource')}
                    onOpenUpload={() => workbench.openSourcePanel('upload')}
                    onOpenGenerate={() => workbench.openSourcePanel('generate')}
                    onContinueRecent={() => void workbench.continueRecent()}
                  />
                </article>
              ) : (
                <DocumentCanvas
                  document={workbench.document}
                  selectedQuestionId={workbench.selectedQuestionId}
                  onTitleChange={workbench.setTitle}
                  onSelectQuestion={workbench.selectQuestion}
                  onOpenAi={workbench.openAiPanel}
                  onMoveQuestion={workbench.moveQuestion}
                  onDeleteQuestion={workbench.deleteQuestion}
                  onEditQuestion={workbench.editQuestion}
                  onAdd={() => workbench.openSourcePanel('resource')}
                />
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

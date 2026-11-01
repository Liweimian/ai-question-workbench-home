import { Fragment, useEffect, useRef, useState } from 'react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import { QuestionInspector } from '../components/AiInspector'
import { AiAssistantWorkspace } from '../components/AiAssistantWorkspace'
import { QuestionSortPanel } from '../components/QuestionSortPanel'
import { DocumentCanvas } from '../components/DocumentCanvas'
import { EmptyCanvas } from '../components/EmptyCanvas'
import { MyResourcesPanel } from '../components/MyResourcesPanel'
import { SourceDrawer } from '../components/SourceDrawer'
import { WorkspaceHeader } from '../components/WorkspaceHeader'
import { DocumentCenter } from '../components/DocumentCenter'
import { ElephantIcon, FeixiangAiLibraryLogo } from '../components/ElephantIcon'
import { isDefaultDocumentTitle } from '../data/workbenchData'
import { useWorkbench } from '../hooks/useWorkbench'
import { defaultDocumentFormat } from '../prototype/types'
import type { AddQuestionMode, MyResourceKind, SourceRecord } from '../prototype/types'
import { BrainCircuit, FileText, House, PanelLeftClose, PanelRightOpen, RefreshCw, X } from 'lucide-react'
import { EditorStudioShell } from '../components/EditorStudioShell'
import { ScoreSettingsDialog } from '../components/ScoreSettingsDialog'
import { getDocumentKind, needsPaperScoreSettings } from '../utils/documentEditorUtils'
import { openAnswerSheetTab } from '../utils/answerSheetRoute'
import { RecentBrowsePanel } from '../components/RecentBrowsePanel'
import { RequirementSpecControls } from '../components/RequirementSpecControls'
import { readRecentBrowseEntries, recordRecentBrowse, type RecentBrowseEntry } from '../utils/recentBrowseHistory'

type AddTabMode = Exclude<AddQuestionMode, 'menu' | 'compose' | 'personalized'>
type LibraryTabMode = Extract<AddTabMode, 'resource' | 'school'>

interface LibraryDetailTab {
  key: string
  libraryMode: LibraryTabMode
  record: SourceRecord
}

const addTabLabels: Record<AddTabMode, string> = {
  resource: '飞象题库',
  school: '校本题库',
  upload: '上传文件 AI 录题',
  create: 'AI 出题',
  manual: '手工录入',
}

function isLibraryTabMode(mode: AddTabMode): mode is LibraryTabMode {
  return mode === 'resource' || mode === 'school'
}

export function WorkbenchHomePage() {
  const workbench = useWorkbench()
  const previousQuestionCount = useRef(workbench.document.questions.length)
  const previousDocumentId = useRef(workbench.document.id)
  const highlightTimerRef = useRef<number | null>(null)
  const assistantTabRef = useRef<HTMLButtonElement>(null)
  const [sortCollapsed, setSortCollapsed] = useState(false)
  const [sidePanelOpen, setSidePanelOpen] = useState(true)
  const [draftCollapsed, setDraftCollapsed] = useState(false)
  const [openAddTabs, setOpenAddTabs] = useState<AddTabMode[]>([])
  const [libraryDetailTabs, setLibraryDetailTabs] = useState<LibraryDetailTab[]>([])
  const [activeLibraryDetailKey, setActiveLibraryDetailKey] = useState<string | null>(null)
  const [assistantTabOpen, setAssistantTabOpen] = useState(false)
  const [assistantActive, setAssistantActive] = useState(false)
  const [myResourcesTabOpen, setMyResourcesTabOpen] = useState(false)
  const [myResourcesActive, setMyResourcesActive] = useState(false)
  const [myResourcesInitialKind, setMyResourcesInitialKind] = useState<MyResourceKind | '全部'>('全部')
  const [recentBrowseTabOpen, setRecentBrowseTabOpen] = useState(false)
  const [recentBrowseActive, setRecentBrowseActive] = useState(false)
  const [recentBrowseEntries, setRecentBrowseEntries] = useState<RecentBrowseEntry[]>(() => readRecentBrowseEntries())
  const [recentlyAddedQuestionId, setRecentlyAddedQuestionId] = useState<string | null>(null)
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false)
  const [scoreDialogNext, setScoreDialogNext] = useState<'save' | 'generate' | 'assign' | 'download' | 'print' | null>(null)
  const hasQuestions = workbench.document.questions.length > 0
  const activeLibraryDetail = libraryDetailTabs.find((tab) => tab.key === activeLibraryDetailKey) ?? null

  useEffect(() => {
    if (workbench.document.questions.length > previousQuestionCount.current && workbench.selectedQuestionId) {
      setRecentlyAddedQuestionId(workbench.selectedQuestionId)
      if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = window.setTimeout(() => {
        setRecentlyAddedQuestionId(null)
        highlightTimerRef.current = null
      }, 1800)
      window.requestAnimationFrame(() => {
        document.getElementById(`question-${workbench.selectedQuestionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
    previousQuestionCount.current = workbench.document.questions.length
  }, [workbench.document.questions.length, workbench.selectedQuestionId])

  useEffect(() => () => {
    if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current)
  }, [])

  useEffect(() => {
    if (previousDocumentId.current === workbench.document.id) return
    previousDocumentId.current = workbench.document.id
    setRecentlyAddedQuestionId(null)
    setAssistantTabOpen(false)
    setAssistantActive(false)
    setMyResourcesTabOpen(false)
    setMyResourcesActive(false)
  }, [workbench.document.id])

  useEffect(() => {
    if (!assistantTabOpen || !assistantActive) return
    window.requestAnimationFrame(() => {
      assistantTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      assistantTabRef.current?.focus()
    })
  }, [assistantActive, assistantTabOpen])

  const questionNumber = workbench.selectedQuestion
    ? workbench.document.questions.findIndex((question) => question.id === workbench.selectedQuestion?.id) + 1
    : 0

  const openAssistant = (prompt?: string) => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setMyResourcesActive(false)
    if (prompt === undefined && workbench.assistantRun) {
      workbench.closeAdd()
      setAssistantTabOpen(true)
      setAssistantActive(true)
      return
    }
    setAssistantTabOpen(true)
    setAssistantActive(true)
    workbench.closeAdd()
    if (prompt !== undefined) workbench.setComposePrompt(prompt)
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>('[aria-label="AI 组题要求"]')?.focus()
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
    setActiveLibraryDetailKey(null)
    setAssistantActive(false)
    setMyResourcesActive(false)
    setRecentBrowseActive(false)
    if (mode !== 'menu') {
      setOpenAddTabs((current) => current.includes(mode) ? current : [...current, mode])
    }
    workbench.openAdd(mode, options)
  }

  const activateAddTab = (mode: AddTabMode) => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setAssistantActive(false)
    setMyResourcesActive(false)
    setRecentBrowseActive(false)
    if (!workbench.isAddOpen || workbench.addMode !== mode) workbench.openAdd(mode)
  }

  const refreshRecentBrowseEntries = () => {
    setRecentBrowseEntries(readRecentBrowseEntries())
  }

  const openRecentBrowse = () => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setAssistantActive(false)
    setMyResourcesActive(false)
    workbench.closeAdd()
    setRecentBrowseTabOpen(true)
    setRecentBrowseActive(true)
    refreshRecentBrowseEntries()
  }

  const closeRecentBrowseTab = () => {
    setRecentBrowseTabOpen(false)
    setRecentBrowseActive(false)
  }

  const activateRecentBrowseTab = () => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setAssistantActive(false)
    setMyResourcesActive(false)
    workbench.closeAdd()
    setRecentBrowseActive(true)
    refreshRecentBrowseEntries()
  }

  const openLibraryDetail = (libraryMode: LibraryTabMode, record: SourceRecord) => {
    const key = `${libraryMode}:${record.id}`
    setSidePanelOpen(true)
    setAssistantActive(false)
    setMyResourcesActive(false)
    setOpenAddTabs((current) => current.includes(libraryMode) ? current : [...current, libraryMode])
    setLibraryDetailTabs((current) => current.some((tab) => tab.key === key)
      ? current
      : [...current, { key, libraryMode, record }])
    setActiveLibraryDetailKey(key)
    setRecentBrowseActive(false)
    recordRecentBrowse(libraryMode, record)
    refreshRecentBrowseEntries()
    if (!workbench.isAddOpen || workbench.addMode !== libraryMode) {
      workbench.openAdd(libraryMode, { libraryView: record.sourceType })
    }
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-detail-tab-key="${key}"]`)?.focus()
    })
  }

  const openRecentBrowseEntry = (entry: RecentBrowseEntry) => {
    openLibraryDetail(entry.libraryMode, entry.record)
  }

  const activateLibraryDetail = (tab: LibraryDetailTab) => {
    setSidePanelOpen(true)
    setAssistantActive(false)
    setMyResourcesActive(false)
    setActiveLibraryDetailKey(tab.key)
    if (!workbench.isAddOpen || workbench.addMode !== tab.libraryMode) {
      workbench.openAdd(tab.libraryMode, { libraryView: tab.record.sourceType })
    }
  }

  const activateAddHome = () => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setAssistantActive(false)
    setMyResourcesActive(false)
    setRecentBrowseActive(false)
    workbench.closeAdd()
  }

  const submitAssistant = () => {
    if (!workbench.composePrompt.trim() || workbench.isContentBusy || workbench.composeStatus === 'loading') {
      void workbench.composeFromBank()
      return
    }
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    workbench.closeAdd()
    setAssistantTabOpen(true)
    setAssistantActive(true)
    void workbench.composeFromBank()
  }

  const activateAssistantTab = () => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setMyResourcesActive(false)
    workbench.closeAdd()
    setAssistantActive(true)
  }

  const closeAssistantTab = () => {
    workbench.clearAssistantRun()
    setAssistantTabOpen(false)
    if (assistantActive) setAssistantActive(false)
  }

  const openMyResources = (initialKind: MyResourceKind | '全部' = '全部') => {
    setMyResourcesInitialKind(initialKind)
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setAssistantActive(false)
    workbench.closeAdd()
    setMyResourcesTabOpen(true)
    setMyResourcesActive(true)
  }

  const closeMyResourcesTab = () => {
    setMyResourcesTabOpen(false)
    setMyResourcesActive(false)
  }

  const closeAddTab = (mode: AddTabMode) => {
    setOpenAddTabs((current) => current.filter((item) => item !== mode))
    if (isLibraryTabMode(mode)) {
      setLibraryDetailTabs((current) => current.filter((tab) => tab.libraryMode !== mode))
      if (activeLibraryDetail?.libraryMode === mode) setActiveLibraryDetailKey(null)
    }
    if (workbench.isAddOpen && workbench.addMode === mode) workbench.closeAdd()
  }

  const closeLibraryDetailTab = (tab: LibraryDetailTab) => {
    setLibraryDetailTabs((current) => current.filter((item) => item.key !== tab.key))
    if (activeLibraryDetailKey !== tab.key) return
    setActiveLibraryDetailKey(null)
    if (!workbench.isAddOpen || workbench.addMode !== tab.libraryMode) {
      workbench.openAdd(tab.libraryMode, { libraryView: tab.record.sourceType })
    }
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-add-tab-mode="${tab.libraryMode}"]`)?.focus()
    })
  }

  const collapseSidePanel = () => {
    setDraftCollapsed(false)
    setSidePanelOpen(false)
  }

  const isAddHome = !workbench.isAddOpen && !activeLibraryDetail && !assistantActive && !myResourcesActive && !recentBrowseActive
  const alternateHomeLayout = sidePanelOpen && isAddHome && !draftCollapsed
  const studioEditorOpen = !sidePanelOpen
  const documentCenterVisible = sidePanelOpen && isAddHome
  const reviewMode = new URLSearchParams(window.location.search).get('mode') === 'review'
  const libraryDetailRecord = activeLibraryDetail?.record ?? null
  const shellClassName = sidePanelOpen
    ? `workspace-shell is-split-source${draftCollapsed ? ' is-draft-collapsed' : ''}`
    : `workspace-shell is-focus-editor is-studio${sortCollapsed ? ' is-sort-collapsed' : ''}${hasQuestions ? '' : ' is-empty'}`
  const documentFormat = { ...defaultDocumentFormat, ...workbench.document.format }
  const hasCustomDocumentFormat = Object.entries(defaultDocumentFormat).some(
    ([key, value]) => documentFormat[key as keyof typeof documentFormat] !== value,
  )
  const canSaveDocument = workbench.document.questions.length > 0
    || Boolean(workbench.document.intro?.trim())
    || hasCustomDocumentFormat
    || (!['未命名组题', '未命名题单'].includes(workbench.document.title.trim()) && !isDefaultDocumentTitle(workbench.document.title))
  const finalizeNewDocument = () => {
    if (!workbench.createNewDocument({ preserveAddWorkspace: sidePanelOpen })) return
    setActiveLibraryDetailKey(null)
    setAssistantTabOpen(false)
    setAssistantActive(false)
    setSidePanelOpen(true)
    setDraftCollapsed(false)
  }

  const hasUnsavedDocumentChanges = workbench.documentSyncState === 'dirty' || workbench.assignmentOutdated

  const expandEditorForScores = () => {
    setDraftCollapsed(false)
    setSidePanelOpen(false)
  }

  const openScoreDialog = (next: 'save' | 'generate' | 'assign' | 'download' | 'print') => {
    if (sidePanelOpen) expandEditorForScores()
    setScoreDialogNext(next)
    setScoreDialogOpen(true)
  }

  const requirePaperScores = (next: 'save' | 'generate' | 'assign' | 'download' | 'print', kind = getDocumentKind(workbench.document)) => {
    if (!needsPaperScoreSettings(workbench.document, kind)) return true
    MetisMessage.error('试题分值不能为空')
    if (kind === '试卷' && getDocumentKind(workbench.document) !== '试卷') {
      workbench.setDocumentKind('试卷')
    }
    openScoreDialog(next)
    return false
  }

  const downloadCurrentDocument = () => {
    const title = workbench.document.title.trim() || '未命名'
    const safeTitle = title.replace(/[\\/:*?"<>|]/g, '-')
    const wordHtml = `<html><meta charset="utf-8"><body><h1>${safeTitle}</h1><p>共 ${workbench.document.questions.length} 道题</p></body></html>`
    const url = URL.createObjectURL(new Blob([wordHtml], { type: 'application/msword' }))
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = `${safeTitle}.doc`
    anchor.click()
    URL.revokeObjectURL(url)
    workbench.markDocumentOutput('download')
    MetisMessage.success('Word 已开始下载')
  }

  const printCurrentDocument = () => {
    workbench.markDocumentOutput('print')
    window.print()
  }

  const finishScoreDialogAction = (next: typeof scoreDialogNext) => {
    if (next === 'generate') {
      if (workbench.generateAnswerSheet()) openAnswerSheetTab(workbench.document.id)
      return
    }
    if (next === 'save') {
      void workbench.saveDocument(true, '试卷')
      return
    }
    if (next === 'assign') {
      void workbench.assignDocument()
      return
    }
    if (next === 'download') {
      downloadCurrentDocument()
      return
    }
    if (next === 'print') printCurrentDocument()
  }

  const trySaveDocument = async (kind?: Parameters<typeof workbench.saveDocument>[1]) => {
    const resolvedKind = kind ?? getDocumentKind(workbench.document)
    if (!requirePaperScores('save', resolvedKind)) return false
    return workbench.saveDocument(true, kind)
  }

  const tryAssignDocument = () => {
    if (!requirePaperScores('assign')) return
    void workbench.assignDocument()
  }

  const tryDownloadDocument = () => {
    if (!requirePaperScores('download')) return
    downloadCurrentDocument()
  }

  const tryPrintDocument = () => {
    if (!requirePaperScores('print')) return
    printCurrentDocument()
  }

  const tryGenerateAnswerSheet = () => {
    if (workbench.document.questions.length === 0) return
    if (!requirePaperScores('generate')) return
    if (workbench.generateAnswerSheet()) openAnswerSheetTab(workbench.document.id)
  }

  const renderDraftContent = (hideActionToolbar = false, studioLayout = false) => {
    const draftBody = !hasQuestions ? (
      <EmptyCanvas
        document={workbench.document}
        sidePanelOpen={sidePanelOpen}
        hideActionToolbar={hideActionToolbar}
        onTitleChange={workbench.setTitle}
        onIntroChange={workbench.setIntro}
        onDocumentFormatChange={workbench.setDocumentFormat}
        canSave={canSaveDocument}
        contentBusy={workbench.isContentBusy}
        syncState={workbench.documentSyncState}
        assignmentOutdated={workbench.assignmentOutdated}
        onSave={() => { void trySaveDocument() }}
        onAssign={tryAssignDocument}
        onRequirePaperScores={requirePaperScores}
        onOpenAssistant={openAssistant}
        onOpenAdd={openAdd}
        onOpenMyResources={() => openMyResources('全部')}
        onKindChange={workbench.setDocumentKind}
        onAnswerModeChange={workbench.setAnswerMode}
        studioLayout={studioLayout}
      />
    ) : (
      <DocumentCanvas
        document={workbench.document}
        compactPreview={sidePanelOpen}
        hideActionToolbar={hideActionToolbar}
        selectedQuestionId={workbench.selectedQuestionId}
        highlightedQuestionId={recentlyAddedQuestionId}
        onTitleChange={workbench.setTitle}
        onSelectQuestion={workbench.selectQuestion}
        onRewriteRequirement={(requirement) => { void workbench.rewrite('自定义要求', requirement) }}
        rewriteStatus={workbench.rewriteStatus}
        rewritePreview={workbench.rewritePreview}
        onApplyRewrite={workbench.applyRewrite}
        onMoveQuestion={workbench.moveQuestion}
        onDeleteQuestion={workbench.deleteQuestion}
        onQuestionChange={workbench.updateQuestion}
        onDocumentFormatChange={workbench.setDocumentFormat}
        canSave={canSaveDocument}
        contentBusy={workbench.isContentBusy}
        syncState={workbench.documentSyncState}
        assignmentOutdated={workbench.assignmentOutdated}
        onSave={() => { void trySaveDocument() }}
        onAssign={tryAssignDocument}
        onRequirePaperScores={requirePaperScores}
        onSectionTitleChange={workbench.setSectionTitle}
        onAdd={openAdd}
        onOpenMyResources={() => openMyResources('全部')}
        onKindChange={workbench.setDocumentKind}
        onAnswerModeChange={workbench.setAnswerMode}
        onGenerateAnswerSheet={tryGenerateAnswerSheet}
        studioLayout={studioLayout}
      />
    )

    return (
      <div className={`editor-scroll${hasQuestions ? '' : ' is-empty'}${studioLayout ? ' is-studio-canvas' : ''}`}>
        {draftBody}
      </div>
    )
  }

  return (
    <div className="fx-app metis-theme-aiq">
      <main className="fx-content workbench-page">
        <div className={`fx-zoom-area workbench-zoom-area${alternateHomeLayout ? ' is-alternate-home' : ''}`}>
          <WorkspaceHeader
            documentTitle={workbench.document.title}
            documentUpdatedAt={workbench.document.updatedAt}
            questionCount={workbench.document.questions.length}
            canSave={canSaveDocument}
            canUndo={workbench.canUndo && !workbench.isContentBusy}
            contentBusy={workbench.isContentBusy}
            documentStatus={workbench.documentStatus}
            syncState={workbench.documentSyncState}
            assignmentOutdated={workbench.assignmentOutdated}
            hasPersistedDraft={workbench.historyDocuments.some((item) => item.id === workbench.document.id)}
            onUndo={() => {
              setAssistantTabOpen(false)
              setAssistantActive(false)
              workbench.undo()
            }}
            onCreateNew={finalizeNewDocument}
            hasUnsavedChanges={hasUnsavedDocumentChanges}
            onSaveAndCreateNew={() => workbench.saveDocument(true, '题单')}
            onSave={(kind) => trySaveDocument(kind)}
            onAssign={tryAssignDocument}
            onMarkOutput={workbench.markDocumentOutput}
            sidePanelOpen={sidePanelOpen}
            onSidePanelOpen={() => {
              setSidePanelOpen(true)
              setDraftCollapsed(false)
            }}
            onEnterEdit={() => {
              setSidePanelOpen(false)
              setDraftCollapsed(false)
            }}
            studioEditorOpen={studioEditorOpen}
            studioDocument={studioEditorOpen ? workbench.document : undefined}
            onStudioSave={() => { void trySaveDocument() }}
            onStudioAssign={tryAssignDocument}
            onStudioGenerateAnswerSheet={tryGenerateAnswerSheet}
            onRequirePaperScores={requirePaperScores}
            draftCollapsed={draftCollapsed}
            onDraftCollapse={() => setDraftCollapsed(true)}
            onDraftExpand={() => setDraftCollapsed(false)}
          />

          <section className={`${shellClassName}${alternateHomeLayout ? ' is-alternate-home is-home-layout-2' : ''}`} aria-label="飞象AI题库编辑器">
            {!alternateHomeLayout ? (!draftCollapsed ? (studioEditorOpen ? (
              <EditorStudioShell
                document={workbench.document}
                onDocumentFormatChange={workbench.setDocumentFormat}
                onKindChange={workbench.setDocumentKind}
                onAnswerModeChange={workbench.setAnswerMode}
                onOpenScoreSettings={() => openScoreDialog('save')}
                sortPanel={(
                  <QuestionSortPanel
                    questions={workbench.document.questions}
                    selectedQuestionId={workbench.selectedQuestionId}
                    collapsed={sortCollapsed}
                    onCollapsedChange={setSortCollapsed}
                    onSelectQuestion={workbench.selectQuestion}
                    onReorderQuestions={workbench.reorderQuestions}
                  />
                )}
                inspector={(
                  <QuestionInspector
                    document={workbench.document}
                    question={workbench.selectedQuestion}
                    questionNumber={questionNumber}
                    view={workbench.inspectorView}
                    status={workbench.rewriteStatus}
                    preview={workbench.rewritePreview}
                    onViewChange={workbench.setInspectorView}
                    onRewrite={(instruction) => { void workbench.rewrite(instruction) }}
                    onApply={workbench.applyRewrite}
                    studioLayout
                  />
                )}
              >
                {renderDraftContent(true, true)}
              </EditorStudioShell>
            ) : renderDraftContent(sidePanelOpen)) : (
              <aside className="draft-collapsed-rail" aria-label="组题画布已收起">
                <button type="button" onClick={() => setDraftCollapsed(false)} aria-label="展开组题画布" title="展开组题画布">
                  <PanelRightOpen size={17} />
                  <span>组题画布</span>
                </button>
              </aside>
            )) : null}

            {sidePanelOpen ? (
              <div className="add-workspace" aria-label="添加题目多任务工作区">
                <div className="add-workspace-brand" aria-label="选择学段科目">
                  <FeixiangAiLibraryLogo />
                  <span className="add-workspace-subject">
                    <select aria-label="学段科目" defaultValue="初中数学">
                      <option>小学数学</option>
                      <option>初中数学</option>
                      <option>高中数学</option>
                    </select>
                  </span>
                </div>
                <nav className="add-workspace-tabs" aria-label="已打开的添加方式" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-label="添加题目首页"
                    title="添加题目首页"
                    aria-selected={!workbench.isAddOpen && !activeLibraryDetail && !assistantActive && !myResourcesActive && !recentBrowseActive}
                    className={`add-workspace-home${!workbench.isAddOpen && !activeLibraryDetail && !assistantActive && !myResourcesActive && !recentBrowseActive ? ' is-active' : ''}`}
                    onClick={activateAddHome}
                  ><House size={17} /></button>
                  {openAddTabs.map((mode) => (
                    <Fragment key={mode}>
                      <span className={`add-workspace-tab${workbench.isAddOpen && workbench.addMode === mode && !activeLibraryDetail ? ' is-active' : ''}`}>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={workbench.isAddOpen && workbench.addMode === mode && !activeLibraryDetail}
                          data-add-tab-mode={mode}
                          onClick={() => activateAddTab(mode)}
                        >{addTabLabels[mode]}</button>
                        <button type="button" className="add-workspace-tab-close" aria-label={`关闭${addTabLabels[mode]}`} onClick={() => closeAddTab(mode)}>
                          <X size={13} />
                        </button>
                      </span>
                      {isLibraryTabMode(mode) ? libraryDetailTabs.filter((tab) => tab.libraryMode === mode).map((tab) => (
                        <span className={`add-workspace-tab is-detail${activeLibraryDetailKey === tab.key ? ' is-active' : ''}`} key={tab.key}>
                          <button
                            type="button"
                            role="tab"
                            title={tab.record.title}
                            aria-selected={activeLibraryDetailKey === tab.key}
                            data-detail-tab-key={tab.key}
                            onClick={() => activateLibraryDetail(tab)}
                            data-track="/click/aiQuestionHome/switchResourceDetailTab | 切换资源详情 | resourceId#STRING"
                          ><FileText size={14} /><span>{tab.record.title}</span></button>
                          <button type="button" className="add-workspace-tab-close" aria-label={`关闭${tab.record.title}`} onClick={() => closeLibraryDetailTab(tab)}>
                            <X size={13} />
                          </button>
                        </span>
                      )) : null}
                    </Fragment>
                  ))}
                  {assistantTabOpen ? (
                    <span className={`add-workspace-tab is-assistant${assistantActive ? ' is-active' : ''}`}>
                      <button
                        type="button"
                        role="tab"
                        ref={assistantTabRef}
                        aria-selected={assistantActive}
                        onClick={activateAssistantTab}
                        data-track="/click/aiQuestionHome/switchAssistantTab | 切换AI助手任务 | 无"
                      ><BrainCircuit size={14} /><span>AI 组题</span></button>
                      <button
                        type="button"
                        className="add-workspace-tab-close"
                        aria-label={workbench.composeStatus === 'loading' ? 'AI 组题正在处理，暂不可关闭' : '关闭 AI 组题'}
                        disabled={workbench.composeStatus === 'loading'}
                        onClick={closeAssistantTab}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ) : null}
                  {myResourcesTabOpen ? (
                    <span className={`add-workspace-tab is-my-resources${myResourcesActive ? ' is-active' : ''}`}>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={myResourcesActive}
                        onClick={() => openMyResources(myResourcesInitialKind)}
                        data-track="/click/aiQuestionHome/switchMyResourcesTab | 切换我的资源任务 | 无"
                      ><span>我的资源</span></button>
                      <button type="button" className="add-workspace-tab-close" aria-label="关闭我的资源" onClick={closeMyResourcesTab}>
                        <X size={13} />
                      </button>
                    </span>
                  ) : null}
                  {recentBrowseTabOpen ? (
                    <span className={`add-workspace-tab is-recent-browse${recentBrowseActive ? ' is-active' : ''}`}>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={recentBrowseActive}
                        onClick={activateRecentBrowseTab}
                        data-track="/click/aiQuestionHome/switchRecentBrowseTab | 切换最近浏览 | 无"
                      ><RefreshCw size={14} /><span>最近浏览</span></button>
                      <button type="button" className="add-workspace-tab-close" aria-label="关闭最近浏览" onClick={closeRecentBrowseTab}>
                        <X size={13} />
                      </button>
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="add-workspace-collapse"
                    aria-label="收起添加题目工作区"
                    title="专注编辑"
                    onClick={collapseSidePanel}
                  ><PanelLeftClose size={17} /></button>
                </nav>
                {myResourcesActive && myResourcesTabOpen ? (
                  <MyResourcesPanel
                    initialKind={myResourcesInitialKind}
                    histories={workbench.historyDocuments}
                    currentDocumentId={workbench.document.id}
                    contentBusy={workbench.isContentBusy || workbench.documentSyncState === 'dirty' || workbench.documentSyncState === 'saving'}
                    pendingResourceId={workbench.myResourcePendingId}
                    addedResourceIds={workbench.myResourceAddedIds}
                    onOpenDocument={(documentId) => { void workbench.openHistoryDocument(documentId) }}
                    onAddResource={(resource) => { void workbench.addMyResource(resource) }}
                  />
                ) : recentBrowseActive && recentBrowseTabOpen ? (
                  <RecentBrowsePanel
                    entries={recentBrowseEntries}
                    onOpenEntry={openRecentBrowseEntry}
                  />
                ) : assistantActive && assistantTabOpen ? (
                  <AiAssistantWorkspace
                    run={workbench.assistantRun}
                    prompt={workbench.composePrompt}
                    error={workbench.composeError}
                    status={workbench.composeStatus}
                    contentBusy={workbench.isContentBusy}
                    questions={workbench.composePreview}
                    addedQuestionIds={new Set(workbench.document.questions.map((question) => question.id))}
                    onPromptChange={workbench.setComposePrompt}
                    onSubmit={submitAssistant}
                    onAddQuestions={workbench.addComposeQuestions}
                  />
                ) : workbench.isAddOpen ? (
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
                    libraryDetail={activeLibraryDetail?.libraryMode === workbench.addMode ? activeLibraryDetail.record : null}
                    onModeChange={workbench.setAddMode}
                    onResourceTypeChange={(type) => void workbench.loadSources(type)}
                    onAddSource={(type, sourceId, count, selectedQuestions) => workbench.addSource(type, sourceId, count, selectedQuestions)}
                    currentDocumentHasContent={workbench.currentDocumentHasContent}
                    onCompleteEditWholeVolume={(type, sourceId, count, selectedQuestions, mode) => workbench.completeEditWholeVolumeAsNewDocument(type, sourceId, count, selectedQuestions, mode)}
                    onOpenLibraryDetail={(record) => {
                      if (workbench.addMode === 'resource' || workbench.addMode === 'school') {
                        openLibraryDetail(workbench.addMode, record)
                      }
                    }}
                    onCreateConfigChange={workbench.setCreateConfig}
                    onCreate={(requestOverride) => void workbench.createQuestions(requestOverride)}
                    onAddCreated={workbench.addCreatedQuestions}
                    onUpload={() => void workbench.recognizeUpload()}
                    onAddManual={() => void workbench.addManualQuestion()}
                    onClose={activeLibraryDetail ? () => closeLibraryDetailTab(activeLibraryDetail) : activateAddHome}
                  />
                ) : (
                  <DocumentCenter
                    embedded
                    draftContent={renderDraftContent(false)}
                    histories={workbench.historyDocuments}
                    historyStatus={workbench.historyStatus}
                    onOpenDocument={(documentId) => { void workbench.openHistoryDocument(documentId) }}
                    onOpenMyResources={() => openMyResources('全部')}
                    onOpenSource={(mode, options) => openAdd(mode, options)}
                    onOpenRecentBrowse={openRecentBrowse}
                    onReload={() => { void workbench.reloadHistory() }}
                  />
                )}
              </div>
            ) : null}
          </section>
        </div>
      </main>
      <RequirementSpecControls
        reviewMode={reviewMode}
        context={{
          documentCenterVisible,
          studioEditorOpen,
          isAddOpen: workbench.isAddOpen,
          addMode: workbench.addMode,
          libraryInitialView: workbench.libraryInitialView,
          activeLibraryDetail: libraryDetailRecord,
          myResourcesTabOpen: myResourcesActive,
          recentBrowseTabOpen: recentBrowseActive,
          assistantTabOpen: assistantActive,
        }}
      />
      {scoreDialogOpen ? (
        <ScoreSettingsDialog
          questions={workbench.document.questions}
          onClose={() => {
            setScoreDialogOpen(false)
            setScoreDialogNext(null)
          }}
          onSave={(scores) => {
            workbench.applyQuestionScores(scores)
            setScoreDialogOpen(false)
            const next = scoreDialogNext
            setScoreDialogNext(null)
            finishScoreDialogAction(next)
          }}
        />
      ) : null}
    </div>
  )
}

import { Fragment, useEffect, useRef, useState } from 'react'
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
import { BrainCircuit, FileText, House, PanelLeftClose, PanelRightOpen, X } from 'lucide-react'

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
  upload: 'AI 录题',
  create: 'AI 生题',
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
  const [homeLayoutVariant, setHomeLayoutVariant] = useState<1 | 2 | 3 | 4>(4)
  const [draftPushAnimating, setDraftPushAnimating] = useState(false)
  const [recentlyAddedQuestionId, setRecentlyAddedQuestionId] = useState<string | null>(null)
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
    if (homeLayoutVariant === 3 && !workbench.isAddOpen && !assistantActive && !myResourcesActive) {
      setDraftPushAnimating(true)
      window.setTimeout(() => setDraftPushAnimating(false), 520)
    }
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
    if (!workbench.isAddOpen || workbench.addMode !== mode) workbench.openAdd(mode)
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
    if (!workbench.isAddOpen || workbench.addMode !== libraryMode) {
      workbench.openAdd(libraryMode, { libraryView: record.sourceType })
    }
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-detail-tab-key="${key}"]`)?.focus()
    })
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

  const isAddHome = !workbench.isAddOpen && !activeLibraryDetail && !assistantActive && !myResourcesActive
  const alternateHomeLayout = sidePanelOpen && isAddHome && (homeLayoutVariant === 2 || homeLayoutVariant === 3) && !draftCollapsed
  const shellClassName = sidePanelOpen
    ? `workspace-shell is-split-source${draftCollapsed ? ' is-draft-collapsed' : ''}`
    : `workspace-shell is-focus-editor${hasQuestions ? ` has-inspector${sortCollapsed ? ' is-sort-collapsed' : ''}` : ' is-empty'}`
  const documentFormat = { ...defaultDocumentFormat, ...workbench.document.format }
  const hasCustomDocumentFormat = Object.entries(defaultDocumentFormat).some(
    ([key, value]) => documentFormat[key as keyof typeof documentFormat] !== value,
  )
  const isUntouchedBlankDocument = workbench.document.questions.length === 0
    && !workbench.document.intro?.trim()
    && !hasCustomDocumentFormat
    && isDefaultDocumentTitle(workbench.document.title)

  const renderDraftContent = () => <div className={`editor-scroll${hasQuestions ? '' : ' is-empty'}${draftPushAnimating ? ' is-pushing-right' : ''}`}>
    {!hasQuestions ? (
      <EmptyCanvas
        document={workbench.document}
        sidePanelOpen={sidePanelOpen}
        onTitleChange={workbench.setTitle}
        onIntroChange={workbench.setIntro}
        onDocumentFormatChange={workbench.setDocumentFormat}
        onOpenAssistant={openAssistant}
        onOpenAdd={openAdd}
      />
    ) : (
      <DocumentCanvas
        document={workbench.document}
        compactPreview={sidePanelOpen}
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
        onSectionTitleChange={workbench.setSectionTitle}
        onAdd={openAdd}
        assistantStatus={workbench.composeStatus}
        assistantRun={workbench.assistantRun}
        assistantPreviewText={workbench.composePreview.slice(0, 3).map((question, index) => `${index + 1}. ${question.stem}`).join('\n')}
        assistantError={workbench.composeError}
        onOpenAssistant={(prompt) => { void workbench.composeFromBank(prompt) }}
        onConfirmAssistant={workbench.confirmComposePreview}
      />
    )}
  </div>

  return (
    <div className="fx-app metis-theme-aiq">
      <main className="fx-content workbench-page">
        <div className={`fx-zoom-area workbench-zoom-area${alternateHomeLayout ? ' is-alternate-home' : ''}`}>
          <WorkspaceHeader
            documentTitle={workbench.document.title}
            documentUpdatedAt={workbench.document.updatedAt}
            questionCount={workbench.document.questions.length}
            canSave={workbench.document.questions.length > 0 || Boolean(workbench.document.intro?.trim()) || hasCustomDocumentFormat || (!['未命名组题', '未命名题单'].includes(workbench.document.title.trim()) && !isDefaultDocumentTitle(workbench.document.title))}
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
            onCreateNew={() => {
              if (!workbench.createNewDocument()) return
              setActiveLibraryDetailKey(null)
              setAssistantTabOpen(false)
              setAssistantActive(false)
              setSidePanelOpen(true)
              setDraftCollapsed(false)
            }}
            showCreateNew={!isUntouchedBlankDocument}
            onSave={() => { void workbench.saveDocument() }}
            onAssign={() => { void workbench.assignDocument() }}
            sidePanelOpen={sidePanelOpen}
            onSidePanelOpen={() => {
              setSidePanelOpen(true)
              setDraftCollapsed(false)
            }}
            onEnterEdit={() => {
              setSidePanelOpen(false)
              setDraftCollapsed(false)
            }}
            draftCollapsed={draftCollapsed}
            onDraftCollapse={() => setDraftCollapsed(true)}
            onDraftExpand={() => setDraftCollapsed(false)}
            onBackHome={activateAddHome}
          />

          <section className={`${shellClassName}${alternateHomeLayout ? ` is-alternate-home is-home-layout-${homeLayoutVariant}` : ''}`} aria-label="飞象AI题库编辑器">
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

            {!alternateHomeLayout ? (!draftCollapsed ? renderDraftContent() : (
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
                    aria-selected={!workbench.isAddOpen && !activeLibraryDetail && !assistantActive && !myResourcesActive}
                    className={`add-workspace-home${!workbench.isAddOpen && !activeLibraryDetail && !assistantActive && !myResourcesActive ? ' is-active' : ''}`}
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
                ) : assistantActive && assistantTabOpen ? (
                  <AiAssistantWorkspace
                    run={workbench.assistantRun}
                    prompt={workbench.composePrompt}
                    error={workbench.composeError}
                    status={workbench.composeStatus}
                    contentBusy={workbench.isContentBusy}
                    previewText={workbench.composePreview.slice(0, 3).map((question, index) => `${index + 1}. ${question.stem}`).join('\n')}
                    onPromptChange={workbench.setComposePrompt}
                    onSubmit={submitAssistant}
                    onConfirm={workbench.confirmComposePreview}
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
                    layoutVariant={homeLayoutVariant}
                    contentBusy={workbench.isContentBusy || workbench.documentSyncState === 'saving'}
                    draftContent={alternateHomeLayout ? renderDraftContent() : undefined}
                    histories={workbench.historyDocuments}
                    historyStatus={workbench.historyStatus}
                    onOpenDocument={(documentId) => { void workbench.openHistoryDocument(documentId) }}
                    onOpenMyResources={() => openMyResources('全部')}
                    onOpenSource={(mode, options) => openAdd(mode, options)}
                    onLayoutVariantChange={setHomeLayoutVariant}
                    onReload={() => { void workbench.reloadHistory() }}
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

import { Fragment, useEffect, useRef, useState } from 'react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import { QuestionInspector } from '../components/AiInspector'
import { AiAssistantWorkspace } from '../components/AiAssistantWorkspace'
import { QuestionSortPanel } from '../components/QuestionSortPanel'
import { DocumentCanvas } from '../components/DocumentCanvas'
import { EmptyCanvas } from '../components/EmptyCanvas'
import { MyResourcesPanel, RESOURCE_CREATED_FOLDERS } from '../components/MyResourcesPanel'
import { MyResourceQuestionDetail } from '../components/MyResourceQuestionDetail'
import { ResourceFileDetail } from '../components/ResourceFileDetail'
import { SourceDrawer } from '../components/SourceDrawer'
import { WorkspaceHeader } from '../components/WorkspaceHeader'
import { DocumentCenter } from '../components/DocumentCenter'
import { ElephantIcon, FeixiangAiLibraryLogo } from '../components/ElephantIcon'
import { isDefaultDocumentTitle } from '../data/workbenchData'
import { useWorkbench } from '../hooks/useWorkbench'
import { defaultDocumentFormat } from '../prototype/types'
import type { AddQuestionMode, Difficulty, MyResourceKind, MyResourceSummary, Question, QuestionType, SourceRecord } from '../prototype/types'
import { BrainCircuit, ChevronRight, File, FileText, House, PanelLeftClose, PanelRightOpen, RefreshCw, X } from 'lucide-react'
import { EditorStudioShell } from '../components/EditorStudioShell'
import { ScoreSettingsDialog } from '../components/ScoreSettingsDialog'
import { getDocumentKind, needsPaperScoreSettings } from '../utils/documentEditorUtils'
import { AnswerSheetPanel } from '../components/AnswerSheetPanel'
import { RecentBrowsePanel } from '../components/RecentBrowsePanel'
import { RequirementSpecControls } from '../components/RequirementSpecControls'
import { GlobalResourceSearch } from '../components/GlobalResourceSearch'
import { readRecentBrowseEntries, recordRecentBrowse, type RecentBrowseEntry } from '../utils/recentBrowseHistory'
import type { GlobalResourceSearchHit } from '../services/globalResourceSearchRepository'
import { sourceRecords as allSourceRecords } from '../data/workbenchData'
import { persistDocumentNow, readStoredDocument } from '../services/workbenchRepository'

type AddTabMode = Exclude<AddQuestionMode, 'menu' | 'compose' | 'personalized'>
type LibraryTabMode = Extract<AddTabMode, 'resource' | 'school'>

interface LibraryDetailTab {
  key: string
  libraryMode: LibraryTabMode
  record: SourceRecord
  matchedPath?: string
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

function resolveChapterNode(hit: GlobalResourceSearchHit) {
  const anchor = hit.target.anchorLabel ?? ''
  if (anchor.includes('待定系数')) return '待定系数法'
  if (anchor.includes('二元一次方程')) return '5.1 认识二元一次方程组'
  if (anchor.includes('实际应用')) return '实际应用'
  if (anchor.includes('图象') || anchor.includes('性质') || anchor.includes('平移')) return '图象与性质'
  if (anchor.includes('一次函数') || hit.title.includes('一次函数')) return '一次函数概念'
  return '4.1 函数'
}

export function WorkbenchHomePage() {
  const workbench = useWorkbench()
  const previousQuestionCount = useRef(workbench.document.questions.length)
  const previousDocumentId = useRef(workbench.document.id)
  const highlightTimerRef = useRef<number | null>(null)
  const assistantTabRef = useRef<HTMLButtonElement>(null)
  const aiSearchTabRef = useRef<HTMLButtonElement>(null)
  const [sortCollapsed, setSortCollapsed] = useState(false)
  const [sidePanelOpen, setSidePanelOpen] = useState(true)
  const [draftCollapsed, setDraftCollapsed] = useState(false)
  const [openAddTabs, setOpenAddTabs] = useState<AddTabMode[]>([])
  const [libraryDetailTabs, setLibraryDetailTabs] = useState<LibraryDetailTab[]>([])
  const [activeLibraryDetailKey, setActiveLibraryDetailKey] = useState<string | null>(null)
  const [assistantTabOpen, setAssistantTabOpen] = useState(false)
  const [assistantActive, setAssistantActive] = useState(false)
  const [aiSearchTabOpen, setAiSearchTabOpen] = useState(false)
  const [aiSearchActive, setAiSearchActive] = useState(false)
  const opensHomeworkResources = new URLSearchParams(window.location.search).get('view') === 'homework-resources'
  const [myResourcesTabOpen, setMyResourcesTabOpen] = useState(opensHomeworkResources)
  const [myResourcesActive, setMyResourcesActive] = useState(opensHomeworkResources)
  const [myResourcesInitialKind, setMyResourcesInitialKind] = useState<MyResourceKind | '全部'>('全部')
  const [fileDetailTabs, setFileDetailTabs] = useState<MyResourceSummary[]>([])
  const [activeFileDetailId, setActiveFileDetailId] = useState<string | null>(null)
  const [recentBrowseTabOpen, setRecentBrowseTabOpen] = useState(false)
  const [recentBrowseActive, setRecentBrowseActive] = useState(false)
  const [recentBrowseEntries, setRecentBrowseEntries] = useState<RecentBrowseEntry[]>(() => readRecentBrowseEntries())
  const [recentlyAddedQuestionId, setRecentlyAddedQuestionId] = useState<string | null>(null)
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false)
  const [scoreDialogNext, setScoreDialogNext] = useState<'save-paper' | 'save-paper-new' | 'generate' | 'preview' | 'assign' | 'download' | 'print' | 'share' | null>(null)
  const [answerSheetActive, setAnswerSheetActive] = useState(false)
  const [resourceAnswerSheetDocument, setResourceAnswerSheetDocument] = useState<ReturnType<typeof readStoredDocument>>(null)
  const [resourceAnswerSheetSaveState, setResourceAnswerSheetSaveState] = useState<'dirty' | 'saving' | 'saved' | 'error'>('saved')
  const [gradeSubject, setGradeSubject] = useState('初中数学')
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
    setAiSearchTabOpen(false)
    setAiSearchActive(false)
    setMyResourcesTabOpen(false)
    setMyResourcesActive(false)
    setFileDetailTabs([])
    setActiveFileDetailId(null)
  }, [workbench.document.id])

  useEffect(() => {
    if (!assistantTabOpen || !assistantActive) return
    window.requestAnimationFrame(() => {
      assistantTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      assistantTabRef.current?.focus()
    })
  }, [assistantActive, assistantTabOpen])

  useEffect(() => {
    if (!aiSearchTabOpen || !aiSearchActive) return
    window.requestAnimationFrame(() => {
      aiSearchTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      aiSearchTabRef.current?.focus()
    })
  }, [aiSearchActive, aiSearchTabOpen])

  const questionNumber = workbench.selectedQuestion
    ? workbench.document.questions.findIndex((question) => question.id === workbench.selectedQuestion?.id) + 1
    : 0

  const openAssistant = (prompt?: string) => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setMyResourcesActive(false)
    setActiveFileDetailId(null)
    setAiSearchActive(false)
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
    setActiveFileDetailId(null)
    setAiSearchActive(false)
    if (mode !== 'menu') {
      setOpenAddTabs((current) => current.includes(mode) ? current : [...current, mode])
    }
    workbench.openAdd(mode, options)
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('open') !== 'ai-recording') return
    url.searchParams.delete('open')
    window.history.replaceState(null, '', url.toString())
    openAdd('upload')
    // Only consumes the one-time navigation instruction from 作业首页.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activateAddTab = (mode: AddTabMode) => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setAssistantActive(false)
    setMyResourcesActive(false)
    setRecentBrowseActive(false)
    setActiveFileDetailId(null)
    setAiSearchActive(false)
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
    setActiveFileDetailId(null)
    setAiSearchActive(false)
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
    setActiveFileDetailId(null)
    setAiSearchActive(false)
    workbench.closeAdd()
    setRecentBrowseActive(true)
    refreshRecentBrowseEntries()
  }

  const openLibraryDetail = (libraryMode: LibraryTabMode, record: SourceRecord, matchedPath?: string) => {
    const key = `${libraryMode}:${record.id}`
    setSidePanelOpen(true)
    setAssistantActive(false)
    setMyResourcesActive(false)
    setActiveFileDetailId(null)
    setAiSearchActive(false)
    setOpenAddTabs((current) => current.includes(libraryMode) ? current : [...current, libraryMode])
    setLibraryDetailTabs((current) => current.some((tab) => tab.key === key)
      ? current.map((tab) => tab.key === key ? { ...tab, matchedPath: matchedPath ?? tab.matchedPath } : tab)
      : [...current, { key, libraryMode, record, matchedPath }])
    setActiveLibraryDetailKey(key)
    setRecentBrowseActive(false)
    recordRecentBrowse(libraryMode, record, matchedPath)
    refreshRecentBrowseEntries()
    if (!workbench.isAddOpen || workbench.addMode !== libraryMode) {
      workbench.openAdd(libraryMode, { libraryView: record.sourceType })
    }
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-detail-tab-key="${key}"]`)?.focus()
    })
  }

  const openRecentBrowseEntry = (entry: RecentBrowseEntry) => {
    const activeRecord = allSourceRecords.find((record) => record.id === entry.record.id)
    if (!activeRecord) {
      MetisMessage.error('资源不存在')
      return
    }
    openLibraryDetail(entry.libraryMode, activeRecord, entry.matchedPath)
  }

  const updateWorkbookBrowsePath = (record: SourceRecord, matchedPath: string) => {
    if (!activeLibraryDetail || activeLibraryDetail.record.id !== record.id) return
    recordRecentBrowse(activeLibraryDetail.libraryMode, record, matchedPath)
    refreshRecentBrowseEntries()
  }

  const openGlobalSearchResult = (hit: GlobalResourceSearchHit) => {
    if (hit.target.view === 'chapter' || hit.groupType === 'question') {
      openAdd(hit.target.mode, {
        libraryView: 'chapter',
        searchKeyword: hit.target.keyword,
        chapterNode: resolveChapterNode(hit),
        questionId: hit.target.questionId,
        questionType: hit.target.questionType as QuestionType | undefined,
        difficulty: hit.target.difficulty as Difficulty | undefined,
      })
      MetisMessage.success(`已定位到“${hit.target.anchorLabel ?? '章节知识点'}”的单题结果`)
      return
    }

    const record = allSourceRecords.find((item) => item.id === hit.target.resourceId)
    if (record) {
      openLibraryDetail(hit.target.mode, record, hit.target.anchorLabel)
      MetisMessage.success(`已进入“${record.title}”的命中位置`)
      return
    }

    openAdd(hit.target.mode, { libraryView: hit.target.view })
  }

  const addGlobalSearchQuestion = (question: Question) => workbench.addSource('workbook', undefined, undefined, [question])

  const activateLibraryDetail = (tab: LibraryDetailTab) => {
    setSidePanelOpen(true)
    setAssistantActive(false)
    setMyResourcesActive(false)
    setActiveFileDetailId(null)
    setAiSearchActive(false)
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
    setActiveFileDetailId(null)
    setAiSearchActive(false)
    workbench.closeAdd()
  }

  const activateAiSearch = () => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setAssistantActive(false)
    setMyResourcesActive(false)
    setRecentBrowseActive(false)
    setActiveFileDetailId(null)
    workbench.closeAdd()
    setAiSearchTabOpen(true)
    setAiSearchActive(true)
  }

  const closeAiSearchTab = () => {
    setAiSearchTabOpen(false)
    setAiSearchActive(false)
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
    setAiSearchActive(false)
    void workbench.composeFromBank()
  }

  const activateAssistantTab = () => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setMyResourcesActive(false)
    setActiveFileDetailId(null)
    setAiSearchActive(false)
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
    setAiSearchActive(false)
    workbench.closeAdd()
    setMyResourcesTabOpen(true)
    setMyResourcesActive(true)
    setActiveFileDetailId(null)
  }

  const openHomeworkHome = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'homework-resources')
    window.open(url.toString(), '_blank')
  }

  const leaveHomeworkResources = (target?: 'ai-recording') => {
    const url = new URL(window.location.href)
    url.searchParams.delete('view')
    if (target) url.searchParams.set('open', target)
    else url.searchParams.delete('open')
    window.location.assign(url.toString())
  }

  const openManagedResource = async (resource: MyResourceSummary) => {
    if ((resource.kind === '题单' || resource.kind === '试卷') && resource.documentId) {
      await workbench.openHistoryDocument(resource.documentId)
      setSidePanelOpen(false)
      setDraftCollapsed(false)
      return
    }
    openFileDetail(resource)
  }

  const openFileDetail = (resource: MyResourceSummary) => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setAssistantActive(false)
    setAiSearchActive(false)
    setRecentBrowseActive(false)
    workbench.closeAdd()
    setMyResourcesActive(false)
    setFileDetailTabs((current) => current.some((item) => item.id === resource.id) ? current : [...current, resource])
    setActiveFileDetailId(resource.id)
  }

  const openResourceAnswerSheet = (resource: MyResourceSummary) => {
    const storedDocument = resource.documentId ? readStoredDocument(resource.documentId) : null
    if (!storedDocument) {
      MetisMessage.info('未找到这份试卷')
      return
    }
    openFileDetail(resource)
    setResourceAnswerSheetDocument(storedDocument)
    setResourceAnswerSheetSaveState('saved')
    setAnswerSheetActive(true)
  }

  const activateFileDetail = (id: string) => {
    setSidePanelOpen(true)
    setActiveLibraryDetailKey(null)
    setAssistantActive(false)
    setAiSearchActive(false)
    setRecentBrowseActive(false)
    workbench.closeAdd()
    setMyResourcesActive(false)
    setActiveFileDetailId(id)
  }

  const closeFileDetailTab = (id: string) => {
    setFileDetailTabs((current) => current.filter((item) => item.id !== id))
    if (activeFileDetailId !== id) return
    setActiveFileDetailId(null)
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
    setAiSearchActive(false)
    setSidePanelOpen(false)
  }

  const isAddHome = !workbench.isAddOpen && !activeLibraryDetail && !assistantActive && !aiSearchActive && !myResourcesActive && !recentBrowseActive && !activeFileDetailId
  const hasOpenTaskTabs = openAddTabs.length > 0
    || libraryDetailTabs.length > 0
    || assistantTabOpen
    || aiSearchTabOpen
    || myResourcesTabOpen
    || recentBrowseTabOpen
    || fileDetailTabs.length > 0
  const showHomeAiSearch = isAddHome && !hasOpenTaskTabs
  const alternateHomeLayout = sidePanelOpen && (isAddHome || aiSearchActive) && !draftCollapsed
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
  const requiresSaveKind = !workbench.historyDocuments.some((item) => item.id === workbench.document.id)
  const finalizeNewDocument = (rememberCurrent = true) => {
    if (!workbench.createNewDocument({
      preserveAddWorkspace: sidePanelOpen,
      rememberCurrent,
      successMessage: rememberCurrent ? undefined : '已新建空白题单',
    })) return
    setActiveLibraryDetailKey(null)
    setAssistantTabOpen(false)
    setAssistantActive(false)
    setAiSearchTabOpen(false)
    setAiSearchActive(false)
    setSidePanelOpen(true)
    setDraftCollapsed(false)
  }

  const hasUnsavedDocumentChanges = workbench.documentSyncState === 'dirty' || workbench.assignmentOutdated

  const expandEditorForScores = () => {
    setDraftCollapsed(false)
    setSidePanelOpen(false)
  }

  const openScoreDialog = (next: typeof scoreDialogNext) => {
    if (sidePanelOpen) expandEditorForScores()
    setScoreDialogNext(next)
    setScoreDialogOpen(true)
  }

  const requirePaperScores = (next: 'generate' | 'preview' | 'assign' | 'download' | 'print' | 'share', kind = getDocumentKind(workbench.document)) => {
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
    if (next === 'save-paper') {
      void workbench.saveDocument(true, '试卷')
      return
    }
    if (next === 'save-paper-new') {
      void workbench.saveDocument(true, '试卷').then((saved) => {
        if (saved) finalizeNewDocument(true)
      })
      return
    }
    if (next === 'generate') {
      if (workbench.generateAnswerSheet()) setAnswerSheetActive(true)
      return
    }
    if (next === 'preview') {
      MetisMessage.info('预览面板已打开（原型演示）')
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
    if (next === 'share') {
      void workbench.saveDocument(true, getDocumentKind(workbench.document)).then((saved) => {
        if (!saved) return
        workbench.markDocumentOutput('share')
        MetisMessage.success('共享到校本库面板已打开（原型演示）')
      })
    }
  }

  const trySaveDocument = async (
    kind?: Parameters<typeof workbench.saveDocument>[1],
    createAfterSave = false,
  ) => {
    const targetKind = kind ?? getDocumentKind(workbench.document)
    if (targetKind === '试卷') {
      if (workbench.document.questions.length === 0) {
        MetisMessage.error('请先添加题目再保存为试卷')
        return false
      }
      if (needsPaperScoreSettings(workbench.document, '试卷')) {
        if (getDocumentKind(workbench.document) !== '试卷') workbench.setDocumentKind('试卷')
        MetisMessage.error('请先完成分值设置')
        openScoreDialog(createAfterSave ? 'save-paper-new' : 'save-paper')
        return false
      }
    }
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
    if (workbench.generateAnswerSheet()) setAnswerSheetActive(true)
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
        onSave={(kind) => trySaveDocument(kind)}
        requiresSaveKind={requiresSaveKind}
        onAssign={tryAssignDocument}
        onMarkOutput={workbench.markDocumentOutput}
        onRequirePaperScores={requirePaperScores}
        onExpand={sidePanelOpen ? () => { setSidePanelOpen(false); setDraftCollapsed(false) } : undefined}
        onCreateNew={finalizeNewDocument}
        onSaveAndCreateNew={(kind) => trySaveDocument(kind, true)}
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
        onSave={(kind) => trySaveDocument(kind)}
        requiresSaveKind={requiresSaveKind}
        onAssign={tryAssignDocument}
        onMarkOutput={workbench.markDocumentOutput}
        onRequirePaperScores={requirePaperScores}
        onExpand={sidePanelOpen ? () => { setSidePanelOpen(false); setDraftCollapsed(false) } : undefined}
        onCreateNew={finalizeNewDocument}
        onSaveAndCreateNew={(kind) => trySaveDocument(kind, true)}
        onSectionTitleChange={workbench.setSectionTitle}
        onInsertUtility={workbench.insertUtility}
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

  if (answerSheetActive) {
    const answerSheetDocument = resourceAnswerSheetDocument ?? workbench.document
    const answerSheetSaveState = resourceAnswerSheetDocument
      ? resourceAnswerSheetSaveState
      : workbench.documentSyncState === 'clean' ? 'saved' : workbench.documentSyncState
    return (
      <div className="fx-app metis-theme-aiq answer-sheet-standalone">
        <AnswerSheetPanel
          document={answerSheetDocument}
          saveState={answerSheetSaveState}
          onSave={() => {
            if (!resourceAnswerSheetDocument) {
              void workbench.saveDocument(true, '试卷')
              return
            }
            setResourceAnswerSheetSaveState('saving')
            try {
              persistDocumentNow(resourceAnswerSheetDocument)
              setResourceAnswerSheetSaveState('saved')
            } catch {
              setResourceAnswerSheetSaveState('error')
            }
          }}
          onChange={(patch) => {
            if (!resourceAnswerSheetDocument) {
              workbench.updateAnswerSheet(patch)
              return
            }
            setResourceAnswerSheetDocument((current) => current ? {
              ...current,
              answerSheet: { ...current.answerSheet, ...patch, updatedAt: new Date().toISOString() },
            } : current)
            setResourceAnswerSheetSaveState('dirty')
          }}
          onMarkOutput={resourceAnswerSheetDocument ? () => persistDocumentNow(resourceAnswerSheetDocument) : workbench.markDocumentOutput}
          onShare={async () => {
            if (resourceAnswerSheetDocument) {
              if (resourceAnswerSheetSaveState !== 'saved') {
                persistDocumentNow(resourceAnswerSheetDocument)
                setResourceAnswerSheetSaveState('saved')
              }
              MetisMessage.info('共享到校本库面板已打开（原型演示）')
              return
            }
            if (workbench.documentSyncState !== 'saved' && workbench.documentSyncState !== 'clean') {
              const saved = await workbench.saveDocument(true, '试卷')
              if (!saved) return
            }
            MetisMessage.info('共享到校本库面板已打开（原型演示）')
          }}
          onBackToPaper={() => {
            const returnDocumentId = resourceAnswerSheetDocument?.id
            if (opensHomeworkResources && returnDocumentId) {
              void workbench.openHistoryDocument(returnDocumentId).then(() => {
                setSidePanelOpen(false)
                setDraftCollapsed(false)
                setAnswerSheetActive(false)
                setResourceAnswerSheetDocument(null)
              })
              return
            }
            setAnswerSheetActive(false)
            setResourceAnswerSheetDocument(null)
          }}
        />
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
            documentKind={getDocumentKind(workbench.document)}
            syncState={workbench.documentSyncState}
            assignmentOutdated={workbench.assignmentOutdated}
            hasPersistedDraft={workbench.historyDocuments.some((item) => item.id === workbench.document.id)}
            onUndo={() => {
              setAssistantTabOpen(false)
              setAssistantActive(false)
              workbench.undo()
            }}
            onCreateNew={finalizeNewDocument}
            hasUnsavedChanges={hasUnsavedDocumentChanges || hasQuestions}
            onSaveAndCreateNew={(kind) => trySaveDocument(kind, true)}
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
            onStudioSave={(kind) => trySaveDocument(kind)}
            studioRequiresSaveKind={requiresSaveKind}
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
                onOpenScoreSettings={() => openScoreDialog(null)}
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
                <header className={`add-workspace-topbar${opensHomeworkResources ? ' is-homework-resource' : ''}`}>
                  {opensHomeworkResources ? (
                    <nav className="homework-resource-breadcrumb" aria-label="我的资源面包屑">
                      <span><House size={15} />作业首页</span>
                      <ChevronRight size={14} />
                      <strong>我的资源</strong>
                    </nav>
                  ) : null}
                  <div className="add-workspace-brand" aria-label="选择学段科目">
                    <FeixiangAiLibraryLogo />
                    <span className="add-workspace-subject">
                      <select aria-label="学段科目" value={gradeSubject} onChange={(event) => setGradeSubject(event.target.value)}>
                        <option>小学数学</option>
                        <option>初中数学</option>
                        <option>高中数学</option>
                      </select>
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="添加题目首页"
                    title="添加题目首页"
                    aria-current={isAddHome ? 'page' : undefined}
                    className={`add-workspace-home${isAddHome ? ' is-active' : ''}`}
                    onClick={activateAddHome}
                  ><House size={17} /></button>
                  <GlobalResourceSearch
                    className={showHomeAiSearch ? 'is-full-workspace is-home-aligned' : alternateHomeLayout ? 'is-full-workspace' : 'is-split-workspace'}
                    currentScope={gradeSubject}
                    workspaceActive={aiSearchActive}
                    showTopBar={showHomeAiSearch}
                    onActivateWorkspace={activateAiSearch}
                    onRequestCloseWorkspace={closeAiSearchTab}
                    onSelectResult={openGlobalSearchResult}
                    onAddQuestion={addGlobalSearchQuestion}
                    onOpenCompose={openAssistant}
                  />
                  <nav className="add-workspace-tabs" aria-label="已打开的任务">
                  {openAddTabs.map((mode) => (
                    <Fragment key={mode}>
                      <span className={`add-workspace-tab${workbench.isAddOpen && workbench.addMode === mode && !activeLibraryDetail ? ' is-active' : ''}`}>
                        <button
                          type="button"
                          aria-current={workbench.isAddOpen && workbench.addMode === mode && !activeLibraryDetail ? 'page' : undefined}
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
                            title={tab.record.title}
                            aria-current={activeLibraryDetailKey === tab.key ? 'page' : undefined}
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
                        ref={assistantTabRef}
                        aria-current={assistantActive ? 'page' : undefined}
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
                  {aiSearchTabOpen ? (
                    <span className={`add-workspace-tab is-ai-search${aiSearchActive ? ' is-active' : ''}`}>
                      <button
                        type="button"
                        ref={aiSearchTabRef}
                        aria-current={aiSearchActive ? 'page' : undefined}
                        onClick={activateAiSearch}
                        data-track="/click/aiQuestionHome/switchAiSearchTab | 切换AI智搜任务 | 无"
                      ><span>AI智搜</span></button>
                      <button
                        type="button"
                        className="add-workspace-tab-close"
                        aria-label="关闭 AI智搜"
                        onClick={closeAiSearchTab}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ) : null}
                  {myResourcesTabOpen ? (
                    <span className={`add-workspace-tab is-my-resources${myResourcesActive ? ' is-active' : ''}`}>
                      <button
                        type="button"
                        aria-current={myResourcesActive ? 'page' : undefined}
                        onClick={() => openMyResources(myResourcesInitialKind)}
                        data-track="/click/aiQuestionHome/switchMyResourcesTab | 切换我的资源任务 | 无"
                      ><span>我的资源</span></button>
                      <button type="button" className="add-workspace-tab-close" aria-label="关闭我的资源" onClick={closeMyResourcesTab}>
                        <X size={13} />
                      </button>
                    </span>
                  ) : null}
                  {fileDetailTabs.map((tab) => (
                    <span key={tab.id} className={`add-workspace-tab is-file-detail${activeFileDetailId === tab.id ? ' is-active' : ''}`}>
                      <button
                        type="button"
                        aria-current={activeFileDetailId === tab.id ? 'page' : undefined}
                        onClick={() => activateFileDetail(tab.id)}
                      ><File size={14} /><span>{tab.title}</span></button>
                      <button type="button" className="add-workspace-tab-close" aria-label={`关闭${tab.title}`} onClick={() => closeFileDetailTab(tab.id)}>
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  {recentBrowseTabOpen ? (
                    <span className={`add-workspace-tab is-recent-browse${recentBrowseActive ? ' is-active' : ''}`}>
                      <button
                        type="button"
                        aria-current={recentBrowseActive ? 'page' : undefined}
                        onClick={activateRecentBrowseTab}
                        data-track="/click/aiQuestionHome/switchRecentBrowseTab | 切换最近浏览 | 无"
                      ><RefreshCw size={14} /><span>最近浏览</span></button>
                      <button type="button" className="add-workspace-tab-close" aria-label="关闭最近浏览" onClick={closeRecentBrowseTab}>
                        <X size={13} />
                      </button>
                    </span>
                  ) : null}
                  </nav>
                  {isAddHome ? null : (
                    <button
                      type="button"
                      className="add-workspace-collapse"
                      aria-label="收起添加题目工作区"
                      title="专注编辑"
                      onClick={collapseSidePanel}
                    ><PanelLeftClose size={17} /></button>
                  )}
                </header>
                {activeFileDetailId && fileDetailTabs.some((tab) => tab.id === activeFileDetailId) ? (
                  fileDetailTabs.find((tab) => tab.id === activeFileDetailId)!.kind === '文件' ? <ResourceFileDetail
                      resource={fileDetailTabs.find((tab) => tab.id === activeFileDetailId)!}
                      folders={RESOURCE_CREATED_FOLDERS}
                      onBack={() => { setActiveFileDetailId(null); setMyResourcesActive(true) }}
                      onResourceChange={(next) => setFileDetailTabs((current) => current.map((item) => item.id === next.id ? next : item))}
                      onDeleted={closeFileDetailTab}
                    /> : <MyResourceQuestionDetail
                      resource={fileDetailTabs.find((tab) => tab.id === activeFileDetailId)!}
                      contentBusy={workbench.isContentBusy}
                      onAddSource={(type, sourceId, count, selectedQuestions) => workbench.addSource(type, sourceId, count, selectedQuestions)}
                    />
                ) : myResourcesActive && myResourcesTabOpen ? (
                  <MyResourcesPanel
                    mode={opensHomeworkResources ? 'manage' : 'picker'}
                    initialKind={myResourcesInitialKind}
                    histories={workbench.historyDocuments}
                    currentDocumentId={workbench.document.id}
                    onOpenFile={opensHomeworkResources ? openManagedResource : openFileDetail}
                    onOpenAnswerSheet={openResourceAnswerSheet}
                    onOpenHomeworkHome={openHomeworkHome}
                    onOpenAiRecording={opensHomeworkResources ? () => leaveHomeworkResources('ai-recording') : undefined}
                    onOpenWorkbench={opensHomeworkResources ? () => leaveHomeworkResources() : undefined}
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
                    librarySearchKeyword={workbench.librarySearchKeyword}
                    libraryChapterNode={workbench.libraryChapterNode}
                    libraryQuestionId={workbench.libraryQuestionId}
                    libraryQuestionType={workbench.libraryQuestionType}
                    libraryDifficulty={workbench.libraryDifficulty}
                    libraryMatchedPath={activeLibraryDetail?.matchedPath}
                    resourceType={workbench.resourceType}
                    records={workbench.sourceRecords}
                    listStatus={workbench.sourceListStatus}
                    addStatus={workbench.sourceAddStatus}
                    contentBusy={workbench.isContentBusy}
                    compactUploadDetail={!draftCollapsed}
                    onViewUploadOriginal={() => setDraftCollapsed(true)}
                    createConfig={workbench.createConfig}
                    createError={workbench.createError}
                    createStatus={workbench.createStatus}
                    createPreview={workbench.createPreview}
                    libraryDetail={activeLibraryDetail?.libraryMode === workbench.addMode ? activeLibraryDetail.record : null}
                    onModeChange={workbench.setAddMode}
                    onResourceTypeChange={(type) => void workbench.loadSources(type)}
                    onAddSource={(type, sourceId, count, selectedQuestions) => workbench.addSource(type, sourceId, count, selectedQuestions)}
                    currentDocumentHasContent={workbench.currentDocumentHasContent}
                    currentDocumentHasUnsavedChanges={hasUnsavedDocumentChanges}
                    onCompleteEditWholeVolume={(type, sourceId, count, selectedQuestions, mode) => workbench.completeEditWholeVolumeAsNewDocument(type, sourceId, count, selectedQuestions, mode)}
                    onOpenLibraryDetail={(record) => {
                      if (workbench.addMode === 'resource' || workbench.addMode === 'school') {
                        openLibraryDetail(workbench.addMode, record)
                      } else if (workbench.addMode === 'upload') {
                        openLibraryDetail('resource', record)
                      }
                    }}
                    onWorkbookDirectoryChange={updateWorkbookBrowsePath}
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
                    currentDocumentId={workbench.document.id}
                    historyStatus={workbench.historyStatus}
                    onOpenDocument={(documentId) => { void workbench.openHistoryDocument(documentId) }}
                    onOpenMyResources={() => openMyResources('全部')}
                    onOpenSource={(mode, options) => openAdd(mode, options)}
                    onOpenAiSearch={activateAiSearch}
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
          aiSearchTabOpen: aiSearchActive,
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

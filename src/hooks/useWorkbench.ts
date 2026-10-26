import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import { blankDocument } from '../data/workbenchData'
import { defaultDocumentFormat } from '../prototype/types'
import type {
  AddQuestionMode,
  AiAssistantRun,
  AsyncStatus,
  CreateQuestionRequest,
  DocumentStatus,
  DocumentSyncState,
  DocumentFormat,
  HistoryDocumentSummary,
  InspectorView,
  LibraryInitialView,
  MyResourceSummary,
  OpenAddOptions,
  Question,
  QuestionPatch,
  QuestionType,
  ResourceType,
  RewriteRequest,
  SourceRecord,
  WorkbenchDocument,
} from '../prototype/types'
import { workbenchRepository } from '../services/workbenchRepository'

type ContentOperation = 'source-add' | 'my-resource-add' | 'upload' | 'personalized' | 'compose' | 'create' | 'manual' | 'history-load'

const defaultCreateConfig: CreateQuestionRequest = {
  method: '知识点组合出题',
  difficulty: '中等',
  textbook: '人教版 · 八年级上册',
  chapter: '第四章 一次函数',
  allocations: [
    { id: 'concept', knowledgePoint: '一次函数的概念', count: 2 },
    { id: 'image', knowledgePoint: '一次函数的图象与性质', count: 2 },
    { id: 'application', knowledgePoint: '一次函数的实际应用', count: 1 },
  ],
}

interface EditorState {
  document: WorkbenchDocument
  undoDocument: WorkbenchDocument | null
}

type EditorAction =
  | { type: 'set-title'; title: string }
  | { type: 'set-intro'; intro: string }
  | { type: 'set-format'; patch: Partial<DocumentFormat> }
  | { type: 'set-section-title'; questionType: QuestionType; title: string }
  | { type: 'update-question'; questionId: string; patch: QuestionPatch }
  | { type: 'append'; questions: Question[] }
  | { type: 'load-document'; document: WorkbenchDocument }
  | { type: 'apply-rewrite'; selectedQuestionId: string; preview: Question; mode: 'replace' | 'append' }
  | { type: 'move'; selectedQuestionId: string; direction: -1 | 1 }
  | { type: 'reorder'; questionIds: string[] }
  | { type: 'delete'; selectedQuestionId: string }
  | { type: 'undo' }

const cloneQuestion = (question: Question): Question => ({
  ...question,
  options: question.options ? [...question.options] : undefined,
})

const cloneQuestions = (questions: Question[]) => questions.map(cloneQuestion)

const cloneDocument = (document: WorkbenchDocument): WorkbenchDocument => ({
  ...document,
  format: document.format ? { ...document.format } : undefined,
  sectionTitles: document.sectionTitles ? { ...document.sectionTitles } : undefined,
  questions: cloneQuestions(document.questions),
})

const documentFingerprint = (document: WorkbenchDocument) => JSON.stringify({
  title: document.title,
  intro: document.intro ?? '',
  format: document.format ?? defaultDocumentFormat,
  sectionTitles: document.sectionTitles ?? {},
  questions: document.questions,
})

const isUntouchedBlankDocument = (document: WorkbenchDocument) => (
  document.questions.length === 0
  && !document.intro?.trim()
  && ['未命名组题', '未命名题单'].includes(document.title.trim())
)

const toHistorySummary = (
  document: WorkbenchDocument,
  previous?: HistoryDocumentSummary,
  status?: DocumentStatus,
  assignmentOutdated?: boolean,
): HistoryDocumentSummary => ({
  id: document.id,
  title: document.title.trim() || '未命名组题',
  gradeSubject: document.gradeSubject,
  questionCount: document.questions.length,
  updatedAt: '刚刚',
  status: status ?? previous?.status ?? '草稿',
  assignmentOutdated: assignmentOutdated ?? previous?.assignmentOutdated ?? false,
  origin: previous?.origin ?? '手工组题',
})

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'set-title') {
    return {
      document: { ...state.document, title: action.title, updatedAt: '刚刚' },
      undoDocument: state.undoDocument,
    }
  }

  if (action.type === 'set-intro') {
    return {
      document: { ...state.document, intro: action.intro, updatedAt: '刚刚' },
      undoDocument: state.undoDocument,
    }
  }

  if (action.type === 'set-format') {
    const nextFormat = {
      ...defaultDocumentFormat,
      ...state.document.format,
      ...action.patch,
    }
    if (JSON.stringify(nextFormat) === JSON.stringify({ ...defaultDocumentFormat, ...state.document.format })) return state
    return {
      document: { ...state.document, format: nextFormat, updatedAt: '刚刚' },
      undoDocument: cloneDocument(state.document),
    }
  }

  if (action.type === 'set-section-title') {
    const title = action.title.trim()
    if (!title || state.document.sectionTitles?.[action.questionType] === title) return state
    return {
      document: {
        ...state.document,
        sectionTitles: { ...state.document.sectionTitles, [action.questionType]: title },
        updatedAt: '刚刚',
      },
      undoDocument: cloneDocument(state.document),
    }
  }

  if (action.type === 'update-question') {
    const index = state.document.questions.findIndex((question) => question.id === action.questionId)
    if (index < 0) return state
    const nextQuestions = [...state.document.questions]
    nextQuestions[index] = {
      ...nextQuestions[index],
      ...action.patch,
      options: action.patch.options ? [...action.patch.options] : nextQuestions[index].options,
    }
    return {
      document: { ...state.document, questions: nextQuestions, updatedAt: '刚刚' },
      undoDocument: cloneDocument(state.document),
    }
  }

  if (action.type === 'append') {
    return {
      document: {
        ...state.document,
        title: state.document.title === '未命名' || state.document.title === '未命名组题' ? '未命名组题' : state.document.title,
        questions: [...state.document.questions, ...cloneQuestions(action.questions)],
        updatedAt: '刚刚',
      },
      undoDocument: cloneDocument(state.document),
    }
  }

  if (action.type === 'load-document') {
    return {
      document: cloneDocument(action.document),
      undoDocument: cloneDocument(state.document),
    }
  }

  if (action.type === 'apply-rewrite') {
    const index = state.document.questions.findIndex((question) => question.id === action.selectedQuestionId)
    if (index < 0) return state
    const nextQuestions = [...state.document.questions]
    if (action.mode === 'replace') {
      nextQuestions[index] = {
        ...cloneQuestion(action.preview),
        id: action.selectedQuestionId,
      }
    }
    if (action.mode === 'append') {
      nextQuestions.splice(index + 1, 0, {
        ...cloneQuestion(action.preview),
        id: `${action.preview.id}-copy-${Date.now()}`,
      })
    }
    return {
      document: { ...state.document, questions: nextQuestions, updatedAt: '刚刚' },
      undoDocument: cloneDocument(state.document),
    }
  }

  if (action.type === 'move') {
    const index = state.document.questions.findIndex((question) => question.id === action.selectedQuestionId)
    const target = index + action.direction
    if (index < 0 || target < 0 || target >= state.document.questions.length) return state
    const nextQuestions = [...state.document.questions]
    ;[nextQuestions[index], nextQuestions[target]] = [nextQuestions[target], nextQuestions[index]]
    return {
      document: { ...state.document, questions: nextQuestions, updatedAt: '刚刚' },
      undoDocument: cloneDocument(state.document),
    }
  }

  if (action.type === 'reorder') {
    const questionMap = new Map(state.document.questions.map((question) => [question.id, question]))
    const nextQuestions = action.questionIds.map((id) => questionMap.get(id)).filter((question): question is Question => Boolean(question))
    if (nextQuestions.length !== state.document.questions.length) return state
    return {
      document: { ...state.document, questions: nextQuestions, updatedAt: '刚刚' },
      undoDocument: cloneDocument(state.document),
    }
  }

  if (action.type === 'delete') {
    return {
      document: {
        ...state.document,
        questions: state.document.questions.filter((question) => question.id !== action.selectedQuestionId),
        updatedAt: '刚刚',
      },
      undoDocument: cloneDocument(state.document),
    }
  }

  if (action.type === 'undo' && state.undoDocument) {
    return {
      document: cloneDocument(state.undoDocument),
      undoDocument: null,
    }
  }

  return state
}

export function useWorkbench() {
  const [editor, dispatch] = useReducer(editorReducer, {
    document: cloneDocument(blankDocument),
    undoDocument: null,
  })
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [inspectorView, setInspectorView] = useState<InspectorView>('info')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addMode, setAddModeState] = useState<AddQuestionMode>('menu')
  const [libraryInitialView, setLibraryInitialView] = useState<LibraryInitialView | undefined>()
  const [resourceType, setResourceType] = useState<ResourceType>('paper')
  const [sourceRecords, setSourceRecords] = useState<SourceRecord[]>([])
  const [sourceListStatus, setSourceListStatus] = useState<AsyncStatus>('idle')
  const [sourceAddStatus, setSourceAddStatus] = useState<AsyncStatus>('idle')
  const [historyStatus, setHistoryStatus] = useState<AsyncStatus>('idle')
  const [historyDocuments, setHistoryDocuments] = useState<HistoryDocumentSummary[]>([])
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('草稿')
  const [documentSyncState, setDocumentSyncState] = useState<DocumentSyncState>('clean')
  const [assignmentOutdated, setAssignmentOutdated] = useState(false)
  const [myResourcePendingId, setMyResourcePendingId] = useState<string | null>(null)
  const [myResourceAddedIds, setMyResourceAddedIds] = useState<Set<string>>(new Set())
  const [composePrompt, setComposePrompt] = useState('')
  const [composeError, setComposeError] = useState('')
  const [composeStatus, setComposeStatus] = useState<AsyncStatus>('idle')
  const [assistantRun, setAssistantRun] = useState<AiAssistantRun | null>(null)
  const [createConfig, setCreateConfig] = useState<CreateQuestionRequest>(defaultCreateConfig)
  const [createError, setCreateError] = useState('')
  const [createStatus, setCreateStatus] = useState<AsyncStatus>('idle')
  const [createPreview, setCreatePreview] = useState<Question[]>([])
  const [createTargetDocumentId, setCreateTargetDocumentId] = useState<string | null>(null)
  const [rewriteStatus, setRewriteStatus] = useState<AsyncStatus>('idle')
  const [rewritePreview, setRewritePreview] = useState<Question | null>(null)
  const [rewriteTargetQuestionId, setRewriteTargetQuestionId] = useState<string | null>(null)
  const [contentOperation, setContentOperation] = useState<ContentOperation | null>(null)
  const contentOperationRef = useRef<ContentOperation | null>(null)
  const sourceRequestIdRef = useRef(0)
  const historyRequestIdRef = useRef(0)
  const createRequestIdRef = useRef(0)
  const assistantRequestIdRef = useRef(0)
  const assistantStepTimersRef = useRef<number[]>([])
  const rewriteRequestIdRef = useRef(0)
  const saveRequestIdRef = useRef(0)
  const autoSaveTimerRef = useRef<number | null>(null)
  const sessionDocumentsRef = useRef(new Map<string, WorkbenchDocument>())

  const document = editor.document
  const latestDocumentRef = useRef(document)
  latestDocumentRef.current = document
  const savedDocumentRef = useRef({ id: document.id, fingerprint: documentFingerprint(document) })
  const documentIdRef = useRef(document.id)
  documentIdRef.current = document.id
  const selectedQuestion = useMemo(
    () => document.questions.find((question) => question.id === selectedQuestionId) ?? null,
    [document.questions, selectedQuestionId],
  )

  useEffect(() => {
    setMyResourceAddedIds(new Set())
    setMyResourcePendingId(null)
  }, [document.id])

  const changeComposePrompt = useCallback((value: string) => {
    setComposePrompt(value)
    setComposeError('')
    setComposeStatus((current) => current === 'loading' ? current : 'idle')
  }, [])

  const clearAssistantStepTimers = useCallback(() => {
    assistantStepTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    assistantStepTimersRef.current = []
  }, [])

  const clearAssistantRun = useCallback(() => {
    assistantRequestIdRef.current += 1
    clearAssistantStepTimers()
    setAssistantRun(null)
    setComposePrompt('')
    setComposeStatus('idle')
    setComposeError('')
  }, [clearAssistantStepTimers])

  useEffect(() => clearAssistantStepTimers, [clearAssistantStepTimers])

  const invalidateRewrite = useCallback(() => {
    rewriteRequestIdRef.current += 1
    setRewriteStatus('idle')
    setRewritePreview(null)
    setRewriteTargetQuestionId(null)
  }, [])

  const beginContentOperation = useCallback((operation: ContentOperation) => {
    if (contentOperationRef.current) {
      MetisMessage.info('正在处理上一项内容，请稍候')
      return false
    }
    contentOperationRef.current = operation
    setContentOperation(operation)
    return true
  }, [])

  const finishContentOperation = useCallback((operation: ContentOperation) => {
    if (contentOperationRef.current !== operation) return
    contentOperationRef.current = null
    setContentOperation(null)
  }, [])

  const loadHistoryList = useCallback(async () => {
    const requestId = historyRequestIdRef.current + 1
    historyRequestIdRef.current = requestId
    setHistoryStatus('loading')
    try {
      const summaries = await workbenchRepository.listHistory()
      if (historyRequestIdRef.current !== requestId) return
      setHistoryDocuments((current) => {
        const sessionIds = new Set(sessionDocumentsRef.current.keys())
        const sessionSummaries = Array.from(sessionDocumentsRef.current.values()).map((sessionDocument) => (
          toHistorySummary(sessionDocument, current.find((item) => item.id === sessionDocument.id))
        ))
        return [
          ...sessionSummaries,
          ...summaries.filter((summary) => !sessionIds.has(summary.id)),
        ]
      })
      setHistoryStatus('success')
    } catch {
      if (historyRequestIdRef.current === requestId) setHistoryStatus('error')
    }
  }, [])

  useEffect(() => {
    void loadHistoryList()
  }, [loadHistoryList])

  const rememberDocument = useCallback((
    currentDocument: WorkbenchDocument,
    status?: DocumentStatus,
    persistedAssignmentOutdated?: boolean,
  ) => {
    const snapshot = cloneDocument({ ...currentDocument, updatedAt: '刚刚' })
    sessionDocumentsRef.current.set(snapshot.id, snapshot)
    setHistoryDocuments((current) => {
      const previous = current.find((item) => item.id === snapshot.id)
      return [
        toHistorySummary(snapshot, previous, status, persistedAssignmentOutdated),
        ...current.filter((item) => item.id !== snapshot.id),
      ]
    })
    setHistoryStatus('success')
  }, [])

  const saveDocument = useCallback(async (explicit = true) => {
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    const snapshot = cloneDocument(latestDocumentRef.current)
    if (isUntouchedBlankDocument(snapshot)) {
      if (explicit) MetisMessage.info('先添加题目或修改题稿名称后再保存')
      return false
    }
    const requestId = saveRequestIdRef.current + 1
    saveRequestIdRef.current = requestId
    setDocumentSyncState('saving')
    try {
      const requestedStatus = documentStatus === '已布置'
        ? '已布置'
        : explicit || documentStatus === '已保存'
          ? '已保存'
          : '草稿'
      const persistedAssignmentOutdated = documentStatus === '已布置' ? assignmentOutdated : false
      const result = await workbenchRepository.saveDocument(snapshot, requestedStatus, persistedAssignmentOutdated)
      if (saveRequestIdRef.current !== requestId || documentIdRef.current !== snapshot.id) return false
      const latest = latestDocumentRef.current
      const snapshotFingerprint = documentFingerprint(snapshot)
      const latestFingerprint = documentFingerprint(latest)
      savedDocumentRef.current = { id: snapshot.id, fingerprint: snapshotFingerprint }
      const effectiveStatus = documentStatus === '已布置' ? '已布置' : result.status
      const effectiveAssignmentOutdated = result.assignmentOutdated ?? persistedAssignmentOutdated
      setDocumentStatus(effectiveStatus)
      setAssignmentOutdated(effectiveAssignmentOutdated)
      rememberDocument(
        latestFingerprint === snapshotFingerprint ? result.document : latest,
        effectiveStatus,
        effectiveAssignmentOutdated,
      )
      setDocumentSyncState(latestFingerprint === snapshotFingerprint ? 'saved' : 'dirty')
      if (explicit) MetisMessage.success('题单已保存，并同步到我的资源')
      return true
    } catch {
      if (saveRequestIdRef.current === requestId && documentIdRef.current === snapshot.id) {
        setDocumentSyncState('error')
        if (explicit) MetisMessage.error('保存失败，请重试')
      }
      return false
    }
  }, [assignmentOutdated, documentStatus, rememberDocument])

  const assignDocument = useCallback(async () => {
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    const snapshot = cloneDocument(latestDocumentRef.current)
    if (snapshot.questions.length === 0) {
      MetisMessage.error('请先添加题目')
      return false
    }
    const requestId = saveRequestIdRef.current + 1
    saveRequestIdRef.current = requestId
    setDocumentSyncState('saving')
    try {
      const result = await workbenchRepository.assignDocument(snapshot)
      if (saveRequestIdRef.current !== requestId || documentIdRef.current !== snapshot.id) return false
      const latest = latestDocumentRef.current
      const snapshotFingerprint = documentFingerprint(snapshot)
      const latestFingerprint = documentFingerprint(latest)
      savedDocumentRef.current = { id: snapshot.id, fingerprint: snapshotFingerprint }
      setDocumentStatus('已布置')
      setAssignmentOutdated(false)
      rememberDocument(latestFingerprint === snapshotFingerprint ? result.document : latest, '已布置', false)
      setDocumentSyncState(latestFingerprint === snapshotFingerprint ? 'saved' : 'dirty')
      MetisMessage.success('题单已保存并布置成功')
      return true
    } catch {
      if (saveRequestIdRef.current === requestId && documentIdRef.current === snapshot.id) {
        setDocumentSyncState('error')
        MetisMessage.error('布置失败，请重试')
      }
      return false
    }
  }, [rememberDocument])

  useEffect(() => {
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    const fingerprint = documentFingerprint(document)
    if (savedDocumentRef.current.id !== document.id) {
      savedDocumentRef.current = { id: document.id, fingerprint }
      const historyDocument = historyDocuments.find((item) => item.id === document.id)
      setDocumentStatus(historyDocument?.status ?? '草稿')
      setDocumentSyncState('clean')
      setAssignmentOutdated(historyDocument?.assignmentOutdated ?? false)
      return
    }
    if (savedDocumentRef.current.fingerprint === fingerprint || isUntouchedBlankDocument(document)) return
    if (documentStatus === '已布置') setAssignmentOutdated(true)
    setDocumentSyncState('dirty')
    autoSaveTimerRef.current = window.setTimeout(() => {
      void saveDocument(false)
    }, 800)
    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
    }
  }, [document, historyDocuments, saveDocument])

  const loadSources = useCallback(async (type: ResourceType) => {
    const requestId = sourceRequestIdRef.current + 1
    sourceRequestIdRef.current = requestId
    setResourceType(type)
    setSourceListStatus('loading')
    try {
      const records = await workbenchRepository.loadSource(type)
      if (sourceRequestIdRef.current !== requestId) return
      setSourceRecords(records)
      setSourceListStatus('success')
    } catch {
      if (sourceRequestIdRef.current === requestId) setSourceListStatus('error')
    }
  }, [])

  const setAddMode = useCallback((mode: AddQuestionMode, options?: OpenAddOptions) => {
    setAddModeState(mode)
    setLibraryInitialView(options?.libraryView)
    setSourceAddStatus('idle')
    setComposeError('')
    setCreateError('')
    if (mode === 'resource' || mode === 'school') {
      const requestedType = options?.libraryView && options.libraryView !== 'chapter'
        ? options.libraryView
        : undefined
      const currentTypeAllowed = mode === 'resource' || resourceType === 'paper' || resourceType === 'workbook'
      const nextType = requestedType ?? (currentTypeAllowed ? resourceType : 'paper')
      void loadSources(nextType)
    }
  }, [loadSources, resourceType])

  const openAdd = useCallback((mode: AddQuestionMode = 'menu', options?: OpenAddOptions) => {
    setIsAddOpen(true)
    setAddMode(mode, options)
  }, [setAddMode])

  const closeAdd = useCallback(() => {
    setIsAddOpen(false)
    setAddModeState('menu')
    setLibraryInitialView(undefined)
  }, [])

  const appendQuestions = useCallback((questions: Question[], message: string, closeWhenEmpty = true) => {
    if (questions.length === 0) return
    const wasEmpty = document.questions.length === 0
    invalidateRewrite()
    dispatch({ type: 'append', questions })
    setSelectedQuestionId(questions[0].id)
    setInspectorView('info')
    if (wasEmpty && closeWhenEmpty) closeAdd()
    MetisMessage.success(message)
  }, [closeAdd, document.questions.length, invalidateRewrite])

  const addSource = useCallback(async (type: ResourceType, sourceId?: string, count?: number, selectedQuestions?: Question[]) => {
    if (!beginContentOperation('source-add')) return false
    setSourceAddStatus('loading')
    try {
      const questions = await workbenchRepository.addSource(type, sourceId, count, selectedQuestions)
      appendQuestions(questions, `已从题库添加 ${questions.length} 道题，可继续选题`, false)
      setSourceAddStatus('success')
      return true
    } catch {
      setSourceAddStatus('error')
      MetisMessage.error('题目添加失败，请重试')
      return false
    } finally {
      finishContentOperation('source-add')
    }
  }, [appendQuestions, beginContentOperation, finishContentOperation])

  const addMyResource = useCallback(async (resource: MyResourceSummary) => {
    if (!beginContentOperation('my-resource-add')) return false
    const targetDocumentId = document.id
    setMyResourcePendingId(resource.id)
    try {
      const questions = await workbenchRepository.addMyResource(resource)
      if (documentIdRef.current !== targetDocumentId) return false
      appendQuestions(questions, `已从“${resource.title}”加入 ${questions.length} 道题`, false)
      setMyResourceAddedIds((current) => new Set(current).add(resource.id))
      return true
    } catch {
      MetisMessage.error('资源加入失败，请重试')
      return false
    } finally {
      setMyResourcePendingId(null)
      finishContentOperation('my-resource-add')
    }
  }, [appendQuestions, beginContentOperation, document.id, finishContentOperation])

  const recognizeUpload = useCallback(async () => {
    if (!beginContentOperation('upload')) return
    setSourceAddStatus('loading')
    try {
      const questions = await workbenchRepository.recognizeUpload()
      appendQuestions(questions, `已识别并添加 ${questions.length} 道题，请校验`)
      setSourceAddStatus('success')
    } catch {
      setSourceAddStatus('error')
      MetisMessage.error('材料识别失败，请重试')
    } finally {
      finishContentOperation('upload')
    }
  }, [appendQuestions, beginContentOperation, finishContentOperation])

  const personalizeFromUpload = useCallback(async () => {
    if (!beginContentOperation('personalized')) return
    setSourceAddStatus('loading')
    try {
      const questions = await workbenchRepository.personalizeFromUpload()
      appendQuestions(questions, `已根据上传材料生成 ${questions.length} 道个性化练习，请校验`)
      setSourceAddStatus('success')
    } catch {
      setSourceAddStatus('error')
      MetisMessage.error('个性化练习生成失败，请重试')
    } finally {
      finishContentOperation('personalized')
    }
  }, [appendQuestions, beginContentOperation, finishContentOperation])

  const composeFromBank = useCallback(async (promptOverride?: string) => {
    const value = (promptOverride ?? composePrompt).trim()
    if (!value) {
      setComposeError('请描述想组题、组卷或查找的内容')
      return
    }
    if (!beginContentOperation('compose')) return
    const targetDocumentId = document.id
    const requestId = assistantRequestIdRef.current + 1
    assistantRequestIdRef.current = requestId
    clearAssistantStepTimers()
    setComposeError('')
    setComposeStatus('loading')
    setAssistantRun({
      id: `assistant-${Date.now()}`,
      prompt: value,
      status: 'loading',
      activeStep: 0,
      resultCount: 0,
    })
    assistantStepTimersRef.current = [240, 540].map((delay, index) => window.setTimeout(() => {
      if (assistantRequestIdRef.current !== requestId) return
      setAssistantRun((current) => current?.status === 'loading'
        ? { ...current, activeStep: index + 1 }
        : current)
    }, delay))
    try {
      const questions = await workbenchRepository.composeFromBank(value)
      if (assistantRequestIdRef.current !== requestId || documentIdRef.current !== targetDocumentId) return
      appendQuestions(questions, `AI 已匹配并添加 ${questions.length} 道题`, false)
      setComposePrompt('')
      setComposeStatus('success')
      setAssistantRun((current) => current ? {
        ...current,
        status: 'success',
        activeStep: 3,
        resultCount: questions.length,
        errorMessage: undefined,
      } : current)
    } catch (error) {
      if (assistantRequestIdRef.current !== requestId) return
      const errorMessage = error instanceof Error ? error.message : 'AI 处理失败，请稍后重试'
      setComposeError(errorMessage)
      setComposeStatus('error')
      setAssistantRun((current) => current ? {
        ...current,
        status: 'error',
        errorMessage,
      } : current)
    } finally {
      clearAssistantStepTimers()
      finishContentOperation('compose')
    }
  }, [appendQuestions, beginContentOperation, clearAssistantStepTimers, composePrompt, document.id, finishContentOperation])

  const createQuestions = useCallback(async (requestOverride?: CreateQuestionRequest) => {
    const request = requestOverride ?? createConfig
    const total = request.allocations.reduce((sum, item) => sum + item.count, 0)
    if (total === 0) {
      setCreateError('请至少为一个知识点设置题量')
      return
    }
    if (total > 12) {
      setCreateError('单次最多生成 12 道题')
      return
    }
    if (!beginContentOperation('create')) return
    const requestId = createRequestIdRef.current + 1
    createRequestIdRef.current = requestId
    setCreateError('')
    setCreateStatus('loading')
    setCreatePreview([])
    setCreateTargetDocumentId(document.id)
    try {
      const questions = await workbenchRepository.createQuestions(request)
      if (createRequestIdRef.current !== requestId) return
      setCreatePreview(questions)
      setCreateStatus('success')
    } catch (error) {
      if (createRequestIdRef.current !== requestId) return
      setCreateError(error instanceof Error ? error.message : '出题失败，请稍后重试')
      setCreateStatus('error')
    } finally {
      finishContentOperation('create')
    }
  }, [beginContentOperation, createConfig, document.id, finishContentOperation])

  const changeCreateConfig = useCallback((value: CreateQuestionRequest) => {
    createRequestIdRef.current += 1
    setCreateConfig(value)
    setCreatePreview([])
    setCreateTargetDocumentId(null)
    setCreateError('')
    setCreateStatus('idle')
  }, [])

  const addCreatedQuestions = useCallback(() => {
    if (createPreview.length === 0) return
    if (contentOperationRef.current) {
      MetisMessage.info('正在处理上一项内容，请稍候')
      return
    }
    if (createTargetDocumentId !== document.id) {
      setCreatePreview([])
      setCreateTargetDocumentId(null)
      setCreateError('题稿已切换，请重新生成后再加入')
      return
    }
    appendQuestions(createPreview, `已加入 ${createPreview.length} 道 AI 原创题，请校验`)
    setCreatePreview([])
    setCreateTargetDocumentId(null)
    setCreateStatus('idle')
    setCreateError('')
  }, [appendQuestions, createPreview, createTargetDocumentId, document.id])

  const addManualQuestion = useCallback(async () => {
    if (!beginContentOperation('manual')) return
    setSourceAddStatus('loading')
    try {
      const question = await workbenchRepository.createManualQuestion()
      appendQuestions([question], '已添加一道空白题，可继续编辑')
      setSourceAddStatus('success')
      closeAdd()
    } catch {
      setSourceAddStatus('error')
      MetisMessage.error('空白题创建失败，请重试')
    } finally {
      finishContentOperation('manual')
    }
  }, [appendQuestions, beginContentOperation, closeAdd, finishContentOperation])

  const createNewDocument = useCallback(() => {
    if (contentOperationRef.current) {
      MetisMessage.info('正在处理上一项内容，请稍候')
      return false
    }
    if (document.questions.length === 0 && !document.intro?.trim() && ['未命名组题', '未命名题单'].includes(document.title.trim())) {
      MetisMessage.info('当前已经是一份空白题单')
      return false
    }

    rememberDocument(document)
    const nextDocument: WorkbenchDocument = {
      id: `draft-${Date.now()}`,
      title: '未命名组题',
      gradeSubject: document.gradeSubject,
      questions: [],
      updatedAt: '刚刚',
    }
    invalidateRewrite()
    dispatch({ type: 'load-document', document: nextDocument })
    setSelectedQuestionId(null)
    setInspectorView('info')
    setIsAddOpen(false)
    setAddModeState('menu')
    setLibraryInitialView(undefined)
    setCreatePreview([])
    setCreateTargetDocumentId(null)
    createRequestIdRef.current += 1
    setCreateConfig(defaultCreateConfig)
    setCreateStatus('idle')
    setCreateError('')
    clearAssistantRun()
    MetisMessage.success('已新建空白题单，上一份已保留在最近记录，可撤销')
    return true
  }, [clearAssistantRun, document, invalidateRewrite, rememberDocument])

  const openHistoryDocument = useCallback(async (documentId: string) => {
    if (document.id === documentId) {
      MetisMessage.info('这份题单已经打开')
      return
    }
    if (!beginContentOperation('history-load')) return
    invalidateRewrite()
    try {
      if (!isUntouchedBlankDocument(document)) rememberDocument(document)
      const sessionDocument = sessionDocumentsRef.current.get(documentId)
      const nextDocument = sessionDocument
        ? cloneDocument(sessionDocument)
        : await workbenchRepository.loadDocument(documentId)
      invalidateRewrite()
      dispatch({ type: 'load-document', document: nextDocument })
      setSelectedQuestionId(null)
      setInspectorView('info')
      createRequestIdRef.current += 1
      setCreatePreview([])
      setCreateTargetDocumentId(null)
      clearAssistantRun()
      MetisMessage.success(`已打开“${nextDocument.title}”，上一份草稿可撤销`)
    } catch {
      MetisMessage.error('历史题单加载失败，请重试')
    } finally {
      finishContentOperation('history-load')
    }
  }, [beginContentOperation, clearAssistantRun, document, finishContentOperation, invalidateRewrite, rememberDocument])

  const selectQuestion = useCallback((questionId: string) => {
    invalidateRewrite()
    setSelectedQuestionId(questionId)
  }, [invalidateRewrite])

  const updateQuestion = useCallback((questionId: string, patch: QuestionPatch) => {
    if (!document.questions.some((question) => question.id === questionId)) return
    invalidateRewrite()
    dispatch({ type: 'update-question', questionId, patch })
  }, [document.questions, invalidateRewrite])

  const rewrite = useCallback(async (instruction: RewriteRequest['instruction'], prompt?: string) => {
    if (!selectedQuestion) return
    const lockedQuestion = selectedQuestion
    const requestId = rewriteRequestIdRef.current + 1
    rewriteRequestIdRef.current = requestId
    setRewriteStatus('loading')
    setRewritePreview(null)
    setRewriteTargetQuestionId(lockedQuestion.id)
    try {
      const preview = await workbenchRepository.rewrite(lockedQuestion, {
        questionId: lockedQuestion.id,
        instruction,
        prompt,
      })
      if (rewriteRequestIdRef.current !== requestId) return
      setRewritePreview(preview)
      setRewriteStatus('success')
    } catch {
      if (rewriteRequestIdRef.current !== requestId) return
      setRewriteStatus('error')
      setRewriteTargetQuestionId(null)
      MetisMessage.error('AI 改编失败，请重试')
    }
  }, [selectedQuestion])

  const applyRewrite = useCallback((mode: 'replace' | 'append') => {
    if (!rewritePreview || !rewriteTargetQuestionId) return
    if (!document.questions.some((question) => question.id === rewriteTargetQuestionId)) {
      invalidateRewrite()
      MetisMessage.info('原题已变化，请重新生成改编预览')
      return
    }
    dispatch({ type: 'apply-rewrite', selectedQuestionId: rewriteTargetQuestionId, preview: rewritePreview, mode })
    setSelectedQuestionId(rewriteTargetQuestionId)
    invalidateRewrite()
    setInspectorView('info')
    MetisMessage.success(mode === 'replace' ? '已替换原题，可撤销' : '已新增到原题下方')
  }, [document.questions, invalidateRewrite, rewritePreview, rewriteTargetQuestionId])

  const moveQuestion = useCallback((direction: -1 | 1) => {
    if (!selectedQuestionId) return
    dispatch({ type: 'move', selectedQuestionId, direction })
  }, [selectedQuestionId])

  const reorderQuestions = useCallback((questionIds: string[]) => {
    dispatch({ type: 'reorder', questionIds })
    MetisMessage.success('题目顺序已更新，可撤销')
  }, [])

  const deleteQuestion = useCallback(() => {
    if (!selectedQuestionId) return
    const index = document.questions.findIndex((question) => question.id === selectedQuestionId)
    const nextSelection = document.questions[index + 1]?.id ?? document.questions[index - 1]?.id ?? null
    invalidateRewrite()
    dispatch({ type: 'delete', selectedQuestionId })
    setMyResourceAddedIds(new Set())
    setSelectedQuestionId(nextSelection)
    setInspectorView('info')
    MetisMessage.success('已删除题目，可撤销')
  }, [document.questions, invalidateRewrite, selectedQuestionId])

  const undo = useCallback(() => {
    if (contentOperationRef.current) {
      MetisMessage.info('正在处理 AI 要求，请稍候再撤销')
      return
    }
    if (!editor.undoDocument) return
    invalidateRewrite()
    createRequestIdRef.current += 1
    setCreatePreview([])
    setCreateTargetDocumentId(null)
    setCreateStatus('idle')
    setCreateError('')
    clearAssistantRun()
    setMyResourceAddedIds(new Set())
    const restored = editor.undoDocument
    dispatch({ type: 'undo' })
    setSelectedQuestionId(restored.questions[0]?.id ?? null)
    setInspectorView('info')
    MetisMessage.success('已撤销上一步操作')
  }, [clearAssistantRun, editor.undoDocument, invalidateRewrite])

  return {
    document,
    setTitle: (title: string) => dispatch({ type: 'set-title', title }),
    setIntro: (intro: string) => dispatch({ type: 'set-intro', intro }),
    setDocumentFormat: (patch: Partial<DocumentFormat>) => dispatch({ type: 'set-format', patch }),
    setSectionTitle: (questionType: QuestionType, title: string) => dispatch({ type: 'set-section-title', questionType, title }),
    selectedQuestion,
    selectedQuestionId,
    inspectorView,
    setInspectorView,
    isAddOpen,
    addMode,
    setAddMode,
    libraryInitialView,
    resourceType,
    sourceRecords,
    sourceListStatus,
    sourceAddStatus,
    historyStatus,
    historyDocuments,
    documentStatus,
    documentSyncState,
    assignmentOutdated,
    myResourcePendingId,
    myResourceAddedIds,
    composePrompt,
    setComposePrompt: changeComposePrompt,
    composeError,
    composeStatus,
    assistantRun,
    clearAssistantRun,
    createConfig,
    setCreateConfig: changeCreateConfig,
    createError,
    createStatus,
    createPreview,
    rewriteStatus,
    rewritePreview,
    isContentBusy: contentOperation !== null,
    canUndo: Boolean(editor.undoDocument),
    createNewDocument,
    openAdd,
    closeAdd,
    loadSources,
    addSource,
    addMyResource,
    recognizeUpload,
    personalizeFromUpload,
    composeFromBank,
    createQuestions,
    addCreatedQuestions,
    addManualQuestion,
    reloadHistory: loadHistoryList,
    openHistoryDocument,
    selectQuestion,
    updateQuestion,
    rewrite,
    applyRewrite,
    moveQuestion,
    reorderQuestions,
    deleteQuestion,
    saveDocument,
    assignDocument,
    undo,
  }
}

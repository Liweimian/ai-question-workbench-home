import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import { recentDocument } from '../data/workbenchData'
import type {
  AddQuestionMode,
  AsyncStatus,
  HistoryDocumentSummary,
  InspectorView,
  Question,
  ResourceType,
  RewriteRequest,
  SourceRecord,
  WorkbenchDocument,
} from '../prototype/types'
import { workbenchRepository } from '../services/workbenchRepository'

type ContentOperation = 'source-add' | 'upload' | 'personalized' | 'compose' | 'create' | 'manual' | 'history-load'

interface EditorState {
  document: WorkbenchDocument
  undoDocument: WorkbenchDocument | null
}

type EditorAction =
  | { type: 'set-title'; title: string }
  | { type: 'append'; questions: Question[] }
  | { type: 'load-document'; document: WorkbenchDocument }
  | { type: 'apply-rewrite'; selectedQuestionId: string; preview: Question; mode: 'replace' | 'append' }
  | { type: 'move'; selectedQuestionId: string; direction: -1 | 1 }
  | { type: 'delete'; selectedQuestionId: string }
  | { type: 'undo' }

const cloneQuestion = (question: Question): Question => ({
  ...question,
  options: question.options ? [...question.options] : undefined,
})

const cloneQuestions = (questions: Question[]) => questions.map(cloneQuestion)

const cloneDocument = (document: WorkbenchDocument): WorkbenchDocument => ({
  ...document,
  questions: cloneQuestions(document.questions),
})

const toHistorySummary = (
  document: WorkbenchDocument,
  previous?: HistoryDocumentSummary,
): HistoryDocumentSummary => ({
  id: document.id,
  title: document.title.trim() || '未命名组题',
  gradeSubject: document.gradeSubject,
  questionCount: document.questions.length,
  updatedAt: '刚刚',
  status: '草稿',
  origin: previous?.origin ?? '手工组题',
})

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'set-title') {
    return {
      document: { ...state.document, title: action.title, updatedAt: '刚刚' },
      undoDocument: state.undoDocument,
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
    if (action.mode === 'replace') nextQuestions[index] = cloneQuestion(action.preview)
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
    document: cloneDocument(recentDocument),
    undoDocument: null,
  })
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(recentDocument.questions[0]?.id ?? null)
  const [inspectorView, setInspectorView] = useState<InspectorView>('info')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addMode, setAddModeState] = useState<AddQuestionMode>('menu')
  const [resourceType, setResourceType] = useState<ResourceType>('workbook')
  const [sourceRecords, setSourceRecords] = useState<SourceRecord[]>([])
  const [sourceListStatus, setSourceListStatus] = useState<AsyncStatus>('idle')
  const [sourceAddStatus, setSourceAddStatus] = useState<AsyncStatus>('idle')
  const [historyStatus, setHistoryStatus] = useState<AsyncStatus>('idle')
  const [historyDocuments, setHistoryDocuments] = useState<HistoryDocumentSummary[]>([])
  const [historyQuery, setHistoryQuery] = useState('')
  const [composePrompt, setComposePrompt] = useState('')
  const [composeError, setComposeError] = useState('')
  const [composeStatus, setComposeStatus] = useState<AsyncStatus>('idle')
  const [createPrompt, setCreatePrompt] = useState('')
  const [createError, setCreateError] = useState('')
  const [createStatus, setCreateStatus] = useState<AsyncStatus>('idle')
  const [createPreview, setCreatePreview] = useState<Question[]>([])
  const [rewriteStatus, setRewriteStatus] = useState<AsyncStatus>('idle')
  const [rewritePreview, setRewritePreview] = useState<Question | null>(null)
  const [contentOperation, setContentOperation] = useState<ContentOperation | null>(null)
  const contentOperationRef = useRef<ContentOperation | null>(null)
  const sourceRequestIdRef = useRef(0)
  const historyRequestIdRef = useRef(0)
  const rewriteRequestIdRef = useRef(0)
  const sessionDocumentsRef = useRef(new Map<string, WorkbenchDocument>())

  const document = editor.document
  const selectedQuestion = useMemo(
    () => document.questions.find((question) => question.id === selectedQuestionId) ?? null,
    [document.questions, selectedQuestionId],
  )

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
      setHistoryDocuments(summaries)
      setHistoryStatus('success')
    } catch {
      if (historyRequestIdRef.current === requestId) setHistoryStatus('error')
    }
  }, [])

  useEffect(() => {
    void loadHistoryList()
  }, [loadHistoryList])

  const rememberDocument = useCallback((currentDocument: WorkbenchDocument) => {
    historyRequestIdRef.current += 1
    const snapshot = cloneDocument({ ...currentDocument, updatedAt: '刚刚' })
    sessionDocumentsRef.current.set(snapshot.id, snapshot)
    setHistoryDocuments((current) => {
      const previous = current.find((item) => item.id === snapshot.id)
      return [
        toHistorySummary(snapshot, previous),
        ...current.filter((item) => item.id !== snapshot.id),
      ]
    })
    setHistoryStatus('success')
  }, [])

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

  const setAddMode = useCallback((mode: AddQuestionMode) => {
    setAddModeState(mode)
    setSourceAddStatus('idle')
    setComposeError('')
    setCreateError('')
    if (mode === 'resource' || mode === 'school') {
      const nextType = mode === 'school' && resourceType === 'special' ? 'paper' : resourceType
      void loadSources(nextType)
    }
  }, [loadSources, resourceType])

  const openAdd = useCallback((mode: AddQuestionMode = 'menu') => {
    setIsAddOpen(true)
    setAddMode(mode)
  }, [setAddMode])

  const closeAdd = useCallback(() => {
    setIsAddOpen(false)
    setAddModeState('menu')
    setCreatePreview([])
  }, [])

  const appendQuestions = useCallback((questions: Question[], message: string) => {
    if (questions.length === 0) return
    const wasEmpty = document.questions.length === 0
    dispatch({ type: 'append', questions })
    setSelectedQuestionId(questions[0].id)
    setInspectorView('info')
    if (wasEmpty) closeAdd()
    MetisMessage.success(message)
  }, [closeAdd, document.questions.length])

  const addSource = useCallback(async (type: ResourceType, sourceId?: string, count?: number) => {
    if (!beginContentOperation('source-add')) return
    setSourceAddStatus('loading')
    try {
      const questions = await workbenchRepository.addSource(type, sourceId, count)
      appendQuestions(questions, `已从题库添加 ${questions.length} 道题`)
      setSourceAddStatus('success')
    } catch {
      setSourceAddStatus('error')
      MetisMessage.error('题目添加失败，请重试')
    } finally {
      finishContentOperation('source-add')
    }
  }, [appendQuestions, beginContentOperation, finishContentOperation])

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
      setComposeError('请描述知识点、题量或难度要求')
      return
    }
    if (!beginContentOperation('compose')) return
    setComposeError('')
    setComposeStatus('loading')
    try {
      const questions = await workbenchRepository.composeFromBank(value)
      appendQuestions(questions, `AI 已从题库挑选并添加 ${questions.length} 道题`)
      setComposePrompt('')
      setComposeStatus('success')
    } catch (error) {
      setComposeError(error instanceof Error ? error.message : '组题失败，请稍后重试')
      setComposeStatus('error')
    } finally {
      finishContentOperation('compose')
    }
  }, [appendQuestions, beginContentOperation, composePrompt, finishContentOperation])

  const createQuestions = useCallback(async () => {
    const value = createPrompt.trim()
    if (!value) {
      setCreateError('请描述希望 AI 原创的题目')
      return
    }
    if (!beginContentOperation('create')) return
    setCreateError('')
    setCreateStatus('loading')
    setCreatePreview([])
    try {
      const questions = await workbenchRepository.createQuestions(value)
      setCreatePreview(questions)
      setCreateStatus('success')
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '出题失败，请稍后重试')
      setCreateStatus('error')
    } finally {
      finishContentOperation('create')
    }
  }, [beginContentOperation, createPrompt, finishContentOperation])

  const addCreatedQuestions = useCallback(() => {
    if (createPreview.length === 0) return
    appendQuestions(createPreview, `已加入 ${createPreview.length} 道 AI 原创题，请校验`)
    setCreatePreview([])
    setCreatePrompt('')
  }, [appendQuestions, createPreview])

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
      return
    }
    if (document.questions.length === 0 && ['未命名组题', '未命名题单'].includes(document.title.trim())) {
      MetisMessage.info('当前已经是一份空白题单')
      return
    }

    rememberDocument(document)
    const nextDocument: WorkbenchDocument = {
      id: `draft-${Date.now()}`,
      title: '未命名组题',
      gradeSubject: document.gradeSubject,
      questions: [],
      updatedAt: '刚刚',
    }
    rewriteRequestIdRef.current += 1
    dispatch({ type: 'load-document', document: nextDocument })
    setSelectedQuestionId(null)
    setInspectorView('info')
    setIsAddOpen(false)
    setAddModeState('menu')
    setCreatePreview([])
    setRewriteStatus('idle')
    setRewritePreview(null)
    MetisMessage.success('已新建空白题单，上一份已自动保存，可撤销')
  }, [document, rememberDocument])

  const openHistoryDocument = useCallback(async (documentId: string) => {
    if (document.id === documentId) {
      MetisMessage.info('这份题单已经打开')
      return
    }
    if (!beginContentOperation('history-load')) return
    try {
      rememberDocument(document)
      const sessionDocument = sessionDocumentsRef.current.get(documentId)
      const nextDocument = sessionDocument
        ? cloneDocument(sessionDocument)
        : await workbenchRepository.loadDocument(documentId)
      dispatch({ type: 'load-document', document: nextDocument })
      setSelectedQuestionId(nextDocument.questions[0]?.id ?? null)
      setInspectorView('info')
      MetisMessage.success(`已打开“${nextDocument.title}”，上一份草稿可撤销`)
    } catch {
      MetisMessage.error('历史题单加载失败，请重试')
    } finally {
      finishContentOperation('history-load')
    }
  }, [beginContentOperation, document, finishContentOperation, rememberDocument])

  const selectQuestion = useCallback((questionId: string) => {
    rewriteRequestIdRef.current += 1
    setSelectedQuestionId(questionId)
    setRewriteStatus('idle')
    setRewritePreview(null)
  }, [])

  const rewrite = useCallback(async (instruction: RewriteRequest['instruction']) => {
    if (!selectedQuestion) return
    const lockedQuestion = selectedQuestion
    const requestId = rewriteRequestIdRef.current + 1
    rewriteRequestIdRef.current = requestId
    setRewriteStatus('loading')
    setRewritePreview(null)
    try {
      const preview = await workbenchRepository.rewrite(lockedQuestion, {
        questionId: lockedQuestion.id,
        instruction,
      })
      if (rewriteRequestIdRef.current !== requestId) return
      setRewritePreview(preview)
      setRewriteStatus('success')
    } catch {
      if (rewriteRequestIdRef.current !== requestId) return
      setRewriteStatus('error')
      MetisMessage.error('AI 改编失败，请重试')
    }
  }, [selectedQuestion])

  const applyRewrite = useCallback((mode: 'replace' | 'append') => {
    if (!rewritePreview || !selectedQuestionId) return
    dispatch({ type: 'apply-rewrite', selectedQuestionId, preview: rewritePreview, mode })
    setRewritePreview(null)
    setInspectorView('info')
    MetisMessage.success(mode === 'replace' ? '已替换原题，可撤销' : '已新增到原题下方')
  }, [rewritePreview, selectedQuestionId])

  const moveQuestion = useCallback((direction: -1 | 1) => {
    if (!selectedQuestionId) return
    dispatch({ type: 'move', selectedQuestionId, direction })
  }, [selectedQuestionId])

  const deleteQuestion = useCallback(() => {
    if (!selectedQuestionId) return
    const index = document.questions.findIndex((question) => question.id === selectedQuestionId)
    const nextSelection = document.questions[index + 1]?.id ?? document.questions[index - 1]?.id ?? null
    rewriteRequestIdRef.current += 1
    dispatch({ type: 'delete', selectedQuestionId })
    setSelectedQuestionId(nextSelection)
    setInspectorView('info')
    setRewriteStatus('idle')
    setRewritePreview(null)
    MetisMessage.success('已删除题目，可撤销')
  }, [document.questions, selectedQuestionId])

  const undo = useCallback(() => {
    if (!editor.undoDocument) return
    rewriteRequestIdRef.current += 1
    const restored = editor.undoDocument
    dispatch({ type: 'undo' })
    setSelectedQuestionId(restored.questions[0]?.id ?? null)
    setInspectorView('info')
    setRewriteStatus('idle')
    setRewritePreview(null)
    MetisMessage.success('已撤销上一步操作')
  }, [editor.undoDocument])

  const editQuestion = useCallback(() => {
    MetisMessage.info('已进入题目编辑演示，正文修改暂不写入服务端')
  }, [])

  return {
    document,
    setTitle: (title: string) => dispatch({ type: 'set-title', title }),
    selectedQuestion,
    selectedQuestionId,
    inspectorView,
    setInspectorView,
    isAddOpen,
    addMode,
    setAddMode,
    resourceType,
    sourceRecords,
    sourceListStatus,
    sourceAddStatus,
    historyStatus,
    historyDocuments,
    historyQuery,
    setHistoryQuery,
    composePrompt,
    setComposePrompt,
    composeError,
    composeStatus,
    createPrompt,
    setCreatePrompt,
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
    recognizeUpload,
    personalizeFromUpload,
    composeFromBank,
    createQuestions,
    addCreatedQuestions,
    addManualQuestion,
    reloadHistory: loadHistoryList,
    openHistoryDocument,
    selectQuestion,
    rewrite,
    applyRewrite,
    moveQuestion,
    deleteQuestion,
    editQuestion,
    undo,
  }
}

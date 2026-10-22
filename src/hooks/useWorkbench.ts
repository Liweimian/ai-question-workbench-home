import { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import { recentDocument } from '../data/workbenchData'
import type {
  AsyncStatus,
  Question,
  RewriteRequest,
  SourceRecord,
  SourceType,
  WorkbenchDocument,
} from '../prototype/types'
import { workbenchRepository } from '../services/workbenchRepository'

type ActivePanel = 'source' | 'ai' | null
type SourceMode = 'resource' | 'upload' | 'generate'
type ContentOperation = 'source-add' | 'generate' | 'recent'

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

const emptyDocument: WorkbenchDocument = {
  id: 'draft-new',
  title: '未命名',
  gradeSubject: '初中数学 · 八年级上册 · 人教版',
  questions: [],
  updatedAt: '刚刚',
}

const cloneQuestion = (question: Question): Question => ({
  ...question,
  options: question.options ? [...question.options] : undefined,
})

const cloneQuestions = (questions: Question[]) => questions.map(cloneQuestion)
const cloneDocument = (document: WorkbenchDocument): WorkbenchDocument => ({
  ...document,
  questions: cloneQuestions(document.questions),
})

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'set-title') {
    return {
      document: { ...state.document, title: action.title },
      undoDocument: state.undoDocument ? { ...state.undoDocument, title: action.title } : null,
    }
  }

  if (action.type === 'append') {
    return {
      document: {
        ...state.document,
        title: state.document.title === '未命名' ? '八年级数学练习' : state.document.title,
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
  const [editor, dispatch] = useReducer(editorReducer, { document: emptyDocument, undoDocument: null })
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [sourceMode, setSourceModeState] = useState<SourceMode>('resource')
  const [resourceType, setResourceType] = useState<SourceType>('paper')
  const [sourceRecords, setSourceRecords] = useState<SourceRecord[]>([])
  const [sourceListStatus, setSourceListStatus] = useState<AsyncStatus>('idle')
  const [sourceAddStatus, setSourceAddStatus] = useState<AsyncStatus>('idle')
  const [recentStatus, setRecentStatus] = useState<AsyncStatus>('idle')
  const [prompt, setPrompt] = useState('')
  const [promptError, setPromptError] = useState('')
  const [generateStatus, setGenerateStatus] = useState<AsyncStatus>('idle')
  const [rewriteStatus, setRewriteStatus] = useState<AsyncStatus>('idle')
  const [rewritePreview, setRewritePreview] = useState<Question | null>(null)
  const [contentOperation, setContentOperation] = useState<ContentOperation | null>(null)
  const contentOperationRef = useRef<ContentOperation | null>(null)
  const sourceRequestIdRef = useRef(0)
  const rewriteRequestIdRef = useRef(0)

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

  const loadSources = useCallback(async (type: SourceType) => {
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

  const setSourceMode = useCallback((mode: SourceMode) => {
    setSourceModeState(mode)
    setSourceAddStatus('idle')
  }, [])

  const openSourcePanel = useCallback((mode: SourceMode = 'resource') => {
    rewriteRequestIdRef.current += 1
    setActivePanel('source')
    setSourceModeState(mode)
    setSourceAddStatus('idle')
    setRewriteStatus('idle')
    setRewritePreview(null)
    if (mode === 'resource') void loadSources(resourceType)
  }, [loadSources, resourceType])

  const openAiPanel = useCallback(() => {
    if (!selectedQuestionId) return
    setActivePanel('ai')
    setRewriteStatus('idle')
    setRewritePreview(null)
  }, [selectedQuestionId])

  const closePanel = useCallback(() => {
    rewriteRequestIdRef.current += 1
    setActivePanel(null)
    setRewriteStatus('idle')
    setRewritePreview(null)
  }, [])

  const appendQuestions = useCallback((questions: Question[], message: string) => {
    dispatch({ type: 'append', questions })
    MetisMessage.success(message)
  }, [])

  const addSource = useCallback(async (type: SourceType, sourceId?: string) => {
    if (!beginContentOperation('source-add')) return
    setSourceAddStatus('loading')
    try {
      const questions = await workbenchRepository.addSource(type, sourceId)
      appendQuestions(questions, `已添加 ${questions.length} 道题，可继续添加或完成`)
      setSourceAddStatus('success')
    } catch {
      setSourceAddStatus('error')
      MetisMessage.error(type === 'recording' ? '材料识别失败，请重试' : '内容添加失败，请重试')
    } finally {
      finishContentOperation('source-add')
    }
  }, [appendQuestions, beginContentOperation, finishContentOperation])

  const generate = useCallback(async () => {
    const value = prompt.trim()
    if (!value) {
      setPromptError('请先描述希望生成的题目')
      return
    }
    if (!beginContentOperation('generate')) return
    setPromptError('')
    setGenerateStatus('loading')
    try {
      const questions = await workbenchRepository.generate(value)
      appendQuestions(questions, `AI 已生成并添加 ${questions.length} 道题`)
      setPrompt('')
      setGenerateStatus('success')
    } catch (error) {
      setPromptError(error instanceof Error ? error.message : '生成失败，请稍后重试')
      setGenerateStatus('error')
    } finally {
      finishContentOperation('generate')
    }
  }, [appendQuestions, beginContentOperation, finishContentOperation, prompt])

  const continueRecent = useCallback(async () => {
    if (!beginContentOperation('recent')) return
    setRecentStatus('loading')
    try {
      const nextDocument = await workbenchRepository.loadRecent()
      dispatch({ type: 'load-document', document: nextDocument })
      setRecentStatus('success')
      MetisMessage.success(`已继续编辑：${recentDocument.title}`)
    } catch {
      setRecentStatus('error')
      MetisMessage.error('最近文档加载失败，请重试')
    } finally {
      finishContentOperation('recent')
    }
  }, [beginContentOperation, finishContentOperation])

  const selectQuestion = useCallback((questionId: string) => {
    rewriteRequestIdRef.current += 1
    setSelectedQuestionId(questionId)
    if (activePanel === 'ai') setActivePanel(null)
    setRewriteStatus('idle')
    setRewritePreview(null)
  }, [activePanel])

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
    MetisMessage.success(mode === 'replace' ? '已替换原题，可撤销' : '已新增到原题下方')
  }, [rewritePreview, selectedQuestionId])

  const moveQuestion = useCallback((direction: -1 | 1) => {
    if (!selectedQuestionId) return
    dispatch({ type: 'move', selectedQuestionId, direction })
  }, [selectedQuestionId])

  const deleteQuestion = useCallback(() => {
    if (!selectedQuestionId) return
    rewriteRequestIdRef.current += 1
    dispatch({ type: 'delete', selectedQuestionId })
    setSelectedQuestionId(null)
    setActivePanel(null)
    setRewriteStatus('idle')
    setRewritePreview(null)
    MetisMessage.success('已删除题目，可撤销')
  }, [selectedQuestionId])

  const undo = useCallback(() => {
    if (!editor.undoDocument) return
    rewriteRequestIdRef.current += 1
    dispatch({ type: 'undo' })
    setSelectedQuestionId(null)
    setActivePanel(null)
    setRewriteStatus('idle')
    setRewritePreview(null)
    MetisMessage.success('已撤销上一步操作')
  }, [editor.undoDocument])

  const editQuestion = useCallback(() => {
    MetisMessage.info('题目编辑已进入演示流程，本轮暂不保存正文修改')
  }, [])

  return {
    document,
    setTitle: (title: string) => dispatch({ type: 'set-title', title }),
    selectedQuestion,
    selectedQuestionId,
    activePanel,
    sourceMode,
    setSourceMode,
    resourceType,
    sourceRecords,
    sourceListStatus,
    sourceAddStatus,
    recentStatus,
    prompt,
    setPrompt,
    promptError,
    generateStatus,
    rewriteStatus,
    rewritePreview,
    isContentBusy: contentOperation !== null,
    canUndo: Boolean(editor.undoDocument),
    openSourcePanel,
    openAiPanel,
    closePanel,
    loadSources,
    addSource,
    generate,
    continueRecent,
    selectQuestion,
    rewrite,
    applyRewrite,
    moveQuestion,
    deleteQuestion,
    editQuestion,
    undo,
  }
}

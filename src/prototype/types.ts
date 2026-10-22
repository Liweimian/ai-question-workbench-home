export type EntityId = string
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'
export type ResourceType = 'workbook' | 'paper' | 'sync' | 'special'
export type AddQuestionMode = 'menu' | 'resource' | 'school' | 'compose' | 'create' | 'upload' | 'personalized' | 'manual'
export type InspectorView = 'info' | 'ai'
export type Difficulty = '基础' | '中等' | '提升'
export type QuestionOrigin = 'question-bank' | 'ai-original' | 'upload' | 'manual'

export interface Question {
  id: EntityId
  type: '选择题' | '填空题' | '解答题'
  stem: string
  options?: string[]
  answer: string
  analysis: string
  knowledgePoint: string
  difficulty: Difficulty
  estimatedMinutes: number
  score: number
  sourceLabel: string
  sourceDetail?: string
  origin: QuestionOrigin
  verifyStatus?: '待校验' | '已校验'
  usageCount?: number
}

export interface WorkbenchDocument {
  id: EntityId
  title: string
  gradeSubject: string
  questions: Question[]
  updatedAt: string
}

export interface HistoryDocumentSummary {
  id: EntityId
  title: string
  gradeSubject: string
  questionCount: number
  updatedAt: string
  status: '草稿' | '已保存' | '已布置'
  origin: 'AI 组题' | '手工组题' | '上传录题'
}

export interface SourceOption {
  type: ResourceType
  title: string
  description: string
  eyebrow: string
}

export interface SourceRecord {
  id: EntityId
  sourceType: ResourceType
  title: string
  meta: string
  questionCount: number
  highlight?: string
  description?: string
  tags?: string[]
  sourceName?: string
  updatedAt?: string
  usageCount?: number
}

export interface RewriteRequest {
  questionId: EntityId
  instruction: '自定义要求' | '整题改编' | '优化题干' | '换生活情境' | '降低难度' | '提高难度' | '同考点换题' | '优化解析'
  prompt?: string
}

export interface WorkbenchRepository {
  listHistory(): Promise<HistoryDocumentSummary[]>
  loadDocument(documentId: EntityId): Promise<WorkbenchDocument>
  loadSource(resourceType: ResourceType): Promise<SourceRecord[]>
  addSource(resourceType: ResourceType, sourceId?: EntityId, count?: number): Promise<Question[]>
  recognizeUpload(): Promise<Question[]>
  personalizeFromUpload(): Promise<Question[]>
  composeFromBank(prompt: string): Promise<Question[]>
  createQuestions(prompt: string): Promise<Question[]>
  createManualQuestion(): Promise<Question>
  rewrite(question: Question, request: RewriteRequest): Promise<Question>
}

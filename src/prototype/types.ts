export type EntityId = string
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'
export type SourceType = 'workbook' | 'paper' | 'list' | 'chapter' | 'recording' | 'generate'
export type Difficulty = '基础' | '中等' | '提升'

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
  sourceLabel: string
}

export interface WorkbenchDocument {
  id: EntityId
  title: string
  gradeSubject: string
  questions: Question[]
  updatedAt: string
}

export interface SourceOption {
  type: SourceType
  title: string
  description: string
  eyebrow: string
}

export interface SourceRecord {
  id: EntityId
  sourceType: SourceType
  title: string
  meta: string
  questionCount: number
  highlight?: string
}

export interface RewriteRequest {
  questionId: EntityId
  instruction: '换生活情境' | '降低难度' | '提高难度' | '同考点换题' | '优化解析'
}

export interface WorkbenchRepository {
  loadRecent(): Promise<WorkbenchDocument>
  loadSource(sourceType: SourceType): Promise<SourceRecord[]>
  addSource(sourceType: SourceType, sourceId?: EntityId): Promise<Question[]>
  generate(prompt: string): Promise<Question[]>
  rewrite(question: Question, request: RewriteRequest): Promise<Question>
}

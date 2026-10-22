import {
  baseQuestions,
  historyDocuments,
  historySummaries,
  sourceRecords,
} from '../data/workbenchData'
import type { Difficulty, Question, ResourceType, WorkbenchRepository } from '../prototype/types'

const delay = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration))

const cloneQuestion = (question: Question, suffix: string): Question => ({
  ...question,
  id: `${question.id}-${suffix}`,
  options: question.options ? [...question.options] : undefined,
})

function getRequestedQuestionPlan(prompt: string) {
  const layered = prompt.match(/基础\s*(\d+)[^\d]+提升\s*(\d+)/)
  if (layered) {
    const basic = Number(layered[1])
    const advanced = Number(layered[2])
    return { count: Math.min(12, Math.max(1, basic + advanced)), basic }
  }
  const requested = Number(prompt.match(/(\d+)\s*道/)?.[1] ?? 3)
  return { count: Math.min(12, Math.max(1, requested)), basic: null }
}

function plannedDifficulty(index: number, fallback: Difficulty, basic: number | null): Difficulty {
  if (basic === null) return fallback
  return index < basic ? '基础' : '提升'
}

export const workbenchRepository: WorkbenchRepository = {
  async listHistory() {
    await delay(280)
    return historySummaries.map((summary) => ({ ...summary }))
  },

  async loadDocument(documentId) {
    await delay(420)
    const document = historyDocuments.find((item) => item.id === documentId)
    if (!document) throw new Error('未找到该历史题单')
    return {
      ...document,
      questions: document.questions.map((question, index) => cloneQuestion(question, `${documentId}-${index}`)),
    }
  },

  async loadSource(resourceType: ResourceType) {
    await delay(260)
    return sourceRecords.filter((record) => record.sourceType === resourceType)
  },

  async addSource(resourceType: ResourceType, sourceId?: string) {
    await delay(520)
    const labelMap: Record<ResourceType, string> = {
      workbook: '53 天天练',
      paper: '一次函数单元达标卷',
      list: '一次函数易错题精选',
      chapter: '章节 / 知识点选题',
    }
    const selectedSource = sourceRecords.find((record) => record.id === sourceId)
    return baseQuestions.slice(0, 2).map((question, index) => ({
      ...cloneQuestion(question, `${resourceType}-${sourceId ?? Date.now()}-${index}`),
      sourceLabel: selectedSource?.title ?? labelMap[resourceType],
      sourceDetail: selectedSource?.meta ?? question.sourceDetail,
      origin: 'question-bank' as const,
      verifyStatus: '已校验' as const,
    }))
  },

  async recognizeUpload() {
    await delay(900)
    return baseQuestions.slice(1, 3).map((question, index) => ({
      ...cloneQuestion(question, `upload-${Date.now()}-${index}`),
      sourceLabel: 'AI 录题 · 教辅扫描件',
      sourceDetail: '八年级数学教辅.pdf · 第 12—13 页',
      origin: 'upload' as const,
      verifyStatus: '待校验' as const,
    }))
  },

  async composeFromBank(prompt: string) {
    await delay(820)
    if (prompt.includes('模拟失败')) throw new Error('题库检索服务暂时不可用，请稍后重试')
    const plan = getRequestedQuestionPlan(prompt)
    return Array.from({ length: plan.count }, (_, index) => {
      const question = baseQuestions[index % baseQuestions.length]
      return {
        ...cloneQuestion(question, `composed-${Date.now()}-${index}`),
        difficulty: plannedDifficulty(index, question.difficulty, plan.basic),
        sourceLabel: question.sourceLabel,
        sourceDetail: `AI 组题命中 · ${question.sourceDetail ?? '飞象题库'}`,
        origin: 'question-bank' as const,
        verifyStatus: '已校验' as const,
      }
    })
  },

  async createQuestions(prompt: string) {
    await delay(960)
    if (prompt.includes('模拟失败')) throw new Error('AI 出题服务暂时不可用，请稍后重试')
    const plan = getRequestedQuestionPlan(prompt)
    return Array.from({ length: plan.count }, (_, index) => {
      const question = baseQuestions[(index + 1) % baseQuestions.length]
      const round = Math.floor(index / baseQuestions.length) + 1
      return {
        ...cloneQuestion(question, `created-${Date.now()}-${index}`),
        stem: index === 0
          ? `根据“${prompt}”原创：${question.stem}`
          : `${question.stem}（AI 原创变式 ${round}）`,
        difficulty: plannedDifficulty(index, question.difficulty, plan.basic),
        sourceLabel: 'AI 原创',
        sourceDetail: '根据教师要求实时生成',
        origin: 'ai-original' as const,
        verifyStatus: '待校验' as const,
        usageCount: 0,
      }
    })
  },

  async createManualQuestion() {
    await delay(280)
    return {
      ...cloneQuestion(baseQuestions[1], `manual-${Date.now()}`),
      stem: '请在此补充手工录入的题目内容。',
      options: undefined,
      answer: '待填写',
      analysis: '待填写',
      sourceLabel: '手工录入',
      sourceDetail: '李老师 · 刚刚创建',
      origin: 'manual',
      verifyStatus: '待校验',
      usageCount: 0,
    }
  },

  async rewrite(question, request) {
    await delay(620)
    const rewritten = cloneQuestion(question, `rewrite-${Date.now()}`)
    rewritten.id = question.id
    rewritten.sourceLabel = 'AI 改编'
    rewritten.sourceDetail = `基于“${question.sourceLabel}”改编`
    rewritten.origin = 'ai-original'
    rewritten.verifyStatus = '待校验'
    if (request.instruction === '换生活情境') {
      rewritten.stem = '某共享单车按骑行时长计费，起步价为 3 元，此后每 10 分钟增加 2 元。请写出费用 y（元）与计费时段 x（个）之间的函数关系式。'
      rewritten.type = '解答题'
      rewritten.knowledgePoint = '一次函数实际应用'
      rewritten.options = undefined
      rewritten.answer = 'y = 2x + 3'
      rewritten.analysis = '起步价为常数项 3；每个计费时段增加 2 元，对应一次项系数 2，因此 y = 2x + 3。'
    }
    if (request.instruction === '降低难度') rewritten.difficulty = '基础'
    if (request.instruction === '提高难度') rewritten.difficulty = '提升'
    if (request.instruction === '同考点换题') {
      rewritten.stem = '已知一次函数 y = -3x + 4，当 x = -1 时，求 y 的值。'
      rewritten.type = '填空题'
      rewritten.options = undefined
      rewritten.answer = '7'
      rewritten.analysis = '将 x = -1 代入 y = -3x + 4，得 y = 7。'
    }
    if (request.instruction === '优化解析') {
      rewritten.analysis = `${question.analysis} 本题关键是先识别已知量，再代入函数关系式，最后检查计算结果与题意是否一致。`
    }
    return rewritten
  },
}

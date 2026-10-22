import { baseQuestions, recentDocument, sourceRecords } from '../data/workbenchData'
import type { Question, SourceType, WorkbenchRepository } from '../prototype/types'

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

export const workbenchRepository: WorkbenchRepository = {
  async loadRecent() {
    await delay(420)
    return {
      ...recentDocument,
      questions: recentDocument.questions.map((question) => cloneQuestion(question, 'recent')),
    }
  },

  async loadSource(sourceType: SourceType) {
    await delay(260)
    return sourceRecords.filter((record) => record.sourceType === sourceType)
  },

  async addSource(sourceType: SourceType, sourceId?: string) {
    await delay(sourceType === 'recording' ? 900 : 520)
    const labelMap: Record<SourceType, string> = {
      workbook: '53 天天练',
      paper: '一次函数单元达标卷',
      list: '一次函数易错题精选',
      chapter: '章节 / 知识点选题',
      recording: 'AI 录题 · 上传文件',
      generate: 'AI 组题',
    }
    const selectedSource = sourceRecords.find((record) => record.id === sourceId)
    return baseQuestions.slice(0, sourceType === 'recording' ? 3 : 2).map((question, index) => ({
      ...cloneQuestion(question, `${sourceType}-${sourceId ?? Date.now()}-${index}`),
      sourceLabel: selectedSource?.title ?? labelMap[sourceType],
    }))
  },

  async generate(prompt: string) {
    await delay(850)
    if (prompt.includes('模拟失败')) throw new Error('AI 服务暂时不可用，请稍后重试')
    const plan = getRequestedQuestionPlan(prompt)
    return Array.from({ length: plan.count }, (_, index) => {
      const question = baseQuestions[index % baseQuestions.length]
      const variantRound = Math.floor(index / baseQuestions.length)
      return {
        ...cloneQuestion(question, `generated-${Date.now()}-${index}`),
        sourceLabel: 'AI 组题',
        difficulty: plan.basic === null ? question.difficulty : index < plan.basic ? '基础' as const : '提升' as const,
        stem: index === 0
          ? `根据“${prompt}”生成：${question.stem}`
          : variantRound > 0
            ? `${question.stem}（同考点变式 ${variantRound + 1}）`
            : question.stem,
      }
    })
  },

  async rewrite(question, request) {
    await delay(620)
    const rewritten = cloneQuestion(question, `rewrite-${Date.now()}`)
    rewritten.id = question.id
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

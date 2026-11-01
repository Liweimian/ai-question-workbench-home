import {
  baseQuestions,
  historyDocuments,
  historySummaries,
  sourceRecords,
} from '../data/workbenchData'
import type { CreateQuestionRequest, Difficulty, DocumentStatus, MyResourceSummary, Question, ResourceType, WorkbenchDocument, WorkbenchRepository } from '../prototype/types'

const delay = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration))
const localDocumentStorageKey = 'feixiang-ai-question-workbench-documents-v1'

interface StoredDocumentEntry {
  document: WorkbenchDocument
  status: DocumentStatus
  assignmentOutdated?: boolean
  savedAtMs?: number
}

function readStoredDocuments(): StoredDocumentEntry[] {
  try {
    const value = window.localStorage.getItem(localDocumentStorageKey)
    if (!value) return []
    const parsed = JSON.parse(value) as StoredDocumentEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function readStoredDocument(documentId: string): WorkbenchDocument | null {
  return readStoredDocuments().find((entry) => entry.document.id === documentId)?.document ?? null
}

export function persistDocumentNow(document: WorkbenchDocument) {
  const existing = readStoredDocuments().find((entry) => entry.document.id === document.id)
  return writeStoredDocument(document, existing?.status ?? '草稿', existing?.assignmentOutdated)
}

function writeStoredDocument(document: WorkbenchDocument, status: DocumentStatus, assignmentOutdated = false) {
  const snapshot = {
    ...document,
    questions: document.questions.map((question) => ({
      ...question,
      options: question.options ? [...question.options] : undefined,
    })),
    updatedAt: '刚刚',
  }
  const entries = [
    { document: snapshot, status, assignmentOutdated, savedAtMs: Date.now() },
    ...readStoredDocuments().filter((entry) => entry.document.id !== snapshot.id),
  ].slice(0, 30)
  window.localStorage.setItem(localDocumentStorageKey, JSON.stringify(entries))
  return snapshot
}

const cloneQuestion = (question: Question, suffix: string): Question => ({
  ...question,
  id: `${question.id}-${suffix}`,
  options: question.options ? [...question.options] : undefined,
})

function createMyResourceQuestion(resource: MyResourceSummary, index: number): Question {
  const variant = index + 1
  const templateIndex = index % 4
  const common = {
    id: `my-resource-${resource.id}-${Date.now()}-${index}`,
    sourceLabel: resource.title,
    sourceDetail: `我的资源 · ${resource.kind} · 第 ${variant} 题`,
    origin: 'question-bank' as const,
    verifyStatus: '已校验' as const,
    usageCount: 0,
  }
  if (templateIndex === 0) {
    const coefficient = 2 + (variant % 4)
    const x = 1 + (variant % 3)
    const intercept = 1 + (variant % 5)
    const answer = coefficient * x - intercept
    return {
      ...common,
      type: '选择题',
      stem: `已知一次函数 y = ${coefficient}x - ${intercept}，当 x = ${x} 时，y 的值是（　　）`,
      options: [`A. ${answer - 1}`, `B. ${answer}`, `C. ${answer + 1}`, `D. ${answer + 2}`],
      answer: 'B',
      analysis: `将 x = ${x} 代入 y = ${coefficient}x - ${intercept}，得 y = ${answer}。`,
      knowledgePoint: '一次函数求值',
      difficulty: '基础',
      estimatedMinutes: 2,
      score: 3,
    }
  }
  if (templateIndex === 1) {
    const x = 2 + (variant % 4)
    const coefficient = 1 + (variant % 5)
    const intercept = 1 + (variant % 3)
    const y = coefficient * x + intercept
    return {
      ...common,
      type: '填空题',
      stem: `若点 A（${x}，${y}）在一次函数 y = kx + ${intercept} 的图象上，则 k = ______。`,
      answer: `${coefficient}`,
      analysis: `代入点 A 的坐标，得 ${y} = ${x}k + ${intercept}，解得 k = ${coefficient}。`,
      knowledgePoint: '待定系数法',
      difficulty: '中等',
      estimatedMinutes: 3,
      score: 4,
    }
  }
  if (templateIndex === 2) {
    const rate = 2 + (variant % 4)
    const start = 5 + (variant % 5)
    return {
      ...common,
      type: '解答题',
      stem: `某服务项目收取 ${start} 元基础费，之后每增加 1 个计费单位加收 ${rate} 元。写出总费用 y（元）与计费单位 x 之间的函数关系式。`,
      answer: `y = ${rate}x + ${start}`,
      analysis: `基础费 ${start} 元是常数项，每单位费用 ${rate} 元是一次项系数，所以 y = ${rate}x + ${start}。`,
      knowledgePoint: '一次函数实际应用',
      difficulty: '中等',
      estimatedMinutes: 5,
      score: 6,
    }
  }
  const slope = 1 + (variant % 5)
  const intercept = 2 + (variant % 6)
  return {
    ...common,
    type: '填空题',
    stem: `一次函数 y = -${slope}x + ${intercept} 的图象从左向右 ______，与 y 轴交于点 ______。`,
    answer: `下降；（0，${intercept}）`,
    analysis: `一次项系数 -${slope} < 0，所以图象下降；令 x = 0，得交点（0，${intercept}）。`,
    knowledgePoint: '一次函数图象与性质',
    difficulty: '基础',
    estimatedMinutes: 3,
    score: 4,
  }
}

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

type GeneratedQuestionContent = Pick<Question, 'type' | 'stem' | 'options' | 'answer' | 'analysis' | 'estimatedMinutes' | 'score'>

function createConceptQuestion(method: CreateQuestionRequest['method'], variant: number): GeneratedQuestionContent {
  const coefficient = 2 + (variant % 3)
  const intercept = 1 + variant
  if (method === '逐知识点出题') {
    return {
      type: '选择题',
      stem: `下列函数中，y 是 x 的一次函数的是（　　）`,
      options: [`A. y = ${coefficient}x + ${intercept}`, 'B. y = x² + 1', 'C. y = 1/x', 'D. y = √x'],
      answer: 'A',
      analysis: `形如 y = kx + b（k ≠ 0）的函数是一次函数。A 中 x 的次数为 1，且系数 ${coefficient} ≠ 0。`,
      estimatedMinutes: 2,
      score: 3,
    }
  }
  if (method === '综合情境出题') {
    return {
      type: '解答题',
      stem: `某共享自习室基础费用为 ${intercept + 4} 元，使用后每小时增加 ${coefficient} 元。设使用 x 小时的总费用为 y 元，写出 y 与 x 的关系式，并说明它是否为一次函数。`,
      answer: `y = ${coefficient}x + ${intercept + 4}，是一次函数。`,
      analysis: `基础费用是常数项 ${intercept + 4}，每小时增加 ${coefficient} 元是一次项系数，因此 y = ${coefficient}x + ${intercept + 4}；${coefficient} ≠ 0，故为一次函数。`,
      estimatedMinutes: 4,
      score: 5,
    }
  }
  const parameter = 1 + variant
  return {
    type: '填空题',
    stem: `若函数 y = (m - ${parameter})x + ${intercept} 是一次函数，则 m 应满足 ______。`,
    answer: `m ≠ ${parameter}`,
    analysis: `一次函数中 x 的系数不能为 0，因此 m - ${parameter} ≠ 0，即 m ≠ ${parameter}。`,
    estimatedMinutes: 3,
    score: 4,
  }
}

function createGraphQuestion(method: CreateQuestionRequest['method'], variant: number): GeneratedQuestionContent {
  const slope = 2 + (variant % 3)
  const intercept = 2 + variant
  if (method === '逐知识点出题') {
    return {
      type: '填空题',
      stem: `一次函数 y = -${slope}x + ${intercept} 的图象从左向右 ______（填“上升”或“下降”），与 y 轴的交点坐标为 ______。`,
      answer: `下降；（0，${intercept}）`,
      analysis: `一次项系数 -${slope} < 0，所以 y 随 x 增大而减小；令 x = 0，得 y = ${intercept}。`,
      estimatedMinutes: 3,
      score: 4,
    }
  }
  if (method === '综合情境出题') {
    const start = 18 + variant
    return {
      type: '解答题',
      stem: `冷却实验中，物体温度 T（℃）与时间 t（分钟）满足 T = ${start} - ${slope}t（0 ≤ t ≤ 5）。说明温度随时间怎样变化，并求图象与 T 轴的交点。`,
      answer: `温度随时间增大而降低；交点为（0，${start}）。`,
      analysis: `函数的一次项系数 -${slope} < 0，图象从左向右下降；t = 0 时 T = ${start}，故与 T 轴交于（0，${start}）。`,
      estimatedMinutes: 4,
      score: 5,
    }
  }
  const x = 2
  const y = slope * x + intercept
  return {
    type: '解答题',
    stem: `一次函数图象经过点 A（0，${intercept}）和 B（${x}，${y}）。求函数解析式，并判断 y 随 x 增大如何变化。`,
    answer: `y = ${slope}x + ${intercept}；y 随 x 增大而增大。`,
    analysis: `由 A 点得 b = ${intercept}；再把 B 点代入，${y} = ${x}k + ${intercept}，解得 k = ${slope}。因为 k > 0，所以 y 随 x 增大而增大。`,
    estimatedMinutes: 5,
    score: 6,
  }
}

function createApplicationQuestion(method: CreateQuestionRequest['method'], variant: number): GeneratedQuestionContent {
  const unitPrice = 2 + (variant % 3)
  const basePrice = 5 + variant
  if (method === '逐知识点出题') {
    const x1 = 3
    const x2 = 7
    const y1 = unitPrice * x1 + basePrice
    const y2 = unitPrice * x2 + basePrice
    return {
      type: '解答题',
      stem: `某项服务费用 y（元）与使用量 x（单位）成一次函数关系。使用 ${x1} 个单位收费 ${y1} 元，使用 ${x2} 个单位收费 ${y2} 元，求 y 与 x 的函数关系式。`,
      answer: `y = ${unitPrice}x + ${basePrice}`,
      analysis: `设 y = kx + b，将两组数据代入，得 ${x1}k + b = ${y1}，${x2}k + b = ${y2}，解得 k = ${unitPrice}，b = ${basePrice}。`,
      estimatedMinutes: 6,
      score: 7,
    }
  }
  if (method === '综合情境出题') {
    const daily = 4 + variant
    const start = 20 + variant * 2
    const target = start + daily * 8
    return {
      type: '解答题',
      stem: `小明已有 ${start} 元，此后每天存 ${daily} 元。设经过 x 天后的存款为 y 元。（1）写出 y 与 x 的函数关系式；（2）至少经过多少天，存款能达到 ${target} 元？`,
      answer: `（1）y = ${daily}x + ${start}；（2）8 天。`,
      analysis: `初始存款是常数项 ${start}，每天增加 ${daily} 元，所以 y = ${daily}x + ${start}。令 y ≥ ${target}，得 x ≥ 8。`,
      estimatedMinutes: 6,
      score: 7,
    }
  }
  const planA = unitPrice + 1
  const planB = unitPrice
  const fixed = 8 + variant
  const breakEven = fixed
  return {
    type: '解答题',
    stem: `打印店有两种收费方案：A 方案每页 ${planA} 角；B 方案先收 ${fixed} 角服务费，再按每页 ${planB} 角收费。分别写出费用 y（角）与页数 x 的关系式，并求两种方案费用相同时的页数。`,
    answer: `A：y = ${planA}x；B：y = ${planB}x + ${fixed}；${breakEven} 页时费用相同。`,
    analysis: `令 ${planA}x = ${planB}x + ${fixed}，因为两种方案每页价差为 1 角，解得 x = ${breakEven}。`,
    estimatedMinutes: 7,
    score: 8,
  }
}

function adaptGeneratedDifficulty(
  content: GeneratedQuestionContent,
  difficulty: Difficulty,
  knowledgePoint: string,
): GeneratedQuestionContent {
  if (difficulty === '基础') return content
  if (difficulty === '中等') {
    return {
      ...content,
      stem: `${content.stem} 请写出关键判断或计算依据。`,
      analysis: `${content.analysis} 作答时需保留关键判断或计算步骤。`,
      estimatedMinutes: content.estimatedMinutes + 1,
      score: content.score + 1,
    }
  }
  const conditionHint = knowledgePoint.includes('概念')
    ? '需注意一次项系数不为 0，并明确变量的取值范围。'
    : knowledgePoint.includes('图象') || knowledgePoint.includes('性质')
      ? '需说明增减性由一次项系数的符号决定，并核对截距或关键点。'
      : '需检验自变量取值符合实际情境，且计算结果具有实际意义。'
  return {
    ...content,
    stem: `${content.stem} 完成后，再指出一个容易忽略的限制条件并说明理由。`,
    answer: `${content.answer}；限制条件需结合题意说明。`,
    analysis: `${content.analysis} ${conditionHint}`,
    estimatedMinutes: content.estimatedMinutes + 2,
    score: content.score + 2,
  }
}

function createGeneratedContent(
  knowledgePoint: string,
  method: CreateQuestionRequest['method'],
  difficulty: Difficulty,
  variant: number,
): GeneratedQuestionContent {
  let content: GeneratedQuestionContent
  if (knowledgePoint.includes('概念')) content = createConceptQuestion(method, variant)
  else if (knowledgePoint.includes('图象') || knowledgePoint.includes('性质')) content = createGraphQuestion(method, variant)
  else if (knowledgePoint.includes('应用')) content = createApplicationQuestion(method, variant)
  else content = {
    type: '解答题',
    stem: `围绕“${knowledgePoint}”完成一道知识梳理题，并写出关键步骤。`,
    answer: '答案应包含结论与完整推导过程。',
    analysis: `本题用于检测“${knowledgePoint}”的概念理解与方法表达。`,
    estimatedMinutes: 5,
    score: 6,
  }
  return adaptGeneratedDifficulty(content, difficulty, knowledgePoint)
}

export const workbenchRepository: WorkbenchRepository = {
  async listHistory() {
    await delay(280)
    const stored = readStoredDocuments()
    const storedIds = new Set(stored.map((entry) => entry.document.id))
    return [
      ...stored.map(({ document, status, assignmentOutdated, savedAtMs }) => ({
        id: document.id,
        title: document.title,
        gradeSubject: document.gradeSubject,
        questionCount: document.questions.length,
        updatedAt: document.updatedAt,
        savedAtMs: savedAtMs ?? Date.now(),
        estimatedMinutes: Math.max(document.questions.length * 3, 6),
        status,
        assignmentOutdated,
        origin: '手工组题' as const,
      })),
      ...historySummaries.filter((summary) => !storedIds.has(summary.id)).map((summary) => ({ ...summary })),
    ]
  },

  async loadDocument(documentId) {
    await delay(420)
    const document = readStoredDocuments().find((entry) => entry.document.id === documentId)?.document
      ?? historyDocuments.find((item) => item.id === documentId)
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

  async addSource(resourceType: ResourceType, sourceId?: string, count = 2, selectedQuestions?: Question[]) {
    await delay(520)
    const labelMap: Record<ResourceType, string> = {
      workbook: '53 天天练',
      paper: '一次函数单元达标卷',
      sync: '一次函数同步题单',
      special: '一次函数思维进阶专题',
    }
    const selectedSource = sourceRecords.find((record) => record.id === sourceId)
    const requestedQuestions = selectedQuestions?.length
      ? selectedQuestions
      : Array.from({ length: Math.min(12, Math.max(1, count)) }, (_, index) => baseQuestions[index % baseQuestions.length])
    return requestedQuestions.map((question, index) => {
      return ({
      ...cloneQuestion(question, `${resourceType}-${sourceId ?? 'selection'}-${Date.now()}-${index}`),
      sourceLabel: selectedSource?.title ?? labelMap[resourceType],
      sourceDetail: selectedSource?.meta ?? question.sourceDetail,
      origin: 'question-bank' as const,
      verifyStatus: '已校验' as const,
      })
    })
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

  async personalizeFromUpload() {
    await delay(980)
    return baseQuestions.slice(0, 3).map((question, index) => ({
      ...cloneQuestion(question, `personalized-${Date.now()}-${index}`),
      stem: `${question.stem}（结合上传材料生成的个性化变式）`,
      sourceLabel: 'AI 个性化练习',
      sourceDetail: '基于学情材料与教师上传文件生成',
      origin: 'ai-original' as const,
      verifyStatus: '待校验' as const,
      usageCount: 0,
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
        sourceDetail: `AI 助手匹配 · ${question.sourceDetail ?? '飞象题库'}`,
        origin: 'question-bank' as const,
        verifyStatus: '已校验' as const,
      }
    })
  },

  async createQuestions(request) {
    await delay(960)
    const plannedQuestions = request.allocations
      .filter((item) => item.count > 0)
      .flatMap((item) => Array.from({ length: item.count }, (_, allocationIndex) => ({
        knowledgePoint: item.knowledgePoint,
        allocationIndex,
      })))
      .slice(0, 12)
    if (plannedQuestions.length === 0) throw new Error('请至少为一个知识点设置题量')
    return plannedQuestions.map(({ knowledgePoint, allocationIndex }, index) => {
      const content = createGeneratedContent(knowledgePoint, request.method, request.difficulty, allocationIndex)
      return {
        id: `created-${Date.now()}-${index}`,
        ...content,
        knowledgePoint,
        difficulty: request.difficulty,
        sourceLabel: 'AI 原创',
        sourceDetail: `${request.textbook} · ${request.chapter} · ${request.method}`,
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
    if (request.instruction === '自定义要求') {
      rewritten.stem = `${question.stem}（已按要求调整：${request.prompt ?? '优化表述'}）`
      rewritten.analysis = `${question.analysis} 本题已按教师输入的要求生成修改预览。`
    }
    if (request.instruction === '整题改编') {
      rewritten.stem = question.stem.replace('当', '若').replace('是', '为')
      rewritten.analysis = `${question.analysis} 已同步校对题干、选项与解析的表述，保持原考点不变。`
    }
    if (request.instruction === '优化题干') {
      rewritten.stem = question.stem.replace('当', '若').replace('求', '请求')
    }
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

  async saveDocument(document, status, assignmentOutdated = false) {
    await delay(460)
    const savedDocument = writeStoredDocument(document, status, assignmentOutdated)
    return {
      document: savedDocument,
      status,
      assignmentOutdated,
      savedAt: '刚刚',
    }
  },

  async assignDocument(document) {
    await delay(620)
    const savedDocument = writeStoredDocument(document, '已布置', false)
    return {
      document: savedDocument,
      status: '已布置',
      assignmentOutdated: false,
      savedAt: '刚刚',
    }
  },

  async addMyResource(resource) {
    await delay(520)
    const count = Math.min(36, Math.max(1, resource.questionCount ?? 2))
    return Array.from({ length: count }, (_, index) => createMyResourceQuestion(resource, index))
  },
}

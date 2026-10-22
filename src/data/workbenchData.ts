import type {
  HistoryDocumentSummary,
  Question,
  SourceOption,
  SourceRecord,
  WorkbenchDocument,
} from '../prototype/types'

export const sourceOptions: SourceOption[] = [
  { type: 'workbook', title: '练习册', description: '按章节或页码加入', eyebrow: '已有资源' },
  { type: 'paper', title: '试卷', description: '整卷或挑题加入', eyebrow: '已有资源' },
  { type: 'list', title: '题单', description: '复用并继续编辑', eyebrow: '已有资源' },
  { type: 'chapter', title: '章节 / 知识点', description: '按教学目标选题', eyebrow: '题库检索' },
]

export const sourceRecords: SourceRecord[] = [
  { id: 'paper-1', sourceType: 'paper', title: '八年级上册期中质量检测', meta: '人教版 · 25 题 · 90 分钟', questionCount: 25, highlight: '本校使用 8 次' },
  { id: 'paper-2', sourceType: 'paper', title: '一次函数单元达标卷', meta: '人教版 · 18 题 · 60 分钟', questionCount: 18, highlight: '含本校学情' },
  { id: 'workbook-1', sourceType: 'workbook', title: '53 天天练 · 八年级上册', meta: '第四章 一次函数 · 6 个练习', questionCount: 42, highlight: '同步教材' },
  { id: 'workbook-2', sourceType: 'workbook', title: '校本分层作业 · 一次函数', meta: '基础 / 巩固 / 提升', questionCount: 30, highlight: '学校委托生产' },
  { id: 'list-1', sourceType: 'list', title: '一次函数易错题精选', meta: '李老师创建 · 12 题', questionCount: 12, highlight: '最近使用' },
  { id: 'list-2', sourceType: 'list', title: '期中复习核心题单', meta: '数学备课组 · 16 题', questionCount: 16, highlight: '备课组共享' },
  { id: 'chapter-1', sourceType: 'chapter', title: '一次函数的图象与性质', meta: '八年级上册 · 第 4 章', questionCount: 126, highlight: '3 个知识点' },
  { id: 'chapter-2', sourceType: 'chapter', title: '函数与方程', meta: '八年级上册 · 第 4 章', questionCount: 84, highlight: '2 个知识点' },
]

export const baseQuestions: Question[] = [
  {
    id: 'q-101',
    type: '选择题',
    stem: '已知一次函数 y = 2x - 3，当 x = 2 时，y 的值是（　　）',
    options: ['A. -1', 'B. 1', 'C. 2', 'D. 3'],
    answer: 'B',
    analysis: '将 x = 2 代入 y = 2x - 3，得 y = 1。',
    knowledgePoint: '一次函数求值',
    difficulty: '基础',
    estimatedMinutes: 2,
    score: 3,
    sourceLabel: '一次函数单元达标卷',
    sourceDetail: '2025—2026 学年八年级上册期中质量检测',
    origin: 'question-bank',
    verifyStatus: '已校验',
    usageCount: 126,
  },
  {
    id: 'q-102',
    type: '填空题',
    stem: '若点 A（2，5）在一次函数 y = kx + 1 的图象上，则 k = ______。',
    answer: '2',
    analysis: '把点 A 的坐标代入函数关系式，5 = 2k + 1，解得 k = 2。',
    knowledgePoint: '待定系数法',
    difficulty: '中等',
    estimatedMinutes: 3,
    score: 4,
    sourceLabel: '一次函数易错题精选',
    sourceDetail: '八年级数学备课组 · 高频易错题',
    origin: 'question-bank',
    verifyStatus: '已校验',
    usageCount: 89,
  },
  {
    id: 'q-103',
    type: '解答题',
    stem: '某出租车的收费由起步价和里程费两部分组成。行驶 3 千米收费 11 元，行驶 8 千米收费 21 元。求车费 y（元）与行驶里程 x（千米）之间的一次函数关系式。',
    answer: 'y = 2x + 5',
    analysis: '设 y = kx + b，根据两组数据列方程组，解得 k = 2，b = 5。',
    knowledgePoint: '一次函数实际应用',
    difficulty: '提升',
    estimatedMinutes: 8,
    score: 8,
    sourceLabel: '校本分层作业',
    sourceDetail: '第四章 · 一次函数综合应用',
    origin: 'question-bank',
    verifyStatus: '已校验',
    usageCount: 54,
  },
  {
    id: 'q-104',
    type: '解答题',
    stem: '某公益义卖活动销售帆布袋、冰箱贴和徽章。已知帆布袋单价 20 元、冰箱贴单价 15 元、徽章单价 8 元。丁售出 12 个帆布袋，总销售额 443 元，且徽章数量比冰箱贴数量的 3 倍多 1 个。求丁售出冰箱贴和徽章各多少个。',
    answer: '冰箱贴 5 个，徽章 16 个。',
    analysis: '设售出 x 个冰箱贴，则徽章为（3x+1）个。列方程 12×20+15x+8（3x+1）=443，解得 x=5，因此徽章为 16 个。',
    knowledgePoint: '一元一次方程实际应用',
    difficulty: '中等',
    estimatedMinutes: 6,
    score: 6,
    sourceLabel: '七年级上全部作业本',
    sourceDetail: '26—27 学年 · 应用题专题',
    origin: 'question-bank',
    verifyStatus: '已校验',
    usageCount: 73,
  },
]

export const recentDocument: WorkbenchDocument = {
  id: 'doc-recent',
  title: '一次函数 · 随堂练习',
  gradeSubject: '初中数学 · 八年级上册 · 人教版',
  questions: baseQuestions,
  updatedAt: '今天 09:26',
}

export const historyDocuments: WorkbenchDocument[] = [
  recentDocument,
  {
    id: 'doc-layered',
    title: '一次函数分层作业',
    gradeSubject: '初中数学 · 八年级上册 · 人教版',
    questions: [baseQuestions[0], baseQuestions[1], baseQuestions[2]],
    updatedAt: '昨天 18:40',
  },
  {
    id: 'doc-midterm',
    title: '期中复习 · 函数与方程',
    gradeSubject: '初中数学 · 八年级上册 · 人教版',
    questions: [baseQuestions[1], baseQuestions[2], baseQuestions[3]],
    updatedAt: '10 月 20 日',
  },
  {
    id: 'doc-upload',
    title: '教辅扫描题 · 待校对',
    gradeSubject: '初中数学 · 七年级上册 · 人教版',
    questions: [baseQuestions[3], baseQuestions[1]],
    updatedAt: '10 月 18 日',
  },
]

export const historySummaries: HistoryDocumentSummary[] = [
  { id: 'doc-recent', title: '一次函数 · 随堂练习', gradeSubject: '八年级数学 · 人教版', questionCount: 4, updatedAt: '今天 09:26', status: '草稿', origin: '手工组题' },
  { id: 'doc-layered', title: '一次函数分层作业', gradeSubject: '八年级数学 · 人教版', questionCount: 3, updatedAt: '昨天 18:40', status: '已保存', origin: 'AI 组题' },
  { id: 'doc-midterm', title: '期中复习 · 函数与方程', gradeSubject: '八年级数学 · 人教版', questionCount: 3, updatedAt: '10 月 20 日', status: '已布置', origin: 'AI 组题' },
  { id: 'doc-upload', title: '教辅扫描题 · 待校对', gradeSubject: '七年级数学 · 人教版', questionCount: 2, updatedAt: '10 月 18 日', status: '草稿', origin: '上传录题' },
]

import type { Question, SourceOption, SourceRecord, WorkbenchDocument } from '../prototype/types'

export const sourceOptions: SourceOption[] = [
  { type: 'workbook', title: '练习册', description: '按章节或页码加入', eyebrow: '已有资源' },
  { type: 'paper', title: '试卷', description: '整卷或挑题加入', eyebrow: '已有资源' },
  { type: 'list', title: '题单', description: '复用并继续编辑', eyebrow: '已有资源' },
  { type: 'chapter', title: '章节 / 知识点', description: '按教学目标选题', eyebrow: '题库检索' },
  { type: 'recording', title: 'AI 录题', description: '上传文件自动拆题', eyebrow: '本地材料' },
  { type: 'generate', title: 'AI 组题', description: '描述需求直接生成', eyebrow: '智能生成' },
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
    sourceLabel: '一次函数单元达标卷',
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
    sourceLabel: '一次函数易错题精选',
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
    sourceLabel: '校本分层作业',
  },
]

export const recentDocument: WorkbenchDocument = {
  id: 'doc-recent',
  title: '八年级数学 · 一次函数随堂练习',
  gradeSubject: '初中数学 · 八年级上册 · 人教版',
  questions: baseQuestions,
  updatedAt: '今天 09:26',
}

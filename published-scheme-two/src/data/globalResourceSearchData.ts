import type { LibraryInitialView, Question, ResourceType, SourceRecord } from '../prototype/types'
import { baseQuestions, sourceRecords } from './workbenchData'

export type GlobalSearchGroupType = 'question' | ResourceType

export interface GlobalSearchNavigationTarget {
  mode: 'resource' | 'school'
  view: LibraryInitialView
  resourceId?: string
  questionId?: string
  anchorLabel?: string
  anchorType?: 'chapter' | 'knowledgePoint' | 'topic' | 'content'
  keyword?: string
  subject?: string
  grade?: string
  textbook?: string
  questionType?: string
  difficulty?: string
}

export interface GlobalResourceSearchIndexItem {
  id: string
  groupType: GlobalSearchGroupType
  title: string
  meta: string
  sourceLabel: string
  questionCount?: number
  tags: string[]
  sections: string[]
  knowledgePoints: string[]
  subject: string
  grade?: string
  volume?: string
  textbook?: string
  searchText: string
  popularity: number
  matchCounts?: Record<string, number>
  target: GlobalSearchNavigationTarget
  sourceRecord?: SourceRecord
  question?: Question
}

export const globalResourceSearchGroupOrder: GlobalSearchGroupType[] = [
  'question',
  'workbook',
  'sync',
  'special',
  'paper',
]

export const globalResourceSearchGroupLabels: Record<GlobalSearchGroupType, string> = {
  question: '单题',
  workbook: '练习册',
  sync: '同步练习',
  special: '专项练习',
  paper: '试卷',
}

export const globalResourceSearchExamples = [
  '八年级上册一次函数同步练习',
  '一次函数专项练习',
  '八年级一次函数试卷',
  '找一道一次函数基础选择题',
] as const

const resourceSections: Record<string, string[]> = {
  'workbook-1': ['第四章 一次函数', '4.1 函数', '4.2 一次函数与正比例函数', '4.3 一次函数的图象', '4.4 一次函数的应用', '第五章 整式乘法与因式分解'],
  'workbook-2': ['第四章 一次函数', '第五章 二元一次方程组'],
  'workbook-3': ['第十二章 三角形', '第四章 一次函数'],
  'workbook-4': ['第四章 一次函数', '第十六章 二次根式'],
  'workbook-5': ['第四章 一次函数', '第五章 二元一次方程组'],
  'workbook-6': ['第十三章 轴对称', '第四章 一次函数'],
  'sync-1': ['第四章 一次函数·函数、图象与表达式'],
  'sync-2': ['第四章 一次函数·图象与性质'],
  'sync-3': ['第四章 一次函数·待定系数法'],
  'sync-4': ['第四章 一次函数·实际应用'],
  'sync-5': ['第四章 一次函数·章末复习'],
  'sync-6': ['第五章 二元一次方程组'],
  'special-1': ['一次函数思维进阶专题'],
  'special-2': ['函数选择题高频考法'],
  'special-3': ['一次函数实际应用专项'],
  'special-4': ['一次函数易错专项'],
  'special-5': ['坐标系中的面积问题专项'],
  'special-6': ['一次函数计算专练'],
}

const resourceKnowledgePoints: Record<string, string[]> = {
  'paper-1': ['一次函数', '二元一次方程组', '轴对称'],
  'paper-2': ['一次函数', '因式分解', '三角形'],
  'paper-3': ['一次函数', '待定系数法'],
  'paper-4': ['一次函数', '二元一次方程组', '二次根式'],
  'paper-5': ['一次函数', '一次函数图象与性质'],
  'paper-6': ['一次函数', '二次函数', '几何综合'],
}

const paperMatchCounts: Record<string, Record<string, number>> = {
  'paper-1': { '一次函数': 6, '二元一次方程组': 3 },
  'paper-2': { '一次函数': 5, '因式分解': 4 },
  'paper-3': { '一次函数': 7, '待定系数法': 3 },
  'paper-4': { '一次函数': 6, '二元一次方程组': 4, '二次根式': 3 },
  'paper-5': { '一次函数': 8, '一次函数图象与性质': 4 },
  'paper-6': { '一次函数': 3, '二次函数': 5 },
}

const resourceView: Record<ResourceType, LibraryInitialView> = {
  workbook: 'workbook',
  paper: 'paper',
  sync: 'sync',
  special: 'special',
}

const gradeAlias: Record<string, string> = {
  '初一': '七年级',
  '初二': '八年级',
  '初三': '九年级',
  '高一': '高一',
  '高二': '高二',
  '高三': '高三',
}

const gradeTextPattern = /(?:[一二三四五六七八九]年级|初[一二三]|高[一二三]|小[一二三四五六])/
const textbookTextPattern = /(?:人教版|北京课改版|北京版|北师大版|苏教版)/

function normalizeGrade(value?: string) {
  if (!value) return undefined
  return gradeAlias[value] ?? value
}

function deriveAcademicMetadata(searchableText: string, fallbackGrade = '八年级') {
  const rawGrade = searchableText.match(gradeTextPattern)?.[0]
  return {
    subject: '初中数学',
    grade: normalizeGrade(rawGrade) ?? fallbackGrade,
    volume: searchableText.match(/(?:上册|下册)/)?.[0],
    textbook: searchableText.match(textbookTextPattern)?.[0],
  }
}

function compact(parts: Array<string | undefined>) {
  return parts.filter((part): part is string => Boolean(part?.trim())).join(' ')
}

function deriveResourceKnowledgePoints(record: SourceRecord, sections: string[]) {
  const explicit = resourceKnowledgePoints[record.id]
  if (explicit) return explicit
  const candidates = [
    '一次函数图象与性质',
    '一次函数实际应用',
    '待定系数法',
    '一次函数',
    '二元一次方程组',
    '二次根式',
    '轴对称',
  ]
  const haystack = compact([record.title, record.meta, record.description, ...sections])
  return candidates.filter((candidate) => haystack.includes(candidate))
}

function resourceToIndexItem(record: SourceRecord): GlobalResourceSearchIndexItem {
  const sections = resourceSections[record.id] ?? []
  const knowledgePoints = deriveResourceKnowledgePoints(record, sections)
  const tags = [record.highlight, ...(record.tags ?? [])].filter((tag): tag is string => Boolean(tag))
  const anchorLabel = sections[0] ?? knowledgePoints[0] ?? record.highlight
  const meta = compact([record.meta, record.sourceName])
  const academic = deriveAcademicMetadata(compact([record.title, record.meta]), record.id === 'paper-6' ? '九年级' : '八年级')

  return {
    id: `resource:${record.id}`,
    groupType: record.sourceType,
    title: record.title,
    meta,
    sourceLabel: '飞象题库',
    questionCount: record.questionCount,
    tags,
    sections,
    knowledgePoints,
    ...academic,
    searchText: compact([
      record.title,
      record.meta,
      record.description,
      record.sourceName,
      record.highlight,
      ...(record.tags ?? []),
      ...sections,
      ...knowledgePoints,
      academic.subject,
      academic.grade,
      academic.volume,
      academic.textbook,
      globalResourceSearchGroupLabels[record.sourceType],
    ]).toLowerCase(),
    popularity: record.usageCount ?? 0,
    matchCounts: paperMatchCounts[record.id],
    target: {
      mode: 'resource',
      view: resourceView[record.sourceType],
      resourceId: record.id,
      anchorLabel,
      anchorType: record.sourceType === 'special'
        ? 'topic'
        : record.sourceType === 'paper'
          ? 'content'
          : 'chapter',
    },
    sourceRecord: record,
  }
}

function questionToIndexItem(question: Question): GlobalResourceSearchIndexItem {
  const sourceMeta = compact([question.type, question.difficulty, question.sourceLabel, question.sourceDetail])
  const academic = deriveAcademicMetadata(sourceMeta, question.id === 'q-104' ? '七年级' : '八年级')
  return {
    id: `question:${question.id}`,
    groupType: 'question',
    title: question.stem,
    meta: sourceMeta,
    sourceLabel: '飞象题库',
    questionCount: 1,
    tags: [question.type, question.difficulty],
    sections: question.sourceDetail ? [question.sourceDetail] : [],
    knowledgePoints: [question.knowledgePoint],
    ...academic,
    searchText: compact([
      question.stem,
      ...(question.options ?? []),
      question.type,
      question.difficulty,
      question.knowledgePoint,
      question.sourceLabel,
      question.sourceDetail,
      academic.subject,
      academic.grade,
      academic.volume,
      academic.textbook,
    ]).toLowerCase(),
    popularity: question.usageCount ?? 0,
    target: {
      mode: 'resource',
      view: 'chapter',
      questionId: question.id,
      anchorLabel: question.knowledgePoint,
      anchorType: 'knowledgePoint',
    },
    question,
  }
}

export const globalResourceSearchIndex: GlobalResourceSearchIndexItem[] = [
  ...baseQuestions.map(questionToIndexItem),
  ...sourceRecords.map(resourceToIndexItem),
]

export const globalResourceSearchKnownTopics = Array.from(new Set(
  globalResourceSearchIndex.flatMap((item) => [
    ...item.knowledgePoints,
    ...item.sections.flatMap((section) => section.split(/[·・/]/g).map((part) => part.replace(/^第[^章]*章\s*/, '').trim())),
  ]).filter(Boolean),
)).sort((left, right) => right.length - left.length)

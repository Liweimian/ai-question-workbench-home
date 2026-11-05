import {
  globalResourceSearchGroupLabels,
  globalResourceSearchGroupOrder,
  globalResourceSearchIndex,
  globalResourceSearchKnownTopics,
} from '../data/globalResourceSearchData'
import type {
  GlobalResourceSearchIndexItem,
  GlobalSearchGroupType,
  GlobalSearchNavigationTarget,
} from '../data/globalResourceSearchData'
import type { Question } from '../prototype/types'

export type { GlobalSearchGroupType, GlobalSearchNavigationTarget } from '../data/globalResourceSearchData'

export type GlobalSearchIntent = 'resource' | 'question' | 'compose'
export type GlobalSearchSimulation = 'success' | 'empty' | 'error'
export type GlobalSearchRequestStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ParsedGlobalSearchCondition {
  id: string
  label: string
  source: 'query' | 'context'
  sourceText?: string
  removable: boolean
}

export interface ParsedGlobalResourceSearchQuery {
  rawQuery: string
  normalizedQuery: string
  intent: GlobalSearchIntent
  subject?: string
  grade?: string
  volume?: string
  textbook?: string
  topic?: string
  questionType?: string
  difficulty?: string
  resourceTypes: GlobalSearchGroupType[]
  strictResourceTypes: boolean
  searchTerms: string[]
  conditions: ParsedGlobalSearchCondition[]
}

export interface GlobalResourceSearchHit {
  id: string
  groupType: GlobalSearchGroupType
  title: string
  meta: string
  sourceLabel: string
  questionCount?: number
  question?: Question
  matchedLabel: string
  matchedSections?: string[]
  actionLabel: string
  target: GlobalSearchNavigationTarget
  score: number
}

export interface GlobalResourceSearchGroup {
  type: GlobalSearchGroupType
  label: string
  total: number
  items: GlobalResourceSearchHit[]
}

export interface GlobalResourceSearchResult {
  query: string
  parsed: ParsedGlobalResourceSearchQuery
  groups: GlobalResourceSearchGroup[]
  total: number
  matchedTypeCount: number
  searchedAt: number
}

export interface GlobalResourceSearchRequest {
  query: string
  currentScope?: string
  signal?: AbortSignal
  latencyMs?: number
  simulate?: GlobalSearchSimulation
  intentOverride?: Exclude<GlobalSearchIntent, 'compose'>
}

export interface GlobalResourceSearchRepository {
  parse(query: string, currentScope?: string, intentOverride?: Exclude<GlobalSearchIntent, 'compose'>): ParsedGlobalResourceSearchQuery
  search(request: GlobalResourceSearchRequest): Promise<GlobalResourceSearchResult>
}

export type GlobalResourceSearchErrorCode = 'INVALID_QUERY' | 'REQUEST_FAILED' | 'ABORTED'

export class GlobalResourceSearchError extends Error {
  readonly code: GlobalResourceSearchErrorCode

  constructor(code: GlobalResourceSearchErrorCode, message: string) {
    super(message)
    this.name = 'GlobalResourceSearchError'
    this.code = code
  }
}

const resourceTypePatterns: Array<{
  type: Exclude<GlobalSearchGroupType, 'question'>
  pattern: RegExp
}> = [
  { type: 'workbook', pattern: /(?:练习册|作业本|教辅)/ },
  { type: 'sync', pattern: /(?:同步练习|同步题|课时练习)/ },
  { type: 'special', pattern: /(?:专项练习|专题练习|专练|专项|专题)/ },
  { type: 'paper', pattern: /(?:试卷|卷子|模拟卷|月考|期中|期末|中考|单元测试)/ },
]

const subjectCandidates = [
  '小学数学',
  '初中数学',
  '高中数学',
  '小学语文',
  '初中语文',
  '高中语文',
  '小学英语',
  '初中英语',
  '高中英语',
]

const gradePattern = /(?:[一二三四五六七八九]年级|初[一二三]|高[一二三]|小[一二三四五六])(?:上册|下册|上|下)?/
const textbookPattern = /(?:人教版|北京课改版|北京版|北师大版|苏教版)/
const questionTypePattern = /(?:选择题|填空题|解答题|计算题|应用题)/
const difficultyPattern = /(?:基础|中等|提升|较难|困难)/
const composePattern = /(?:(?:组|生成|编|出)(?:一|1)?(?:份|套|张)?[^，。，。]{0,12}(?:题单|作业|练习卷|试卷|卷子)|(?:AI\s*)?组题|组卷)/i
const genericExercisePattern = /(?:章节练习|课时练习|单元练习|练习资源|(?:章节|课时|单元)?作业|练习)/
const questionIntentPattern = /(?:单题|题目|找题|搜题|一道|一题|\d+道|选择题|填空题|解答题|计算题|应用题)/

function normalizeQuery(query: string) {
  return query.trim().replace(/\s+/g, ' ')
}

function compactSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, '')
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values))
}

function firstIncludedCandidate(value: string, candidates: string[]) {
  return candidates.find((candidate) => value.includes(candidate))
}

function matchText(value: string, pattern: RegExp) {
  return value.match(pattern)?.[0]
}

function normalizeGrade(value?: string) {
  if (!value) return undefined
  const gradeOnly = value.replace(/(?:上册|下册|上|下)$/, '')
  const aliases: Record<string, string> = {
    '初一': '七年级',
    '初二': '八年级',
    '初三': '九年级',
  }
  return aliases[gradeOnly] ?? gradeOnly
}

function extractVolume(value?: string) {
  if (!value) return undefined
  if (value.endsWith('上册') || value.endsWith('上')) return '上册'
  if (value.endsWith('下册') || value.endsWith('下')) return '下册'
  return undefined
}

function supportsMockScope(currentScope?: string) {
  return !currentScope || currentScope.includes('初中数学')
}

function condition(
  id: string,
  label: string | undefined,
  source: ParsedGlobalSearchCondition['source'],
  sourceText?: string,
): ParsedGlobalSearchCondition | null {
  if (!label) return null
  return {
    id,
    label,
    source,
    sourceText,
    removable: source === 'query' && Boolean(sourceText),
  }
}

function findTopic(query: string) {
  return globalResourceSearchKnownTopics.find((topic) => query.includes(topic))
}

function deriveSearchTerms(
  query: string,
  removableParts: Array<string | undefined>,
) {
  let residual = query.toLowerCase()
  for (const part of removableParts) {
    if (part) residual = residual.split(part.toLowerCase()).join(' ')
  }
  residual = residual
    .replace(/(?:帮我|请|我想|想要|需要|给我|找一下|搜一下|查一下|查找|搜索|检索|查看|找|搜|有没有|相关的|相关|一些|几个|(?:组|生成|编|出)(?:一|1)?(?:份|套|张)?)/g, ' ')
    .replace(/[，,。。？?！!、/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return unique(residual.split(' ').map((term) => term.trim()).filter((term) => term.length > 1))
}

export function parseGlobalResourceSearchQuery(
  rawQuery: string,
  currentScope = '初中数学',
  intentOverride?: Exclude<GlobalSearchIntent, 'compose'>,
): ParsedGlobalResourceSearchQuery {
  const normalizedQuery = normalizeQuery(rawQuery)
  const querySubject = firstIncludedCandidate(normalizedQuery, subjectCandidates)
  const contextSubject = firstIncludedCandidate(currentScope, subjectCandidates) ?? (currentScope.trim() || undefined)
  const queryGradeText = matchText(normalizedQuery, gradePattern)
  const contextGradeText = matchText(currentScope, gradePattern)
  const selectedGradeText = queryGradeText ?? contextGradeText
  const grade = normalizeGrade(selectedGradeText)
  const volume = extractVolume(selectedGradeText)
  const queryTextbook = matchText(normalizedQuery, textbookPattern)
  const contextTextbook = matchText(currentScope, textbookPattern)
  const topic = findTopic(normalizedQuery)
  const questionType = matchText(normalizedQuery, questionTypePattern)
  const difficulty = matchText(normalizedQuery, difficultyPattern)
  const explicitMatches = resourceTypePatterns.flatMap(({ type, pattern }) => {
    const sourceText = matchText(normalizedQuery, pattern)
    return sourceText ? [{ type, sourceText }] : []
  })
  const genericExerciseText = explicitMatches.length === 0 ? matchText(normalizedQuery, genericExercisePattern) : undefined
  const questionIntentText = explicitMatches.length === 0 && !genericExerciseText
    ? matchText(normalizedQuery, questionIntentPattern)
    : undefined
  const detectedComposeIntent = composePattern.test(normalizedQuery)

  let intent: GlobalSearchIntent
  let resourceTypes: GlobalSearchGroupType[]
  let strictResourceTypes = true

  if (!intentOverride && detectedComposeIntent) {
    intent = 'compose'
    resourceTypes = []
  } else if (intentOverride === 'question' || questionIntentText) {
    intent = 'question'
    resourceTypes = ['question']
  } else if (explicitMatches.length > 0) {
    intent = 'resource'
    resourceTypes = unique(explicitMatches.map(({ type }) => type))
  } else if (genericExerciseText) {
    intent = 'resource'
    resourceTypes = ['workbook', 'sync', 'special', 'paper']
  } else {
    intent = 'resource'
    resourceTypes = [...globalResourceSearchGroupOrder]
    strictResourceTypes = false
  }

  const typeConditions: ParsedGlobalSearchCondition[] = intent === 'compose'
    ? []
    : questionIntentText || intent === 'question'
      ? [condition('resource:question', '单题', 'query', questionIntentText) as ParsedGlobalSearchCondition]
      : explicitMatches.length > 0
        ? explicitMatches.map(({ type, sourceText }) => condition(
          `resource:${type}`,
          globalResourceSearchGroupLabels[type],
          'query',
          sourceText,
        ) as ParsedGlobalSearchCondition)
        : genericExerciseText
          ? [condition('resource:exercise', '章节练习资源', 'query', genericExerciseText) as ParsedGlobalSearchCondition]
          : []

  const parsedConditions = [
    condition(
      'subject',
      querySubject ?? contextSubject,
      querySubject ? 'query' : 'context',
      querySubject,
    ),
    condition(
      'grade',
      queryGradeText ?? contextGradeText,
      queryGradeText ? 'query' : 'context',
      queryGradeText,
    ),
    condition(
      'textbook',
      queryTextbook ?? contextTextbook,
      queryTextbook ? 'query' : 'context',
      queryTextbook,
    ),
    condition('topic', topic, 'query', topic),
    condition('questionType', questionType, 'query', questionType),
    condition('difficulty', difficulty, 'query', difficulty),
    ...typeConditions,
  ].filter((item): item is ParsedGlobalSearchCondition => Boolean(item))

  const searchTerms = deriveSearchTerms(normalizedQuery, [
    querySubject,
    queryGradeText,
    queryTextbook,
    topic,
    questionType,
    difficulty,
    genericExerciseText,
    questionIntentText,
    ...explicitMatches.map(({ sourceText }) => sourceText),
  ])

  return {
    rawQuery,
    normalizedQuery,
    intent,
    subject: querySubject ?? contextSubject,
    grade,
    volume,
    textbook: queryTextbook ?? contextTextbook,
    topic,
    questionType,
    difficulty,
    resourceTypes,
    strictResourceTypes,
    searchTerms,
    conditions: parsedConditions,
  }
}

function itemMatchesQuery(item: GlobalResourceSearchIndexItem, parsed: ParsedGlobalResourceSearchQuery) {
  if (!parsed.resourceTypes.includes(item.groupType)) return false
  const text = compactSearchText(item.searchText)

  if (parsed.subject && item.subject !== parsed.subject) return false
  if (parsed.grade && item.grade !== parsed.grade) return false
  if (parsed.volume && item.volume && item.volume !== parsed.volume) return false

  if (parsed.topic && !text.includes(compactSearchText(parsed.topic))) return false
  if (parsed.questionType && item.groupType === 'question' && !text.includes(compactSearchText(parsed.questionType))) return false
  if (parsed.difficulty && item.groupType === 'question' && !text.includes(compactSearchText(parsed.difficulty))) return false

  if (!parsed.topic && parsed.searchTerms.length > 0) {
    const matchesResidualTerms = parsed.searchTerms.every((term) => text.includes(compactSearchText(term)))
    if (!matchesResidualTerms) return false
  }

  if (parsed.textbook && item.textbook && item.textbook !== parsed.textbook) return false

  return true
}

function scoreItem(item: GlobalResourceSearchIndexItem, parsed: ParsedGlobalResourceSearchQuery) {
  const text = compactSearchText(item.searchText)
  const title = compactSearchText(item.title)
  let score = Math.min(20, Math.log10(item.popularity + 1) * 5)

  if (parsed.topic) {
    const topic = compactSearchText(parsed.topic)
    if (title.includes(topic)) score += 120
    else if (item.sections.some((section) => compactSearchText(section).includes(topic))) score += 100
    else if (item.knowledgePoints.some((point) => compactSearchText(point).includes(topic))) score += 90
  }
  for (const term of parsed.searchTerms) {
    const compactTerm = compactSearchText(term)
    if (title.includes(compactTerm)) score += 45
    else if (text.includes(compactTerm)) score += 24
  }
  if (parsed.grade && text.includes(compactSearchText(parsed.grade))) score += 16
  if (parsed.volume && text.includes(compactSearchText(parsed.volume))) score += 8
  if (parsed.textbook && text.includes(compactSearchText(parsed.textbook))) score += 18
  if (parsed.questionType && text.includes(compactSearchText(parsed.questionType))) score += 20
  if (parsed.difficulty && text.includes(compactSearchText(parsed.difficulty))) score += 12
  return Math.round(score * 100) / 100
}

function matchingAnchor(item: GlobalResourceSearchIndexItem, parsed: ParsedGlobalResourceSearchQuery) {
  const topic = parsed.topic ? compactSearchText(parsed.topic) : ''
  if (topic) {
    return item.sections.find((section) => compactSearchText(section).includes(topic))
      ?? item.knowledgePoints.find((point) => compactSearchText(point).includes(topic))
  }
  return item.target.anchorLabel ?? item.sections[0] ?? item.knowledgePoints[0]
}

function matchingSections(item: GlobalResourceSearchIndexItem, parsed: ParsedGlobalResourceSearchQuery) {
  if (item.groupType !== 'workbook') return []
  const terms = [parsed.topic, ...parsed.searchTerms].filter((term): term is string => Boolean(term))
  if (terms.length === 0) return item.sections
  const matched = item.sections.filter((section) => terms.some((term) => compactSearchText(section).includes(compactSearchText(term))))
  return matched.length > 0 ? matched : item.sections
}

function matchedLabel(item: GlobalResourceSearchIndexItem, parsed: ParsedGlobalResourceSearchQuery, anchor?: string) {
  if (item.groupType === 'question') {
    return `知识点：${item.knowledgePoints[0] ?? anchor ?? '相关知识点'}`
  }
  if (item.groupType === 'paper') {
    const topic = parsed.topic ?? item.knowledgePoints[0] ?? '相关考点'
    return `匹配内容：${topic}`
  }
  if (item.groupType === 'special') return `匹配专题：${anchor ?? item.title}`
  return `匹配章节：${anchor ?? item.tags[0] ?? '相关章节'}`
}

function actionLabel(type: GlobalSearchGroupType) {
  if (type === 'question') return '查看并选题'
  if (type === 'paper') return '查看试卷'
  return '进入命中位置'
}

function toSearchHit(item: GlobalResourceSearchIndexItem, parsed: ParsedGlobalResourceSearchQuery): GlobalResourceSearchHit {
  const anchor = matchingAnchor(item, parsed)
  const keyword = parsed.topic ?? (parsed.searchTerms.length > 0 ? parsed.searchTerms.join(' ') : undefined)
  return {
    id: item.id,
    groupType: item.groupType,
    title: item.title,
    meta: item.meta,
    sourceLabel: item.sourceLabel,
    questionCount: item.questionCount,
    question: item.question,
    matchedLabel: matchedLabel(item, parsed, anchor),
    matchedSections: matchingSections(item, parsed),
    actionLabel: actionLabel(item.groupType),
    target: {
      ...item.target,
      anchorLabel: anchor ?? item.target.anchorLabel,
      keyword,
      subject: parsed.subject,
      grade: parsed.grade,
      textbook: parsed.textbook,
      questionType: parsed.questionType,
      difficulty: parsed.difficulty,
    },
    score: scoreItem(item, parsed),
  }
}

function emptyResult(query: string, parsed: ParsedGlobalResourceSearchQuery): GlobalResourceSearchResult {
  return {
    query,
    parsed,
    groups: [],
    total: 0,
    matchedTypeCount: 0,
    searchedAt: Date.now(),
  }
}

function waitForMockLatency(latencyMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new GlobalResourceSearchError('ABORTED', '搜索已取消'))
      return
    }
    const timer = globalThis.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, Math.max(0, latencyMs))
    const onAbort = () => {
      globalThis.clearTimeout(timer)
      reject(new GlobalResourceSearchError('ABORTED', '搜索已取消'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export async function searchGlobalResources(
  request: GlobalResourceSearchRequest,
): Promise<GlobalResourceSearchResult> {
  const query = normalizeQuery(request.query)
  if (!query) throw new GlobalResourceSearchError('INVALID_QUERY', '请输入要查找的题目或资源')

  const parsed = parseGlobalResourceSearchQuery(query, request.currentScope, request.intentOverride)
  await waitForMockLatency(request.latencyMs ?? 420, request.signal)

  if (request.simulate === 'error') {
    throw new GlobalResourceSearchError('REQUEST_FAILED', '搜索失败，请稍后重试')
  }
  if (request.simulate === 'empty' || parsed.intent === 'compose') return emptyResult(query, parsed)
  if (!supportsMockScope(request.currentScope)) return emptyResult(query, parsed)

  const hits = globalResourceSearchIndex
    .filter((item) => itemMatchesQuery(item, parsed))
    .map((item) => toSearchHit(item, parsed))
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, 'zh-CN'))

  const groupOrder = parsed.resourceTypes.length > 0 ? parsed.resourceTypes : globalResourceSearchGroupOrder
  const groups = groupOrder.flatMap((type) => {
    const items = hits.filter((hit) => hit.groupType === type)
    return items.length > 0
      ? [{ type, label: globalResourceSearchGroupLabels[type], total: items.length, items }]
      : []
  })

  return {
    query,
    parsed,
    groups,
    total: groups.reduce((total, group) => total + group.total, 0),
    matchedTypeCount: groups.length,
    searchedAt: Date.now(),
  }
}

export const globalResourceSearchRepository: GlobalResourceSearchRepository = {
  parse: parseGlobalResourceSearchQuery,
  search: searchGlobalResources,
}

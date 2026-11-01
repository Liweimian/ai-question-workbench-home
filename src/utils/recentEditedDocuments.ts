import type { HistoryDocumentSummary } from '../prototype/types'

export const RECENT_EDITED_MAX = 10
export const RECENT_EDITED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export function parseHistoryUpdatedAt(label: string, now = Date.now()): number {
  const trimmed = label.trim()
  if (!trimmed || trimmed === '刚刚') return now

  if (trimmed.startsWith('今天')) {
    const match = trimmed.match(/(\d{1,2}):(\d{2})/)
    const date = new Date(now)
    if (match) date.setHours(Number(match[1]), Number(match[2]), 0, 0)
    return date.getTime()
  }

  if (trimmed.startsWith('昨天')) {
    const match = trimmed.match(/(\d{1,2}):(\d{2})/)
    const date = new Date(now)
    date.setDate(date.getDate() - 1)
    if (match) date.setHours(Number(match[1]), Number(match[2]), 0, 0)
    else date.setHours(12, 0, 0, 0)
    return date.getTime()
  }

  const monthDay = trimmed.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
  if (monthDay) {
    const date = new Date(now)
    date.setMonth(Number(monthDay[1]) - 1, Number(monthDay[2]))
    date.setHours(12, 0, 0, 0)
    if (date.getTime() > now) date.setFullYear(date.getFullYear() - 1)
    return date.getTime()
  }

  return now - 7 * 24 * 60 * 60 * 1000
}

export function historySummarySavedAt(item: HistoryDocumentSummary, now = Date.now()): number {
  return item.savedAtMs ?? parseHistoryUpdatedAt(item.updatedAt, now)
}

export function isSavedHistorySummary(item: HistoryDocumentSummary): boolean {
  return item.status === '已保存' || item.status === '已布置'
}

export function selectRecentEditedSummaries(
  histories: HistoryDocumentSummary[],
  now = Date.now(),
): HistoryDocumentSummary[] {
  const cutoff = now - RECENT_EDITED_WINDOW_MS
  return histories
    .filter((item) => isSavedHistorySummary(item))
    .filter((item) => historySummarySavedAt(item, now) >= cutoff)
    .sort((a, b) => historySummarySavedAt(b, now) - historySummarySavedAt(a, now))
    .slice(0, RECENT_EDITED_MAX)
}

function resolveStageSubject(item: HistoryDocumentSummary): { stage: string; subject: string } {
  if (item.schoolStage && item.subjectName) {
    return { stage: item.schoolStage, subject: item.subjectName }
  }

  const head = item.gradeSubject.split('·')[0]?.trim() ?? item.gradeSubject
  if (head.startsWith('小学')) return { stage: '小学', subject: head.slice(2).trim() || '数学' }
  if (head.startsWith('初中')) return { stage: '初中', subject: head.slice(2).trim() || '数学' }
  if (head.startsWith('高中')) return { stage: '高中', subject: head.slice(2).trim() || '数学' }

  const grade = head.match(/([一二三四五六七八九十])年级/)
  if (grade) {
    const gradeNo = '一二三四五六七八九十'.indexOf(grade[1]) + 1
    const stage = gradeNo <= 6 ? '小学' : gradeNo <= 9 ? '初中' : '高中'
    const subject = head.replace(/[一二三四五六七八九十]年级/, '').trim() || '数学'
    return { stage, subject }
  }

  return { stage: '初中', subject: head || '数学' }
}

export function formatRecentEditedMeta(item: HistoryDocumentSummary): string {
  const { stage, subject } = resolveStageSubject(item)
  const minutes = item.estimatedMinutes ?? Math.max(item.questionCount * 3, 6)
  return `${stage} / ${subject} / 共${item.questionCount}题 / 预计${minutes}分钟`
}

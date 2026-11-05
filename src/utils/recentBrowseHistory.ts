import type { SourceRecord } from '../prototype/types'

const STORAGE_KEY = 'feixiang-ai-question-workbench-recent-browse-v2'
const MAX_ENTRIES = 30
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function isWithinSevenDays(viewedAtMs: number, now = Date.now()) {
  return now - viewedAtMs <= SEVEN_DAYS_MS
}

export type RecentBrowseLibraryMode = 'resource' | 'school'

export interface RecentBrowseEntry {
  id: string
  libraryMode: RecentBrowseLibraryMode
  title: string
  viewedAt: string
  viewedAtMs: number
  record: SourceRecord
  matchedPath?: string
}

function formatViewedAt(ms: number, nowMs = Date.now()) {
  const date = new Date(ms)
  const now = new Date(nowMs)
  if (nowMs - ms < 60 * 1000) return '刚刚'
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const dayDiff = Math.round((startOfToday - startOfDate) / (24 * 60 * 60 * 1000))
  if (dayDiff === 0) return `今天 ${hours}:${minutes}`
  if (dayDiff === 1) return `昨天 ${hours}:${minutes}`
  if (dayDiff === 2) return `前天 ${hours}:${minutes}`
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

function toEntry(libraryMode: RecentBrowseLibraryMode, record: SourceRecord, viewedAtMs: number, matchedPath?: string): RecentBrowseEntry {
  return {
    id: `${libraryMode}:${record.id}`,
    libraryMode,
    title: record.title,
    viewedAt: formatViewedAt(viewedAtMs),
    viewedAtMs,
    record,
    matchedPath,
  }
}

export function readRecentBrowseEntries(): RecentBrowseEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentBrowseEntry[]
    if (!Array.isArray(parsed)) return []
    const now = Date.now()
    const visible = parsed
      .filter((item) => typeof item?.viewedAtMs === 'number' && isWithinSevenDays(item.viewedAtMs, now))
      .sort((a, b) => b.viewedAtMs - a.viewedAtMs)
      .map((item) => ({ ...item, viewedAt: formatViewedAt(item.viewedAtMs, now) }))
    if (visible.length !== parsed.length) writeRecentBrowseEntries(visible)
    return visible
  } catch {
    return []
  }
}

function writeRecentBrowseEntries(entries: RecentBrowseEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
}

export function recordRecentBrowse(libraryMode: RecentBrowseLibraryMode, record: SourceRecord, matchedPath?: string) {
  if (typeof window === 'undefined') return
  const viewedAtMs = Date.now()
  const nextEntry = toEntry(libraryMode, record, viewedAtMs, matchedPath)
  const current = readRecentBrowseEntries().filter((item) => item.id !== nextEntry.id)
  writeRecentBrowseEntries([nextEntry, ...current])
}

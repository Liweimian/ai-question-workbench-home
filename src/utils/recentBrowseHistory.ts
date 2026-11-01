import { sourceOptions } from '../data/workbenchData'
import type { ResourceType, SourceRecord } from '../prototype/types'

const STORAGE_KEY = 'feixiang-ai-question-workbench-recent-browse-v2'
const MAX_ENTRIES = 30
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

function isWithinThreeDays(viewedAtMs: number, now = Date.now()) {
  return now - viewedAtMs <= THREE_DAYS_MS
}

export type RecentBrowseLibraryMode = 'resource' | 'school'

export interface RecentBrowseEntry {
  id: string
  libraryMode: RecentBrowseLibraryMode
  typeLabel: string
  title: string
  viewedAt: string
  viewedAtMs: number
  record: SourceRecord
}

const resourceTypeLabels = Object.fromEntries(
  sourceOptions.map((option) => [option.type, option.title]),
) as Record<ResourceType, string>

function formatViewedAt(ms: number) {
  const date = new Date(ms)
  const now = new Date()
  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  if (sameDay) return `今天 ${hours}:${minutes}`
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日 ${hours}:${minutes}`
}

function toEntry(libraryMode: RecentBrowseLibraryMode, record: SourceRecord, viewedAtMs: number): RecentBrowseEntry {
  return {
    id: `${libraryMode}:${record.id}`,
    libraryMode,
    typeLabel: resourceTypeLabels[record.sourceType] ?? record.sourceType,
    title: record.title,
    viewedAt: formatViewedAt(viewedAtMs),
    viewedAtMs,
    record,
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
      .filter((item) => typeof item?.viewedAtMs === 'number' && isWithinThreeDays(item.viewedAtMs, now))
      .sort((a, b) => b.viewedAtMs - a.viewedAtMs)
    if (visible.length !== parsed.length) writeRecentBrowseEntries(visible)
    return visible
  } catch {
    return []
  }
}

function writeRecentBrowseEntries(entries: RecentBrowseEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
}

export function recordRecentBrowse(libraryMode: RecentBrowseLibraryMode, record: SourceRecord) {
  if (typeof window === 'undefined') return
  const viewedAtMs = Date.now()
  const nextEntry = toEntry(libraryMode, record, viewedAtMs)
  const current = readRecentBrowseEntries().filter((item) => item.id !== nextEntry.id)
  writeRecentBrowseEntries([nextEntry, ...current])
}

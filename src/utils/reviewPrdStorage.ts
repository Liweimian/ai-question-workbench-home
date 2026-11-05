const PREFIX = 'prd:'
const PAGE_REVISIONS: Record<string, string> = {
  组题编辑: '371',
  资源详情: '372',
  同步练习: '372',
  专题: '372',
  我的资源: '381',
}

export function reviewPrdStorageKey(pageTitle: string): string {
  const revision = PAGE_REVISIONS[pageTitle]
  return revision ? `${PREFIX}${pageTitle}:v${revision}` : `${PREFIX}${pageTitle}`
}

export function readStoredPrdMarkdown(pageTitle: string, defaultMarkdown: string): string {
  try {
    const raw = localStorage.getItem(reviewPrdStorageKey(pageTitle))
    if (raw && raw.trim()) return raw
  } catch {
    /* ignore */
  }
  return defaultMarkdown
}

export function writeStoredPrdMarkdown(pageTitle: string, markdown: string): void {
  try {
    localStorage.setItem(reviewPrdStorageKey(pageTitle), markdown)
  } catch {
    /* ignore */
  }
}

export function clearStoredPrdMarkdown(pageTitle: string): void {
  try {
    localStorage.removeItem(reviewPrdStorageKey(pageTitle))
  } catch {
    /* ignore */
  }
}

export function hasStoredPrdEdit(pageTitle: string, defaultMarkdown: string): boolean {
  try {
    const raw = localStorage.getItem(reviewPrdStorageKey(pageTitle))
    return Boolean(raw && raw.trim() && raw !== defaultMarkdown)
  } catch {
    return false
  }
}

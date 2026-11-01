const PREFIX = 'prd:'

export function reviewPrdStorageKey(pageTitle: string): string {
  return `${PREFIX}${pageTitle}`
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

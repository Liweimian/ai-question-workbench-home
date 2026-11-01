const STORAGE_KEY = 'feixiang-ai-recent-edited-panel-closed'
const LEGACY_SESSION_KEY = STORAGE_KEY

function readClosedFlag(storage: Storage): boolean {
  try {
    return storage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function isRecentEditedPanelClosed(): boolean {
  if (typeof window === 'undefined') return false
  if (readClosedFlag(window.localStorage)) return true
  if (readClosedFlag(window.sessionStorage)) {
    window.localStorage.setItem(STORAGE_KEY, '1')
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY)
    return true
  }
  return false
}

export function setRecentEditedPanelClosed(closed: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (closed) {
      window.localStorage.setItem(STORAGE_KEY, '1')
      window.sessionStorage.setItem(STORAGE_KEY, '1')
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    /* ignore */
  }
}

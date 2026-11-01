import { MetisMessage } from '@yuanfudao/metis-web-component'

const answerSheetHashPattern = /^#\/answer-sheet\/(.+)$/

export function parseAnswerSheetDocumentId(hash = window.location.hash): string | null {
  const match = hash.match(answerSheetHashPattern)
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export function buildAnswerSheetUrl(documentId: string) {
  const url = new URL(window.location.href)
  url.hash = `/answer-sheet/${encodeURIComponent(documentId)}`
  return url.toString()
}

export function openAnswerSheetTab(documentId: string) {
  const opened = window.open(buildAnswerSheetUrl(documentId), '_blank')
  if (!opened) MetisMessage.info('请允许浏览器打开新标签页后重试')
  return Boolean(opened)
}

export function leaveAnswerSheetPage() {
  window.close()
  window.setTimeout(() => {
    if (!window.closed) window.location.hash = ''
  }, 50)
}

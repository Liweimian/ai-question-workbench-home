import { useEffect, useState } from 'react'
import { applyFxZoom } from './design-system/fx-adapt'
import { AnswerSheetPage } from './pages/AnswerSheetPage'
import { WorkbenchHomePage } from './pages/WorkbenchHomePage'
import { parseAnswerSheetDocumentId } from './utils/answerSheetRoute'

export function App() {
  const [answerSheetId, setAnswerSheetId] = useState(() => parseAnswerSheetDocumentId())

  useEffect(() => {
    const syncRoute = () => setAnswerSheetId(parseAnswerSheetDocumentId())
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useEffect(() => {
    if (!answerSheetId) applyFxZoom('.fx-zoom-area')
  }, [answerSheetId])

  if (answerSheetId) {
    return <AnswerSheetPage documentId={answerSheetId} />
  }

  return <WorkbenchHomePage />
}

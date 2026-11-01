import { useEffect, useState } from 'react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import { AnswerSheetPanel } from '../components/AnswerSheetPanel'
import type { WorkbenchDocument } from '../prototype/types'
import { persistDocumentNow, readStoredDocument } from '../services/workbenchRepository'
import { leaveAnswerSheetPage } from '../utils/answerSheetRoute'

interface AnswerSheetPageProps {
  documentId: string
}

export function AnswerSheetPage({ documentId }: AnswerSheetPageProps) {
  const [document, setDocument] = useState<WorkbenchDocument | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const stored = readStoredDocument(documentId)
    if (!stored) {
      setDocument(null)
      setMissing(true)
      return
    }
    setMissing(false)
    setDocument(stored)
  }, [documentId])

  if (missing || !document) {
    return (
      <div className="fx-app metis-theme-aiq answer-sheet-standalone">
        <div className="answer-sheet-missing">
          <p>未找到这份试卷，请返回编辑器后重新生成答题卡。</p>
          <button type="button" onClick={leaveAnswerSheetPage}>返回</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fx-app metis-theme-aiq answer-sheet-standalone">
      <AnswerSheetPanel
        document={document}
        onSave={() => {
          persistDocumentNow(document)
          MetisMessage.success('答题卡已保存')
        }}
        onMarkOutput={() => {
          persistDocumentNow(document)
        }}
        onBackToPaper={leaveAnswerSheetPage}
      />
    </div>
  )
}

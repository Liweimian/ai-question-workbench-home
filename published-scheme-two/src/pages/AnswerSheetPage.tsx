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
  const [saveState, setSaveState] = useState<'dirty' | 'saving' | 'saved' | 'error'>('saved')

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
        saveState={saveState}
        onSave={() => {
          setSaveState('saving')
          try {
            persistDocumentNow(document)
            setSaveState('saved')
          } catch {
            setSaveState('error')
          }
        }}
        onChange={(patch) => {
          const next = {
            ...document,
            answerSheet: { ...document.answerSheet, ...patch, updatedAt: new Date().toISOString() },
          }
          setDocument(next)
          setSaveState('dirty')
        }}
        onMarkOutput={() => {
          persistDocumentNow(document)
        }}
        onShare={() => {
          if (saveState !== 'saved') {
            persistDocumentNow(document)
            setSaveState('saved')
          }
          MetisMessage.info('共享到校本库面板已打开（原型演示）')
        }}
        onBackToPaper={leaveAnswerSheetPage}
      />
    </div>
  )
}

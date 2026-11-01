import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import type { Question } from '../prototype/types'
import { sumQuestionScores } from '../utils/documentEditorUtils'

interface ScoreSettingsDialogProps {
  questions: Question[]
  onClose: () => void
  onSave: (scores: Record<string, number>) => void
}

export function ScoreSettingsDialog({ questions, onClose, onSave }: ScoreSettingsDialogProps) {
  const [scores, setScores] = useState<Record<string, string>>(() => (
    Object.fromEntries(questions.map((question) => [question.id, question.score > 0 ? String(question.score) : '']))
  ))

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.document.addEventListener('keydown', closeOnEscape)
    return () => window.document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const parsedScores = Object.fromEntries(questions.map((question) => {
    const value = Number(scores[question.id])
    return [question.id, Number.isFinite(value) && value > 0 ? value : 0]
  }))
  const unsetCount = questions.filter((question) => !parsedScores[question.id]).length
  const totalScore = sumQuestionScores(questions.map((question) => ({ ...question, score: parsedScores[question.id] })))

  return (
    <div className="score-settings-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="score-settings-dialog" role="dialog" aria-modal="true" aria-label="分数设置">
        <header>
          <div>
            <h2>分数设置</h2>
            <p>查看可 AI 批改的题目</p>
          </div>
          <button type="button" className="score-settings-close" aria-label="关闭分数设置" onClick={onClose}><X size={16} /></button>
        </header>
        <div className="score-settings-summary">
          <span>测验总分：<b>{unsetCount ? '--' : totalScore}</b></span>
          <span>总题数：<b>{questions.length}</b></span>
        </div>
        <div className="score-settings-list">
          {questions.map((question, index) => (
            <label key={question.id}>
              <span>题{index + 1}</span>
              <span className={`score-settings-field${!parsedScores[question.id] ? ' is-empty' : ''}`}>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="输入分数"
                  value={scores[question.id] ?? ''}
                  aria-label={`第 ${index + 1} 题分值`}
                  onChange={(event) => setScores((current) => ({ ...current, [question.id]: event.target.value }))}
                />
                <i>分</i>
              </span>
            </label>
          ))}
        </div>
        <footer>
          <button type="button" onClick={onClose}>取消</button>
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              if (unsetCount > 0) {
                MetisMessage.error('试题分值不能为空')
                return
              }
              onSave(parsedScores)
            }}
          >
            保存分值
          </button>
        </footer>
      </section>
    </div>
  )
}

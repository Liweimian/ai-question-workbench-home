import type { PaperAnswerMode, Question, WorkbenchDocument, WorkbenchDocumentKind } from '../prototype/types'

export function getDocumentKind(document: WorkbenchDocument): WorkbenchDocumentKind {
  return document.kind ?? '题单'
}

export function getPaperAnswerMode(document: WorkbenchDocument): PaperAnswerMode {
  return document.answerMode ?? '原卷作答'
}

export function canSwitchDocumentKind(document: WorkbenchDocument) {
  return (document.outputLocks ?? []).every((lock) => lock === 'answer-sheet')
}

export function canSwitchAnswerMode(document: WorkbenchDocument) {
  return !(document.answerSheet?.generatedAt && getPaperAnswerMode(document) === '答题卡作答')
}

export function sumQuestionScores(questions: Question[]) {
  return questions.reduce((total, question) => total + (question.score || 0), 0)
}

export function countUnsetScores(questions: Question[]) {
  return questions.filter((question) => !question.score || question.score <= 0).length
}

export function needsPaperScoreSettings(document: WorkbenchDocument, kind = getDocumentKind(document)) {
  return kind === '试卷'
    && document.questions.length > 0
    && (!document.scoreSettingsConfirmed || countUnsetScores(document.questions) > 0)
}

import type { AddQuestionMode, LibraryInitialView, SourceRecord } from '../prototype/types'

export interface ReviewPageContext {
  documentCenterVisible: boolean
  studioEditorOpen: boolean
  isAddOpen: boolean
  addMode: AddQuestionMode
  libraryInitialView?: LibraryInitialView
  activeLibraryDetail: SourceRecord | null
  myResourcesTabOpen: boolean
  assistantTabOpen: boolean
  recentBrowseTabOpen?: boolean
}

const libraryViewTitles: Record<LibraryInitialView, string> = {
  sync: '同步练习',
  workbook: '练习册',
  paper: '试卷',
  special: '专题',
  chapter: '章节/知识点选题',
}

export function resolveReviewPageTitle(ctx: ReviewPageContext): string {
  if (ctx.myResourcesTabOpen) return '我的资源'
  if (ctx.recentBrowseTabOpen) return '最近浏览'
  if (ctx.assistantTabOpen) return 'AI组题'

  if (ctx.isAddOpen) {
    if (ctx.addMode === 'create') return 'AI出题'
    if (ctx.addMode === 'upload') return '我的资源'
    if (ctx.activeLibraryDetail) return '资源详情'
    if (ctx.addMode === 'school') return '校本题库'
    if (ctx.libraryInitialView) return libraryViewTitles[ctx.libraryInitialView]
    if (ctx.addMode === 'resource') return '首页'
  }

  if (ctx.studioEditorOpen || !ctx.documentCenterVisible) return '组题编辑'
  return '首页'
}

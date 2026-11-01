import {
  BookOpen,
  BrainCircuit,
  FileInput,
  FileText,
  Layers3,
  ListTree,
  School,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'
import type { AddQuestionMode, LibraryInitialView } from '../prototype/types'

export interface AddQuestionEntry {
  description?: string
  icon: LucideIcon
  label: string
  mode: AddQuestionMode
  source: string
  view?: LibraryInitialView
}

export const addQuestionEntries: AddQuestionEntry[] = [
  { mode: 'resource', view: 'chapter', label: '按章节/知识点选题', source: '飞象题库', icon: ListTree },
  { mode: 'resource', view: 'workbook', label: '从练习册选题', source: '飞象题库', icon: BookOpen },
  { mode: 'resource', view: 'paper', label: '从试卷选题', source: '飞象题库', icon: FileText },
  { mode: 'resource', view: 'sync', label: '从同步练习选题', source: '飞象题库', icon: Layers3 },
  { mode: 'resource', view: 'special', label: '从专题练习选题', source: '飞象题库', icon: Target },
  { mode: 'school', label: '从校本题库选题', source: '校本资源', icon: School },
  { mode: 'upload', label: '上传文件 AI 录题', source: 'AI 工具', description: '上传 Word、PDF 或图片，识别并录入题目', icon: FileInput },
  { mode: 'create', label: 'AI 出题', source: 'AI 工具', description: '设置教材、知识点、题型和题量，生成几道新题', icon: Sparkles },
  { mode: 'compose', label: 'AI 组题', source: 'AI 工具', description: '直接说作业或试卷要求，从题库配题组卷', icon: BrainCircuit },
]

export const libraryQuestionEntries = addQuestionEntries.slice(0, 6)
export const aiQuestionEntries = addQuestionEntries.slice(6)

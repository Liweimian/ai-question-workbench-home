import { useEffect, useRef, useState } from 'react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import { BookOpenCheck, BrainCircuit, FileImage, FileText, FileUp, GraduationCap, GripVertical, Heading2, Minus, Network, Plus, ScanSearch, School, Sparkles } from 'lucide-react'
import type { AddQuestionMode } from '../prototype/types'

export type UtilityAction = 'image-search' | 'web-search' | 'heading' | 'note' | 'divider' | 'page-break'

interface BlockAddMenuProps {
  empty?: boolean
  openRequest?: number
  onOpenAdd: (mode: AddQuestionMode) => void
  onInsertUtility?: (action: UtilityAction) => void
}

const optionGroups = [
  { title: '题库选题', items: [
    { id: 'resource', mode: 'resource', title: '飞象题库', description: '练习册、试卷、同步题单与专题', icon: BookOpenCheck },
    { id: 'school', mode: 'school', title: '校本题库', description: '本校沉淀的试卷、练习册与题目', icon: School },
  ] },
  { title: '搜题与导入', items: [
    { id: 'upload', mode: 'upload', title: '上传文件 AI 录题', description: '识别 PDF、Word 或图片中的题目', icon: FileUp },
    { id: 'image-search', utility: 'image-search', title: '图片搜题', description: '上传或粘贴题目图片查找原题', icon: ScanSearch },
    { id: 'web-search', utility: 'web-search', title: '联网搜题', description: '从公开网络检索可用题目', icon: Network },
  ] },
  { title: '飞象 AI', items: [
    { id: 'compose', mode: 'compose', title: 'AI 组题', description: '从题库智能挑选并组合', icon: BrainCircuit, ai: true },
    { id: 'create', mode: 'create', title: 'AI 命题', description: '按要求生成原创题目', icon: Sparkles, ai: true },
    { id: 'personalized', mode: 'personalized', title: '个性化练习', description: '结合材料与学情生成练习', icon: GraduationCap, ai: true },
  ] },
  { title: '试卷结构', items: [
    { id: 'heading', utility: 'heading', title: '二级标题', description: '插入题型或大题分组标题', icon: Heading2 },
    { id: 'note', utility: 'note', title: '说明文字', description: '插入考试说明、作答要求或导语', icon: FileText },
    { id: 'divider', utility: 'divider', title: '分割线', description: '分隔不同题型或内容区域', icon: Minus },
    { id: 'page-break', utility: 'page-break', title: '分页符', description: '控制打印与 PDF 的分页位置', icon: FileImage },
  ] },
] as const

export function BlockAddMenu({ empty = false, openRequest = 0, onOpenAdd, onInsertUtility }: BlockAddMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (openRequest > 0) setOpen(true) }, [openRequest])
  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isInteractive = Boolean(target?.closest('input, textarea, button, a, select, [contenteditable="true"]'))
      const hasBlockingLayer = Boolean(document.querySelector('[role="dialog"][aria-modal="true"], .inline-ai-dialog'))
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey || event.shiftKey
      if (event.key === 'Escape') setOpen(false)
      if (event.key === '/' && !event.isComposing && !hasModifier && !event.repeat && !isInteractive && !hasBlockingLayer) {
        event.preventDefault(); setOpen(true)
      }
    }
    window.addEventListener('mousedown', closeOnOutside)
    window.addEventListener('keydown', handleKeyboard)
    return () => { window.removeEventListener('mousedown', closeOnOutside); window.removeEventListener('keydown', handleKeyboard) }
  }, [open])

  const chooseUtility = (action: UtilityAction) => {
    setOpen(false)
    if (onInsertUtility) return onInsertUtility(action)
    if (action === 'image-search') MetisMessage.info('图片搜题入口已打开（原型演示）')
    else if (action === 'web-search') MetisMessage.info('联网搜题入口已打开（原型演示）')
    else MetisMessage.success('已插入试卷结构块（原型演示）')
  }

  return (
    <div className={`block-add${empty ? ' block-add--empty' : ''}`} ref={rootRef}>
      <div className="block-add-control-row">
        <button type="button" className="block-add-trigger" aria-expanded={open} aria-label="插入内容" onClick={() => setOpen((current) => !current)}><Plus size={18} /></button>
        <button type="button" className="block-drag-handle" draggable aria-label="拖动内容块"><GripVertical size={18} /></button>
        {!empty ? <button type="button" className="block-add-trigger-copy" onClick={() => setOpen((current) => !current)}><strong>继续添加内容</strong><small>添加题目、素材或试卷结构，也可以输入 /</small></button> : null}
      </div>
      {open ? (
        <div className="block-command-menu" role="menu" aria-label="插入内容">
          <div className="block-command-heading"><strong>插入内容</strong><span>按任务分类</span></div>
          <div className="block-command-scroll">
            {optionGroups.map((group) => <section className="block-command-group" key={group.title}>
              <h4>{group.title}</h4>
              {group.items.map(({ id, title, description, icon: Icon, ...item }) => {
                const mode = 'mode' in item ? item.mode : undefined
                const utility = 'utility' in item ? item.utility : undefined
                const ai = 'ai' in item && item.ai
                return <button type="button" role="menuitem" key={id} className={ai ? 'is-ai' : ''} onClick={() => {
                  if (mode) { setOpen(false); onOpenAdd(mode) }
                  else if (utility) chooseUtility(utility)
                }}><span className="block-command-icon"><Icon size={16} /></span><span><strong>{title}</strong><small>{description}</small></span>{ai ? <em>AI</em> : null}</button>
              })}
            </section>)}
          </div>
          <div className="block-command-tip">输入 / 快速唤起 · Esc 关闭</div>
        </div>
      ) : null}
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import { MetisButton, MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import {
  ArchiveX,
  ArrowLeft,
  BookOpenCheck,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  FileText,
  ImagePlus,
  ListTree,
  SquarePen,
  ListChecks,
  MoreHorizontal,
  Pin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
} from 'lucide-react'
import { baseQuestions, sourceOptions, sourceRecords as allSourceRecords } from '../data/workbenchData'
import type { AsyncStatus, LibraryInitialView, Question, ResourceType, SourceRecord } from '../prototype/types'
import { workbenchRepository } from '../services/workbenchRepository'
import { animateQuestionToDraft } from '../utils/animateQuestionToDraft'
import { ContextualAiPopover } from './ContextualAiPopover'
import {
  ImageQuestionSearchPanel,
  useImageQuestionSearch,
  validateQuestionImage,
} from './ImageQuestionSearchPanel'

interface LibraryPickerProps {
  variant?: 'dialog' | 'home'
  libraryKind: 'fly' | 'school'
  initialView?: LibraryInitialView
  initialSearchKeyword?: string
  initialChapterNode?: string
  initialQuestionId?: string
  initialQuestionType?: Question['type']
  initialDifficulty?: Question['difficulty']
  initialMatchedPath?: string
  hideMatchBanner?: boolean
  resourceType: ResourceType
  records: SourceRecord[]
  listStatus: AsyncStatus
  addStatus: AsyncStatus
  contentBusy: boolean
  showAll?: boolean
  detailRecord?: SourceRecord | null
  onShowAllChange?: (showAll: boolean) => void
  onDetailChange?: (open: boolean) => void
  onOpenDetail?: (record: SourceRecord) => void
  onWorkbookDirectoryChange?: (record: SourceRecord, matchedPath: string) => void
  onResourceTypeChange: (type: ResourceType) => void
  onAddSource: (type: ResourceType, sourceId: string, count: number, selectedQuestions?: Question[]) => Promise<boolean>
  currentDocumentHasContent?: boolean
  currentDocumentHasUnsavedChanges?: boolean
  onCompleteEditWholeVolume?: (
    type: ResourceType,
    sourceId: string,
    count: number,
    selectedQuestions: Question[],
    mode: 'plain' | 'save-first' | 'discard-first',
  ) => Promise<'success' | 'failed'>
}

const resourceIcons: Record<ResourceType, typeof BookOpenCheck> = {
  workbook: BookOpenCheck,
  paper: FileText,
  sync: ListChecks,
  special: Sparkles,
}

const categoryGroups: Record<Exclude<ResourceType, 'workbook'>, Array<{ title?: string; items: string[] }>> = {
  paper: [
    { items: ['全部资源'] },
    { title: '同步考试', items: ['期中', '期末', '月考', '单元测试', '学业考试', '开学考试', '其他'] },
    { title: '中考', items: ['真题', '模拟题'] },
  ],
  sync: [
    { items: ['全部资源'] },
    { title: '第四章 一次函数', items: ['4.1 函数', '4.2 一次函数与正比例函数', '4.3 一次函数的图象', '4.4 一次函数的应用'] },
    { title: '第五章 二元一次方程组', items: ['5.1 认识二元一次方程组', '5.2 求解二元一次方程组'] },
  ],
  special: [
    { items: ['全部资源'] },
    { title: '知识模块', items: ['数与式', '方程（组）与不等式（组）', '函数', '几何初步', '三角形', '四边形', '圆'] },
    { title: '能力专项', items: ['几何模型', '计算专练', '难点突破', '情境建模'] },
  ],
}

const filterLabels: Record<ResourceType, string[]> = {
  workbook: ['八年级', '类型', '教材版本', '练习册系列'],
  paper: ['八年级上', '北京市朝阳区', '年份', '来源'],
  sync: ['难度', '来源'],
  special: ['难度', '来源'],
}

const listHeadings: Record<ResourceType, string> = {
  workbook: '练习册',
  paper: '全部试卷',
  sync: '4.1 函数',
  special: '全部资源',
}

const resourceTypeLabels: Record<ResourceType, string> = {
  workbook: '练习册',
  paper: '试卷',
  sync: '同步练习',
  special: '专题',
}

const chapterKnowledgeTree = [
  { title: '第四章 一次函数', items: ['4.1 函数', '4.2 一次函数与正比例函数', '4.3 一次函数的图象', '4.4 一次函数的应用'] },
  { title: '第五章 二元一次方程组', items: ['5.1 认识二元一次方程组', '5.2 求解二元一次方程组'] },
  { title: '知识点选题', items: ['一次函数概念', '图象与性质', '待定系数法', '实际应用'] },
]

function getResourceCardTags(record: SourceRecord) {
  const secondaryTag = record.tags?.[0]
    ?? record.meta.split(/[·/]/).map((item) => item.trim()).find(Boolean)
    ?? resourceTypeLabels[record.sourceType]

  return [record.highlight || resourceTypeLabels[record.sourceType], secondaryTag].slice(0, 2)
}

function getPaperRecordingType(record: SourceRecord) {
  if (record.sourceType !== 'paper') return 'none'
  if (record.tags?.includes('委托录题')) return 'delegated'
  if (record.tags?.includes('AI录题')) return 'ai'
  return 'none'
}

interface LegacyResourceDetailProps {
  record: SourceRecord
  initialMatchedPath?: string
  hideMatchBanner?: boolean
  embedded?: boolean
  questions: Question[]
  selectedQuestionIds: Set<string>
  pendingQuestionIds: Set<string>
  showAnswers: boolean
  contentBusy: boolean
  addStatus: AsyncStatus
  showReturnNavigation: boolean
  onReturnHome: () => void
  onToggleAnswers: () => void
  onToggleQuestion: (question: Question) => Promise<void>
  onAddQuestionGroup: (questions: Question[]) => Promise<void>
  onUseAll: () => Promise<void>
  onWorkbookDirectoryChange?: (matchedPath: string) => void
  currentDocumentHasContent?: boolean
  currentDocumentHasUnsavedChanges?: boolean
  onCompleteEditWholeVolume?: (
    type: ResourceType,
    sourceId: string,
    count: number,
    selectedQuestions: Question[],
    mode: 'plain' | 'save-first' | 'discard-first',
  ) => Promise<'success' | 'failed'>
  schoolLibrary?: boolean
}

function QuestionMoreMenu(props: { showUnpublish: boolean }) {
  const [open, setOpen] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])
  return (
    <div className="legacy-question-more" ref={rootRef}>
      <button type="button" aria-label="更多" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div className="legacy-question-more-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setFavorited((current) => !current); MetisMessage.success(favorited ? '已取消收藏' : '已收藏'); setOpen(false) }}>{favorited ? '取消收藏' : '收藏'}</button>
          <button type="button" role="menuitem" onClick={() => { MetisMessage.info('已提交纠错'); setOpen(false) }}>纠错</button>
          {props.showUnpublish ? <button type="button" role="menuitem" onClick={() => { MetisMessage.success('已下架'); setOpen(false) }}>下架</button> : null}
        </div>
      ) : null}
    </div>
  )
}

function LibraryQuestionAiRewrite(props: { question: Question; onAdd: (question: Question) => void | Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<AsyncStatus>('idle')
  const [preview, setPreview] = useState<Question | null>(null)

  const generate = async (instruction: '自定义要求' | '优化题干' | '换生活情境' | '降低难度' | '同考点换题', customPrompt?: string) => {
    setStatus('loading')
    setPreview(null)
    try {
      const result = await workbenchRepository.rewrite(props.question, {
        questionId: props.question.id,
        instruction,
        prompt: customPrompt,
      })
      setPreview({ ...result, id: `library-rewrite-${Date.now()}` })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const quickActions = [
    { label: '润色表达', instruction: '优化题干' as const },
    { label: '降低难度', instruction: '降低难度' as const },
    { label: '增加情境', instruction: '换生活情境' as const },
    { label: '同考点变式', instruction: '同考点换题' as const },
  ]

  return (
    <>
      <button type="button" className="is-ai-rewrite" onClick={() => { setOpen(true); setStatus('idle'); setPreview(null) }}><Sparkles size={14} />AI改编</button>
      {open ? (
        <ContextualAiPopover
          title="AI改编"
          prompt={prompt}
          placeholder="描述如何修改这道题…"
          status={status}
          error={status === 'error' ? 'AI 改编失败，请重试' : undefined}
          resultText={preview?.stem}
          resultMeta="已生成改编结果"
          quickActions={quickActions.map((action) => ({ label: action.label, onSelect: () => { setPrompt(action.label); void generate(action.instruction) } }))}
          onPromptChange={setPrompt}
          onSubmit={() => { if (prompt.trim()) void generate('自定义要求', prompt.trim()) }}
          onClose={() => setOpen(false)}
          onAppend={preview ? () => { void props.onAdd(preview); setOpen(false) } : undefined}
          appendLabel="添加"
        />
      ) : null}
    </>
  )
}

function LegacyUseWholeVolumeMenu(props: {
  embedded?: boolean
  contentBusy: boolean
  showEdit: boolean
  onAddToDraft: () => void
  onEdit: () => void
  onFavorite: () => void
  favorited: boolean
  showFavorite?: boolean
  showUnpublish?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <div className="legacy-use-whole-volume" ref={rootRef}>
      <button
        type="button"
        className="is-primary"
        disabled={props.contentBusy}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <FileText size={15} />
        {props.embedded ? '添加整卷' : '使用整卷'}
        <ChevronDown size={13} />
      </button>
      {open ? (
        <div className="legacy-use-whole-menu" role="menu" aria-label="使用整卷">
          <button type="button" role="menuitem" disabled={props.contentBusy} onClick={() => { props.onAddToDraft(); setOpen(false) }}>
            <FileText size={16} />
            当前编辑
          </button>
          {props.showEdit ? (
            <button type="button" role="menuitem" onClick={() => { props.onEdit(); setOpen(false) }}>
              <SquarePen size={16} />
              新建并编辑
            </button>
          ) : null}
          {props.showFavorite !== false || props.showUnpublish ? <div className="legacy-use-whole-menu-divider" role="separator" /> : null}
          {props.showFavorite !== false ? <button type="button" role="menuitem" onClick={() => { props.onFavorite(); setOpen(false) }}>
            <Star size={16} />
            {props.favorited ? '取消收藏' : '收藏'}
          </button> : null}
          {props.showUnpublish ? (
            <button type="button" role="menuitem" onClick={() => { MetisMessage.success('已下架'); setOpen(false) }}>
              <ArchiveX size={16} />
              下架
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

const workbookDirectory = [
  {
    title: '第一章 有理数',
    groups: [
      { title: '学习过程', items: ['1.1 正数和负数', '第1课时 相反意义的量', '第2课时 相反意义的量的表示', '1.2 有理数及其大小比较'] },
      { title: '学业评价', items: ['本章检测'] },
    ],
  },
  { title: '第二章 有理数的运算', groups: [{ title: '学习过程', items: ['2.1 有理数的加法'] }] },
  { title: '第三章 代数式', groups: [{ title: '学习过程', items: ['3.1 列代数式'] }] },
  { title: '第四章 整式的加减', groups: [{ title: '学习过程', items: ['4.1 整式'] }] },
  { title: '第五章 一元一次方程', groups: [{ title: '学习过程', items: ['5.1 方程'] }] },
  { title: '第六章 几何图形初步', groups: [{ title: '学习过程', items: ['6.1 立体图形与平面图形'] }] },
  {
    title: '第四章 一次函数',
    groups: [
      { title: '学习过程', items: ['4.1 函数', '4.2 一次函数与正比例函数', '4.3 一次函数的图象', '4.4 一次函数的应用'] },
      { title: '学业评价', items: ['一次函数单元检测'] },
    ],
  },
]

export function LegacyResourceDetail(props: LegacyResourceDetailProps) {
  const isWorkbook = props.record.sourceType === 'workbook'
  const paperRecordingType = getPaperRecordingType(props.record)
  const matchedPathParts = props.initialMatchedPath?.split('>').map((item) => item.trim()).filter(Boolean) ?? []
  const matchedChapterTitle = matchedPathParts.find((item) => item.includes('章'))
    ?? matchedPathParts[matchedPathParts.length - 1]
  const knownDirectoryItems = workbookDirectory.flatMap((chapter) => chapter.groups.flatMap((group) => group.items))
  const exactMatchedDirectoryNode = [...matchedPathParts].reverse().find((item) => knownDirectoryItems.includes(item))
  const matchedDirectoryNode = exactMatchedDirectoryNode
    ?? (props.initialMatchedPath?.includes('一次函数') ? '4.1 函数' : undefined)
  const [directoryNode, setDirectoryNode] = useState(matchedDirectoryNode ?? '第1课时 相反意义的量')
  const directoryRef = useRef<HTMLElement>(null)
  const [paperView, setPaperView] = useState<'original' | 'question'>('question')
  const [volumeFavorited, setVolumeFavorited] = useState(false)
  const [newEditConfirmOpen, setNewEditConfirmOpen] = useState(false)
  const [newEditPending, setNewEditPending] = useState(false)
  const sectionOrder = ['选择题', '填空题', '解答题']
  const sectionNames = ['一、单项选择题', '二、填空题', '三、解答题']
  const groupedQuestions = sectionOrder.map((type, index) => ({
    title: sectionNames[index],
    questions: props.questions.filter((question) => question.type === type),
  })).filter((section) => section.questions.length > 0)

  useEffect(() => {
    if (matchedDirectoryNode) setDirectoryNode(matchedDirectoryNode)
    if (!matchedChapterTitle) return undefined
    const frame = window.requestAnimationFrame(() => {
      const target = Array.from(directoryRef.current?.querySelectorAll<HTMLElement>('[data-directory-chapter]') ?? [])
        .find((item) => item.dataset.directoryChapter === matchedChapterTitle)
      target?.scrollIntoView({ block: 'start' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [matchedChapterTitle, matchedDirectoryNode])

  const completeEditWholeVolume = async (mode: 'plain' | 'save-first' | 'discard-first') => {
    if (!props.onCompleteEditWholeVolume || newEditPending) return
    setNewEditPending(true)
    const result = await props.onCompleteEditWholeVolume(
      props.record.sourceType,
      props.record.id,
      props.questions.length,
      props.questions,
      mode,
    )
    setNewEditPending(false)
    if (result === 'success') setNewEditConfirmOpen(false)
  }

  const handleEditWholeVolume = () => {
    if (!props.onCompleteEditWholeVolume || props.contentBusy) return
    if (props.currentDocumentHasContent && props.currentDocumentHasUnsavedChanges) {
      setNewEditConfirmOpen(true)
      return
    }
    void completeEditWholeVolume('plain')
  }

  return (
    <section className={`legacy-detail-workspace${props.embedded ? ' is-embedded' : ''}`} aria-label={props.record.title}>
      {!props.embedded ? <header className="legacy-detail-topbar">
        <div className="legacy-detail-brand">
          <span><Sparkles size={16} /></span>
          <div><strong>飞象AI题库</strong><small>初中数学 · 八年级上</small></div>
        </div>
        <nav className="legacy-detail-breadcrumb" aria-label="面包屑">
          <button type="button" onClick={props.onReturnHome}>组题首页</button>
          <i>/</i>
          <span>{resourceTypeLabels[props.record.sourceType]}</span>
          <i>/</i>
          <strong>{props.record.title}</strong>
        </nav>
        <button type="button" className="legacy-detail-home-action" onClick={props.onReturnHome}><ArrowLeft size={15} />返回首页</button>
      </header> : null}
      <div className={`legacy-detail-stage${isWorkbook ? ' has-directory' : ''}`}>
        {isWorkbook ? (
          <aside ref={directoryRef} className="legacy-workbook-directory has-no-back" aria-label="练习册章节">
            <nav className="legacy-directory-tree">
              {workbookDirectory.map((chapter) => (
                <section key={chapter.title} data-directory-chapter={chapter.title}>
                  <h3><ChevronDown size={13} />{chapter.title}</h3>
                  {chapter.groups.map((group) => (
                    <div key={group.title}>
                      <h4><ChevronDown size={12} />{group.title}</h4>
                      {group.items.map((item) => (
                        <button
                          type="button"
                          key={item}
                          className={directoryNode === item ? 'is-active' : ''}
                          onClick={() => {
                            setDirectoryNode(item)
                            props.onWorkbookDirectoryChange?.(`${chapter.title} > ${group.title} > ${item}`)
                          }}
                        >{item}</button>
                      ))}
                    </div>
                  ))}
                </section>
              ))}
            </nav>
          </aside>
        ) : null}
        <main className="legacy-detail-panel">
          <div className="legacy-detail-scroll">
            {props.initialMatchedPath && !props.hideMatchBanner ? (
              <div className="legacy-search-match-banner" role="status">
                <Search size={15} />
                <span><strong>已定位到匹配内容</strong>{props.initialMatchedPath}</span>
              </div>
            ) : null}
            {props.record.sourceType === 'paper' && paperRecordingType === 'ai' ? (
              <div className="legacy-paper-view-switch" role="tablist" aria-label="试卷查看方式">
                <button type="button" role="tab" aria-selected={paperView === 'original'} className={paperView === 'original' ? 'is-active' : ''} onClick={() => setPaperView('original')}>原卷</button>
                <button type="button" role="tab" aria-selected={paperView === 'question'} className={paperView === 'question' ? 'is-active' : ''} onClick={() => setPaperView('question')}>题目</button>
              </div>
            ) : null}
            {props.record.sourceType === 'paper' && paperView === 'original' ? (
              <section className="legacy-original-paper-preview" aria-label="原卷预览">
                <div><FileText size={38} /><strong>{props.record.title}</strong><span>原卷预览 · PDF</span></div>
                <p>原卷版式、页码和图片按线上试卷预览展示。</p>
                <MetisButton type="bordered" icon={<Download size={15} />} onClick={() => MetisMessage.success('试卷已开始下载（原型演示）')}>下载</MetisButton>
              </section>
            ) : <>
              <div className="legacy-question-global-actions">
                <button type="button" onClick={props.onToggleAnswers}><Eye size={15} />{props.showAnswers ? '隐藏答案' : '显示答案'}</button>
                <LegacyUseWholeVolumeMenu
                  embedded={props.embedded}
                  contentBusy={props.contentBusy}
                  showEdit={Boolean(props.embedded && props.onCompleteEditWholeVolume)}
                  favorited={volumeFavorited}
                  showFavorite={!isWorkbook}
                  showUnpublish={Boolean(props.schoolLibrary && props.record.sourceType === 'paper')}
                  onAddToDraft={() => void props.onUseAll()}
                  onEdit={() => void handleEditWholeVolume()}
                  onFavorite={() => setVolumeFavorited((current) => !current)}
                />
              </div>
              {groupedQuestions.map((section) => {
              const unaddedGroupQuestions = section.questions.filter((question) => !props.selectedQuestionIds.has(question.id))
              const groupPending = section.questions.some((question) => props.pendingQuestionIds.has(question.id))
              const groupAdded = unaddedGroupQuestions.length === 0
              return <section className="legacy-question-section" key={section.title} aria-label={section.title}>
                <div className="legacy-question-section-heading">
                  <h3>{section.title}</h3>
                  <div className="legacy-question-section-actions">
                    {props.embedded ? <button
                      type="button"
                      className="is-primary"
                      disabled={groupAdded || groupPending || props.contentBusy}
                      onClick={() => void props.onAddQuestionGroup(unaddedGroupQuestions)}
                    >{groupAdded ? '已添加题组' : groupPending ? '添加中…' : '＋ 添加题组'}</button> : null}
                  </div>
                </div>
                {section.questions.map((question) => {
                  const selected = props.selectedQuestionIds.has(question.id)
                  const pending = props.pendingQuestionIds.has(question.id)
                  const number = props.questions.findIndex((item) => item.id === question.id) + 1
                  return (
                    <article className={`legacy-question-card${selected ? ' is-added' : pending ? ' is-selected' : ''}`} key={question.id} aria-label={`第 ${number} 题`}>
                      <div className="legacy-question-meta">
                        {number === 1 ? <><em>AI批改</em><em>AI赋分</em></> : null}
                        <span>{question.type === '选择题' ? '单项选择题' : question.type} / {question.difficulty} / {question.estimatedMinutes}分钟</span>
                      </div>
                      <div className="legacy-question-stem"><span>{number}</span><p>{question.stem}</p></div>
                      {question.options ? <ul>{question.options.map((option) => <li key={option}>{option}</li>)}</ul> : null}
                      {props.showAnswers ? <div className="legacy-question-answer"><strong>答案：</strong>{question.answer}　<strong>解析：</strong>{question.analysis}</div> : null}
                      <footer>
                        <span>知识点：{question.knowledgePoint}</span>
                        <div>
                          <QuestionMoreMenu showUnpublish={Boolean(props.schoolLibrary)} />
                          <LibraryQuestionAiRewrite question={question} onAdd={props.onToggleQuestion} /><button type="button">解析</button><button type="button">相似题</button>
                          {props.embedded ? <button type="button" className={`is-add${selected ? ' is-added' : ''}${pending ? ' is-pending' : ''}`} disabled={selected || pending} onClick={(event) => { animateQuestionToDraft(event.currentTarget); void props.onToggleQuestion(question) }}>{selected ? '已添加' : pending ? '添加中…' : '＋ 添加'}</button> : null}
                        </div>
                      </footer>
                    </article>
                  )
                })}
              </section>
              })}
            </>}
          </div>
        </main>
      </div>
      {newEditConfirmOpen ? (
        <div className="workspace-confirm-overlay" role="presentation" onClick={() => { if (!newEditPending) setNewEditConfirmOpen(false) }}>
          <div className="workspace-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="resource-new-edit-title" onClick={(event) => event.stopPropagation()}>
            <strong id="resource-new-edit-title">新建并编辑</strong>
            <span>当前编辑有未保存的修改。保存后新建，可在「我的资源」中继续编辑；不保存则放弃本次修改，直接以当前整卷新建。</span>
            <div>
              <button type="button" disabled={newEditPending} onClick={() => setNewEditConfirmOpen(false)}>取消</button>
              <button type="button" disabled={newEditPending} onClick={() => { void completeEditWholeVolume('discard-first') }}>不保存，直接新建</button>
              <button type="button" className="is-primary" disabled={newEditPending} onClick={() => { void completeEditWholeVolume('save-first') }}>{newEditPending ? '保存中…' : '保存并新建'}</button>
            </div>
          </div>
        </div>
      ) : null}
      {props.addStatus === 'loading' ? <div className="legacy-detail-loading">正在加入当前组题…</div> : null}
    </section>
  )
}

export function LibraryPicker(props: LibraryPickerProps) {
  const variant = props.variant ?? 'dialog'
  const [dialogChapter, setDialogChapter] = useState(props.initialView === 'chapter')
  const isAll = variant === 'home' && props.showAll === true
  const detailResourceId = variant === 'home' ? new URLSearchParams(window.location.search).get('resource') : null
  const [keyword, setKeyword] = useState(props.initialSearchKeyword ?? '')
  const [sort, setSort] = useState<'recommended' | 'latest'>('recommended')
  const [category, setCategory] = useState('全部资源')
  const [chapterNode, setChapterNode] = useState(props.initialChapterNode ?? '4.1 函数')
  const [chapterBrowseMode, setChapterBrowseMode] = useState<'chapter' | 'knowledge'>('chapter')
  const [internalDetailRecord, setInternalDetailRecord] = useState<SourceRecord | null>(() => (
    detailResourceId ? allSourceRecords.find((record) => record.id === detailResourceId) ?? null : null
  ))
  const [showAnswers, setShowAnswers] = useState(false)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [pendingQuestionIds, setPendingQuestionIds] = useState<Set<string>>(new Set())
  const [pickerDetailNavHost, setPickerDetailNavHost] = useState<HTMLElement | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['paper-2']))
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  const chapterImageInputRef = useRef<HTMLInputElement>(null)
  const chapterKeywordBeforeImageRef = useRef('')
  const { imageSearch: chapterImageSearch, startRecognition: startChapterImageRecognition, retry: retryChapterImageSearch, clear: clearChapterImageSearch } = useImageQuestionSearch(() => {
    setKeyword('一次函数')
  })
  const detailControlled = props.detailRecord !== undefined
  const detailRecord = detailControlled ? props.detailRecord ?? null : internalDetailRecord
  const chapterGroups = chapterKnowledgeTree.filter((group) => group.title !== '知识点选题')
  const knowledgeGroups = chapterKnowledgeTree.filter((group) => group.title === '知识点选题')
  const chapterItems = chapterGroups.flatMap((group) => group.items)

  const selectChapterNode = (item: string) => {
    setChapterNode(item)
    setCategory(item)
  }

  const selectChapterBrowseMode = (mode: 'chapter' | 'knowledge') => {
    setChapterBrowseMode(mode)
    if (mode === 'chapter') {
      setChapterNode(chapterItems.includes(category) ? category : chapterItems[0])
      return
    }
    setChapterNode(knowledgeGroups[0]?.items[0] ?? '一次函数概念')
  }

  const closeChapterImageSearch = () => {
    clearChapterImageSearch()
    setKeyword(chapterKeywordBeforeImageRef.current)
  }

  const handleChapterImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validationMessage = validateQuestionImage(file)
      if (validationMessage) MetisMessage.error(validationMessage)
      else {
        if (!chapterImageSearch) chapterKeywordBeforeImageRef.current = keyword
        startChapterImageRecognition(file)
      }
    }
    event.currentTarget.value = ''
  }

  useEffect(() => {
    setKeyword(props.initialSearchKeyword ?? '')
    setCategory(
      props.resourceType === 'sync' && chapterItems.includes(chapterNode)
        ? chapterNode
        : '全部资源'
    )
    if (!detailControlled) {
      setInternalDetailRecord(detailResourceId ? allSourceRecords.find((record) => record.id === detailResourceId) ?? null : null)
    }
    setShowAnswers(false)
  }, [detailControlled, detailResourceId, isAll, props.initialSearchKeyword, props.libraryKind, props.resourceType])

  useEffect(() => {
    if (variant === 'dialog') {
      setDialogChapter(props.initialView === 'chapter')
      setKeyword(props.initialSearchKeyword ?? '')
      setChapterNode((current) => props.initialChapterNode ?? current)
      if (props.initialView === 'chapter') setChapterBrowseMode('chapter')
      setSelectedQuestionIds(new Set())
      setPendingQuestionIds(new Set())
      if (
        props.initialView !== 'chapter'
        && props.libraryKind === 'school'
        && props.resourceType !== 'paper'
        && props.resourceType !== 'workbook'
      ) {
        props.onResourceTypeChange('paper')
      }
    }
  }, [props.initialChapterNode, props.initialSearchKeyword, props.initialView, props.libraryKind, variant])

  useEffect(() => {
    if (variant !== 'home' || !detailRecord) return undefined
    const previousTitle = document.title
    document.title = `${detailRecord.title} - 飞象AI题库`
    return () => { document.title = previousTitle }
  }, [detailRecord, variant])

  useEffect(() => {
    props.onDetailChange?.(Boolean(detailRecord))
  }, [detailRecord, props.onDetailChange])

  useEffect(() => {
    if (variant !== 'dialog' || !detailRecord || detailControlled) {
      setPickerDetailNavHost(null)
      return undefined
    }
    const frame = window.requestAnimationFrame(() => {
      setPickerDetailNavHost(document.querySelector<HTMLElement>('[data-picker-detail-nav]'))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [detailControlled, detailRecord, variant])

  const visibleRecords = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    const source = isAll ? allSourceRecords : props.records
    const filtered = source.filter((record) => (
      (category === '全部资源'
        || isAll
        || props.resourceType !== 'paper'
        || record.highlight === category
        || record.tags?.includes(category))
      && (!normalized
        || record.title.toLowerCase().includes(normalized)
        || record.meta.toLowerCase().includes(normalized)
        || record.sourceName?.toLowerCase().includes(normalized))
    ))
    const sortByLaunchTime = props.resourceType === 'sync' || props.resourceType === 'special'
    return [...filtered].sort((a, b) => {
      if (normalized) {
        const relevance = (record: SourceRecord) => {
          if (record.title.toLowerCase().includes(normalized)) return 3
          if (record.meta.toLowerCase().includes(normalized)) return 2
          if (record.sourceName?.toLowerCase().includes(normalized)) return 1
          return 0
        }
        const relevanceDiff = relevance(b) - relevance(a)
        if (relevanceDiff !== 0) return relevanceDiff
      } else if (pinned.has(a.id) !== pinned.has(b.id)) {
        return pinned.has(a.id) ? -1 : 1
      }
      if (sortByLaunchTime || sort === 'latest') {
        return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
      }
      return (b.usageCount ?? 0) - (a.usageCount ?? 0)
    })
  }, [category, isAll, keyword, pinned, props.records, props.resourceType, sort])

  const togglePinnedRecord = (recordId: string) => {
    setPinned((current) => {
      const next = new Set(current)
      if (next.has(recordId)) {
        next.delete(recordId)
        return next
      }
      if (next.size >= 3) {
        MetisMessage.info('最多置顶 3 本练习册')
        return current
      }
      next.add(recordId)
      return next
    })
  }

  const openRecord = (record: SourceRecord) => {
    if (variant === 'dialog') {
      if (props.onOpenDetail) props.onOpenDetail(record)
      else setInternalDetailRecord(record)
      return
    }
    const targetUrl = new URL(window.location.href)
    targetUrl.searchParams.delete('mode')
    targetUrl.searchParams.set('resource', record.id)
    targetUrl.searchParams.set('resourceType', record.sourceType)
    targetUrl.searchParams.set('libraryKind', props.libraryKind)
    window.open(targetUrl.toString(), '_blank', 'noopener,noreferrer')
  }

  const previewQuestions = useMemo(() => Array.from({ length: 7 }, (_, index) => ({
    ...baseQuestions[index % baseQuestions.length],
    id: `${detailRecord?.id ?? 'preview'}-${index}`,
  })), [detailRecord])

  const chapterQuestions = useMemo(() => {
    const exactQuestion = props.initialQuestionId
      ? baseQuestions.find((question) => question.id === props.initialQuestionId)
      : undefined
    const questionPool = exactQuestion
      ? [exactQuestion, ...baseQuestions.filter((question) => question.id !== exactQuestion.id)]
      : baseQuestions
    return Array.from({ length: 8 }, (_, index) => ({
      ...questionPool[index % questionPool.length],
      id: index === 0 && exactQuestion ? exactQuestion.id : `chapter-${chapterNode}-${index}`,
    }))
  }, [chapterNode, props.initialQuestionId])

  const visibleChapterQuestions = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return chapterQuestions.filter((question) => {
      const searchableText = `${question.stem} ${question.knowledgePoint} ${question.sourceLabel} ${question.sourceDetail ?? ''}`.toLowerCase()
      return (!normalizedKeyword || searchableText.includes(normalizedKeyword))
        && (!props.initialQuestionType || question.type === props.initialQuestionType)
        && (!props.initialDifficulty || question.difficulty === props.initialDifficulty)
    })
  }, [chapterQuestions, keyword, props.initialDifficulty, props.initialQuestionType])

  const toggleSetValue = (setter: Dispatch<SetStateAction<Set<string>>>, value: string) => {
    setter((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const addQuestionImmediately = async (question: Question) => {
    if (selectedQuestionIds.has(question.id) || pendingQuestionIds.size > 0 || props.contentBusy) return
    setPendingQuestionIds(new Set([question.id]))
    const added = await props.onAddSource(
      detailRecord?.sourceType ?? props.resourceType,
      detailRecord?.id ?? 'chapter-selection',
      1,
      [question],
    )
    if (added) setSelectedQuestionIds((current) => new Set([...current, question.id]))
    setPendingQuestionIds(new Set())
  }

  const pickerDetailNav = variant === 'dialog' && detailRecord && pickerDetailNavHost ? createPortal(
    <div className="picker-detail-header-nav">
      <button type="button" onClick={() => setInternalDetailRecord(null)}>{props.libraryKind === 'fly' ? '飞象题库' : '校本题库'}</button>
      <i>/</i>
      <span>{resourceTypeLabels[detailRecord.sourceType]}</span>
      <i>/</i>
      <strong>{detailRecord.title}</strong>
    </div>,
    pickerDetailNavHost,
  ) : null

  const hasSidebar = props.resourceType !== 'workbook'
    && (variant === 'dialog' || props.resourceType === 'sync' || props.resourceType === 'special')
  const groups = props.resourceType === 'workbook' ? [] : categoryGroups[props.resourceType]
  const visibleSourceOptions = variant === 'dialog' && props.libraryKind === 'school'
    ? sourceOptions.filter((option) => option.type === 'paper' || option.type === 'workbook')
    : sourceOptions

  const detailView = detailRecord ? (
    <>
      {pickerDetailNav}
      <LegacyResourceDetail
        key={detailRecord.id}
        record={detailRecord}
        initialMatchedPath={props.initialMatchedPath}
        hideMatchBanner={props.hideMatchBanner}
        embedded={variant === 'dialog'}
        questions={previewQuestions}
        selectedQuestionIds={selectedQuestionIds}
        pendingQuestionIds={pendingQuestionIds}
        showAnswers={showAnswers}
        contentBusy={props.contentBusy}
        addStatus={props.addStatus}
        schoolLibrary={props.libraryKind === 'school'}
        showReturnNavigation={!detailControlled}
        onReturnHome={() => {
          if (variant === 'dialog') {
            setInternalDetailRecord(null)
          } else {
            const homeUrl = new URL(window.location.href)
            homeUrl.searchParams.delete('resource')
            homeUrl.searchParams.delete('resourceType')
            window.location.assign(homeUrl.toString())
          }
        }}
        onToggleAnswers={() => setShowAnswers((current) => !current)}
        onWorkbookDirectoryChange={(matchedPath) => props.onWorkbookDirectoryChange?.(detailRecord, matchedPath)}
        onToggleQuestion={addQuestionImmediately}
        onAddQuestionGroup={async (questions) => {
          if (variant !== 'dialog' || questions.length === 0 || pendingQuestionIds.size > 0 || props.contentBusy) return
          const pendingIds = questions.map((question) => question.id)
          setPendingQuestionIds(new Set(pendingIds))
          const added = await props.onAddSource(detailRecord.sourceType, detailRecord.id, questions.length, questions)
          if (added) setSelectedQuestionIds((current) => new Set([...current, ...pendingIds]))
          setPendingQuestionIds(new Set())
        }}
        onUseAll={async () => {
          if (variant === 'dialog') {
            const unaddedQuestions = previewQuestions.filter((question) => !selectedQuestionIds.has(question.id))
            if (unaddedQuestions.length === 0 || props.contentBusy) return
            const pendingIds = unaddedQuestions.map((question) => question.id)
            setPendingQuestionIds(new Set(pendingIds))
            const added = await props.onAddSource(detailRecord.sourceType, detailRecord.id, unaddedQuestions.length, unaddedQuestions)
            if (added) {
              setSelectedQuestionIds((current) => new Set([...current, ...pendingIds]))
            }
            setPendingQuestionIds(new Set())
            return
          }
          await props.onAddSource(detailRecord.sourceType, detailRecord.id, previewQuestions.length)
        }}
        currentDocumentHasContent={props.currentDocumentHasContent}
        currentDocumentHasUnsavedChanges={props.currentDocumentHasUnsavedChanges}
        onCompleteEditWholeVolume={props.onCompleteEditWholeVolume}
      />
    </>
  ) : null

  return (
    <>
    {detailView}
    <div className={`library-picker ${variant === 'home' ? 'is-home' : 'is-dialog'}${detailRecord ? ' is-behind-detail' : ''}`} aria-hidden={Boolean(detailRecord)}>
      {variant === 'dialog' ? <nav className="library-resource-tabs" aria-label="题库资源类型" role="tablist">
        {visibleSourceOptions.map((option) => {
          const Icon = resourceIcons[option.type]
          const isActive = !isAll && !dialogChapter && props.resourceType === option.type
          return (
            <button
              type="button"
              key={option.type}
              className={isActive ? 'is-active' : ''}
              role="tab"
              aria-selected={isActive}
              disabled={props.contentBusy}
              onClick={() => {
                setDialogChapter(false)
                if (option.type === 'sync') {
                  setCategory(chapterBrowseMode === 'chapter' && chapterItems.includes(chapterNode) ? chapterNode : '全部资源')
                }
                props.onResourceTypeChange(option.type)
              }}
              data-track="/click/aiQuestionHome/switchResourceTab | 切换题库资源类型 | resourceType#STRING"
            >
              <Icon size={17} /><span><strong>{option.title}</strong></span>
            </button>
          )
        })}
        {variant === 'dialog' ? (
          <button
            type="button"
            className={dialogChapter ? 'is-active' : ''}
            role="tab"
            aria-selected={dialogChapter}
            disabled={props.contentBusy}
            onClick={() => {
              setDialogChapter(true)
            }}
            data-track="/click/aiQuestionHome/switchResourceTab | 切换章节知识点选题 | 无"
          >
            <ListTree size={17} /><span><strong>章节知识点选题</strong></span>
          </button>
        ) : null}
      </nav> : null}

      {dialogChapter ? (
        <div className={`chapter-picker-browser${chapterImageSearch ? ' is-image-search' : ''}`}>
          <aside className="chapter-picker-tree" aria-label="教材章节与知识点">
            <div className="chapter-picker-tree-tabs" role="tablist" aria-label="章节或知识点选题">
              <button type="button" role="tab" aria-selected={chapterBrowseMode === 'chapter'} className={chapterBrowseMode === 'chapter' ? 'is-active' : ''} onClick={() => selectChapterBrowseMode('chapter')}>教材章节</button>
              <button type="button" role="tab" aria-selected={chapterBrowseMode === 'knowledge'} className={chapterBrowseMode === 'knowledge' ? 'is-active' : ''} onClick={() => selectChapterBrowseMode('knowledge')}>知识点</button>
            </div>
            <div className="library-textbook-switch"><BookOpenCheck size={15} /><span>人教版 / 八年级上册</span><ChevronDown size={14} /></div>
            {(chapterBrowseMode === 'chapter' ? chapterGroups : knowledgeGroups).map((group) => (
              <section key={group.title}>
                <h4><ChevronDown size={13} />{group.title}</h4>
                {group.items.map((item) => <button type="button" key={item} className={chapterNode === item ? 'is-active' : ''} onClick={() => chapterBrowseMode === 'chapter' ? selectChapterNode(item) : setChapterNode(item)}>{item}</button>)}
              </section>
            ))}
          </aside>
          <main className="chapter-picker-results">
            {chapterImageSearch ? (
              <div className="chapter-image-search-heading">
                <button type="button" onClick={closeChapterImageSearch}><ArrowLeft size={16} />返回章节知识点选题</button>
                <div><strong>图片搜题</strong><span>识别图片并查找相似题目</span></div>
                <input ref={chapterImageInputRef} className="global-resource-search-image-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="选择题目图片" onChange={handleChapterImageFile} />
              </div>
            ) : (
              <div className="chapter-picker-heading"><div><h3>{chapterNode}</h3><p>按教材章节或知识点逐题选择</p></div><div className="library-search has-image-search"><Search size={15} /><MetisInput value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索题目关键词" /><button type="button" className="library-image-search" aria-label="图片搜题" title="图片搜题" onClick={() => chapterImageInputRef.current?.click()}><ImagePlus size={16} /></button><input ref={chapterImageInputRef} className="global-resource-search-image-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="选择题目图片" onChange={handleChapterImageFile} /></div></div>
            )}
            {chapterImageSearch ? (
              <ImageQuestionSearchPanel
                value={chapterImageSearch}
                compact
                onRetry={retryChapterImageSearch}
                onReplace={() => chapterImageInputRef.current?.click()}
                onRemove={closeChapterImageSearch}
              />
            ) : null}
            <div className="chapter-question-list">
              {visibleChapterQuestions.map((question, index) => {
                const added = selectedQuestionIds.has(question.id)
                const pending = pendingQuestionIds.has(question.id)
                return (
                  <article key={question.id} className={added ? 'is-added' : ''}>
                    <div className="chapter-question-meta"><span>{question.type} / {question.difficulty} / {question.estimatedMinutes}分钟</span></div>
                    <div className="chapter-question-stem"><b>{index + 1}.</b><p>{question.stem}</p></div>
                    {question.options ? <ul>{question.options.map((option) => <li key={option}>{option}</li>)}</ul> : null}
                    <footer><span>知识点：{question.knowledgePoint}</span><div><QuestionMoreMenu showUnpublish={props.libraryKind === 'school'} /><LibraryQuestionAiRewrite question={question} onAdd={addQuestionImmediately} /><button type="button">解析</button><button type="button">相似题</button><button type="button" className={`is-add${added ? ' is-added' : ''}${pending ? ' is-pending' : ''}`} disabled={added || pending} onClick={(event) => { animateQuestionToDraft(event.currentTarget); void addQuestionImmediately(question) }}>{added ? '已添加' : pending ? '添加中…' : '＋ 添加'}</button></div></footer>
                  </article>
                )
              })}
            </div>
          </main>
        </div>
      ) : <div className={`library-browser${hasSidebar ? ' has-sidebar' : ''}`}>
        {hasSidebar ? (
          <aside className="library-category-sidebar" aria-label={`${visibleSourceOptions.find((item) => item.type === props.resourceType)?.title}分类`}>
            {props.resourceType === 'sync' ? <div className="library-textbook-switch"><BookOpenCheck size={15} /><span>人教版 / 八年级上册</span><ChevronDown size={14} /></div> : null}
            {groups.map((group, groupIndex) => (
              <section key={`${group.title ?? 'root'}-${groupIndex}`}>
                {group.title ? <h4><ChevronDown size={13} />{group.title}</h4> : null}
                {group.items.map((item) => (
                  <button type="button" key={item} className={category === item ? 'is-active' : ''} onClick={() => {
                    setCategory(item)
                    if (props.resourceType === 'sync' && item !== '全部资源') {
                      setChapterBrowseMode('chapter')
                      setChapterNode(item)
                    }
                  }}>{item}</button>
                ))}
              </section>
            ))}
          </aside>
        ) : null}

        <main className="library-results">
          <div className="library-filter-row" aria-label="题库筛选">
            <div className="library-filter-chips">
              {(isAll ? ['八年级上', '资源类型', '教材版本', '来源'] : filterLabels[props.resourceType]).map((label) => <button type="button" key={label}>{label}<ChevronDown size={13} /></button>)}
              {props.resourceType !== 'sync' && props.resourceType !== 'special' ? (
                <button type="button"><SlidersHorizontal size={14} />其他</button>
              ) : null}
            </div>
            <div className="library-search"><Search size={15} /><MetisInput value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={isAll ? '搜索全部资源名称或关键词' : `搜索${visibleSourceOptions.find((item) => item.type === props.resourceType)?.title ?? '资源'}名称或关键词`} /></div>
          </div>

          {variant === 'dialog' ? <div className="library-list-heading">
            <h3>{isAll ? '全部资源' : category === '全部资源' ? listHeadings[props.resourceType] : category}</h3>
            {props.resourceType !== 'sync' && props.resourceType !== 'special' ? (
              <div role="tablist" aria-label="资源排序">
                <button type="button" className={sort === 'recommended' ? 'is-active' : ''} onClick={() => setSort('recommended')}>推荐</button>
                <button type="button" className={sort === 'latest' ? 'is-active' : ''} onClick={() => setSort('latest')}>最新</button>
              </div>
            ) : null}
          </div> : null}

          <div className="library-record-scroll">
            {props.listStatus === 'loading' ? <div className="library-loading"><span /><span /><span /><span /></div> : null}
            {props.listStatus === 'error' ? <div className="library-feedback"><strong>资源加载失败</strong><p>当前题单不受影响。</p><MetisButton onClick={() => props.onResourceTypeChange(props.resourceType)}>重新加载</MetisButton></div> : null}
            {props.listStatus === 'success' && visibleRecords.length === 0 ? <div className="library-feedback"><strong>没有找到匹配资源</strong><p>换个关键词或减少筛选条件试试。</p></div> : null}
            {props.listStatus === 'success' ? (
              <div className={`library-record-grid library-record-grid--${isAll ? 'all' : props.resourceType}`}>
                {visibleRecords.map((record) => (
                  <article className={`library-resource-card${record.sourceType === 'workbook' ? ' is-workbook-card' : ''}`} key={record.id}>
                    <button
                      type="button"
                      className="library-card-main"
                      onClick={() => openRecord(record)}
                      data-track="/click/aiQuestionHome/openResourceDetail | 打开资源详情 | resourceId#STRING"
                    >
                      {record.sourceType === 'workbook' ? (
                        <span className={`library-workbook-cover library-workbook-cover--${(Number(record.id.split('-').slice(-1)[0]) || 1) % 6}`} aria-hidden="true">
                          <small>同步练习</small>
                          <strong>{record.title.slice(0, 6)}</strong>
                          <em>数学</em>
                        </span>
                      ) : null}
                      <span className="library-card-copy">
                        {record.sourceType === 'workbook' ? <span className="library-workbook-type">{record.highlight || '同步练习'}</span> : <span className="library-card-tags">{getResourceCardTags(record).map((tag) => <em className={tag === 'AI录题' ? 'is-ai-recording' : tag === '委托录题' ? 'is-delegated-recording' : undefined} key={tag}>{tag}</em>)}</span>}
                        <strong>{record.title}{record.sourceType === 'workbook' ? <span className="library-workbook-year">2025-2026学年</span> : null}</strong>
                        {record.sourceType === 'workbook' ? <small className="library-workbook-meta">{record.meta.replace(/·/g, ' ')}</small> : <small className="library-card-date"><Clock3 size={13} />{record.updatedAt ?? '最近更新'}</small>}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={favorites.has(record.id) ? '取消收藏' : '收藏'}
                      onClick={() => toggleSetValue(setFavorites, record.id)}
                      className={`library-card-favorite${favorites.has(record.id) ? ' is-active' : ''}`}
                    >
                      <Star size={record.sourceType === 'workbook' ? 18 : 15} />{record.sourceType === 'workbook' ? null : '收藏'}
                    </button>
                    {props.resourceType === 'workbook' ? (
                      <button
                        type="button"
                        aria-label={pinned.has(record.id) ? '取消置顶' : '置顶'}
                        title={pinned.has(record.id) ? '取消置顶' : '置顶'}
                        onClick={() => togglePinnedRecord(record.id)}
                        className={`library-card-pin${pinned.has(record.id) ? ' is-active' : ''}`}
                      >
                        <Pin size={15} />
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </main>
      </div>}
    </div>
    </>
  )
}

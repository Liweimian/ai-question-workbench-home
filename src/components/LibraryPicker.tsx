import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import { MetisButton, MetisInput } from '@yuanfudao/metis-web-component'
import {
  ArrowLeft,
  BookOpenCheck,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  ListTree,
  SquarePen,
  ListChecks,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
} from 'lucide-react'
import { baseQuestions, sourceOptions, sourceRecords as allSourceRecords } from '../data/workbenchData'
import type { AsyncStatus, LibraryInitialView, Question, ResourceType, SourceRecord } from '../prototype/types'
import { animateQuestionToDraft } from '../utils/animateQuestionToDraft'

interface LibraryPickerProps {
  variant?: 'dialog' | 'home'
  libraryKind: 'fly' | 'school'
  initialView?: LibraryInitialView
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
  onResourceTypeChange: (type: ResourceType) => void
  onAddSource: (type: ResourceType, sourceId: string, count: number, selectedQuestions?: Question[]) => Promise<boolean>
  currentDocumentHasContent?: boolean
  onCompleteEditWholeVolume?: (
    type: ResourceType,
    sourceId: string,
    count: number,
    selectedQuestions: Question[],
    mode: 'plain' | 'discard' | 'save-first',
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
  sync: ['来自', '难度', '资源库'],
  special: ['来自', '难度'],
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

interface LegacyResourceDetailProps {
  record: SourceRecord
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
  onUseAll: () => Promise<void>
  currentDocumentHasContent?: boolean
  onCompleteEditWholeVolume?: (
    type: ResourceType,
    sourceId: string,
    count: number,
    selectedQuestions: Question[],
    mode: 'plain' | 'discard' | 'save-first',
  ) => Promise<'success' | 'failed'>
}

function LegacyUseWholeVolumeMenu(props: {
  embedded?: boolean
  contentBusy: boolean
  showEdit: boolean
  onAddToDraft: () => void
  onEdit: () => void
  onFavorite: () => void
  favorited: boolean
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
            加入当前编辑
          </button>
          {props.showEdit ? (
            <button type="button" role="menuitem" onClick={() => { props.onEdit(); setOpen(false) }}>
              <SquarePen size={16} />
              编辑
            </button>
          ) : null}
          <div className="legacy-use-whole-menu-divider" role="separator" />
          <button type="button" role="menuitem" onClick={() => { props.onFavorite(); setOpen(false) }}>
            <Star size={16} />
            {props.favorited ? '取消收藏' : '收藏'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function LegacyResourceDetail(props: LegacyResourceDetailProps) {
  const [volumeFavorited, setVolumeFavorited] = useState(false)
  const [editConfirmOpen, setEditConfirmOpen] = useState(false)
  const [editConfirmPending, setEditConfirmPending] = useState(false)
  const sectionOrder = ['选择题', '填空题', '解答题']
  const sectionNames = ['一、单项选择题', '二、填空题', '三、解答题']
  const groupedQuestions = sectionOrder.map((type, index) => ({
    title: sectionNames[index],
    questions: props.questions.filter((question) => question.type === type),
  })).filter((section) => section.questions.length > 0)

  const handleEditWholeVolume = async () => {
    if (!props.onCompleteEditWholeVolume || props.contentBusy) return
    if (props.currentDocumentHasContent) {
      setEditConfirmOpen(true)
      return
    }
    await props.onCompleteEditWholeVolume(
      props.record.sourceType,
      props.record.id,
      props.questions.length,
      props.questions,
      'plain',
    )
  }

  const handleCompleteEditWholeVolume = async (mode: 'discard' | 'save-first') => {
    if (!props.onCompleteEditWholeVolume || editConfirmPending) return
    setEditConfirmPending(true)
    try {
      await props.onCompleteEditWholeVolume(
        props.record.sourceType,
        props.record.id,
        props.questions.length,
        props.questions,
        mode,
      )
      setEditConfirmOpen(false)
    } finally {
      setEditConfirmPending(false)
    }
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
      <div className="legacy-detail-stage">
        <main className="legacy-detail-panel">
          <div className="legacy-detail-scroll">
            {groupedQuestions.map((section, sectionIndex) => (
              <section className="legacy-question-section" key={section.title} aria-label={section.title}>
                <div className="legacy-question-section-heading">
                  <h3>{section.title}</h3>
                  {sectionIndex === 0 ? <div className="legacy-question-section-actions">
                    <button type="button" onClick={props.onToggleAnswers}><Eye size={15} />{props.showAnswers ? '隐藏答案' : '显示答案'}</button>
                    <LegacyUseWholeVolumeMenu
                      embedded={props.embedded}
                      contentBusy={props.contentBusy}
                      showEdit={Boolean(props.embedded && props.onCompleteEditWholeVolume)}
                      favorited={volumeFavorited}
                      onAddToDraft={() => void props.onUseAll()}
                      onEdit={() => void handleEditWholeVolume()}
                      onFavorite={() => setVolumeFavorited((current) => !current)}
                    />
                  </div> : null}
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
                          <button type="button">纠错</button><button type="button"><Star size={14} />收藏</button><button type="button">解析</button><button type="button">相似题</button>
                          {props.embedded ? <button type="button" className={`is-add${selected ? ' is-added' : ''}${pending ? ' is-pending' : ''}`} disabled={selected || pending} onClick={(event) => { animateQuestionToDraft(event.currentTarget); void props.onToggleQuestion(question) }}>{selected ? '已添加' : pending ? '添加中…' : '＋ 添加'}</button> : null}
                        </div>
                      </footer>
                    </article>
                  )
                })}
              </section>
            ))}
          </div>
        </main>
      </div>
      {props.addStatus === 'loading' ? <div className="legacy-detail-loading">正在加入当前组题…</div> : null}
      {editConfirmOpen ? (
        <div className="workspace-confirm-overlay" role="presentation" onClick={() => { if (!editConfirmPending) setEditConfirmOpen(false) }}>
          <div
            className="workspace-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legacy-whole-volume-unsaved-title"
            onClick={(event) => event.stopPropagation()}
          >
            <strong id="legacy-whole-volume-unsaved-title">当前题单尚未保存</strong>
            <span>右侧正在编辑的题单还有内容。请先保存后再新建并载入整卷；或不保存，直接用整卷覆盖当前题单。</span>
            <div>
              <button type="button" disabled={editConfirmPending} onClick={() => setEditConfirmOpen(false)}>取消</button>
              <button type="button" disabled={editConfirmPending} onClick={() => void handleCompleteEditWholeVolume('discard')}>不保存，直接覆盖</button>
              <button
                type="button"
                className="is-primary"
                disabled={editConfirmPending}
                onClick={() => void handleCompleteEditWholeVolume('save-first')}
              >
                {editConfirmPending ? '处理中…' : '先保存再新建'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export function LibraryPicker(props: LibraryPickerProps) {
  const variant = props.variant ?? 'dialog'
  const [dialogChapter, setDialogChapter] = useState(props.initialView === 'chapter')
  const isAll = variant === 'home' && props.showAll === true
  const detailResourceId = variant === 'home' ? new URLSearchParams(window.location.search).get('resource') : null
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState<'recommended' | 'latest'>('recommended')
  const [category, setCategory] = useState('全部资源')
  const [chapterNode, setChapterNode] = useState('4.1 函数')
  const [internalDetailRecord, setInternalDetailRecord] = useState<SourceRecord | null>(() => (
    detailResourceId ? allSourceRecords.find((record) => record.id === detailResourceId) ?? null : null
  ))
  const [showAnswers, setShowAnswers] = useState(false)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [pendingQuestionIds, setPendingQuestionIds] = useState<Set<string>>(new Set())
  const [pickerDetailNavHost, setPickerDetailNavHost] = useState<HTMLElement | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['paper-2']))
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  const detailControlled = props.detailRecord !== undefined
  const detailRecord = detailControlled ? props.detailRecord ?? null : internalDetailRecord

  useEffect(() => {
    setKeyword('')
    setCategory('全部资源')
    if (!detailControlled) {
      setInternalDetailRecord(detailResourceId ? allSourceRecords.find((record) => record.id === detailResourceId) ?? null : null)
    }
    setShowAnswers(false)
  }, [detailControlled, detailResourceId, isAll, props.libraryKind, props.resourceType])

  useEffect(() => {
    if (variant === 'dialog') {
      setDialogChapter(props.initialView === 'chapter')
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
  }, [props.initialView, props.libraryKind, variant])

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
      if (pinned.has(a.id) !== pinned.has(b.id)) return pinned.has(a.id) ? -1 : 1
      if (sortByLaunchTime || sort === 'latest') {
        return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
      }
      return (b.usageCount ?? 0) - (a.usageCount ?? 0)
    })
  }, [category, isAll, keyword, pinned, props.records, props.resourceType, sort])

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

  const chapterQuestions = useMemo(() => Array.from({ length: 8 }, (_, index) => ({
    ...baseQuestions[index % baseQuestions.length],
    id: `chapter-${chapterNode}-${index}`,
  })), [chapterNode])

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
        embedded={variant === 'dialog'}
        questions={previewQuestions}
        selectedQuestionIds={selectedQuestionIds}
        pendingQuestionIds={pendingQuestionIds}
        showAnswers={showAnswers}
        contentBusy={props.contentBusy}
        addStatus={props.addStatus}
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
        onToggleQuestion={addQuestionImmediately}
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
        <div className="chapter-picker-browser">
          <aside className="chapter-picker-tree" aria-label="教材章节与知识点">
            <div className="library-textbook-switch"><BookOpenCheck size={15} /><span>人教版 / 八年级上册</span><ChevronDown size={14} /></div>
            {chapterKnowledgeTree.map((group) => (
              <section key={group.title}>
                <h4><ChevronDown size={13} />{group.title}</h4>
                {group.items.map((item) => <button type="button" key={item} className={chapterNode === item ? 'is-active' : ''} onClick={() => setChapterNode(item)}>{item}</button>)}
              </section>
            ))}
          </aside>
          <main className="chapter-picker-results">
            <div className="chapter-picker-heading"><div><h3>{chapterNode}</h3><p>按教材章节或知识点逐题选择</p></div><div className="library-search"><Search size={15} /><MetisInput value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索题目关键词" /></div></div>
            <div className="chapter-question-list">
              {chapterQuestions.filter((question) => !keyword.trim() || question.stem.includes(keyword.trim())).map((question, index) => {
                const added = selectedQuestionIds.has(question.id)
                const pending = pendingQuestionIds.has(question.id)
                return (
                  <article key={question.id} className={added ? 'is-added' : ''}>
                    <div className="chapter-question-meta"><span>{question.type} / {question.difficulty} / {question.estimatedMinutes}分钟</span></div>
                    <div className="chapter-question-stem"><b>{index + 1}.</b><p>{question.stem}</p></div>
                    {question.options ? <ul>{question.options.map((option) => <li key={option}>{option}</li>)}</ul> : null}
                    <footer><span>知识点：{question.knowledgePoint}</span><div><button type="button">收藏</button><button type="button">解析</button><button type="button">相似题</button><button type="button" className={`is-add${added ? ' is-added' : ''}${pending ? ' is-pending' : ''}`} disabled={added || pending} onClick={(event) => { animateQuestionToDraft(event.currentTarget); void addQuestionImmediately(question) }}>{added ? '已添加' : pending ? '添加中…' : '＋ 添加'}</button></div></footer>
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
                  <button type="button" key={item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}</button>
                ))}
              </section>
            ))}
          </aside>
        ) : null}

        <main className="library-results">
          <div className="library-filter-row" aria-label="题库筛选">
            <div className="library-filter-chips">
              {(isAll ? ['八年级上', '资源类型', '教材版本', '来源'] : filterLabels[props.resourceType]).map((label) => <button type="button" key={label}>{label}<ChevronDown size={13} /></button>)}
              <button type="button"><SlidersHorizontal size={14} />其他</button>
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
                  <article className="library-resource-card" key={record.id}>
                    <button
                      type="button"
                      className="library-card-main"
                      onClick={() => openRecord(record)}
                      data-track="/click/aiQuestionHome/openResourceDetail | 打开资源详情 | resourceId#STRING"
                    >
                      <span className="library-card-copy">
                        <span className="library-card-tags">
                          {getResourceCardTags(record).map((tag) => <em key={tag}>{tag}</em>)}
                        </span>
                        <strong>{record.title}</strong>
                        <small className="library-card-date"><Clock3 size={13} />{record.updatedAt ?? '最近更新'}</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={favorites.has(record.id) ? '取消收藏' : '收藏'}
                      onClick={() => toggleSetValue(setFavorites, record.id)}
                      className={`library-card-favorite${favorites.has(record.id) ? ' is-active' : ''}`}
                    >
                      <Star size={15} />收藏
                    </button>
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

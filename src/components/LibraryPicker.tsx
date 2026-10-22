import { useEffect, useMemo, useState } from 'react'
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
  ListChecks,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
} from 'lucide-react'
import { baseQuestions, sourceOptions, sourceRecords as allSourceRecords } from '../data/workbenchData'
import type { AsyncStatus, LibraryInitialView, Question, ResourceType, SourceRecord } from '../prototype/types'

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
  onShowAllChange?: (showAll: boolean) => void
  onDetailChange?: (open: boolean) => void
  onResourceTypeChange: (type: ResourceType) => void
  onAddSource: (type: ResourceType, sourceId: string, count: number) => void
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

const workbookDirectory = [
  {
    title: '第四章 一次函数',
    lessons: [
      { title: '4.1 函数', sections: ['达标检测', '基础练习', '能力提升', '拓展训练', '自我反思'] },
      { title: '4.2 一次函数与正比例函数', sections: [] },
      { title: '4.3 一次函数的图象', sections: [] },
    ],
  },
  { title: '第五章 二元一次方程组', lessons: [] },
  { title: '第六章 数据的分析', lessons: [] },
]

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
  onReturnHome: () => void
  onToggleAnswers: () => void
  onToggleQuestion: (questionId: string) => void
  onUseAll: () => void
}

function LegacyResourceDetail(props: LegacyResourceDetailProps) {
  const [workbookSection, setWorkbookSection] = useState('达标检测')
  const sectionOrder = ['选择题', '填空题', '解答题']
  const sectionNames = ['一、单项选择题', '二、填空题', '三、解答题']
  const groupedQuestions = sectionOrder.map((type, index) => ({
    title: sectionNames[index],
    questions: props.questions.filter((question) => question.type === type),
  })).filter((section) => section.questions.length > 0)

  return (
    <section className={`legacy-detail-workspace${props.embedded ? ' is-embedded' : ''}`} aria-label={props.record.title}>
      {!props.embedded ? <header className="legacy-detail-topbar">
        <div className="legacy-detail-brand">
          <span><Sparkles size={16} /></span>
          <div><strong>飞象 AI 组题工作台</strong><small>初中数学 · 八年级上</small></div>
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
      <div className={`legacy-detail-stage${props.record.sourceType === 'workbook' ? ' has-directory' : ''}`}>
        {props.record.sourceType === 'workbook' ? (
          <aside className="legacy-workbook-directory" aria-label={`${props.record.title}目录`}>
            <button type="button" className="legacy-workbook-back"><ArrowLeft size={15} />练习册</button>
            <h2>{props.record.title}</h2>
            <div className="legacy-directory-tree" role="tree" aria-label="教材章节目录">
              {workbookDirectory.map((chapter, chapterIndex) => (
                <section key={chapter.title}>
                  <h3><ChevronDown size={14} />{chapter.title}</h3>
                  {chapter.lessons.map((lesson) => (
                    <div key={lesson.title}>
                      <h4 className={chapterIndex === 0 ? 'is-current' : ''}><ChevronDown size={13} />{lesson.title}{chapterIndex === 0 ? <em>已关联</em> : null}</h4>
                      {lesson.sections.map((section) => (
                        <button
                          type="button"
                          role="treeitem"
                          key={section}
                          className={workbookSection === section ? 'is-active' : ''}
                          onClick={() => setWorkbookSection(section)}
                        >
                          {section}
                        </button>
                      ))}
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </aside>
        ) : null}
        <main className="legacy-detail-panel">
          <div className="legacy-detail-scroll">
            {groupedQuestions.map((section, sectionIndex) => (
              <section className="legacy-question-section" key={section.title} aria-label={section.title}>
                <div className="legacy-question-section-heading">
                  <h3>{section.title}</h3>
                  {sectionIndex === 0 ? <div className="legacy-question-section-actions">
                    <button type="button" onClick={props.onToggleAnswers}><Eye size={15} />{props.showAnswers ? '隐藏答案' : '显示答案'}</button>
                    <button type="button" className="is-primary" disabled={props.contentBusy} onClick={props.onUseAll}><FileText size={15} />{props.embedded ? '选择整卷' : '使用整卷'}<ChevronDown size={13} /></button>
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
                          {props.embedded ? <button type="button" className="is-add" disabled={props.contentBusy || selected} onClick={() => props.onToggleQuestion(question.id)}>{selected || pending ? '已添加' : '＋ 添加'}</button> : null}
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
  const [detailRecord, setDetailRecord] = useState<SourceRecord | null>(() => (
    detailResourceId ? allSourceRecords.find((record) => record.id === detailResourceId) ?? null : null
  ))
  const [showAnswers, setShowAnswers] = useState(false)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [pickerPendingIds, setPickerPendingIds] = useState<Set<string>>(new Set())
  const [pickerDetailNavHost, setPickerDetailNavHost] = useState<HTMLElement | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['paper-2']))
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  const pickerActionHost = variant === 'dialog'
    ? document.querySelector<HTMLElement>('[data-picker-selection-actions]')
    : null

  useEffect(() => {
    setKeyword('')
    setCategory('全部资源')
    setDetailRecord(detailResourceId ? allSourceRecords.find((record) => record.id === detailResourceId) ?? null : null)
    setShowAnswers(false)
  }, [detailResourceId, isAll, props.libraryKind, props.resourceType])

  useEffect(() => {
    if (variant === 'dialog') {
      setDialogChapter(props.initialView === 'chapter')
      setSelectedQuestionIds(new Set())
      setPickerPendingIds(new Set())
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
    document.title = `${detailRecord.title} - 飞象 AI 组题工作台`
    return () => { document.title = previousTitle }
  }, [detailRecord, variant])

  useEffect(() => {
    props.onDetailChange?.(Boolean(detailRecord))
  }, [detailRecord, props.onDetailChange])

  useEffect(() => {
    if (variant !== 'dialog' || !detailRecord) {
      setPickerDetailNavHost(null)
      return undefined
    }
    const frame = window.requestAnimationFrame(() => {
      setPickerDetailNavHost(document.querySelector<HTMLElement>('[data-picker-detail-nav]'))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [detailRecord, variant])

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
    return [...filtered].sort((a, b) => {
      if (pinned.has(a.id) !== pinned.has(b.id)) return pinned.has(a.id) ? -1 : 1
      if (sort === 'recommended') return (b.usageCount ?? 0) - (a.usageCount ?? 0)
      return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
    })
  }, [category, isAll, keyword, pinned, props.records, props.resourceType, sort])

  const openRecord = (record: SourceRecord) => {
    if (variant === 'dialog') {
      setDetailRecord(record)
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

  const commitPickerQuestions = () => {
    if (pickerPendingIds.size === 0 || props.contentBusy) return
    const pendingIds = [...pickerPendingIds]
    setSelectedQuestionIds((current) => new Set([...current, ...pendingIds]))
    setPickerPendingIds(new Set())
    props.onAddSource(props.resourceType, 'picker-selection', pendingIds.length)
  }

  const pickerBatchAction = variant === 'dialog' && pickerActionHost ? createPortal(
    <div className="picker-selection-action" aria-live="polite">
      <span>已选 <strong>{pickerPendingIds.size}</strong> 道题</span>
      <MetisButton type="primary" disabled={pickerPendingIds.size === 0 || props.contentBusy} onClick={commitPickerQuestions}>
        添加
      </MetisButton>
    </div>,
    pickerActionHost,
  ) : null

  const pickerDetailNav = variant === 'dialog' && detailRecord && pickerDetailNavHost ? createPortal(
    <div className="picker-detail-header-nav">
      <button type="button" onClick={() => setDetailRecord(null)}>{props.libraryKind === 'fly' ? '飞象题库' : '校本题库'}</button>
      <i>/</i>
      <span>{resourceTypeLabels[detailRecord.sourceType]}</span>
      <i>/</i>
      <strong>{detailRecord.title}</strong>
    </div>,
    pickerDetailNavHost,
  ) : null

  if (detailRecord) {
    return (
      <>
      {pickerBatchAction}
      {pickerDetailNav}
      <LegacyResourceDetail
        record={detailRecord}
        embedded={variant === 'dialog'}
        questions={previewQuestions}
        selectedQuestionIds={selectedQuestionIds}
        pendingQuestionIds={pickerPendingIds}
        showAnswers={showAnswers}
        contentBusy={props.contentBusy}
        addStatus={props.addStatus}
        onReturnHome={() => {
          if (variant === 'dialog') {
            setDetailRecord(null)
          } else {
            const homeUrl = new URL(window.location.href)
            homeUrl.searchParams.delete('resource')
            homeUrl.searchParams.delete('resourceType')
            window.location.assign(homeUrl.toString())
          }
        }}
        onToggleAnswers={() => setShowAnswers((current) => !current)}
        onToggleQuestion={(questionId) => {
          if (selectedQuestionIds.has(questionId)) return
          toggleSetValue(setPickerPendingIds, questionId)
        }}
        onUseAll={() => {
          if (variant === 'dialog') {
            setPickerPendingIds((current) => new Set([
              ...current,
              ...previewQuestions.filter((question) => !selectedQuestionIds.has(question.id)).map((question) => question.id),
            ]))
            return
          }
          props.onAddSource(detailRecord.sourceType, detailRecord.id, previewQuestions.length)
        }}
      />
      </>
    )
  }

  const hasSidebar = props.resourceType !== 'workbook'
    && (variant === 'dialog' || props.resourceType === 'sync' || props.resourceType === 'special')
  const groups = props.resourceType === 'workbook' ? [] : categoryGroups[props.resourceType]
  const visibleSourceOptions = variant === 'dialog' && props.libraryKind === 'school'
    ? sourceOptions.filter((option) => option.type === 'paper' || option.type === 'workbook')
    : sourceOptions

  return (
    <div className={`library-picker ${variant === 'home' ? 'is-home' : 'is-dialog'}`}>
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

      {pickerBatchAction}

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
                const pending = pickerPendingIds.has(question.id)
                return (
                  <article key={question.id} className={added ? 'is-added' : pending ? 'is-selected' : ''}>
                    <div className="chapter-question-meta"><span>{question.type} / {question.difficulty} / {question.estimatedMinutes}分钟</span></div>
                    <div className="chapter-question-stem"><b>{index + 1}.</b><p>{question.stem}</p></div>
                    {question.options ? <ul>{question.options.map((option) => <li key={option}>{option}</li>)}</ul> : null}
                    <footer><span>知识点：{question.knowledgePoint}</span><div><button type="button">收藏</button><button type="button">解析</button><button type="button">相似题</button><button type="button" className="is-add" disabled={props.contentBusy || added} onClick={() => toggleSetValue(setPickerPendingIds, question.id)}>{added || pending ? '已添加' : '＋ 添加'}</button></div></footer>
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
            <div role="tablist" aria-label="资源排序">
              <button type="button" className={sort === 'recommended' ? 'is-active' : ''} onClick={() => setSort('recommended')}>推荐</button>
              <button type="button" className={sort === 'latest' ? 'is-active' : ''} onClick={() => setSort('latest')}>最新</button>
            </div>
          </div> : null}

          <div className="library-record-scroll">
            {props.listStatus === 'loading' ? <div className="library-loading"><span /><span /><span /><span /></div> : null}
            {props.listStatus === 'error' ? <div className="library-feedback"><strong>资源加载失败</strong><p>当前题单不受影响。</p><MetisButton onClick={() => props.onResourceTypeChange(props.resourceType)}>重新加载</MetisButton></div> : null}
            {props.listStatus === 'success' && visibleRecords.length === 0 ? <div className="library-feedback"><strong>没有找到匹配资源</strong><p>换个关键词或减少筛选条件试试。</p></div> : null}
            {props.listStatus === 'success' ? (
              <div className={`library-record-grid library-record-grid--${isAll ? 'all' : props.resourceType}`}>
                {visibleRecords.map((record) => (
                  <article className="library-resource-card" key={record.id}>
                    <button type="button" className="library-card-main" onClick={() => openRecord(record)}>
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
  )
}

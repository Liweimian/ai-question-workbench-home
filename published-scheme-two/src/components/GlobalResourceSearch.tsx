import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { MetisButton, MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Clock3,
  FileText,
  Layers3,
  ListTree,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { globalResourceSearchGroupLabels } from '../data/globalResourceSearchData'
import type { GlobalSearchGroupType } from '../data/globalResourceSearchData'
import type { Question } from '../prototype/types'
import {
  GlobalResourceSearchError,
  globalResourceSearchRepository,
} from '../services/globalResourceSearchRepository'
import type {
  GlobalResourceSearchHit,
  GlobalResourceSearchRepository,
  GlobalResourceSearchResult,
  GlobalSearchIntent,
  GlobalSearchRequestStatus,
  ParsedGlobalResourceSearchQuery,
  ParsedGlobalSearchCondition,
} from '../services/globalResourceSearchRepository'
import {
  ImageQuestionSearchPanel,
  useImageQuestionSearch,
  validateQuestionImage,
} from './ImageQuestionSearchPanel'
import type { ImageQuestionSearchState } from './ImageQuestionSearchPanel'

const RECENT_SEARCH_STORAGE_KEY = 'ai-question-global-resource-searches'
const MAX_RECENT_SEARCHES = 10
const RECENT_SEARCH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000
const DEFAULT_VISIBLE_RESOURCE_SIZE = 5
const DEFAULT_VISIBLE_QUESTION_SIZE = 10
const QUESTION_LOAD_SIZE = 10
const MAX_VISIBLE_QUESTIONS = 50
const DEFAULT_VISIBLE_WORKBOOK_SECTIONS = 3

interface RecentSearchEntry {
  query: string
  searchedAt: number
}

const resultIconMap = {
  question: ListTree,
  workbook: BookOpen,
  sync: Layers3,
  special: Target,
  paper: FileText,
} satisfies Record<GlobalSearchGroupType, typeof Search>

function readRecentSearches(): RecentSearchEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_STORAGE_KEY) ?? '[]')
    const now = Date.now()
    return Array.isArray(parsed)
      ? parsed.flatMap((item): RecentSearchEntry[] => {
          if (typeof item === 'string' && item.trim()) return [{ query: item.trim(), searchedAt: now }]
          if (item && typeof item === 'object' && typeof item.query === 'string' && typeof item.searchedAt === 'number') {
            return item.query.trim() && now - item.searchedAt <= RECENT_SEARCH_RETENTION_MS
              ? [{ query: item.query.trim(), searchedAt: item.searchedAt }]
              : []
          }
          return []
        }).slice(0, MAX_RECENT_SEARCHES)
      : []
  } catch {
    return []
  }
}

function persistRecentSearches(searches: RecentSearchEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(RECENT_SEARCH_STORAGE_KEY, JSON.stringify(searches.slice(0, MAX_RECENT_SEARCHES)))
  } catch {
    // Storage may be unavailable in private or embedded environments; search still works.
  }
}

export interface GlobalResourceSearchBarProps {
  value: string
  panelId: string
  expanded: boolean
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  onChange: (value: string) => void
  onFocus: () => void
  onSubmit: () => void
  onClear: () => void
  onImageSearch: () => void
}

export function GlobalResourceSearchBar({
  value,
  panelId,
  expanded,
  loading = false,
  disabled = false,
  placeholder = '说说你想找什么题、练习或试卷',
  onChange,
  onFocus,
  onSubmit,
  onClear,
  onImageSearch,
}: GlobalResourceSearchBarProps) {
  return (
    <div className="global-resource-search-bar" role="search" aria-label="AI智搜">
      <Search className="global-resource-search-leading-icon" size={17} aria-hidden="true" />
      <span className="global-resource-search-name">AI智搜</span>
      <MetisInput
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="AI智搜"
        aria-expanded={expanded}
        aria-controls={expanded ? panelId : undefined}
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing && value.trim() && !loading && !disabled) {
            event.preventDefault()
            onSubmit()
          }
        }}
      />
      {value ? (
        <MetisButton
          type="borderless"
          className="global-resource-search-clear"
          icon={<X size={15} />}
          aria-label="清空搜索"
          title="清空搜索"
          disabled={disabled}
          onClick={onClear}
        />
      ) : null}
      <MetisButton
        type="borderless"
        className="global-resource-search-image"
        icon={<Plus size={17} />}
        aria-label="上传图片搜题"
        title="图片搜题"
        disabled={disabled || loading}
        onClick={onImageSearch}
      />
      <MetisButton
        type="primary"
        className="global-resource-search-submit"
        icon={<Search size={16} />}
        loading={loading}
        disabled={disabled || loading || !value.trim()}
        aria-label="搜索 AI智搜"
        title="AI智搜"
        onClick={onSubmit}
        data-track="/click/aiQuestionHome/globalResourceSearch | AI智搜 | query#STRING"
      />
    </div>
  )
}

export interface GlobalResourceSearchWorkspaceProps {
  id: string
  style?: CSSProperties
  presentation?: 'popover' | 'task'
  status: GlobalSearchRequestStatus
  query: string
  submittedQuery: string
  parsed: ParsedGlobalResourceSearchQuery | null
  result: GlobalResourceSearchResult | null
  errorMessage?: string
  recentSearches: string[]
  disabled?: boolean
  onQueryChange: (value: string) => void
  onSubmit: () => void
  onClear: () => void
  onImageSearch: () => void
  onSuggestionSelect: (query: string) => void
  onRetry: () => void
  onResultSelect: (hit: GlobalResourceSearchHit) => void
  onAddQuestion?: (question: Question) => Promise<boolean>
  onOpenCompose: (prompt: string) => void
  onSearchExisting: (query: string) => void
  onRemoveCondition?: (condition: ParsedGlobalSearchCondition) => void
  onClose: () => void
  onViewAllGroup?: (type: GlobalSearchGroupType, result: GlobalResourceSearchResult) => void
  imageSearch?: ImageQuestionSearchState | null
  onRetryImageSearch?: () => void
  onReplaceImage?: () => void
  onRemoveImage?: () => void
}

function SearchConditions({
  parsed,
  onRemove,
}: {
  parsed: ParsedGlobalResourceSearchQuery | null
  onRemove?: (condition: ParsedGlobalSearchCondition) => void
}) {
  if (!parsed?.conditions.length) return null
  return (
    <div className="global-resource-search-conditions" aria-label="已解析的搜索条件">
      <span>已理解为</span>
      <div>
        {parsed.conditions.map((item) => item.removable && onRemove ? (
          <button
            type="button"
            className="global-resource-search-condition is-removable"
            key={item.id}
            title={`移除条件：${item.label}`}
            onClick={() => onRemove(item)}
          >
            {item.label}<X size={12} />
          </button>
        ) : (
          <span className="global-resource-search-condition" key={item.id}>{item.label}</span>
        ))}
      </div>
    </div>
  )
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getHighlightTerms(parsed: ParsedGlobalResourceSearchQuery) {
  return Array.from(new Set([
    ...parsed.conditions.filter((item) => item.source === 'query').map((item) => item.sourceText),
    parsed.topic,
    ...parsed.searchTerms,
  ].filter((item): item is string => Boolean(item?.trim())))).sort((left, right) => right.length - left.length)
}

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
  return <>{text.split(pattern).map((part, index) => terms.some((term) => term.toLowerCase() === part.toLowerCase()) ? <mark key={`${part}-${index}`}>{part}</mark> : part)}</>
}

function ResourceSearchResult({
  hit,
  icon: Icon,
  highlightTerms,
  onSelect,
}: {
  hit: GlobalResourceSearchHit
  icon: typeof Search
  highlightTerms: string[]
  onSelect: (hit: GlobalResourceSearchHit) => void
}) {
  const [sectionsExpanded, setSectionsExpanded] = useState(false)
  const sections = hit.groupType === 'workbook' ? hit.matchedSections ?? [] : []
  const visibleSections = sectionsExpanded ? sections : sections.slice(0, DEFAULT_VISIBLE_WORKBOOK_SECTIONS)

  return (
    <article className={`global-resource-search-result${sections.length > 0 ? ' has-sections' : ''}`}>
      <button type="button" className="global-resource-search-result-main" onClick={() => onSelect(hit)}>
        <span className="global-resource-search-result-icon"><Icon size={18} /></span>
        <span className="global-resource-search-result-copy">
          <strong><HighlightedText text={hit.title} terms={highlightTerms} /></strong>
          <small><HighlightedText text={hit.meta} terms={highlightTerms} /></small>
          {sections.length === 0 ? <em><HighlightedText text={hit.matchedLabel} terms={highlightTerms} /></em> : null}
        </span>
        <span className="global-resource-search-result-source">
          <small>{hit.sourceLabel}</small>
          <b>{hit.actionLabel}<ChevronRight size={14} /></b>
        </span>
      </button>
      {sections.length > 0 ? (
        <div className="global-resource-search-workbook-sections" aria-label="命中章节">
          {visibleSections.map((section) => (
            <button type="button" key={section} onClick={() => onSelect({ ...hit, target: { ...hit.target, anchorLabel: section } })}>
              <HighlightedText text={section} terms={highlightTerms} /><ChevronRight size={13} />
            </button>
          ))}
          {sections.length > DEFAULT_VISIBLE_WORKBOOK_SECTIONS ? (
            <button type="button" className="is-toggle" onClick={() => setSectionsExpanded((current) => !current)}>
              {sectionsExpanded ? '收起章节' : `查看全部 ${sections.length} 个命中章节`}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function QuestionSearchResult({
  hit,
  index,
  onAdd,
  onSimilar,
}: {
  hit: GlobalResourceSearchHit
  index: number
  onAdd?: (question: Question) => Promise<boolean>
  onSimilar: (query: string) => void
}) {
  const [favorite, setFavorite] = useState(false)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const question = hit.question
  if (!question) return null

  const addQuestion = async () => {
    if (!onAdd || adding || added) return
    setAdding(true)
    const success = await onAdd(question)
    if (success) setAdded(true)
    setAdding(false)
  }

  return (
    <article className="global-resource-search-question">
      <div className="global-resource-search-question-meta">{question.type} / {question.difficulty} / {question.estimatedMinutes}分钟</div>
      <div className="global-resource-search-question-stem"><b>{index + 1}.</b><span>{question.stem}</span></div>
      {question.options?.length ? (
        <div className="global-resource-search-question-options">
          {question.options.map((option) => <span key={option}>{option}</span>)}
        </div>
      ) : null}
      {analysisOpen ? (
        <div className="global-resource-search-question-analysis"><strong>解析：</strong>{question.analysis}</div>
      ) : null}
      <footer>
        <span>知识点：{question.knowledgePoint}</span>
        <div>
          <button type="button" aria-label="更多操作">•••</button>
          <button type="button" className={favorite ? 'is-active' : ''} onClick={() => setFavorite((value) => !value)}>{favorite ? '已收藏' : '收藏'}</button>
          <button type="button" className={analysisOpen ? 'is-active' : ''} onClick={() => setAnalysisOpen((value) => !value)}>解析</button>
          <button type="button" onClick={() => onSimilar(`${question.knowledgePoint}相似题`)}>相似题</button>
          <button type="button" className="is-add" disabled={adding || added} onClick={() => { void addQuestion() }}>{added ? '已添加' : adding ? '添加中…' : '＋ 添加'}</button>
        </div>
      </footer>
    </article>
  )
}

function SuggestionWorkspace({
  query,
  recentSearches,
  onSelect,
}: {
  query: string
  recentSearches: string[]
  onSelect: (query: string) => void
}) {
  const compactQuery = query.trim()
  return (
    <div className="global-resource-search-suggestions">
      {compactQuery ? (
        <section aria-labelledby="global-search-current-query">
          <h3 id="global-search-current-query">搜索当前内容</h3>
          <button type="button" className="global-resource-search-suggestion is-current" onClick={() => onSelect(compactQuery)}>
            <Search size={16} />
            <span>搜索“{compactQuery}”</span>
            <small>回车搜索</small>
          </button>
        </section>
      ) : recentSearches.length > 0 ? (
        <section aria-labelledby="global-search-recent-title">
          <h3 id="global-search-recent-title"><Clock3 size={15} />最近搜索</h3>
          <div className="global-resource-search-suggestion-list">
            {recentSearches.map((item) => (
              <button type="button" className="global-resource-search-suggestion" key={item} onClick={() => onSelect(item)}>
                <Clock3 size={15} /><span>{item}</span><ChevronRight size={14} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

    </div>
  )
}

function LoadingWorkspace({ parsed }: { parsed: ParsedGlobalResourceSearchQuery | null }) {
  const loadingLabel = parsed?.resourceTypes.length
    ? `正在查找${parsed.resourceTypes.map((type) => globalResourceSearchGroupLabels[type]).join('、')}…`
    : '正在搜索题库…'
  return (
    <div className="global-resource-search-loading" role="status" aria-live="polite">
      <header><LoaderCircle className="is-spinning" size={17} /><strong>{loadingLabel}</strong></header>
      <SearchConditions parsed={parsed} />
      <div className="global-resource-search-skeleton-list" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="global-resource-search-skeleton" key={index}>
            <span /><div><i /><i /><i /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GlobalResourceSearchWorkspace({
  id,
  style,
  presentation = 'popover',
  status,
  query,
  submittedQuery,
  parsed,
  result,
  errorMessage,
  recentSearches,
  disabled = false,
  onQueryChange,
  onSubmit,
  onClear,
  onImageSearch,
  onSuggestionSelect,
  onRetry,
  onResultSelect,
  onAddQuestion,
  onOpenCompose,
  onSearchExisting,
  onRemoveCondition,
  onClose,
  onViewAllGroup,
  imageSearch,
  onRetryImageSearch,
  onReplaceImage,
  onRemoveImage,
}: GlobalResourceSearchWorkspaceProps) {
  const [visibleGroupCounts, setVisibleGroupCounts] = useState<Partial<Record<GlobalSearchGroupType, number>>>({})

  useEffect(() => {
    setVisibleGroupCounts({})
  }, [result?.searchedAt])

  const showMoreGroup = (type: GlobalSearchGroupType, total: number) => {
    setVisibleGroupCounts((current) => {
      const defaultSize = type === 'question' ? DEFAULT_VISIBLE_QUESTION_SIZE : DEFAULT_VISIBLE_RESOURCE_SIZE
      const currentSize = current[type] ?? defaultSize
      const nextSize = type === 'question'
        ? Math.min(MAX_VISIBLE_QUESTIONS, total, currentSize + QUESTION_LOAD_SIZE)
        : total
      return { ...current, [type]: nextSize }
    })
  }

  return (
    <section
      className={`global-resource-search-workspace is-${status} is-${presentation}`}
      id={id}
      style={style}
      role="region"
      aria-label="AI智搜"
    >
      <button type="button" className="global-resource-search-workspace-close" aria-label={presentation === 'task' ? '关闭 AI智搜' : '关闭搜索面板'} title="关闭" onClick={onClose}>
        <X size={16} />
      </button>

      {presentation === 'task' ? (
        <div className="global-resource-search-task-input">
          <GlobalResourceSearchBar
            value={query}
            panelId={id}
            expanded
            loading={status === 'loading'}
            disabled={disabled}
            onChange={onQueryChange}
            onFocus={() => undefined}
            onSubmit={onSubmit}
            onClear={onClear}
            onImageSearch={onImageSearch}
          />
        </div>
      ) : null}

      {presentation === 'task' && status !== 'idle' && recentSearches.length > 0 ? (
        <nav className="global-resource-search-history" aria-label="AI智搜历史">
          <span><Clock3 size={14} />搜索历史</span>
          <div>
            {recentSearches.map((item) => (
              <button type="button" key={item} className={item === submittedQuery ? 'is-current' : ''} onClick={() => onSuggestionSelect(item)}>{item}</button>
            ))}
          </div>
        </nav>
      ) : null}

      {imageSearch && onRetryImageSearch && onReplaceImage && onRemoveImage ? (
        <ImageQuestionSearchPanel
          value={imageSearch}
          onRetry={onRetryImageSearch}
          onReplace={onReplaceImage}
          onRemove={onRemoveImage}
        />
      ) : null}

      {status === 'idle' && !imageSearch ? (
        <SuggestionWorkspace query={query} recentSearches={recentSearches} onSelect={onSuggestionSelect} />
      ) : null}

      {status === 'loading' ? <LoadingWorkspace parsed={parsed} /> : null}

      {status === 'error' ? (
        <div className="global-resource-search-state is-error" role="alert">
          <AlertCircle size={28} />
          <strong>搜索失败</strong>
          <p>{errorMessage || '请稍后重试，当前题单不受影响。'}</p>
          <MetisButton type="primary" onClick={onRetry}>重新搜索</MetisButton>
        </div>
      ) : null}

      {status === 'success' && result?.parsed.intent === 'compose' ? (
        <div className="global-resource-search-compose-handoff">
          <span><Sparkles size={21} /></span>
          <div>
            <strong>这句话更像是在组一份题单</strong>
            <p>AI 组题会继续询问题量、难度和题型，并生成题单预览。</p>
            <div>
              <MetisButton type="primary" onClick={() => onOpenCompose(submittedQuery)}>前往 AI 组题</MetisButton>
              <MetisButton type="bordered" onClick={() => onSearchExisting(submittedQuery)}>仍然搜索现有资源</MetisButton>
            </div>
          </div>
        </div>
      ) : null}

      {status === 'success' && result && result.parsed.intent !== 'compose' && result.total === 0 ? (
        <div className="global-resource-search-state is-empty">
          <Search size={28} />
          <strong>{result.parsed.intent === 'question' ? '没有找到相关题目' : '没有找到相关资源'}</strong>
          <p>{result.parsed.intent === 'question'
            ? '换一张更清晰的图片，或调整章节、题型和难度后再试。'
            : '试试减少条件，或换一个章节名称。'}</p>
          <SearchConditions parsed={result.parsed} onRemove={onRemoveCondition} />
          {result.parsed.intent === 'question' ? (
            <MetisButton type="bordered" onClick={onRetry}>重新搜索</MetisButton>
          ) : (
            <MetisButton type="bordered" onClick={() => onOpenCompose(submittedQuery)}>没有现成资源？前往 AI 组题</MetisButton>
          )}
        </div>
      ) : null}

      {status === 'success' && result && result.total > 0 ? (
        <div className="global-resource-search-results">
          <header className="global-resource-search-results-heading">
            <strong>已为您找到 {result.total} 条资源</strong>
          </header>

          <div className="global-resource-search-group-list">
            {result.groups.map((group) => {
              const defaultSize = group.type === 'question' ? DEFAULT_VISIBLE_QUESTION_SIZE : DEFAULT_VISIBLE_RESOURCE_SIZE
              const visibleCount = visibleGroupCounts[group.type] ?? defaultSize
              const visibleItems = group.items.slice(0, visibleCount)
              const canShowMore = visibleCount < group.total && (group.type !== 'question' || visibleCount < MAX_VISIBLE_QUESTIONS)
              const Icon = resultIconMap[group.type]
              const highlightTerms = getHighlightTerms(result.parsed)
              return (
                <section className={`global-resource-search-group is-${group.type}`} key={group.type} aria-labelledby={`global-search-group-${group.type}`}>
                  <header>
                    <h3 id={`global-search-group-${group.type}`}><Icon size={17} />{group.label}<span>{group.total}</span></h3>
                    {canShowMore && group.type !== 'question' ? (
                      <MetisButton
                        type="borderless"
                        onClick={() => {
                          if (onViewAllGroup) onViewAllGroup(group.type, result)
                          else showMoreGroup(group.type, group.total)
                        }}
                      >
                        查看全部 {group.total} 条
                      </MetisButton>
                    ) : null}
                  </header>
                  <div className="global-resource-search-result-list">
                    {group.type === 'question' ? visibleItems.map((hit, index) => (
                      <QuestionSearchResult
                        key={hit.id}
                        hit={hit}
                        index={index}
                        onAdd={onAddQuestion}
                        onSimilar={onSuggestionSelect}
                      />
                    )) : visibleItems.map((hit) => (
                      <ResourceSearchResult
                        key={hit.id}
                        hit={hit}
                        icon={Icon}
                        highlightTerms={highlightTerms}
                        onSelect={onResultSelect}
                      />
                    ))}
                    {group.type === 'question' && canShowMore ? (
                      <div className="global-resource-search-load-more">
                        <MetisButton type="bordered" onClick={() => showMoreGroup(group.type, group.total)}>加载更多</MetisButton>
                        <span>已展示 {visibleItems.length} / {Math.min(group.total, MAX_VISIBLE_QUESTIONS)} 道</span>
                      </div>
                    ) : null}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export interface GlobalResourceSearchProps {
  currentScope?: string
  initialQuery?: string
  disabled?: boolean
  className?: string
  repository?: GlobalResourceSearchRepository
  workspaceActive?: boolean
  showTopBar?: boolean
  onSelectResult: (hit: GlobalResourceSearchHit) => void
  onAddQuestion?: (question: Question) => Promise<boolean>
  onOpenCompose: (prompt: string) => void
  onActivateWorkspace?: () => void
  onRequestCloseWorkspace?: () => void
  onSearchComplete?: (result: GlobalResourceSearchResult) => void
}

export function GlobalResourceSearch({
  currentScope = '初中数学',
  initialQuery = '',
  disabled = false,
  className,
  repository = globalResourceSearchRepository,
  workspaceActive = false,
  showTopBar = true,
  onSelectResult,
  onAddQuestion,
  onOpenCompose,
  onActivateWorkspace,
  onRequestCloseWorkspace,
  onSearchComplete,
}: GlobalResourceSearchProps) {
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [status, setStatus] = useState<GlobalSearchRequestStatus>('idle')
  const [parsed, setParsed] = useState<ParsedGlobalResourceSearchQuery | null>(null)
  const [result, setResult] = useState<GlobalResourceSearchResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [recentSearchEntries, setRecentSearchEntries] = useState<RecentSearchEntry[]>(readRecentSearches)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>()
  const workspaceVisible = workspaceActive || popoverOpen

  useEffect(() => () => requestRef.current?.abort(), [])

  useEffect(() => {
    if (!popoverOpen || workspaceActive) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setPopoverOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPopoverOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [popoverOpen, workspaceActive])

  useEffect(() => {
    if (!workspaceVisible) return undefined
    const updatePanelBounds = () => {
      const rootBounds = rootRef.current?.getBoundingClientRect()
      const workspaceElement = rootRef.current?.closest<HTMLElement>('.add-workspace')
      const workspaceBounds = workspaceElement?.getBoundingClientRect()
      if (!rootBounds || !workspaceBounds || !workspaceElement) return
      const scale = workspaceElement.offsetWidth > 0
        ? workspaceBounds.width / workspaceElement.offsetWidth
        : 1
      const draftBounds = className?.includes('is-split-workspace')
        ? rootRef.current?.closest('.workspace-shell')?.querySelector<HTMLElement>(':scope > .editor-scroll')?.getBoundingClientRect()
        : undefined
      const panelRight = draftBounds?.left ?? workspaceBounds.right
      if (status === 'idle' && !workspaceActive) {
        const availableWidth = Math.max(280, panelRight - rootBounds.left - 16)
        setPanelStyle({
          left: rootBounds.left / scale,
          right: 'auto',
          width: Math.min(Math.max(rootBounds.width, 440), availableWidth) / scale,
        })
        return
      }
      setPanelStyle({
        left: workspaceBounds.left / scale,
        right: 'auto',
        width: (panelRight - workspaceBounds.left) / scale,
      })
    }
    updatePanelBounds()
    window.addEventListener('resize', updatePanelBounds)
    return () => window.removeEventListener('resize', updatePanelBounds)
  }, [className, status, workspaceActive, workspaceVisible])

  const rememberSearch = (value: string) => {
    setRecentSearchEntries((current) => {
      const next = [
        { query: value, searchedAt: Date.now() },
        ...current.filter((item) => item.query !== value),
      ].slice(0, MAX_RECENT_SEARCHES)
      persistRecentSearches(next)
      return next
    })
  }

  const recentSearches = recentSearchEntries.map((item) => item.query)

  const runSearch = async (nextQuery: string, intentOverride?: Exclude<GlobalSearchIntent, 'compose'>) => {
    const compactQuery = nextQuery.trim()
    if (!compactQuery || disabled) return

    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setQuery(compactQuery)
    setSubmittedQuery(compactQuery)
    if (onActivateWorkspace) {
      setPopoverOpen(false)
      onActivateWorkspace()
    } else {
      setPopoverOpen(true)
    }
    setStatus('loading')
    setErrorMessage('')
    setResult(null)
    setParsed(repository.parse(compactQuery, currentScope, intentOverride))

    try {
      const nextResult = await repository.search({
        query: compactQuery,
        currentScope,
        signal: controller.signal,
        intentOverride,
      })
      if (controller.signal.aborted) return
      setParsed(nextResult.parsed)
      setResult(nextResult)
      setStatus('success')
      rememberSearch(compactQuery)
      onSearchComplete?.(nextResult)
    } catch (error) {
      if (error instanceof GlobalResourceSearchError && error.code === 'ABORTED') return
      if (controller.signal.aborted) return
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : '搜索失败，请稍后重试')
    }
  }

  const { imageSearch, startRecognition, retry: retryImageSearch, clear: clearImageSearch } = useImageQuestionSearch(() => {
    void runSearch('找一道一次函数单题')
  })

  const resetSearch = () => {
    requestRef.current?.abort()
    setQuery('')
    setSubmittedQuery('')
    setParsed(null)
    setResult(null)
    setErrorMessage('')
    setStatus('idle')
    if (!workspaceActive) setPopoverOpen(true)
  }

  const updateQuery = (value: string) => {
    requestRef.current?.abort()
    setQuery(value)
    setParsed(null)
    setResult(null)
    setErrorMessage('')
    setStatus('idle')
    if (!workspaceActive) setPopoverOpen(true)
  }

  const removeCondition = (item: ParsedGlobalSearchCondition) => {
    if (!item.sourceText) return
    const nextQuery = query.split(item.sourceText).join(' ').replace(/\s+/g, ' ').trim()
    if (!nextQuery) {
      resetSearch()
      return
    }
    void runSearch(nextQuery)
  }

  const selectQuestionImage = (file?: File) => {
    if (!file) return
    const validationMessage = validateQuestionImage(file)
    if (validationMessage) {
      MetisMessage.error(validationMessage)
      return
    }
    if (onActivateWorkspace) {
      setPopoverOpen(false)
      onActivateWorkspace()
    } else {
      setPopoverOpen(true)
    }
    setStatus('idle')
    setResult(null)
    setParsed(null)
    startRecognition(file)
  }

  return (
    <div
      className={`global-resource-search${workspaceVisible ? ' is-open' : ''}${showTopBar ? '' : ' is-topbar-hidden'}${className ? ` ${className}` : ''}`}
      ref={rootRef}
    >
      <input
        ref={imageInputRef}
        className="global-resource-search-image-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="选择题目图片"
        onChange={(event) => {
          selectQuestionImage(event.target.files?.[0])
          event.currentTarget.value = ''
        }}
      />
      {showTopBar ? (
        <GlobalResourceSearchBar
          value={query}
          panelId={panelId}
          expanded={workspaceVisible}
          loading={status === 'loading'}
          disabled={disabled}
          onChange={updateQuery}
          onFocus={() => { if (!workspaceActive) setPopoverOpen(true) }}
          onSubmit={() => { void runSearch(query) }}
          onClear={resetSearch}
          onImageSearch={() => imageInputRef.current?.click()}
        />
      ) : null}
      {workspaceVisible ? (
        <GlobalResourceSearchWorkspace
          id={panelId}
          style={panelStyle}
          presentation={workspaceActive ? 'task' : 'popover'}
          status={status}
          query={query}
          submittedQuery={submittedQuery}
          parsed={parsed}
          result={result}
          errorMessage={errorMessage}
          recentSearches={recentSearches}
          disabled={disabled}
          onQueryChange={updateQuery}
          onSubmit={() => { void runSearch(query) }}
          onClear={resetSearch}
          onImageSearch={() => imageInputRef.current?.click()}
          onSuggestionSelect={(value) => { void runSearch(value) }}
          onRetry={() => { void runSearch(submittedQuery || query) }}
          onResultSelect={(hit) => {
            setPopoverOpen(false)
            onSelectResult(hit)
          }}
          onAddQuestion={onAddQuestion}
          onOpenCompose={(prompt) => {
            setPopoverOpen(false)
            onOpenCompose(prompt)
          }}
          onSearchExisting={(value) => { void runSearch(value, 'resource') }}
          onRemoveCondition={removeCondition}
          imageSearch={imageSearch}
          onRetryImageSearch={retryImageSearch}
          onReplaceImage={() => imageInputRef.current?.click()}
          onRemoveImage={() => {
            clearImageSearch()
            resetSearch()
          }}
          onClose={() => {
            if (workspaceActive) onRequestCloseWorkspace?.()
            else setPopoverOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

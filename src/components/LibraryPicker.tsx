import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { MetisButton, MetisInput } from '@yuanfudao/metis-web-component'
import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  ChevronDown,
  FileText,
  LayoutGrid,
  ListChecks,
  Pin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
} from 'lucide-react'
import { baseQuestions, sourceOptions, sourceRecords as allSourceRecords } from '../data/workbenchData'
import type { AsyncStatus, ResourceType, SourceRecord } from '../prototype/types'

interface LibraryPickerProps {
  variant?: 'dialog' | 'home'
  libraryKind: 'fly' | 'school'
  resourceType: ResourceType
  records: SourceRecord[]
  listStatus: AsyncStatus
  addStatus: AsyncStatus
  contentBusy: boolean
  showAll?: boolean
  onShowAllChange?: (showAll: boolean) => void
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

export function LibraryPicker(props: LibraryPickerProps) {
  const variant = props.variant ?? 'dialog'
  const isAll = variant === 'home' && props.showAll === true
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState<'recommended' | 'latest'>('recommended')
  const [category, setCategory] = useState('全部资源')
  const [detailRecord, setDetailRecord] = useState<SourceRecord | null>(null)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['paper-2']))
  const [pinned, setPinned] = useState<Set<string>>(new Set())

  useEffect(() => {
    setKeyword('')
    setCategory('全部资源')
    setDetailRecord(null)
    setSelectedQuestionIds(new Set())
  }, [isAll, props.libraryKind, props.resourceType])

  useEffect(() => {
    if (props.addStatus === 'success') setSelectedQuestionIds(new Set())
  }, [props.addStatus])

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
    setSelectedQuestionIds(new Set())
    setDetailRecord(record)
  }

  const previewQuestions = useMemo(() => baseQuestions.map((question, index) => ({
    ...question,
    id: `${detailRecord?.id ?? 'preview'}-${index}`,
  })), [detailRecord])

  const toggleSetValue = (setter: Dispatch<SetStateAction<Set<string>>>, value: string) => {
    setter((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  if (detailRecord) {
    const allSelected = selectedQuestionIds.size === previewQuestions.length
    return (
      <div className={`library-detail-view${variant === 'home' ? ' is-home' : ''}`}>
        <div className="library-detail-toolbar">
          <button type="button" onClick={() => setDetailRecord(null)}><ArrowLeft size={16} />返回资源列表</button>
          <div><span>{detailRecord.highlight}</span><strong>{detailRecord.title}</strong><small>{detailRecord.meta} · {detailRecord.questionCount} 题</small></div>
          <MetisButton
            type="bordered"
            onClick={() => setSelectedQuestionIds(allSelected ? new Set() : new Set(previewQuestions.map((question) => question.id)))}
          >
            {allSelected ? '取消全选' : '全选本页'}
          </MetisButton>
        </div>
        <div className="library-detail-scroll">
          {previewQuestions.map((question, index) => {
            const selected = selectedQuestionIds.has(question.id)
            return (
              <article
                key={question.id}
                className={`library-question-preview${selected ? ' is-selected' : ''}`}
                onClick={() => toggleSetValue(setSelectedQuestionIds, question.id)}
              >
                <button type="button" className="library-question-check" aria-label={`${selected ? '取消选择' : '选择'}第 ${index + 1} 题`}>
                  {selected ? <Check size={14} /> : null}
                </button>
                <div><span>{index + 1}. {question.type} · {question.difficulty}</span><p>{question.stem}</p>{question.options ? <small>{question.options.join('　　')}</small> : null}</div>
              </article>
            )
          })}
        </div>
        <div className="library-detail-footer">
          <span>已选 {selectedQuestionIds.size} 道题 · 加入后不覆盖当前内容</span>
          <MetisButton
            type="primary"
            disabled={selectedQuestionIds.size === 0 || props.contentBusy}
            loading={props.addStatus === 'loading'}
            onClick={() => props.onAddSource(detailRecord.sourceType, detailRecord.id, selectedQuestionIds.size)}
            data-track="/click/aiQuestionHome/addSelectedBankQuestions | 加入勾选题目 | resourceId#STRING,count#NUMBER"
          >
            加入当前题单（{selectedQuestionIds.size}）
          </MetisButton>
        </div>
      </div>
    )
  }

  const hasSidebar = variant === 'dialog' && props.resourceType !== 'workbook'
  const groups = props.resourceType === 'workbook' ? [] : categoryGroups[props.resourceType]
  const visibleSourceOptions = props.libraryKind === 'school'
    ? sourceOptions
      .filter((option) => option.type !== 'special')
      .map((option) => option.type === 'sync'
        ? { ...option, title: '章节知识点', description: '按本校教材章节浏览' }
        : option)
    : sourceOptions

  return (
    <div className={`library-picker${variant === 'home' ? ' is-home' : ''}`}>
      <nav className="library-resource-tabs" aria-label="题库资源类型" role="tablist">
        {variant === 'home' ? (
          <button
            type="button"
            className={isAll ? 'is-active' : ''}
            role="tab"
            aria-selected={isAll}
            disabled={props.contentBusy}
            onClick={() => props.onShowAllChange?.(true)}
            data-track="/click/aiQuestionHome/switchResourceTab | 切换全部资源 | 无"
          >
            <LayoutGrid size={17} /><span><strong>全部</strong></span>
          </button>
        ) : null}
        {visibleSourceOptions.map((option) => {
          const Icon = resourceIcons[option.type]
          const isActive = !isAll && props.resourceType === option.type
          return (
            <button
              type="button"
              key={option.type}
              className={isActive ? 'is-active' : ''}
              role="tab"
              aria-selected={isActive}
              disabled={props.contentBusy}
              onClick={() => {
                props.onShowAllChange?.(false)
                props.onResourceTypeChange(option.type)
              }}
              data-track="/click/aiQuestionHome/switchResourceTab | 切换题库资源类型 | resourceType#STRING"
            >
              <Icon size={17} /><span><strong>{option.title}</strong>{variant === 'dialog' ? <small>{option.description}</small> : null}</span>
            </button>
          )
        })}
      </nav>

      <div className={`library-browser${hasSidebar ? ' has-sidebar' : ''}`}>
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

          <div className="library-list-heading">
            <h3>{isAll ? '全部资源' : category === '全部资源' ? listHeadings[props.resourceType] : category}</h3>
            <div role="tablist" aria-label="资源排序">
              <button type="button" className={sort === 'recommended' ? 'is-active' : ''} onClick={() => setSort('recommended')}>推荐</button>
              <button type="button" className={sort === 'latest' ? 'is-active' : ''} onClick={() => setSort('latest')}>最新</button>
            </div>
          </div>

          <div className="library-record-scroll">
            {props.listStatus === 'loading' ? <div className="library-loading"><span /><span /><span /><span /></div> : null}
            {props.listStatus === 'error' ? <div className="library-feedback"><strong>资源加载失败</strong><p>当前题单不受影响。</p><MetisButton onClick={() => props.onResourceTypeChange(props.resourceType)}>重新加载</MetisButton></div> : null}
            {props.listStatus === 'success' && visibleRecords.length === 0 ? <div className="library-feedback"><strong>没有找到匹配资源</strong><p>换个关键词或减少筛选条件试试。</p></div> : null}
            {props.listStatus === 'success' ? (
              <div className={`library-record-grid library-record-grid--${isAll ? 'all' : props.resourceType}`}>
                {visibleRecords.map((record) => (
                  <article className={`library-resource-card library-resource-card--${record.sourceType}`} key={record.id}>
                    <button type="button" className="library-card-main" onClick={() => openRecord(record)}>
                      {!isAll && props.resourceType === 'workbook' ? <span className="workbook-cover"><BookOpenCheck size={25} /><small>{record.highlight?.slice(0, 2)}</small></span> : null}
                      <span className="library-card-copy">
                        <span className="library-card-tags"><em>{record.highlight}</em>{record.tags?.map((tag) => <em key={tag}>{tag}</em>)}</span>
                        <strong>{record.title}</strong>
                        {record.description ? <p>{record.description}</p> : null}
                        <small>{record.meta}</small>
                        {record.sourceName ? <small>来源：{record.sourceName}　{record.usageCount?.toLocaleString()} 人使用</small> : null}
                      </span>
                    </button>
                    <div className="library-card-actions">
                      <button type="button" aria-label={favorites.has(record.id) ? '取消收藏' : '收藏'} onClick={() => toggleSetValue(setFavorites, record.id)} className={favorites.has(record.id) ? 'is-active' : ''}><Star size={15} />{!isAll && props.resourceType === 'workbook' ? '收藏' : null}</button>
                      {!isAll && props.resourceType === 'workbook' ? <button type="button" aria-label="置顶" onClick={() => toggleSetValue(setPinned, record.id)} className={pinned.has(record.id) ? 'is-active' : ''}><Pin size={15} /></button> : null}
                    </div>
                    <div className="library-card-footer"><span>{record.questionCount} 题</span><span>{record.updatedAt ?? `${record.usageCount?.toLocaleString()} 人使用`}</span><button type="button" onClick={() => openRecord(record)}>选题</button></div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}

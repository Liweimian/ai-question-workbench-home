import { BookOpen, BrainCircuit, ChevronDown, ChevronRight, Clock3, FileScan, FileText, FolderHeart, Layers3, Library, ListTree, School, Sparkles, Target } from 'lucide-react'
import { useState } from 'react'
import type { AddQuestionMode, LibraryInitialView, OpenAddOptions, SourceRecord } from '../prototype/types'

export interface RecentOpenedResource {
  id: string
  type: '试卷' | '练习册' | '章节'
  title: string
  progress: string
  updatedAt: string
  libraryMode: 'resource' | 'school'
  record: SourceRecord
  scrollTop: number
}

interface CompositionHubProps {
  contentBusy: boolean
  onOpenAdd: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onOpenMyResources: () => void
  onOpenAssistant: () => void
  recentResources?: RecentOpenedResource[]
  onOpenRecentResource: (resource: RecentOpenedResource) => void
}

interface ResourceMetric {
  id: string
  label: string
  value: string
  view: LibraryInitialView
  wide?: boolean
}

interface ResourceOverview {
  id: 'resource' | 'school'
  title: string
  scope?: string
  total: string
  totalUnit: string
  metrics: ResourceMetric[]
}

function ResourceTypeGlyph({ view, size = 17 }: { view: LibraryInitialView; size?: number }) {
  if (view === 'paper') return <FileText size={size} />
  if (view === 'workbook') return <BookOpen size={size} />
  if (view === 'sync') return <Layers3 size={size} />
  if (view === 'special') return <Target size={size} />
  return <ListTree size={size} />
}

const resourceOverviews: ResourceOverview[] = [
  {
    id: 'resource',
    title: '飞象题库',
    total: '1000万+',
    totalUnit: '道题',
    metrics: [
      { id: 'fly-paper', label: '试卷', value: '12万份', view: 'paper' },
      { id: 'fly-workbook', label: '练习册', value: '3,200本', view: 'workbook' },
      { id: 'fly-sync', label: '同步练习', value: '8,600份', view: 'sync' },
      { id: 'fly-special', label: '专题', value: '2.4万份', view: 'special' },
    ],
  },
  {
    id: 'school',
    title: '校本题库',
    scope: '北京市第八十中学',
    total: '8.6万',
    totalUnit: '道题',
    metrics: [
      { id: 'school-paper', label: '试卷', value: '3,300份', view: 'paper' },
      { id: 'school-workbook', label: '练习册', value: '1,500本', view: 'workbook' },
    ],
  },
]

export function CompositionHub(props: CompositionHubProps) {
  const [currentTerm, setCurrentTerm] = useState('八年级上')
  const [resourceCardScheme, setResourceCardScheme] = useState<'two' | 'three' | 'four' | 'five' | 'six'>('two')
  const taskEntries = [
    { id: 'upload', title: 'AI 智能录题', description: '上传文件智能录题', action: '去上传', icon: FileScan, onClick: () => props.onOpenAdd('upload') },
    { id: 'create', title: 'AI 原创出题', description: '按章节智能出题', action: '去出题', icon: Sparkles, onClick: () => props.onOpenAdd('create') },
    { id: 'resources', title: '我的资源', description: '管理个人资源', action: '去查看', icon: FolderHeart, onClick: props.onOpenMyResources },
    { id: 'assistant', title: 'AI 助手', description: '描述需求智能组题', action: '去对话', icon: BrainCircuit, onClick: props.onOpenAssistant },
  ]

  return (
    <aside className={`composition-hub composition-hub--resource-first is-scheme-${resourceCardScheme}`} data-sec="2" aria-label="添加题目工作区">
      <div className="composition-hub-scroll">
        <div className="composition-overview">
          <header className="composition-overview-heading">
            <div><strong>添加题目<label className="composition-current-term"><select aria-label="切换当前学期" value={currentTerm} onChange={(event) => setCurrentTerm(event.target.value)}><option>七年级上</option><option>七年级下</option><option>八年级上</option><option>八年级下</option><option>九年级上</option><option>九年级下</option></select><ChevronDown size={12} /></label></strong><span>从题库查找、上传或生成题目，加入右侧题单</span></div>
            <nav className="composition-scheme-switch" aria-label="题库卡片方案" role="tablist">
              <button type="button" role="tab" aria-selected={resourceCardScheme === 'two'} className={resourceCardScheme === 'two' ? 'is-active' : ''} onClick={() => setResourceCardScheme('two')}>方案一</button>
              <button type="button" role="tab" aria-selected={resourceCardScheme === 'three'} className={resourceCardScheme === 'three' ? 'is-active' : ''} onClick={() => setResourceCardScheme('three')}>方案二</button>
              <button type="button" role="tab" aria-selected={resourceCardScheme === 'four'} className={resourceCardScheme === 'four' ? 'is-active' : ''} onClick={() => setResourceCardScheme('four')}>方案三</button>
              <button type="button" role="tab" aria-selected={resourceCardScheme === 'five'} className={resourceCardScheme === 'five' ? 'is-active' : ''} onClick={() => setResourceCardScheme('five')}>方案四</button>
              <button type="button" role="tab" aria-selected={resourceCardScheme === 'six'} className={resourceCardScheme === 'six' ? 'is-active' : ''} onClick={() => setResourceCardScheme('six')}>方案五</button>
            </nav>
          </header>

          <section className="composition-resource-grid" aria-label="题库资源入口">
            {resourceOverviews.map(({ id, title, total, totalUnit, metrics }) => (
              <article className={`composition-resource-card is-${id} is-scheme-${resourceCardScheme}`} key={id}>
                {resourceCardScheme === 'two' ? <div className="composition-resource-main composition-resource-main--scheme-two">
                  <button type="button" className="composition-resource-identity composition-resource-identity--with-total" disabled={props.contentBusy} onClick={() => props.onOpenAdd(id)}>
                    <span className="composition-resource-identity-icon">{id === 'resource' ? <Library size={18} /> : <School size={18} />}</span>
                    <span><strong>{title}</strong><em>共 {total} {totalUnit}</em></span>
                  </button>
                  <div className="composition-resource-type-grid">
                    <button type="button" className="composition-resource-type is-chapter" disabled={props.contentBusy} onClick={() => props.onOpenAdd(id, { libraryView: 'chapter' })}>
                      <strong>章节知识点选题</strong><small>单题</small>
                    </button>
                    {metrics.map((metric) => (
                      <button type="button" className="composition-resource-type" key={metric.id} disabled={props.contentBusy} onClick={() => props.onOpenAdd(id, { libraryView: metric.view })} data-track="/click/aiQuestionHome/openResourceCategory | 打开题库资源分类 | resourceType#STRING">
                        <strong>{metric.label}</strong><small>{metric.value}</small>
                      </button>
                    ))}
                  </div>
                </div> : resourceCardScheme === 'three' ? <div className="composition-resource-main composition-resource-main--scheme-three">
                  <button type="button" className="composition-resource-identity composition-resource-identity--illustrated" disabled={props.contentBusy} onClick={() => props.onOpenAdd(id)}>
                    <span className="composition-resource-identity-icon">{id === 'resource' ? <Library size={20} /> : <School size={20} />}</span>
                    <span><strong>{title}</strong><em>共 {total} {totalUnit}</em></span>
                  </button>
                  <div className="composition-resource-illustration" aria-hidden="true">
                    <i className="is-back" />
                    <i className="is-middle" />
                    <i className="is-front">{id === 'resource' ? <Library size={22} /> : <School size={22} />}</i>
                  </div>
                  <div className="composition-resource-type-grid composition-resource-type-grid--illustrated">
                    <button type="button" className="composition-resource-type is-chapter" disabled={props.contentBusy} onClick={() => props.onOpenAdd(id, { libraryView: 'chapter' })}>
                      <strong>章节知识点选题</strong><small>单题</small>
                    </button>
                    {metrics.map((metric) => (
                      <button type="button" className="composition-resource-type" key={metric.id} disabled={props.contentBusy} onClick={() => props.onOpenAdd(id, { libraryView: metric.view })} data-track="/click/aiQuestionHome/openResourceCategory | 打开题库资源分类 | resourceType#STRING">
                        <strong>{metric.label}</strong><small>{metric.value}</small>
                      </button>
                    ))}
                  </div>
                </div> : resourceCardScheme === 'four' ? <div className="composition-resource-main composition-resource-main--scheme-four">
                  <button type="button" className="composition-resource-identity composition-resource-identity--minimal" disabled={props.contentBusy} onClick={() => props.onOpenAdd(id)}>
                    <span className="composition-resource-identity-icon">{id === 'resource' ? <Library size={19} /> : <School size={19} />}</span>
                    <span><strong>{title}</strong><em>共 {total} {totalUnit}</em></span>
                  </button>
                  <div className="composition-resource-standard-grid">
                    <button type="button" className="is-chapter" disabled={props.contentBusy} onClick={() => props.onOpenAdd(id, { libraryView: 'chapter' })}>
                      <ResourceTypeGlyph view="chapter" /><strong>章节知识点选题</strong><i aria-hidden="true" />
                    </button>
                    {metrics.map((metric) => (
                      <button type="button" className={`is-${metric.view}`} key={metric.id} disabled={props.contentBusy} onClick={() => props.onOpenAdd(id, { libraryView: metric.view })} data-track="/click/aiQuestionHome/openResourceCategory | 打开题库资源分类 | resourceType#STRING">
                        <ResourceTypeGlyph view={metric.view} /><strong>{metric.label}</strong><i aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div> : resourceCardScheme === 'five' ? <div className="composition-resource-main composition-resource-main--scheme-five">
                  <button type="button" className="composition-resource-identity composition-resource-identity--minimal" disabled={props.contentBusy} onClick={() => props.onOpenAdd(id)}>
                    <span className="composition-resource-identity-icon">{id === 'resource' ? <Library size={19} /> : <School size={19} />}</span>
                    <span><strong>{title}</strong><em>共 {total} {totalUnit}</em></span>
                  </button>
                  <div className="composition-resource-chip-list">
                    <button type="button" disabled={props.contentBusy} onClick={() => props.onOpenAdd(id, { libraryView: 'chapter' })}><ResourceTypeGlyph view="chapter" /><strong>章节知识点选题</strong></button>
                    {metrics.map((metric) => (
                      <button type="button" key={metric.id} disabled={props.contentBusy} onClick={() => props.onOpenAdd(id, { libraryView: metric.view })} data-track="/click/aiQuestionHome/openResourceCategory | 打开题库资源分类 | resourceType#STRING"><ResourceTypeGlyph view={metric.view} /><strong>{metric.label}</strong></button>
                    ))}
                  </div>
                </div> : <div className="composition-resource-main composition-resource-main--scheme-six">
                  <button type="button" className="composition-resource-equal-heading" disabled={props.contentBusy} onClick={() => props.onOpenAdd(id)}>
                    <span>{id === 'resource' ? <Library size={21} /> : <School size={21} />}</span>
                    <span><strong>{title}</strong><small>共 {total} {totalUnit}</small></span>
                  </button>
                </div>}
              </article>
            ))}
          </section>

          <section className="composition-task-grid" aria-label="其他添加方式">
            {taskEntries.map(({ id, title, description, action, icon: Icon, onClick }) => (
              <button type="button" className={`is-${id}`} key={id} disabled={props.contentBusy} onClick={onClick}>
                <span className="composition-task-icon"><Icon size={19} /></span>
                <span><strong>{title}</strong><small>{description}</small></span>
                <em>{action}<ChevronRight size={14} /></em>
              </button>
            ))}
          </section>
          {props.recentResources?.length ? (
            <section className="composition-recent-resources" aria-label="最近浏览的资源">
              <header><strong>最近浏览</strong><span>继续上次浏览</span></header>
              <div>
                {props.recentResources.slice(0, 5).map((resource) => (
                  <button type="button" key={resource.id} disabled={props.contentBusy} onClick={() => props.onOpenRecentResource(resource)}>
                    <em>{resource.type}</em>
                    <span><strong>{resource.title}</strong></span>
                    <time><Clock3 size={12} />{resource.updatedAt}</time>
                    <ChevronRight size={15} />
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

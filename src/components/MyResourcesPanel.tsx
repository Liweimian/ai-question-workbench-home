import { useEffect, useMemo, useState } from 'react'
import { MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import { BookOpenCheck, ChevronDown, Download, FileQuestion, FileText, Folder, FolderPlus, ListChecks, MoreHorizontal, Plus, Search, Star } from 'lucide-react'
import type { HistoryDocumentSummary, MyResourceKind, MyResourceSummary } from '../prototype/types'
import { animateQuestionToDraft } from '../utils/animateQuestionToDraft'

type SpaceTab = 'created' | 'favorites'
type ResourceKind = '全部' | MyResourceKind

const createdResources: MyResourceSummary[] = [
  { id: 'mine-3', title: '教辅扫描题 · 待校对', kind: '题目', detail: '12 道题 · AI 录题', questionCount: 12, updatedAt: '10 月 18 日', folder: '未分类资源' },
  { id: 'mine-4', title: '函数专题资料', kind: '文件', detail: 'PDF · 8.6 MB', updatedAt: '10 月 16 日', folder: '教学资料' },
  { id: 'mine-5', title: '一元一次方程周测', kind: '试卷', detail: '18 道题 · 初中数学', questionCount: 18, updatedAt: '10 月 15 日', folder: '周测' },
]

const favoriteResources: MyResourceSummary[] = [
  { id: 'fav-1', title: '一次函数单元达标卷', kind: '试卷', detail: '25 道题 · 朝阳区教研', questionCount: 25, updatedAt: '今天 08:50', folder: '全部收藏' },
  { id: 'fav-2', title: '学习探究诊断', kind: '练习册', detail: '36 道题 · 人教版八上', questionCount: 36, updatedAt: '昨天 16:20', folder: '常用练习册' },
  { id: 'fav-3', title: '真实情境建模专题', kind: '题目', detail: '12 道题 · 应用题', questionCount: 12, updatedAt: '10 月 20 日', folder: '未分类收藏' },
  { id: 'fav-4', title: '期中易错题精选', kind: '题目', detail: '16 道题 · 中等', questionCount: 16, updatedAt: '10 月 18 日', folder: '期中复习' },
]

const iconMap = {
  题单: ListChecks,
  试卷: FileText,
  题目: FileQuestion,
  文件: Folder,
  练习册: BookOpenCheck,
} satisfies Record<MyResourceKind, typeof FileText>

interface MyResourcesPanelProps {
  initialKind?: MyResourceKind | '全部'
  histories: HistoryDocumentSummary[]
  currentDocumentId: string
  contentBusy: boolean
  pendingResourceId: string | null
  addedResourceIds: Set<string>
  onOpenDocument: (documentId: string) => void
  onAddResource: (resource: MyResourceSummary) => void
}

export function MyResourcesPanel(props: MyResourcesPanelProps) {
  const [space, setSpace] = useState<SpaceTab>('created')
  const [folder, setFolder] = useState('全部资源')
  const [kind, setKind] = useState<ResourceKind>(props.initialKind ?? '全部')
  const [keyword, setKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [customFolders, setCustomFolders] = useState<string[]>([])

  useEffect(() => {
    setSpace('created')
    setFolder('全部资源')
    setKind(props.initialKind ?? '全部')
    setSelectedIds(new Set())
  }, [props.initialKind])

  const historyResources = useMemo<MyResourceSummary[]>(() => props.histories.map((item) => ({
    id: `history-${item.id}`,
    title: item.title,
    kind: '题单',
    detail: `${item.questionCount} 道题 · ${item.status}`,
    questionCount: item.questionCount,
    updatedAt: item.updatedAt,
    folder: '全部资源',
    documentId: item.id,
  })), [props.histories])

  const resources = space === 'created' ? [...historyResources, ...createdResources] : favoriteResources
  const rootFolder = space === 'created' ? '全部资源' : '全部收藏'
  const folderNames = space === 'created'
    ? ['期中复习', '周测', '教学资料', '未分类资源']
    : ['常用练习册', '期中复习', '未分类收藏']
  const folders = [
    { name: rootFolder, root: true },
    ...folderNames.map((name) => ({ name, root: false })),
  ]
  const kinds: ResourceKind[] = space === 'created' ? ['全部', '试卷', '题单', '题目', '文件'] : ['全部', '题目', '练习册', '试卷']
  const visible = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    return resources.filter((item) => (
      (folder === rootFolder || item.folder === folder)
      && (kind === '全部' || item.kind === kind)
      && (!query || `${item.title}${item.kind}${item.detail}`.toLowerCase().includes(query))
    ))
  }, [folder, keyword, kind, resources, rootFolder])

  const switchSpace = (next: SpaceTab) => {
    setSpace(next)
    setFolder(next === 'created' ? '全部资源' : '全部收藏')
    setKind('全部')
    setSelectedIds(new Set())
  }
  const toggleSelected = (id: string) => setSelectedIds((current) => {
    const next = new Set(current)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const addFolder = () => {
    const name = `新建文件夹 ${customFolders.length + 1}`
    setCustomFolders((current) => [...current, name])
    setFolder(name)
    MetisMessage.success('文件夹已创建')
  }

  return <section className="my-resources-page" aria-label="我的资源">
    <aside className="resource-workbench" aria-label="资源工作台">
      <div className="resource-space-tabs" role="tablist" aria-label="资源空间">
        <button type="button" role="tab" aria-selected={space === 'created'} onClick={() => switchSpace('created')}>我的创建</button>
        <button type="button" role="tab" aria-selected={space === 'favorites'} onClick={() => switchSpace('favorites')}>我的收藏</button>
      </div>
      <div className="resource-directory-head"><strong>{space === 'created' ? '资源目录' : '收藏目录'}</strong><button type="button" aria-label="新建文件夹" title="新建文件夹" onClick={addFolder}><FolderPlus size={16} /></button></div>
      <nav className="resource-folder-tree" aria-label="文件夹目录">
        {[...folders, ...customFolders.map((name) => ({ name, root: false }))].map((item) => <button key={item.name} type="button" className={folder === item.name ? 'is-active' : ''} onClick={() => setFolder(item.name)}>
          {item.root ? <ChevronDown size={14} /> : <span className="resource-folder-indent" />}<Folder size={16} /><span>{item.name}</span>
        </button>)}
      </nav>
    </aside>
    <div className="resource-workbench-main">
      <div className="resource-content-toolbar">
        <div className="resource-kind-tabs" role="tablist" aria-label="资源类型">
          {kinds.map((item) => <button key={item} type="button" role="tab" aria-selected={kind === item} onClick={() => setKind(item)}>{item}</button>)}
          <label className="resource-search"><Search size={15} /><MetisInput value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索资源" /></label>
        </div>
        <div className="resource-batch-actions">{selectedIds.size > 0 ? <><span>已选 {selectedIds.size} 项</span><button type="button" onClick={() => MetisMessage.info('已下载所选资源')}>下载</button><button type="button" onClick={() => MetisMessage.info('已移动所选资源')}>移动</button></> : null}</div>
      </div>
      <section className="resource-manage-list" aria-label="资源列表">
        {visible.length ? visible.map((resource) => {
          const { id, title, kind: itemKind, detail, updatedAt, documentId } = resource
          const Icon = iconMap[itemKind]
          const pending = props.pendingResourceId === id
          const added = props.addedResourceIds.has(id)
          const isCurrentDocument = documentId === props.currentDocumentId
          return <article key={id} className={selectedIds.has(id) ? 'is-selected' : ''}>
            <label className="resource-select"><input type="checkbox" checked={selectedIds.has(id)} onChange={() => toggleSelected(id)} /><span /></label>
            <span className="resource-type-icon"><Icon size={21} /></span>
            <div className="resource-item-copy"><strong>{title}</strong><span>{itemKind} · {detail}</span><small>更新于 {updatedAt}</small></div>
            <div className="resource-item-actions">
              {documentId ? (
                <button type="button" disabled={isCurrentDocument || props.contentBusy} onClick={() => props.onOpenDocument(documentId)}>{isCurrentDocument ? '正在编辑' : '继续编辑'}</button>
              ) : itemKind === '文件' ? (
                <button type="button" disabled={props.contentBusy} onClick={() => MetisMessage.info(`正在打开“${title}”`)}>查看</button>
              ) : (
                <button
                  type="button"
                  className={added ? 'is-added' : ''}
                  disabled={pending || added}
                  onClick={(event) => { animateQuestionToDraft(event.currentTarget); props.onAddResource(resource) }}
                ><Plus size={15} />{pending ? '添加中…' : added ? '已添加' : '添加'}</button>
              )}
              <button type="button" className="resource-download-action" aria-label={`下载：${title}`} title="下载" onClick={() => MetisMessage.info(`正在下载“${title}”`)}><Download size={16} /><span className="resource-action-label">下载</span></button>
              {space === 'favorites' ? <button type="button" className="is-favorite" aria-label={`已收藏：${title}`} title="已收藏"><Star size={16} fill="currentColor" /><span className="resource-action-label">已收藏</span></button> : null}
              <button type="button" aria-label={`更多操作：${title}`}><MoreHorizontal size={18} /></button>
            </div>
          </article>
        }) : <div className="resource-manage-empty"><Folder size={34} /><strong>这里还没有资源</strong><span>可切换目录或调整搜索条件</span></div>}
      </section>
    </div>
  </section>
}

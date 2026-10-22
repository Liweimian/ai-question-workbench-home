import { useMemo, useState } from 'react'
import { MetisButton, MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import { BookOpenCheck, ChevronDown, ChevronRight, Download, FileQuestion, FileText, Folder, FolderPlus, ListChecks, MoreHorizontal, ScanLine, Search, Star, Upload } from 'lucide-react'

type SpaceTab = 'created' | 'favorites'
type ResourceKind = '全部' | '试卷' | '题单' | '题目' | '文件' | '练习册'
interface ResourceItem { id: string; title: string; kind: Exclude<ResourceKind, '全部'>; detail: string; updatedAt: string; folder: string; icon: typeof FileText }

const createdResources: ResourceItem[] = [
  { id: 'mine-1', title: '一次函数 · 随堂练习', kind: '题单', detail: '4 道题 · 初中数学', updatedAt: '今天 09:26', folder: '全部资源', icon: ListChecks },
  { id: 'mine-2', title: '八年级期中复习卷', kind: '试卷', detail: '22 道题 · 人教版八上', updatedAt: '昨天 18:40', folder: '期中复习', icon: FileText },
  { id: 'mine-3', title: '教辅扫描题 · 待校对', kind: '题目', detail: '12 道题 · AI 录题', updatedAt: '10 月 18 日', folder: '未分类资源', icon: FileQuestion },
  { id: 'mine-4', title: '函数专题资料', kind: '文件', detail: 'PDF · 8.6 MB', updatedAt: '10 月 16 日', folder: '教学资料', icon: Folder },
  { id: 'mine-5', title: '一元一次方程周测', kind: '试卷', detail: '18 道题 · 初中数学', updatedAt: '10 月 15 日', folder: '周测', icon: FileText },
]
const favoriteResources: ResourceItem[] = [
  { id: 'fav-1', title: '一次函数单元达标卷', kind: '试卷', detail: '25 道题 · 朝阳区教研', updatedAt: '今天 08:50', folder: '全部收藏', icon: FileText },
  { id: 'fav-2', title: '学习探究诊断', kind: '练习册', detail: '36 道题 · 人教版八上', updatedAt: '昨天 16:20', folder: '常用练习册', icon: BookOpenCheck },
  { id: 'fav-3', title: '真实情境建模专题', kind: '题目', detail: '12 道题 · 应用题', updatedAt: '10 月 20 日', folder: '未分类收藏', icon: Star },
  { id: 'fav-4', title: '期中易错题精选', kind: '题目', detail: '16 道题 · 中等', updatedAt: '10 月 18 日', folder: '期中复习', icon: FileQuestion },
]
const createdFolders = [{ name: '全部资源', count: 5, root: true }, { name: '期中复习', count: 1 }, { name: '周测', count: 1 }, { name: '教学资料', count: 1 }, { name: '未分类资源', count: 1 }]
const favoriteFolders = [{ name: '全部收藏', count: 4, root: true }, { name: '常用练习册', count: 1 }, { name: '期中复习', count: 1 }, { name: '未分类收藏', count: 1 }]

export function MyResourcesPanel() {
  const [space, setSpace] = useState<SpaceTab>('created')
  const [folder, setFolder] = useState('全部资源')
  const [kind, setKind] = useState<ResourceKind>('全部')
  const [keyword, setKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [customFolders, setCustomFolders] = useState<string[]>([])
  const resources = space === 'created' ? createdResources : favoriteResources
  const folders = space === 'created' ? createdFolders : favoriteFolders
  const kinds: ResourceKind[] = space === 'created' ? ['全部', '试卷', '题单', '题目', '文件'] : ['全部', '题目', '练习册', '试卷']
  const visible = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    const rootFolder = space === 'created' ? '全部资源' : '全部收藏'
    return resources.filter((item) => (folder === rootFolder || item.folder === folder) && (kind === '全部' || item.kind === kind) && (!query || `${item.title}${item.kind}${item.detail}`.toLowerCase().includes(query)))
  }, [folder, keyword, kind, resources, space])
  const switchSpace = (next: SpaceTab) => { setSpace(next); setFolder(next === 'created' ? '全部资源' : '全部收藏'); setKind('全部'); setSelectedIds(new Set()) }
  const toggleSelected = (id: string) => setSelectedIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next })
  const addFolder = () => { const name = `新建文件夹 ${customFolders.length + 1}`; setCustomFolders((current) => [...current, name]); setFolder(name); MetisMessage.success('文件夹已创建') }

  return <section className="my-resources-page" aria-label="我的资源">
    <aside className="resource-workbench" aria-label="资源工作台">
      <button type="button" className="resource-recording-entry" onClick={() => MetisMessage.info('已进入 AI 智能录题演示')}>
        <span><ScanLine size={20} /></span><div><strong>AI 智能录题</strong><small>上传文档，自动解析题目</small></div><ChevronRight size={16} />
      </button>
      <div className="resource-space-tabs" role="tablist" aria-label="资源空间">
        <button type="button" role="tab" aria-selected={space === 'created'} onClick={() => switchSpace('created')}>我的创建 <span>{createdResources.length}</span></button>
        <button type="button" role="tab" aria-selected={space === 'favorites'} onClick={() => switchSpace('favorites')}>我的收藏 <span>{favoriteResources.length}</span></button>
      </div>
      <div className="resource-directory-head"><strong>{space === 'created' ? '资源目录' : '收藏目录'}</strong><button type="button" aria-label="新建文件夹" title="新建文件夹" onClick={addFolder}><FolderPlus size={16} /></button></div>
      <nav className="resource-folder-tree" aria-label="文件夹目录">
        {[...folders, ...customFolders.map((name) => ({ name, count: 0, root: false }))].map((item) => <button key={item.name} type="button" className={folder === item.name ? 'is-active' : ''} onClick={() => setFolder(item.name)}>
          {item.root ? <ChevronDown size={14} /> : <span className="resource-folder-indent" />}<Folder size={16} /><span>{item.name}</span><small>{item.count}</small>
        </button>)}
      </nav>
    </aside>
    <main className="resource-workbench-main">
      <header className="resource-workbench-header">
        <div className="resource-breadcrumb"><span>{space === 'created' ? '我的创建' : '我的收藏'}</span><ChevronRight size={14} /><strong>{folder}</strong></div>
        <div className="resource-header-actions">
          {space === 'created' ? <MetisButton type="bordered" icon={<Upload size={16} />} onClick={() => MetisMessage.info('已打开上传文件演示')}>上传文件</MetisButton> : null}
          <label className="resource-search"><Search size={15} /><MetisInput value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索资源" /></label>
        </div>
      </header>
      <div className="resource-content-toolbar">
        <div className="resource-kind-tabs" role="tablist" aria-label="资源类型">{kinds.map((item) => <button key={item} type="button" role="tab" aria-selected={kind === item} onClick={() => setKind(item)}>{item}</button>)}</div>
        <div className="resource-batch-actions">{selectedIds.size > 0 ? <><span>已选 {selectedIds.size} 项</span><button type="button" onClick={() => MetisMessage.info('已下载所选资源')}>下载</button><button type="button" onClick={() => MetisMessage.info('已移动所选资源')}>移动</button></> : null}</div>
      </div>
      <section className="resource-manage-list" aria-label="资源列表">
        {visible.length ? visible.map(({ id, title, kind: itemKind, detail, updatedAt, icon: Icon }) => <article key={id} className={selectedIds.has(id) ? 'is-selected' : ''}>
          <label className="resource-select"><input type="checkbox" checked={selectedIds.has(id)} onChange={() => toggleSelected(id)} /><span /></label>
          <span className="resource-type-icon"><Icon size={21} /></span>
          <div className="resource-item-copy"><strong>{title}</strong><span>{itemKind} · {detail}</span><small>更新于 {updatedAt}</small></div>
          <div className="resource-item-actions"><button type="button" onClick={() => MetisMessage.info(`正在下载“${title}”`)}><Download size={16} />下载</button>{space === 'favorites' ? <button type="button" className="is-favorite"><Star size={16} fill="currentColor" />已收藏</button> : null}<button type="button" aria-label={`更多操作：${title}`}><MoreHorizontal size={18} /></button></div>
        </article>) : <div className="resource-manage-empty"><Folder size={34} /><strong>这里还没有资源</strong><span>可切换目录或调整搜索条件</span></div>}
      </section>
    </main>
  </section>
}

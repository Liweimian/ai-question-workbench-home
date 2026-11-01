import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import { BookOpenCheck, ChevronDown, Download, File, FileQuestion, FileText, Folder, FolderPlus, ListChecks, MoreHorizontal, Search, Star, Upload } from 'lucide-react'
import type { HistoryDocumentSummary, MyResourceKind, MyResourceSummary } from '../prototype/types'

type SpaceTab = 'created' | 'favorites'
type ResourceKind = '全部' | MyResourceKind
type PendingUpload = { id: string; name: string; size: number }
const FILE_ACCEPT = '.txt,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.epub,.equb,.png,.jpg,.jpeg,.gif,.webp,.mp4,.mov,.mp3,.wav'
const SUBJECTS = ['小学科学', '初中数学', '初中语文', '初中英语', '高中数学']

const KIND_FOLDER: Record<Exclude<MyResourceKind, '练习册'>, string> = {
  试卷: '试卷',
  题单: '题单',
  题目: '题目',
  文件: '墨水屏作业',
}

const FOLDER_KIND: Record<string, ResourceKind> = {
  试卷: '试卷',
  题单: '题单',
  题目: '题目',
  墨水屏作业: '文件',
}

export const RESOURCE_CREATED_FOLDERS = ['全部资源', '试卷', '题单', '题目', '墨水屏作业']

const seedCreatedResources: MyResourceSummary[] = [
  { id: 'mine-3', title: '教辅扫描题 · 待校对', kind: '题目', detail: '12 道题 · AI 录题', questionCount: 12, updatedAt: '10 月 18 日', folder: '题目' },
  { id: 'mine-4', title: '函数专题资料.pdf', kind: '文件', detail: 'PDF · 8.6 MB', updatedAt: '2026.10.16', folder: '墨水屏作业' },
  { id: 'mine-5', title: '一元一次方程周测', kind: '试卷', detail: '18 道题 · 初中数学', questionCount: 18, updatedAt: '10 月 15 日', folder: '试卷' },
  { id: 'mine-6', title: '2024-2025学年浙江省杭州市滨江区七年级下册期末试卷：英语.pdf', kind: '文件', detail: 'PDF · 1.7 MB', updatedAt: '2026.11.01', folder: '墨水屏作业' },
  { id: 'mine-7', title: '墨水屏测试作业.pdf', kind: '文件', detail: 'PDF · 2.4 MB', updatedAt: '2026.10.28', folder: '墨水屏作业' },
  { id: 'mine-8', title: '2026年广东深圳宝安区二模试卷：语文.pdf', kind: '文件', detail: 'PDF · 3.1 MB', updatedAt: '2026.10.22', folder: '墨水屏作业' },
]

const favoriteResources: MyResourceSummary[] = [
  { id: 'fav-1', title: '一次函数单元达标卷', kind: '试卷', detail: '25 道题 · 朝阳区教研', questionCount: 25, updatedAt: '今天 08:50', folder: '全部收藏' },
  { id: 'fav-2', title: '学习探究诊断', kind: '练习册', detail: '36 道题 · 人教版八上', questionCount: 36, updatedAt: '昨天 16:20', folder: '常用练习册' },
  { id: 'fav-3', title: '真实情境建模专题', kind: '题目', detail: '12 道题 · 应用题', questionCount: 12, updatedAt: '10 月 20 日', folder: '未分类收藏' },
  { id: 'fav-4', title: '期中易错题精选', kind: '题目', detail: '16 道题 · 中等', updatedAt: '10 月 18 日', folder: '期中复习' },
]

const iconMap = {
  题单: ListChecks,
  试卷: FileText,
  题目: FileQuestion,
  文件: File,
  练习册: BookOpenCheck,
} satisfies Record<MyResourceKind, typeof FileText>

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function isMediaFile(name: string) {
  return /\.(mp4|mov|mp3|wav)$/i.test(name)
}

function extensionLabel(name: string) {
  const ext = name.split('.').pop()?.toUpperCase()
  return ext && ext !== name.toUpperCase() ? ext : '文件'
}

function formatToday() {
  const now = new Date()
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
}

interface MyResourcesPanelProps {
  initialKind?: MyResourceKind | '全部'
  histories: HistoryDocumentSummary[]
  currentDocumentId: string
  contentBusy: boolean
  pendingResourceId: string | null
  addedResourceIds: Set<string>
  onOpenDocument: (documentId: string) => void
  onAddResource: (resource: MyResourceSummary) => void
  onOpenFile: (resource: MyResourceSummary) => void
}

export function MyResourcesPanel(props: MyResourcesPanelProps) {
  const [space, setSpace] = useState<SpaceTab>('created')
  const [folder, setFolder] = useState('全部资源')
  const [kind, setKind] = useState<ResourceKind>(props.initialKind ?? '全部')
  const [keyword, setKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [customFolders, setCustomFolders] = useState<string[]>([])
  const [ownedResources, setOwnedResources] = useState<MyResourceSummary[]>(seedCreatedResources)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null)
  const [publishTarget, setPublishTarget] = useState<MyResourceSummary | null>(null)
  const [publishSubject, setPublishSubject] = useState('')
  const [publishStudents, setPublishStudents] = useState('')
  const [renameTarget, setRenameTarget] = useState<MyResourceSummary | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [moveTarget, setMoveTarget] = useState<MyResourceSummary | null>(null)
  const [publishRecords, setPublishRecords] = useState<{ id: string; title: string; at: string }[]>([])
  const [showRecords, setShowRecords] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSpace('created')
    setFolder('全部资源')
    setKind(props.initialKind ?? '全部')
    setSelectedIds(new Set())
    setShowRecords(false)
    if (props.initialKind && props.initialKind !== '全部' && KIND_FOLDER[props.initialKind as Exclude<MyResourceKind, '练习册'>]) {
      setFolder(KIND_FOLDER[props.initialKind as Exclude<MyResourceKind, '练习册'>])
    }
  }, [props.initialKind])

  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '')
  }, [])

  useEffect(() => {
    if (!moreMenuId) return
    const onPointerDown = (event: PointerEvent) => {
      if (moreMenuRef.current?.contains(event.target as Node)) return
      if ((event.target as HTMLElement).closest('.resource-more-menu')) return
      setMoreMenuId(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [moreMenuId])

  const historyResources = useMemo<MyResourceSummary[]>(() => props.histories.map((item) => ({
    id: `history-${item.id}`,
    title: item.title,
    kind: '题单',
    detail: `${item.questionCount} 道题 · ${item.status}`,
    questionCount: item.questionCount,
    updatedAt: item.updatedAt,
    folder: '题单',
    documentId: item.id,
  })), [props.histories])

  const resources = space === 'created' ? [...historyResources, ...ownedResources] : favoriteResources
  const hasFiles = ownedResources.some((item) => item.kind === '文件')
  const rootFolder = space === 'created' ? '全部资源' : '全部收藏'
  const folderNames = space === 'created'
    ? hasFiles ? ['试卷', '题单', '题目', '墨水屏作业'] : ['试卷', '题单', '题目']
    : ['常用练习册', '期中复习', '未分类收藏']
  const folders = [
    { name: rootFolder, root: true },
    ...folderNames.map((name) => ({ name, root: false })),
    ...customFolders.map((name) => ({ name, root: false })),
  ]
  const kinds: ResourceKind[] = space === 'created'
    ? hasFiles ? ['全部', '试卷', '题单', '题目', '文件'] : ['全部', '试卷', '题单', '题目']
    : ['全部', '题目', '练习册', '试卷']
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
    setShowRecords(false)
  }
  const toggleSelected = (id: string) => setSelectedIds((current) => {
    const next = new Set(current)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  useEffect(() => {
    if (hasFiles) return
    if (kind === '文件') setKind('全部')
    if (folder === '墨水屏作业') setFolder('全部资源')
  }, [folder, hasFiles, kind])

  const enqueueFiles = (fileList: FileList | File[]) => {
    const next: PendingUpload[] = []
    for (const file of Array.from(fileList)) {
      const limit = isMediaFile(file.name) ? 300 * 1024 * 1024 : 100 * 1024 * 1024
      if (file.size > limit) {
        MetisMessage.error(`${file.name} 超过大小限制`)
        continue
      }
      next.push({ id: `upload-${file.name}-${file.size}-${Date.now()}`, name: file.name, size: file.size })
    }
    if (next.length) setPendingUploads((current) => [...current, ...next])
  }

  const startUpload = () => {
    if (!pendingUploads.length || uploading) return
    setUploading(true)
    setUploadPercent(12)
    const timer = window.setInterval(() => {
      setUploadPercent((current) => Math.min(100, current + 22))
    }, 160)
    window.setTimeout(() => {
      window.clearInterval(timer)
      const uploaded = pendingUploads.map((item) => ({
        id: item.id,
        title: item.name,
        kind: '文件' as const,
        detail: `${extensionLabel(item.name)} · ${formatBytes(item.size)}`,
        updatedAt: formatToday(),
        folder: '墨水屏作业',
      }))
      setOwnedResources((current) => [...uploaded, ...current])
      setPendingUploads([])
      setUploading(false)
      setUploadPercent(0)
      setUploadOpen(false)
      setKind('文件')
      setFolder('墨水屏作业')
      MetisMessage.success(uploaded.length > 1 ? `已上传 ${uploaded.length} 个文件` : `已上传“${uploaded[0].title}”`)
    }, 900)
  }

  const addFolder = () => {
    const name = `新建文件夹 ${customFolders.length + 1}`
    setCustomFolders((current) => [...current, name])
    setFolder(name)
    MetisMessage.success('文件夹已创建')
  }

  const openRename = (resource: MyResourceSummary) => {
    setRenameTarget(resource)
    setRenameValue(resource.title)
    setMoreMenuId(null)
  }

  const openMove = (resource: MyResourceSummary) => {
    setMoveTarget(resource)
    setMoreMenuId(null)
  }

  const openPublish = (resource: MyResourceSummary) => {
    setPublishTarget(resource)
    setPublishSubject('')
    setPublishStudents('')
    setMoreMenuId(null)
  }

  const toggleFavorite = (id: string) => {
    setMoreMenuId(null)
    setFavoriteIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
        MetisMessage.success('已取消收藏')
      } else {
        next.add(id)
        MetisMessage.success('已收藏')
      }
      return next
    })
  }

  const removeResource = (id: string) => {
    setOwnedResources((current) => current.filter((item) => item.id !== id))
    setMoreMenuId(null)
    MetisMessage.success('已删除')
  }

  const confirmRename = () => {
    const title = renameValue.trim()
    if (!renameTarget || !title) return
    setOwnedResources((current) => current.map((item) => item.id === renameTarget.id ? { ...item, title } : item))
    setRenameTarget(null)
    MetisMessage.success('已修改名称')
  }

  const confirmMove = (nextFolder: string) => {
    if (!moveTarget) return
    setOwnedResources((current) => current.map((item) => item.id === moveTarget.id ? { ...item, folder: nextFolder } : item))
    setMoveTarget(null)
    MetisMessage.success(`已移动到“${nextFolder}”`)
  }

  const openResource = (resource: MyResourceSummary) => {
    if (resource.kind === '文件') {
      setMoreMenuId(null)
      props.onOpenFile(resource)
      return
    }
    if (resource.documentId) props.onOpenDocument(resource.documentId)
    else props.onAddResource(resource)
  }

  const renderRowActions = (resource: MyResourceSummary) => {
    const favorited = favoriteIds.has(resource.id) || space === 'favorites'
    return (
      <div className="resource-online-actions">
        {resource.kind === '文件' ? (
          <button type="button" className="resource-pill is-publish" onClick={() => openPublish(resource)}>发布到墨水屏</button>
        ) : null}
        <button type="button" className="resource-pill" onClick={() => MetisMessage.info(`正在下载“${resource.title}”`)}><Download size={15} />下载</button>
        {resource.kind === '文件' ? null : (
          <button type="button" className={`resource-pill${favorited ? ' is-favorite' : ''}`} onClick={() => toggleFavorite(resource.id)}><Star size={15} fill={favorited ? 'currentColor' : 'none'} />收藏</button>
        )}
        <div className="resource-more" ref={moreMenuId === resource.id ? moreMenuRef : undefined}>
          <button
            type="button"
            className="resource-pill"
            aria-label={`更多操作：${resource.title}`}
            aria-expanded={moreMenuId === resource.id}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
              setMoreMenuId((current) => current === resource.id ? null : resource.id)
            }}
          ><MoreHorizontal size={16} />更多</button>
          {moreMenuId === resource.id ? createPortal(
            <div className="resource-more-menu is-portal" role="menu" style={{ top: menuPos.top, right: menuPos.right }}>
              <button type="button" role="menuitem" onClick={() => openMove(resource)}>移动</button>
              {resource.kind === '文件' ? (
                <button type="button" role="menuitem" onClick={() => toggleFavorite(resource.id)}><Star size={14} fill={favorited ? 'currentColor' : 'none'} />{favorited ? '取消收藏' : '收藏'}</button>
              ) : null}
              <button type="button" role="menuitem" onClick={() => openRename(resource)}>编辑</button>
              <button type="button" role="menuitem" className="is-danger" onClick={() => removeResource(resource.id)}>删除</button>
            </div>,
            document.body,
          ) : null}
        </div>
      </div>
    )
  }

  const confirmPublish = () => {
    if (!publishTarget) return
    if (!publishSubject) {
      MetisMessage.error('请选择学科')
      return
    }
    if (!publishStudents) {
      MetisMessage.error('请选择学生')
      return
    }
    setPublishRecords((current) => [{ id: `pub-${Date.now()}`, title: publishTarget.title, at: formatToday() }, ...current])
    setPublishTarget(null)
    setPublishSubject('')
    setPublishStudents('')
    MetisMessage.success('已发布到墨水屏')
  }

  return <section className="my-resources-page" aria-label="我的资源">
    <aside className="resource-workbench" aria-label="资源工作台">
      <div className="resource-space-tabs" role="tablist" aria-label="资源空间">
        <button type="button" role="tab" aria-selected={space === 'created'} onClick={() => switchSpace('created')}>我的创建</button>
        <button type="button" role="tab" aria-selected={space === 'favorites'} onClick={() => switchSpace('favorites')}>我的收藏</button>
      </div>
      <div className="resource-directory-head"><strong>{space === 'created' ? '资源目录' : '收藏目录'}</strong><button type="button" aria-label="新建文件夹" title="新建文件夹" onClick={addFolder}><FolderPlus size={16} /></button></div>
      <nav className="resource-folder-tree" aria-label="文件夹目录">
        {folders.map((item) => <button key={item.name} type="button" className={folder === item.name ? 'is-active' : ''} onClick={() => { setFolder(item.name); setKind(FOLDER_KIND[item.name] ?? '全部'); setShowRecords(false) }}>
          {item.root ? <ChevronDown size={14} /> : <span className="resource-folder-indent" />}<Folder size={16} /><span>{item.name}</span>
        </button>)}
      </nav>
    </aside>
    <div className="resource-workbench-main">
      <div className="resource-content-toolbar">
        <div className="resource-kind-tabs" role="tablist" aria-label="资源类型">
          {kinds.map((item) => <button key={item} type="button" role="tab" aria-selected={!showRecords && kind === item} onClick={() => { setKind(item); setShowRecords(false); if (space === 'created') setFolder(item === '全部' ? '全部资源' : KIND_FOLDER[item as Exclude<MyResourceKind, '练习册'>] ?? '全部资源') }}>{item}</button>)}
          <label className="resource-search"><Search size={15} /><MetisInput value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索资源" /></label>
        </div>
        {space === 'created' ? (
          <div className="resource-file-actions">
            <button type="button" className={showRecords ? 'is-active' : ''} onClick={() => setShowRecords((open) => !open)}>发布记录</button>
            <button type="button" className="is-primary" onClick={() => { setUploadOpen(true); setShowRecords(false) }}><Upload size={14} />上传文件</button>
          </div>
        ) : (
          <div className="resource-batch-actions">{selectedIds.size > 0 ? <><span>已选 {selectedIds.size} 项</span><button type="button" onClick={() => MetisMessage.info('已下载所选资源')}>下载</button><button type="button" onClick={() => MetisMessage.info('已移动所选资源')}>移动</button></> : null}</div>
        )}
      </div>

      {showRecords ? (
        <section className="resource-manage-list" aria-label="发布记录">
          {publishRecords.length ? publishRecords.map((record) => (
            <article key={record.id}>
              <span className="resource-type-icon"><File size={21} /></span>
              <div className="resource-item-copy"><strong>{record.title}</strong><span>已发布到墨水屏</span><small>{record.at}</small></div>
            </article>
          )) : (
            <div className="resource-manage-empty"><File size={34} /><strong>暂无发布记录</strong><span>文件发布到墨水屏后会出现在这里</span></div>
          )}
        </section>
      ) : (
        <section className={`resource-manage-list${kind === '文件' ? ' is-file-list' : ''}`} aria-label="资源列表">
          {visible.length ? visible.map((resource) => {
            const { id, title, kind: itemKind, detail, updatedAt } = resource
            const Icon = iconMap[itemKind]
            return <article key={id} className={selectedIds.has(id) ? 'is-selected' : ''}>
              <label className="resource-select"><input type="checkbox" checked={selectedIds.has(id)} onChange={() => toggleSelected(id)} /><span /></label>
              <span className="resource-type-icon"><Icon size={21} /></span>
              <button type="button" className="resource-item-copy is-openable" onClick={() => openResource(resource)}>
                <strong>{title}</strong>
                <span>{itemKind} · {detail}</span>
                <small>{itemKind === '文件' ? `上传于 ${updatedAt}` : `更新于 ${updatedAt}`}</small>
              </button>
              {renderRowActions(resource)}
            </article>
          }) : (
            <div className="resource-manage-empty">
              <Folder size={34} />
              <strong>这里还没有资源</strong>
              <span>可切换目录或调整搜索条件</span>
            </div>
          )}
        </section>
      )}
    </div>

    {uploadOpen ? (
      <div className="resource-modal-mask" role="presentation" onClick={() => !uploading && setUploadOpen(false)}>
        <div className="resource-upload-modal" role="dialog" aria-label="上传文件" onClick={(event) => event.stopPropagation()}>
          <header>
            <strong>上传文件</strong>
            <button type="button" aria-label="关闭" disabled={uploading} onClick={() => setUploadOpen(false)}>×</button>
          </header>
          {uploading ? (
            <div className="resource-upload-progress" role="status">
              <span>正在上传，请勿关闭页面</span>
              <div><i style={{ width: `${uploadPercent}%` }} /><em>{uploadPercent}%</em></div>
            </div>
          ) : (
            <>
              <div
                className="resource-upload-drop"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  if (event.dataTransfer.files.length) enqueueFiles(event.dataTransfer.files)
                }}
              >
                <p>拖入文件，或点击下方按钮选择</p>
                <small>支持文档、图片、音频、视频格式文件。文档、图片单个文件不超过 100MB；音频、视频单个文件不超过 300MB</small>
                <div>
                  <button type="button" onClick={() => fileInputRef.current?.click()}>选择文件</button>
                  <button type="button" onClick={() => folderInputRef.current?.click()}>选择文件夹</button>
                </div>
              </div>
              {pendingUploads.length ? (
                <ul className="resource-upload-list">
                  {pendingUploads.map((item) => <li key={item.id}><File size={16} /><span>{item.name}</span><small>{formatBytes(item.size)}</small></li>)}
                </ul>
              ) : null}
              <footer>
                <span>{pendingUploads.length ? `文件 ${pendingUploads.length} · 大小 ${formatBytes(pendingUploads.reduce((sum, item) => sum + item.size, 0))}` : '尚未选择文件'}</span>
                <button type="button" className="is-primary" disabled={!pendingUploads.length} onClick={startUpload}>开始上传</button>
              </footer>
            </>
          )}
          <input ref={fileInputRef} type="file" multiple accept={FILE_ACCEPT} hidden onChange={(event) => { if (event.target.files) enqueueFiles(event.target.files); event.target.value = '' }} />
          <input ref={folderInputRef} type="file" multiple hidden onChange={(event) => { if (event.target.files) enqueueFiles(event.target.files); event.target.value = '' }} />
        </div>
      </div>
    ) : null}

    {publishTarget ? (
      <div className="resource-modal-mask" role="presentation" onClick={() => setPublishTarget(null)}>
        <div className="resource-eink-modal" role="dialog" aria-label="发布到墨水屏" onClick={(event) => event.stopPropagation()}>
          <header><strong>发布到墨水屏</strong><button type="button" aria-label="关闭" onClick={() => setPublishTarget(null)}>×</button></header>
          <div className="resource-eink-file"><File size={18} /><span>{publishTarget.title}</span></div>
          <label>学科<span>*</span>
            <select value={publishSubject} onChange={(event) => setPublishSubject(event.target.value)} aria-label="学科">
              <option value="">请选择学科</option>
              {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>选择学生<span>*</span>
            <div className="resource-eink-students">
              {publishStudents ? <em>{publishStudents}</em> : <button type="button" onClick={() => setPublishStudents('初一（1）班 · 42 人')}>＋ 添加</button>}
            </div>
          </label>
          <button type="button" className="is-primary" onClick={confirmPublish}>确定</button>
        </div>
      </div>
    ) : null}

    {renameTarget ? (
      <div className="resource-modal-mask" role="presentation" onClick={() => setRenameTarget(null)}>
        <div className="resource-simple-modal" role="dialog" aria-label="编辑名称" onClick={(event) => event.stopPropagation()}>
          <strong>编辑</strong>
          <p className="resource-edit-hint">修改资源名称</p>
          <MetisInput value={renameValue} onChange={(event) => setRenameValue(event.target.value)} aria-label="资源名称" />
          <div><button type="button" onClick={() => setRenameTarget(null)}>取消</button><button type="button" className="is-primary" onClick={confirmRename}>确定</button></div>
        </div>
      </div>
    ) : null}

    {moveTarget ? (
      <div className="resource-modal-mask" role="presentation" onClick={() => setMoveTarget(null)}>
        <div className="resource-simple-modal" role="dialog" aria-label="移动到" onClick={(event) => event.stopPropagation()}>
          <strong>移动到</strong>
          <div className="resource-move-folders">
            {folders.map((item) => (
              <button type="button" key={item.name} onClick={() => confirmMove(item.name)}>{item.name}</button>
            ))}
          </div>
        </div>
      </div>
    ) : null}
  </section>
}

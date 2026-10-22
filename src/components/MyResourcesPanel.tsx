import { useState } from 'react'
import { MetisButton, MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import { BookOpenCheck, FileText, Folder, ListChecks, Search, Star, Upload } from 'lucide-react'

const createdResources = [
  { id: 'mine-1', title: '一次函数 · 随堂练习', type: '题单', meta: '4 题 · 今天 09:26', icon: ListChecks },
  { id: 'mine-2', title: '八年级期中复习卷', type: '试卷', meta: '22 题 · 昨天 18:40', icon: FileText },
  { id: 'mine-3', title: '教辅扫描题 · 待校对', type: '题目', meta: '12 题 · 10 月 18 日', icon: BookOpenCheck },
  { id: 'mine-4', title: '函数专题资料', type: '文件', meta: 'PDF · 8.6 MB', icon: Folder },
]

const favoriteResources = [
  { id: 'fav-1', title: '一次函数单元达标卷', type: '试卷', meta: '25 题 · 朝阳区教研', icon: FileText },
  { id: 'fav-2', title: '学习探究诊断', type: '练习册', meta: '36 题 · 人教版八上', icon: BookOpenCheck },
  { id: 'fav-3', title: '真实情境建模专题', type: '题单', meta: '12 题 · 已收藏', icon: Star },
]

const uploadedResources = [
  { id: 'upload-1', title: '八上期中复习资料.pdf', type: 'PDF', meta: '已识别 18 题 · 今天 10:12', icon: Upload },
  { id: 'upload-2', title: '教辅练习册扫描件', type: '图片', meta: '已识别 12 题 · 昨天 16:45', icon: BookOpenCheck },
  { id: 'upload-3', title: '一次函数课堂练习.docx', type: 'Word', meta: '已识别 8 题 · 10 月 20 日', icon: FileText },
]

export function MyResourcesPanel() {
  const [tab, setTab] = useState<'created' | 'favorite' | 'uploaded'>('created')
  const [keyword, setKeyword] = useState('')
  const source = tab === 'created' ? createdResources : tab === 'favorite' ? favoriteResources : uploadedResources
  const normalized = keyword.trim().toLowerCase()
  const visible = source.filter((item) => !normalized || item.title.toLowerCase().includes(normalized) || item.type.includes(normalized))

  return (
    <section className="my-resources-page" aria-label="我的资源">
        <header>
          <div><strong>我的资源</strong><span>集中管理我创建、收藏和上传的题目资源</span></div>
        </header>
        <div className="my-resource-toolbar">
          <div role="tablist" aria-label="我的资源分类">
            <button type="button" className={tab === 'created' ? 'is-active' : ''} onClick={() => setTab('created')}>我的创建</button>
            <button type="button" className={tab === 'favorite' ? 'is-active' : ''} onClick={() => setTab('favorite')}>我的收藏</button>
            <button type="button" className={tab === 'uploaded' ? 'is-active' : ''} onClick={() => setTab('uploaded')}>我的上传</button>
          </div>
          <label><Search size={15} /><MetisInput value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索题单、试卷、题目或文件" /></label>
        </div>
        <nav className="my-resource-types" aria-label="资源类型">
          {(tab === 'created' ? ['全部', '试卷', '题单', '题目', '文件'] : tab === 'favorite' ? ['全部', '题目', '练习册', '试卷'] : ['全部', 'PDF', 'Word', '图片']).map((item, index) => <button type="button" className={index === 0 ? 'is-active' : ''} key={item}>{item}</button>)}
        </nav>
        <div className="my-resource-list">
          {visible.length ? visible.map(({ id, title, type, meta, icon: Icon }) => (
            <article key={id}>
              <span><Icon size={19} /></span>
              <div><strong>{title}</strong><small>{type} · {meta}</small></div>
              <MetisButton type="borderless" onClick={() => MetisMessage.info(`已打开“${title}”演示`)}>打开</MetisButton>
            </article>
          )) : <div className="my-resource-empty">没有找到匹配资源</div>}
        </div>
    </section>
  )
}

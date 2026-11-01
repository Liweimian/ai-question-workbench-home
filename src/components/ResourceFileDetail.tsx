import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { MetisInput, MetisMessage } from '@yuanfudao/metis-web-component'
import { ArrowLeft, Download, File, MoreHorizontal, Star } from 'lucide-react'
import type { MyResourceSummary } from '../prototype/types'

const SUBJECTS = ['小学科学', '初中数学', '初中语文', '初中英语', '高中数学']

function extensionLabel(name: string) {
  const ext = name.split('.').pop()?.toUpperCase()
  return ext && ext !== name.toUpperCase() ? ext : '文件'
}

interface ResourceFileDetailProps {
  resource: MyResourceSummary
  folders: string[]
  onBack: () => void
  onResourceChange: (resource: MyResourceSummary) => void
  onDeleted: (id: string) => void
}

export function ResourceFileDetail({ resource, folders, onBack, onResourceChange, onDeleted }: ResourceFileDetailProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishSubject, setPublishSubject] = useState('')
  const [publishStudents, setPublishStudents] = useState('')
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(resource.title)
  const [moveOpen, setMoveOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moreOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (moreRef.current?.contains(event.target as Node)) return
      if ((event.target as HTMLElement).closest('.resource-more-menu')) return
      setMoreOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [moreOpen])

  const openMore = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setMoreOpen((open) => !open)
  }

  const confirmPublish = () => {
    if (!publishSubject) {
      MetisMessage.error('请选择学科')
      return
    }
    if (!publishStudents) {
      MetisMessage.error('请选择学生')
      return
    }
    setPublishOpen(false)
    MetisMessage.success('已发布到墨水屏')
  }

  const confirmRename = () => {
    const title = renameValue.trim()
    if (!title) return
    onResourceChange({ ...resource, title })
    setRenameOpen(false)
    MetisMessage.success('已修改名称')
  }

  return (
    <section className="resource-file-detail" aria-label="文件详情">
      <header className="resource-file-detail-bar">
        <button type="button" className="resource-file-back" onClick={onBack}><ArrowLeft size={16} />返回</button>
        <div className="resource-file-detail-title">
          <strong>{resource.title}</strong>
          <span>{resource.detail} · 上传于 {resource.updatedAt} · {resource.folder}</span>
        </div>
        <div className="resource-online-actions">
          <button type="button" className="resource-pill is-publish" onClick={() => { setPublishOpen(true); setPublishSubject(''); setPublishStudents('') }}>发布到墨水屏</button>
          <button type="button" className="resource-pill" onClick={() => MetisMessage.info(`正在下载“${resource.title}”`)}><Download size={15} />下载</button>
          <div className="resource-more" ref={moreRef}>
            <button type="button" className="resource-pill" aria-expanded={moreOpen} onClick={openMore}><MoreHorizontal size={16} />更多</button>
            {moreOpen ? createPortal(
              <div className="resource-more-menu is-portal" role="menu" style={{ top: menuPos.top, right: menuPos.right }}>
                <button type="button" role="menuitem" onClick={() => { setMoveOpen(true); setMoreOpen(false) }}>移动</button>
                <button type="button" role="menuitem" onClick={() => { setFavorited((current) => !current); setMoreOpen(false); MetisMessage.success(favorited ? '已取消收藏' : '已收藏') }}><Star size={14} fill={favorited ? 'currentColor' : 'none'} />{favorited ? '取消收藏' : '收藏'}</button>
                <button type="button" role="menuitem" onClick={() => { setRenameValue(resource.title); setRenameOpen(true); setMoreOpen(false) }}>编辑</button>
                <button type="button" role="menuitem" className="is-danger" onClick={() => { setMoreOpen(false); onDeleted(resource.id); MetisMessage.success('已删除') }}>删除</button>
              </div>,
              document.body,
            ) : null}
          </div>
        </div>
      </header>
      <div className="resource-file-detail-body">
        <div className="resource-file-preview" aria-label="文件预览">
          <article>
            <h3>{resource.title.replace(/\.[^.]+$/, '')}</h3>
            <p>这是文件预览示意。学生在墨水屏上打开后，可直接阅读并在页面上书写作答。</p>
            <p>支持文档、图片在预览区按页展示；音视频显示播放控件。当前为原型示意页。</p>
            <div className="resource-file-preview-lines" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </div>
          </article>
        </div>
        <aside className="resource-file-meta">
          <h4>文件信息</h4>
          <dl>
            <div><dt>类型</dt><dd>{extensionLabel(resource.title)}</dd></div>
            <div><dt>大小</dt><dd>{resource.detail.split('·').pop()?.trim() ?? resource.detail}</dd></div>
            <div><dt>上传时间</dt><dd>{resource.updatedAt}</dd></div>
            <div><dt>所在目录</dt><dd>{resource.folder}</dd></div>
            <div><dt>用途</dt><dd>可发布到墨水屏，不加入题单</dd></div>
          </dl>
          <button type="button" className="resource-pill is-publish" onClick={() => { setPublishOpen(true); setPublishSubject(''); setPublishStudents('') }}>发布到墨水屏</button>
        </aside>
      </div>

      {publishOpen ? (
        <div className="resource-modal-mask" role="presentation" onClick={() => setPublishOpen(false)}>
          <div className="resource-eink-modal" role="dialog" aria-label="发布到墨水屏" onClick={(event) => event.stopPropagation()}>
            <header><strong>发布到墨水屏</strong><button type="button" aria-label="关闭" onClick={() => setPublishOpen(false)}>×</button></header>
            <div className="resource-eink-file"><File size={18} /><span>{resource.title}</span></div>
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

      {renameOpen ? (
        <div className="resource-modal-mask" role="presentation" onClick={() => setRenameOpen(false)}>
          <div className="resource-simple-modal" role="dialog" aria-label="编辑名称" onClick={(event) => event.stopPropagation()}>
            <strong>编辑</strong>
            <p className="resource-edit-hint">修改资源名称</p>
            <MetisInput value={renameValue} onChange={(event) => setRenameValue(event.target.value)} aria-label="资源名称" />
            <div><button type="button" onClick={() => setRenameOpen(false)}>取消</button><button type="button" className="is-primary" onClick={confirmRename}>确定</button></div>
          </div>
        </div>
      ) : null}

      {moveOpen ? (
        <div className="resource-modal-mask" role="presentation" onClick={() => setMoveOpen(false)}>
          <div className="resource-simple-modal" role="dialog" aria-label="移动到" onClick={(event) => event.stopPropagation()}>
            <strong>移动到</strong>
            <div className="resource-move-folders">
              {folders.map((name) => (
                <button type="button" key={name} onClick={() => { onResourceChange({ ...resource, folder: name }); setMoveOpen(false); MetisMessage.success(`已移动到“${name}”`) }}>{name}</button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

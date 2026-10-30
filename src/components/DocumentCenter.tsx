import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import {
  Bot,
  BrainCircuit,
  BookOpen,
  ChevronRight,
  Clock3,
  FileInput,
  FilePlus2,
  FileText,
  FolderOpen,
  Library,
  ListTree,
  Layers3,
  LoaderCircle,
  RefreshCw,
  School,
  Sparkles,
  Target,
} from 'lucide-react'
import type { AddQuestionMode, AsyncStatus, HistoryDocumentSummary, OpenAddOptions } from '../prototype/types'
import { FeixiangAiLibraryLogo } from './ElephantIcon'

interface DocumentCenterProps {
  embedded?: boolean
  histories: HistoryDocumentSummary[]
  historyStatus: AsyncStatus
  onCreate: () => void
  onOpenDocument: (documentId: string) => void
  onOpenSource: (mode: AddQuestionMode, options?: OpenAddOptions) => void
  onReload: () => void
}

const sourceEntries: Array<{ mode: AddQuestionMode; label: string; description: string; icon: typeof Library }> = [
  { mode: 'resource', label: '飞象题库', description: '从平台试卷、习题和章节中选题', icon: Library },
  { mode: 'school', label: '校本题库', description: '从本校沉淀的题目和试卷中选题', icon: School },
  { mode: 'upload', label: '上传文件 AI 录题', description: '上传 Word、PDF 或图片，AI 识别原题', icon: FileInput },
  { mode: 'create', label: 'AI 生成题目', description: '设置教材、知识点、题型、难度和题量后生成', icon: Sparkles },
  { mode: 'compose', label: 'AI 组题', description: '说一句组题需求，AI 自动从题库组题', icon: BrainCircuit },
]

export function DocumentCenter({ embedded = false, histories, historyStatus, onCreate, onOpenDocument, onOpenSource, onReload }: DocumentCenterProps) {
  const recentDocuments = histories.slice(0, 8)

  return (
    <div className={`document-center${embedded ? ' is-embedded' : ''}`}>
      <aside className="document-center-sidebar">
        {!embedded ? <div className="document-center-brand"><FeixiangAiLibraryLogo /><strong>AI 题单</strong></div> : null}
        <div className="document-center-primary-actions">
          <MetisButton type="primary" icon={<FilePlus2 size={18} />} onClick={onCreate} data-track="/click/aiQuestionHome/createFromHome | 首页新建题单 | 无">新建题单</MetisButton>
          <MetisButton type="bordered" icon={<FolderOpen size={18} />} onClick={() => {
            if (recentDocuments[0]) onOpenDocument(recentDocuments[0].id)
            else MetisMessage.info('暂无已有题单，请先新建题单')
          }}>打开题单</MetisButton>
        </div>

        <nav className="document-center-nav" aria-label="题单导航">
          <p>题单</p>
          <button type="button" className="is-active"><Clock3 size={17} /><span>最近编辑</span></button>
          <button type="button" onClick={() => recentDocuments[0] ? onOpenDocument(recentDocuments[0].id) : MetisMessage.info('暂无已有题单')}><FileText size={17} /><span>我的题单</span></button>
          <p>添加内容</p>
          <button type="button" className="document-center-parent" aria-expanded="true" onClick={() => onOpenSource('resource')}><Library size={17} /><span>飞象题库</span></button>
          <div className="document-center-subnav" aria-label="飞象题库分类">
            <button type="button" onClick={() => onOpenSource('resource', { libraryView: 'chapter' })}><ListTree size={15} /><span>章节知识点选题</span></button>
            <button type="button" onClick={() => onOpenSource('resource', { libraryView: 'workbook' })}><BookOpen size={15} /><span>练习册</span></button>
            <button type="button" onClick={() => onOpenSource('resource', { libraryView: 'paper' })}><FileText size={15} /><span>试卷</span></button>
            <button type="button" onClick={() => onOpenSource('resource', { libraryView: 'sync' })}><Layers3 size={15} /><span>同步练习</span></button>
            <button type="button" onClick={() => onOpenSource('resource', { libraryView: 'special' })}><Target size={15} /><span>专题练习</span></button>
          </div>
          <button type="button" className="document-center-parent" aria-expanded="true" onClick={() => onOpenSource('school')}><School size={17} /><span>校本题库</span></button>
          <div className="document-center-subnav" aria-label="校本题库分类">
            <button type="button" onClick={() => onOpenSource('school', { libraryView: 'chapter' })}><ListTree size={15} /><span>章节知识点选题</span></button>
            <button type="button" onClick={() => onOpenSource('school', { libraryView: 'workbook' })}><BookOpen size={15} /><span>练习册</span></button>
            <button type="button" onClick={() => onOpenSource('school', { libraryView: 'paper' })}><FileText size={15} /><span>试卷</span></button>
          </div>
          {sourceEntries.filter(({ mode }) => mode !== 'resource' && mode !== 'school').map(({ mode, label, icon: Icon }) => (
            <button type="button" key={mode} onClick={() => onOpenSource(mode)}><Icon size={17} /><span>{label}</span></button>
          ))}
          <button type="button" onClick={() => MetisMessage.info('近期浏览记录会在这里展示')}><RefreshCw size={17} /><span>最近浏览</span></button>
        </nav>
        <div className="document-center-tip"><Bot size={16} /><span>先新建或打开题单，再从左侧添加内容。</span></div>
      </aside>

      <main className="document-center-main">
        <header className="document-center-heading">
          <div>{!embedded ? <span>题单工作台</span> : null}<h1>最近编辑</h1>{!embedded ? <p>继续上次的题单，或创建一份新题单。</p> : null}</div>
          {!embedded ? <MetisButton type="borderless" icon={<RefreshCw size={16} />} onClick={onReload}>刷新</MetisButton> : null}
        </header>

        <section className="document-center-quick" aria-label="开始使用">
          <button type="button" onClick={onCreate}><span className="is-primary"><FilePlus2 size={22} /></span><strong>新建题单</strong><small>从一份空白题单开始</small><ChevronRight size={17} /></button>
          <button type="button" onClick={() => recentDocuments[0] ? onOpenDocument(recentDocuments[0].id) : MetisMessage.info('暂无已有题单')}><span><FolderOpen size={22} /></span><strong>打开题单</strong><small>继续编辑已有内容</small><ChevronRight size={17} /></button>
        </section>

        <section className="document-center-recent" aria-label="最近编辑题单">
          <div className="document-center-section-title"><div><h2>最近编辑的题单</h2><p>按最近修改时间排序</p></div><span>{recentDocuments.length} 份</span></div>
          {historyStatus === 'loading' ? <div className="document-center-state"><LoaderCircle className="is-spinning" size={18} />正在加载最近题单…</div>
            : historyStatus === 'error' ? <div className="document-center-state is-error"><span>最近题单加载失败</span><MetisButton type="bordered" onClick={onReload}>重新加载</MetisButton></div>
              : recentDocuments.length ? <div className="document-center-list">
                {recentDocuments.map((item) => (
                  <button type="button" key={item.id} onClick={() => onOpenDocument(item.id)}>
                    <span className="document-file-icon"><FileText size={22} /></span>
                    <span className="document-file-name"><strong>{item.title}</strong><small>{item.gradeSubject} · {item.origin}</small></span>
                    <span>{item.questionCount} 道题</span><span>{item.status}</span><span>{item.updatedAt}</span><ChevronRight size={17} />
                  </button>
                ))}
              </div> : <div className="document-center-empty"><FileText size={30} /><strong>还没有编辑过的题单</strong><p>新建题单后，它会出现在这里。</p><MetisButton type="primary" onClick={onCreate}>新建题单</MetisButton></div>}
        </section>

        <section className="document-center-sources" aria-label="题单内容来源">
          <div className="document-center-section-title"><div><h2>打开题单后，从这些来源添加内容</h2><p>点击后会进入题单编辑区，并打开对应工具。</p></div></div>
          <div className="document-center-source-grid">{sourceEntries.slice(0, 4).map(({ mode, label, description, icon: Icon }) => <button type="button" key={mode} onClick={() => onOpenSource(mode)}><Icon size={20} /><span><strong>{label}</strong><small>{description}</small></span><ChevronRight size={16} /></button>)}</div>
        </section>
      </main>
    </div>
  )
}

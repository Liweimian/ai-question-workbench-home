import { useEffect, useState } from 'react'
import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import {
  ArrowLeft,
  FilePenLine,
  FileText,
  FileUp,
  Minus,
  Plus,
  School,
  Search,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import { baseQuestions, sourceRecords } from '../data/workbenchData'
import type {
  AddQuestionMode,
  AsyncStatus,
  CreateQuestionRequest,
  LibraryInitialView,
  Question,
  ResourceType,
  SourceRecord,
} from '../prototype/types'
import { animateQuestionToDraft } from '../utils/animateQuestionToDraft'
import { LibraryPicker } from './LibraryPicker'

interface SourceDrawerProps {
  presentation?: 'modal' | 'docked'
  mode: AddQuestionMode
  libraryInitialView?: LibraryInitialView
  librarySearchKeyword?: string
  libraryChapterNode?: string
  libraryQuestionId?: string
  libraryQuestionType?: Question['type']
  libraryDifficulty?: Question['difficulty']
  libraryMatchedPath?: string
  hideLibraryMatchBanner?: boolean
  resourceType: ResourceType
  records: SourceRecord[]
  listStatus: AsyncStatus
  addStatus: AsyncStatus
  contentBusy: boolean
  compactUploadDetail?: boolean
  onViewUploadOriginal?: () => void
  createConfig: CreateQuestionRequest
  createError: string
  createStatus: AsyncStatus
  createPreview: Question[]
  libraryDetail?: SourceRecord | null
  onModeChange: (mode: AddQuestionMode) => void
  onResourceTypeChange: (type: ResourceType) => void
  onAddSource: (type: ResourceType, sourceId?: string, count?: number, selectedQuestions?: Question[]) => Promise<boolean>
  currentDocumentHasContent?: boolean
  currentDocumentHasUnsavedChanges?: boolean
  onCompleteEditWholeVolume?: (
    type: ResourceType,
    sourceId: string,
    count: number,
    selectedQuestions: Question[],
    mode: 'plain' | 'save-first' | 'discard-first',
  ) => Promise<'success' | 'failed'>
  onOpenLibraryDetail?: (record: SourceRecord) => void
  onWorkbookDirectoryChange?: (record: SourceRecord, matchedPath: string) => void
  onCreateConfigChange: (value: CreateQuestionRequest) => void
  onCreate: (requestOverride?: CreateQuestionRequest) => void
  onAddCreated: () => void
  onUpload: () => void
  onAddManual: () => void
  onClose: () => void
}

const commandOptions: Array<{
  mode: Exclude<AddQuestionMode, 'menu'>
  title: string
  description: string
  tag: string
  icon: typeof Search
}> = [
  { mode: 'resource', title: '飞象题库选题', description: '浏览练习册、试卷、同步题单和专题', tag: '平台资源', icon: Search },
  { mode: 'district', title: '区本题库选题', description: '浏览区域沉淀的试卷、练习册和章节题目', tag: '区域资源', icon: School },
  { mode: 'school', title: '校本题库选题', description: '浏览本校沉淀的试卷、练习册和章节题目', tag: '本校资源', icon: School },
  { mode: 'upload', title: '上传文件 AI 录题', description: '上传 PDF、Word 或图片，识别并录入原题', tag: '文件识别', icon: FileUp },
  { mode: 'create', title: 'AI 出题', description: '设置教材、知识点、题型和题量，生成几道新题', tag: '条件出题', icon: Sparkles },
  { mode: 'manual', title: '手工录入', description: '添加一道空白题并继续编辑', tag: '空白题', icon: FilePenLine },
]

const modeTitles: Record<AddQuestionMode, string> = {
  menu: '添加题目',
  resource: '从飞象题库选题',
  district: '从区本题库选题',
  school: '从校本题库选题',
  compose: 'AI 组题',
  create: 'AI 出题',
  upload: '上传文件 AI 录题',
  personalized: '上传材料生成个性化练习',
  manual: '手工录入',
}

const structuredKnowledgeExamples: Record<string, string> = {
  concept: '判断一次函数与正比例函数',
  image: '图象、增减性与截距',
  application: '方案比较与情境建模',
}

const recognitionRecords = [
  {
    id: 'recognition-1',
    title: '2025-2026学年杭州市钱塘区观澜中学七年级下册期末项目评价试卷：数学.pdf',
    submittedAt: '2026-09-24 15:35',
    completedAt: '2026-09-24 15:40',
    size: '5.3MB',
    questionCount: '28题',
  },
  {
    id: 'recognition-2',
    title: '2025-2026学年杭州市钱塘区义蓬中学九年级下册第3次适应性训练——学科试题卷：数学.pdf',
    submittedAt: '2026-08-27 10:26',
    completedAt: '2026-08-27 10:29',
    size: '2.4MB',
    questionCount: '25题',
  },
  {
    id: 'recognition-3',
    title: '2025-2026学年深圳市福田区红岭实验学校（上沙）九年级下册周测试卷：物理.pdf',
    submittedAt: '2026-06-11 19:29',
    completedAt: '2026-06-11 19:30',
    size: '1.2MB',
    questionCount: '18题',
  },
]

const delegatedRecognitionRecords = [
  {
    id: 'delegated-1',
    title: '2026-2027学年北京市朝阳区八年级（上）期中数学试卷',
    submittedAt: '2026-09-20 10:18',
    completedAt: '2026-09-21 16:30',
    size: '4.8MB',
    questionCount: '25题',
    paperId: 'paper-1',
  },
]

export function SourceDrawer(props: SourceDrawerProps) {
  const [libraryDetailOpen, setLibraryDetailOpen] = useState(false)
  const [recognitionTab, setRecognitionTab] = useState<'ai' | 'manual'>('ai')
  const [recognitionKeyword, setRecognitionKeyword] = useState('')
  const [createTool, setCreateTool] = useState<'oral' | 'chinese' | 'english'>('oral')
  const [recognitionDetailId, setRecognitionDetailId] = useState<string | null>(null)
  const [addedRecognitionQuestionIds, setAddedRecognitionQuestionIds] = useState<Set<string>>(new Set())
  const docked = props.presentation === 'docked'
  const createTotal = props.createConfig.allocations.reduce((sum, item) => sum + item.count, 0)
  const visibleRecognitionRecords = recognitionRecords.filter((record) => record.title.includes(recognitionKeyword.trim()))
  const visibleDelegatedRecords = delegatedRecognitionRecords.filter((record) => record.title.includes(recognitionKeyword.trim()))
  const recognitionDetailRecord = recognitionRecords.find((record) => record.id === recognitionDetailId)
  const recognitionQuestions = baseQuestions.slice(0, 4).map((question, index) => ({
    ...question,
    id: `recognition-${recognitionDetailId ?? 'preview'}-${index}`,
    sourceLabel: 'AI 录题',
    sourceDetail: recognitionDetailRecord?.title,
    origin: 'upload' as const,
    verifyStatus: '待校验' as const,
  }))

  const addRecognitionQuestions = async (questions: Question[]) => {
    const pending = questions.filter((question) => !addedRecognitionQuestionIds.has(question.id))
    if (!pending.length) return
    const added = await props.onAddSource('paper', recognitionDetailId ?? 'ai-recording', pending.length, pending)
    if (added) setAddedRecognitionQuestionIds((current) => new Set([...current, ...pending.map((question) => question.id)]))
  }

  const updateCreateCount = (id: string, delta: number) => {
    const nextAllocations = props.createConfig.allocations.map((item) => {
      if (item.id !== id) return item
      const maxForItem = Math.min(10, item.count + Math.max(0, 12 - createTotal))
      return { ...item, count: Math.max(0, Math.min(maxForItem, item.count + delta)) }
    })
    props.onCreateConfigChange({ ...props.createConfig, allocations: nextAllocations })
  }

  const generateStructuredQuestions = () => {
    if (createTotal === 0 || props.contentBusy) return
    props.onCreate(props.createConfig)
  }

  useEffect(() => { setLibraryDetailOpen(false) }, [props.mode])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        props.onClose()
        return
      }
      if (props.mode === 'menu' && !props.contentBusy && /^[1-5]$/.test(event.key)) {
        const option = commandOptions[Number(event.key) - 1]
        if (option) props.onModeChange(option.mode)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [props.contentBusy, props.mode, props.onClose, props.onModeChange])

  return (
    <div className={`add-question-layer${props.mode === 'resource' || props.mode === 'district' || props.mode === 'school' ? ' add-question-layer--library' : ''}${docked ? ' is-docked' : ''}`} onMouseDown={docked ? undefined : props.onClose}>
      <section
        className={`add-question-panel${props.mode === 'resource' || props.mode === 'district' || props.mode === 'school' ? ' add-question-panel--library' : ''}${docked ? ' is-docked' : ''}`}
        data-sec="5"
        role={docked ? 'region' : 'dialog'}
        aria-modal={docked ? undefined : 'true'}
        aria-label="添加题目"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {!docked ? (
          <header className="add-question-header">
            <div className="add-question-title">
              <div className="add-question-heading-copy">
                <div data-picker-detail-nav className={libraryDetailOpen ? '' : 'is-hidden'} />
                {!docked && !libraryDetailOpen ? <h2>{modeTitles[props.mode]}</h2> : null}
                {!docked && props.mode === 'menu' ? <p>一个入口，选择这次要怎样添加题目</p> : null}
              </div>
            </div>
            <div className="add-question-header-actions">
              {!docked ? <MetisButton type="borderless" icon={<X size={18} />} aria-label="关闭添加题目" onClick={props.onClose} /> : null}
            </div>
          </header>
        ) : null}

        <div className="add-question-body">
          {props.mode === 'menu' ? (
            <div className="add-command-list">
              {commandOptions.map(({ mode, title, description, tag, icon: Icon }, index) => (
                <button
                  type="button"
                  key={mode}
                  className="add-command-item"
                  disabled={props.contentBusy}
                  onClick={() => props.onModeChange(mode)}
                  data-track={`/click/aiQuestionHome/addMode${mode} | 选择${title} | 无`}
                >
                  <span className={`add-command-icon add-command-icon--${mode}`}><Icon size={20} /></span>
                  <span className="add-command-copy"><strong>{title}</strong><small>{description}</small></span>
                  <span className="add-command-tag">{tag}</span>
                  <kbd>{index + 1}</kbd>
                </button>
              ))}
            </div>
          ) : null}

          {props.mode === 'resource' || props.mode === 'district' || props.mode === 'school' ? (
            <LibraryPicker
              libraryKind={props.mode === 'resource' ? 'fly' : 'school'}
              memoryKey={props.mode}
              hideResourceTabs={docked && props.mode === 'resource'}
              initialView={props.libraryInitialView}
              initialSearchKeyword={props.librarySearchKeyword}
              initialChapterNode={props.libraryChapterNode}
              initialQuestionId={props.libraryQuestionId}
              initialQuestionType={props.libraryQuestionType}
              initialDifficulty={props.libraryDifficulty}
              initialMatchedPath={props.libraryMatchedPath}
              hideMatchBanner={props.hideLibraryMatchBanner}
              resourceType={props.resourceType}
              records={props.records}
              listStatus={props.listStatus}
              addStatus={props.addStatus}
              contentBusy={props.contentBusy}
              detailRecord={docked ? props.libraryDetail : undefined}
              onDetailChange={setLibraryDetailOpen}
              onOpenDetail={docked ? props.onOpenLibraryDetail : undefined}
              onWorkbookDirectoryChange={props.onWorkbookDirectoryChange}
              onResourceTypeChange={props.onResourceTypeChange}
              onAddSource={(type, sourceId, count, selectedQuestions) => props.onAddSource(type, sourceId, count, selectedQuestions)}
              currentDocumentHasContent={props.currentDocumentHasContent}
              currentDocumentHasUnsavedChanges={props.currentDocumentHasUnsavedChanges}
              onCompleteEditWholeVolume={props.onCompleteEditWholeVolume}
            />
          ) : null}

          {props.mode === 'create' ? (
            <div className="structured-create-tool">
              <aside className="structured-create-settings" aria-label="AI 出题设置">
                <div className="structured-create-tool-tabs" role="tablist" aria-label="AI 出题工具">
                  <button type="button" role="tab" aria-selected={createTool === 'oral'} className={createTool === 'oral' ? 'is-active' : ''} onClick={() => setCreateTool('oral')}>口算练习</button>
                  <button type="button" role="tab" aria-selected={createTool === 'chinese'} className={createTool === 'chinese' ? 'is-active' : ''} onClick={() => setCreateTool('chinese')}>语文字词</button>
                  <button type="button" role="tab" aria-selected={createTool === 'english'} className={createTool === 'english' ? 'is-active' : ''} onClick={() => setCreateTool('english')}>英汉互译</button>
                </div>
                {createTool === 'oral' ? (
                  <>
                    <section>
                      <h4>设置出题条件</h4>
                      <label>出题方式<select value={props.createConfig.method} onChange={(event) => props.onCreateConfigChange({ ...props.createConfig, method: event.target.value as CreateQuestionRequest['method'] })}><option value="知识点组合出题">知识点合并出题</option><option>逐知识点出题</option><option>综合情境出题</option></select></label>
                      <label>知识点排序<select defaultValue="顺序"><option>顺序</option><option>随机</option></select></label>
                    </section>
                    <section>
                      <h4>选择教材及章节</h4>
                      <label>教材<select value={props.createConfig.textbook} onChange={(event) => props.onCreateConfigChange({ ...props.createConfig, textbook: event.target.value })}><option>人教版 · 八年级上册</option><option>北师大版 · 八年级上册</option></select></label>
                      <label>章节<select value={props.createConfig.chapter} onChange={(event) => props.onCreateConfigChange({ ...props.createConfig, chapter: event.target.value })}><option>第四章 一次函数</option><option>第五章 二元一次方程组</option></select></label>
                      <div className="structured-chapter-tree"><strong>{props.createConfig.chapter}</strong>{props.createConfig.allocations.map((item) => <span key={item.id}><input type="checkbox" defaultChecked /> {item.knowledgePoint}</span>)}</div>
                    </section>
                  </>
                ) : (
                  <section>
                    <h4>{createTool === 'chinese' ? '选择教材及课文' : '选择教材及单元'}</h4>
                    <label>教材<select defaultValue={createTool === 'chinese' ? '人教版 · 八年级上册' : '人教版 · 八年级上册英语'}><option>{createTool === 'chinese' ? '人教版 · 八年级上册' : '人教版 · 八年级上册英语'}</option></select></label>
                    <div className="structured-chapter-tree">
                      <strong>{createTool === 'chinese' ? '第一单元' : 'Unit 1'}</strong>
                      {(createTool === 'chinese' ? ['读读写写', '重点字词', '课外扩展'] : ['Section A', 'Section B', 'Reading']).map((item) => <span key={item}><input type="checkbox" defaultChecked /> {item}</span>)}
                    </div>
                  </section>
                )}
              </aside>
              <section className="structured-create-main" aria-label="AI 出题题量与预览">
                <header><div><h3>2. 设置知识点题量</h3><p>每个知识点可单独调整，当前共 {createTotal} 道</p></div><span>AI 原创 · 待校验</span></header>
                <div className="structured-count-grid">
                  {props.createConfig.allocations.map((item) => (
                    <article key={item.id}>
                      <div><strong>{item.knowledgePoint}</strong><small>示例：{structuredKnowledgeExamples[item.id] ?? '围绕当前知识点生成'}</small></div>
                      <div className="structured-stepper" aria-label={`${item.knowledgePoint}题量`}>
                        <button type="button" aria-label={`减少${item.knowledgePoint}题量`} disabled={props.contentBusy || item.count === 0} onClick={() => updateCreateCount(item.id, -1)}><Minus size={14} /></button>
                        <strong>{item.count}</strong>
                        <button type="button" aria-label={`增加${item.knowledgePoint}题量`} disabled={props.contentBusy || item.count === 10 || createTotal >= 12} onClick={() => updateCreateCount(item.id, 1)}><Plus size={14} /></button>
                      </div>
                    </article>
                  ))}
                </div>
                {props.createError ? <div className="inline-error" role="alert">{props.createError}</div> : null}
                {props.createPreview.length > 0 ? (
                  <div className="create-preview-block structured-create-preview">
                    <div className="create-preview-heading"><strong>生成预览</strong><span>{props.createPreview.length} 道 · 确认后添加到题单</span></div>
                    <div className="create-preview-list">
                      {props.createPreview.map((question, index) => (
                        <article key={question.id}><span>{index + 1}</span><p>{question.stem}</p></article>
                      ))}
                    </div>
                    <div className="structured-create-actions">
                      <MetisButton type="bordered" disabled={props.contentBusy} onClick={generateStructuredQuestions}>重新生成</MetisButton>
                      <MetisButton type="primary" icon={<Plus size={16} />} disabled={props.contentBusy} onClick={(event) => { animateQuestionToDraft(event.currentTarget); props.onAddCreated() }}>添加</MetisButton>
                    </div>
                  </div>
                ) : (
                  <MetisButton type="primary" className="structured-generate" icon={<Sparkles size={17} />} loading={props.createStatus === 'loading'} disabled={props.contentBusy || createTotal === 0} onClick={generateStructuredQuestions}>
                    生成 {createTotal} 道题
                  </MetisButton>
                )}
              </section>
            </div>
          ) : null}

          {props.mode === 'upload' && recognitionDetailRecord ? (
            <div className={`ai-recording-detail${props.compactUploadDetail ? ' is-compact' : ''}`}>
              <header className="ai-recording-detail-header">
                <button type="button" onClick={() => setRecognitionDetailId(null)}><ArrowLeft size={17} />返回解析记录</button>
                <div><strong title={recognitionDetailRecord.title}>{recognitionDetailRecord.title}</strong><span>AI 录题内容（共 {recognitionQuestions.length} 道题）</span></div>
                <div className="ai-recording-detail-actions">
                  <span>效果不好？<button type="button" onClick={() => { setRecognitionDetailId(null); setRecognitionTab('manual') }}>人工委托录题</button></span>
                  {props.compactUploadDetail ? <MetisButton type="bordered" onClick={props.onViewUploadOriginal}>查看原卷</MetisButton> : null}
                  <MetisButton type="primary" icon={<Plus size={16} />} disabled={props.contentBusy || addedRecognitionQuestionIds.size === recognitionQuestions.length} onClick={(event) => { animateQuestionToDraft(event.currentTarget); void addRecognitionQuestions(recognitionQuestions) }}>
                    {addedRecognitionQuestionIds.size === recognitionQuestions.length ? '已添加整卷' : '添加整卷'}
                  </MetisButton>
                </div>
              </header>
              <div className="ai-recording-detail-body">
                <aside className="ai-recording-original" aria-label="原文件预览">
                  <div className="ai-recording-original-toolbar"><strong>原文件</strong><span>1 / 3 页</span></div>
                  <div className="ai-recording-paper-preview">
                    <h3>期末项目评价作业</h3>
                    {recognitionQuestions.map((question, index) => <p key={question.id}><b>{index + 1}.</b> {question.stem}</p>)}
                  </div>
                </aside>
                <main className="ai-recording-question-pane" aria-label="AI 录题内容">
                  {recognitionQuestions.map((question, index) => {
                    const added = addedRecognitionQuestionIds.has(question.id)
                    return (
                      <article className="ai-recording-question-card" key={question.id}>
                        <div className="ai-recording-question-toolbar">
                          <span>飞象原题</span>
                        </div>
                        <div className="ai-recording-question-meta"><small>{question.type} · {question.difficulty}</small></div>
                        <div className="ai-recording-question-stem"><b>{index + 1}.</b><p>{question.stem}</p></div>
                        {question.options?.length ? <ul>{question.options.map((option) => <li key={option}>{option}</li>)}</ul> : null}
                        <dl><dt>答案</dt><dd>{question.answer}</dd><dt>解析</dt><dd>{question.analysis}</dd></dl>
                        <footer><span>知识点：{question.knowledgePoint}</span><MetisButton type={added ? 'bordered' : 'primary'} disabled={added || props.contentBusy} icon={<Plus size={15} />} onClick={(event) => { animateQuestionToDraft(event.currentTarget); void addRecognitionQuestions([question]) }}>{added ? '已添加' : '添加'}</MetisButton></footer>
                      </article>
                    )
                  })}
                </main>
              </div>
            </div>
          ) : null}

          {props.mode === 'upload' && !recognitionDetailRecord ? (
            <div className="add-mode-content upload-workbench">
              <section className="ai-recording-hero">
                <div className="ai-recording-intro">
                  <div className="ai-recording-title"><span>AI</span><h2>智能录题</h2></div>
                  <p>上传题目答案文件，AI智能一键生成专属个人题库格式</p>
                  <div className="ai-recording-delegate">复杂资料或资料解析不佳？<button type="button" onClick={() => setRecognitionTab('manual')}>委托人工录入 →</button></div>
                  <i className="ai-recording-paper" aria-hidden="true" />
                </div>
                <button
                  type="button"
                  className="ai-recording-dropzone"
                  disabled={props.contentBusy}
                  onClick={props.onUpload}
                  data-track="/click/aiQuestionHome/uploadQuestion | AI智能录题 | 无"
                >
                  <span className="ai-recording-file"><FileText size={42} /><UploadCloud size={22} /></span>
                  <strong>点击上传 / 拖动文件到此处 / 快捷键粘贴</strong>
                  <small>支持 PDF、DOCX，单文件限 20M 内</small>
                </button>
              </section>

              <section className="ai-recording-progress">
                <div className="ai-recording-toolbar">
                  <div className="ai-recording-tabs" role="tablist" aria-label="录题进度">
                    <button type="button" role="tab" aria-selected={recognitionTab === 'ai'} className={recognitionTab === 'ai' ? 'is-active' : ''} onClick={() => setRecognitionTab('ai')}>AI解析进度</button>
                    <button type="button" role="tab" aria-selected={recognitionTab === 'manual'} className={recognitionTab === 'manual' ? 'is-active' : ''} onClick={() => setRecognitionTab('manual')}>委托录题进度</button>
                  </div>
                  <label className="ai-recording-search"><Search size={17} /><input value={recognitionKeyword} onChange={(event) => setRecognitionKeyword(event.target.value)} placeholder="搜索" /></label>
                </div>

                {recognitionTab === 'ai' ? (
                  <div className="ai-recording-list">
                    {visibleRecognitionRecords.map((record) => (
                      <article className="ai-recording-row" key={record.id}>
                        <span className="ai-recording-pdf"><FileText size={28} /><b>PDF</b></span>
                        <div className="ai-recording-record">
                          <div><span className="ai-recording-status">解析完成</span><strong>{record.title}</strong></div>
                          <p><span>提交时间：{record.submittedAt}</span><span>完成时间：{record.completedAt}</span><i /><span>{record.size}</span><i /><span>{record.questionCount}</span></p>
                        </div>
                        <MetisButton type="bordered" onClick={() => { setRecognitionDetailId(record.id); setAddedRecognitionQuestionIds(new Set()) }}>查看</MetisButton>
                      </article>
                    ))}
                    {visibleRecognitionRecords.length === 0 ? <div className="ai-recording-empty">暂无匹配的解析记录</div> : null}
                  </div>
                ) : (
                  <div className="ai-recording-list">
                    {visibleDelegatedRecords.map((record) => (
                      <article className="ai-recording-row" key={record.id}>
                        <span className="ai-recording-pdf"><FileText size={28} /><b>PDF</b></span>
                        <div className="ai-recording-record">
                          <div><span className="ai-recording-status">录题完成</span><strong>{record.title}</strong></div>
                          <p><span>提交时间：{record.submittedAt}</span><span>完成时间：{record.completedAt}</span><i /><span>{record.size}</span><i /><span>{record.questionCount}</span></p>
                        </div>
                        <MetisButton type="bordered" onClick={() => {
                          const paper = sourceRecords.find((item) => item.id === record.paperId)
                          if (paper) props.onOpenLibraryDetail?.({ ...paper, id: `delegated-${paper.id}`, tags: [...(paper.tags ?? []), '委托录题'] })
                        }}>查看</MetisButton>
                      </article>
                    ))}
                    {visibleDelegatedRecords.length === 0 ? <div className="ai-recording-empty">暂无匹配的委托录题记录</div> : null}
                  </div>
                )}
              </section>
            </div>
          ) : null}

          {props.mode === 'manual' ? (
            <div className="add-mode-content manual-panel">
              <div className="manual-visual"><FilePenLine size={28} /></div>
              <h3>添加一道空白题</h3>
              <p>先创建空白题，再在中间编辑区补充题干、答案与解析。</p>
              <MetisButton
                type="primary"
                icon={<Plus size={17} />}
                loading={props.addStatus === 'loading'}
                disabled={props.contentBusy}
                onClick={props.onAddManual}
              >
                添加空白题
              </MetisButton>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

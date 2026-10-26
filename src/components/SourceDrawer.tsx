import { useEffect, useState } from 'react'
import { MetisButton } from '@yuanfudao/metis-web-component'
import {
  BrainCircuit,
  FilePenLine,
  Files,
  FileUp,
  GraduationCap,
  Minus,
  Plus,
  School,
  Search,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import type {
  AddQuestionMode,
  AsyncStatus,
  CreateQuestionRequest,
  LibraryInitialView,
  Question,
  ResourceType,
  SourceRecord,
} from '../prototype/types'
import { AiComposer } from './AiComposer'
import { LibraryPicker } from './LibraryPicker'

interface SourceDrawerProps {
  presentation?: 'modal' | 'docked'
  mode: AddQuestionMode
  libraryInitialView?: LibraryInitialView
  resourceType: ResourceType
  records: SourceRecord[]
  listStatus: AsyncStatus
  addStatus: AsyncStatus
  contentBusy: boolean
  composePrompt: string
  composeError: string
  composeStatus: AsyncStatus
  createConfig: CreateQuestionRequest
  createError: string
  createStatus: AsyncStatus
  createPreview: Question[]
  onModeChange: (mode: AddQuestionMode) => void
  onResourceTypeChange: (type: ResourceType) => void
  onAddSource: (type: ResourceType, sourceId?: string, count?: number) => void
  onComposePromptChange: (value: string) => void
  onCompose: () => void
  onCreateConfigChange: (value: CreateQuestionRequest) => void
  onCreate: (requestOverride?: CreateQuestionRequest) => void
  onAddCreated: () => void
  onUpload: () => void
  onPersonalize: () => void
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
  { mode: 'school', title: '校本题库选题', description: '浏览本校沉淀的试卷、练习册和章节题目', tag: '本校资源', icon: School },
  { mode: 'upload', title: '上传文件 AI 录题', description: '识别 PDF、Word 或图片中的原题', tag: '材料转题目', icon: FileUp },
  { mode: 'compose', title: 'AI 组题', description: '根据要求从题库智能挑选，保留真实来源', tag: 'AI 对话能力', icon: BrainCircuit },
  { mode: 'create', title: 'AI 出题工具', description: '按教材、知识点和题量生成原创题', tag: '原创 · 待校验', icon: Sparkles },
  { mode: 'personalized', title: '上传材料生成个性化练习', description: '结合上传材料与学情生成针对性练习', tag: 'AI 个性化', icon: GraduationCap },
  { mode: 'manual', title: '手工录入', description: '添加一道空白题并继续编辑', tag: '空白题', icon: FilePenLine },
]

const modeTitles: Record<AddQuestionMode, string> = {
  menu: '添加题目',
  resource: '从飞象题库选题',
  school: '从校本题库选题',
  compose: 'AI 组题',
  create: 'AI 出题工具',
  upload: '上传文件 AI 录题',
  personalized: '上传材料生成个性化练习',
  manual: '手工录入',
}

const structuredKnowledgeExamples: Record<string, string> = {
  concept: '判断一次函数与正比例函数',
  image: '图象、增减性与截距',
  application: '方案比较与情境建模',
}

export function SourceDrawer(props: SourceDrawerProps) {
  const [libraryDetailOpen, setLibraryDetailOpen] = useState(false)
  const docked = props.presentation === 'docked'
  const createTotal = props.createConfig.allocations.reduce((sum, item) => sum + item.count, 0)

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
      if (props.mode === 'menu' && !props.contentBusy && /^[1-7]$/.test(event.key)) {
        const option = commandOptions[Number(event.key) - 1]
        if (option) props.onModeChange(option.mode)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [props.contentBusy, props.mode, props.onClose, props.onModeChange])

  return (
    <div className={`add-question-layer${props.mode === 'resource' || props.mode === 'school' ? ' add-question-layer--library' : ''}${docked ? ' is-docked' : ''}`} onMouseDown={docked ? undefined : props.onClose}>
      <section
        className={`add-question-panel${props.mode === 'resource' || props.mode === 'school' ? ' add-question-panel--library' : ''}${docked ? ' is-docked' : ''}`}
        data-sec="5"
        role={docked ? 'region' : 'dialog'}
        aria-modal={docked ? undefined : 'true'}
        aria-label="添加题目"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {!docked || libraryDetailOpen ? (
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

          {props.mode === 'resource' || props.mode === 'school' ? (
            <LibraryPicker
              libraryKind={props.mode === 'school' ? 'school' : 'fly'}
              initialView={props.libraryInitialView}
              resourceType={props.resourceType}
              records={props.records}
              listStatus={props.listStatus}
              addStatus={props.addStatus}
              contentBusy={props.contentBusy}
              onDetailChange={setLibraryDetailOpen}
              onResourceTypeChange={props.onResourceTypeChange}
              onAddSource={(type, sourceId, count) => props.onAddSource(type, sourceId, count)}
            />
          ) : null}

          {props.mode === 'compose' ? (
            <div className="add-mode-content ai-mode-content">
              <div className="ai-mode-intro ai-mode-intro--compose">
                <BrainCircuit size={21} />
                <div><strong>从已有题库智能挑题</strong><p>按年级、知识点、难度和题量筛选，加入后仍保留真实题目来源。</p></div>
              </div>
              <AiComposer
                compact
                kind="compose"
                value={props.composePrompt}
                error={props.composeError}
                status={props.composeStatus}
                disabled={props.contentBusy}
                onChange={props.onComposePromptChange}
                onSubmit={props.onCompose}
              />
              <div className="prompt-example-list">
                <button type="button" onClick={() => props.onComposePromptChange('挑选 6 道一次函数基础题')}>6 道一次函数基础题</button>
                <button type="button" onClick={() => props.onComposePromptChange('按基础 6、提升 4 生成分层作业')}>基础与提升分层组题</button>
                <button type="button" onClick={() => props.onComposePromptChange('筛选 3 道函数实际应用解答题')}>实际应用解答题</button>
              </div>
            </div>
          ) : null}

          {props.mode === 'create' ? (
            <div className="structured-create-tool">
              <aside className="structured-create-settings" aria-label="AI 出题设置">
                <div className="structured-create-heading"><Sparkles size={19} /><div><h3>AI 生成题目</h3><p>按教材、知识点与题量生成原创题</p></div></div>
                <section>
                  <h4>设置出题条件</h4>
                  <label>出题方式<select value={props.createConfig.method} onChange={(event) => props.onCreateConfigChange({ ...props.createConfig, method: event.target.value as CreateQuestionRequest['method'] })}><option>知识点组合出题</option><option>逐知识点出题</option><option>综合情境出题</option></select></label>
                  <label>整体难度<select value={props.createConfig.difficulty} onChange={(event) => props.onCreateConfigChange({ ...props.createConfig, difficulty: event.target.value as CreateQuestionRequest['difficulty'] })}><option>基础</option><option>中等</option><option>提升</option></select></label>
                </section>
                <section>
                  <h4>选择教材及章节</h4>
                  <div className="structured-textbook">{props.createConfig.textbook}</div>
                  <div className="structured-chapter-tree">
                    <strong>{props.createConfig.chapter}</strong>
                    {props.createConfig.allocations.map((item) => <span key={item.id}>✓ {item.knowledgePoint}</span>)}
                  </div>
                </section>
              </aside>
              <section className="structured-create-main" aria-label="AI 出题题量与预览">
                <header><div><h3>设置知识点题量</h3><p>每个知识点可单独调整，当前共 {createTotal} 道</p></div><span>AI 原创 · 待校验</span></header>
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
                    <div className="create-preview-heading"><strong>生成预览</strong><span>{props.createPreview.length} 道 · 确认后加入左侧题稿</span></div>
                    <div className="create-preview-list">
                      {props.createPreview.map((question, index) => (
                        <article key={question.id}><span>{index + 1}</span><p>{question.stem}</p></article>
                      ))}
                    </div>
                    <div className="structured-create-actions">
                      <MetisButton type="bordered" disabled={props.contentBusy} onClick={generateStructuredQuestions}>重新生成</MetisButton>
                      <MetisButton type="primary" icon={<Plus size={16} />} disabled={props.contentBusy} onClick={props.onAddCreated}>加入当前题单</MetisButton>
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

          {props.mode === 'upload' ? (
            <div className="add-mode-content upload-panel">
              <div className="upload-dropzone">
                <div className="upload-icon"><UploadCloud size={28} /></div>
                <h3>上传后自动识别题目</h3>
                <p>支持 PDF、DOCX、JPG、PNG，单文件 20MB 内；识别结果会标记待校验。</p>
                <MetisButton
                  type="primary"
                  icon={<FileUp size={17} />}
                  loading={props.addStatus === 'loading'}
                  disabled={props.contentBusy}
                  onClick={props.onUpload}
                  data-track="/click/aiQuestionHome/uploadQuestion | 上传材料录题 | 无"
                >
                  选择文件并识别
                </MetisButton>
              </div>
              <div className="upload-steps"><span>1. 识别题目</span><span>2. 加入题单</span><span>3. 人工校验</span></div>
            </div>
          ) : null}

          {props.mode === 'personalized' ? (
            <div className="add-mode-content upload-panel personalized-panel">
              <div className="upload-dropzone">
                <div className="upload-icon"><Files size={28} /></div>
                <h3>上传材料，生成针对性练习</h3>
                <p>支持导入学生错题、课堂讲义或作业文件，AI 会提取薄弱点并生成一份个性化练习。</p>
                <MetisButton
                  type="primary"
                  icon={<GraduationCap size={17} />}
                  loading={props.addStatus === 'loading'}
                  disabled={props.contentBusy}
                  onClick={props.onPersonalize}
                  data-track="/click/aiQuestionHome/personalizeFromFile | 上传材料生成个性化练习 | 无"
                >
                  选择材料并生成练习
                </MetisButton>
              </div>
              <div className="upload-steps"><span>1. 解析材料</span><span>2. 识别薄弱点</span><span>3. 生成练习</span></div>
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

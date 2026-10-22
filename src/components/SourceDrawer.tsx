import { useEffect } from 'react'
import { MetisButton } from '@yuanfudao/metis-web-component'
import {
  ArrowLeft,
  BrainCircuit,
  FilePenLine,
  Files,
  FileUp,
  GraduationCap,
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
  LibraryInitialView,
  Question,
  ResourceType,
  SourceRecord,
} from '../prototype/types'
import { AiComposer } from './AiComposer'
import { LibraryPicker } from './LibraryPicker'

interface SourceDrawerProps {
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
  createPrompt: string
  createError: string
  createStatus: AsyncStatus
  createPreview: Question[]
  onModeChange: (mode: AddQuestionMode) => void
  onResourceTypeChange: (type: ResourceType) => void
  onAddSource: (type: ResourceType, sourceId?: string, count?: number) => void
  onComposePromptChange: (value: string) => void
  onCompose: () => void
  onCreatePromptChange: (value: string) => void
  onCreate: () => void
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
  { mode: 'create', title: 'AI 命题', description: '生成全新题目，先预览再加入当前题单', tag: '原创 · 待校验', icon: Sparkles },
  { mode: 'personalized', title: '上传材料生成个性化练习', description: '结合上传材料与学情生成针对性练习', tag: 'AI 个性化', icon: GraduationCap },
  { mode: 'manual', title: '手工录入', description: '添加一道空白题并继续编辑', tag: '空白题', icon: FilePenLine },
]

const modeTitles: Record<AddQuestionMode, string> = {
  menu: '添加题目',
  resource: '从飞象题库选题',
  school: '从校本题库选题',
  compose: 'AI 组题',
  create: 'AI 命题',
  upload: '上传文件 AI 录题',
  personalized: '上传材料生成个性化练习',
  manual: '手工录入',
}

export function SourceDrawer(props: SourceDrawerProps) {
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
    <div className="add-question-layer" onMouseDown={props.onClose}>
      <section
        className={`add-question-panel${props.mode === 'resource' || props.mode === 'school' ? ' add-question-panel--library' : ''}`}
        data-sec="5"
        role="dialog"
        aria-modal="true"
        aria-label="添加题目"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="add-question-header">
          <div className="add-question-title">
            {props.mode !== 'menu' ? (
              <MetisButton
                type="borderless"
                icon={<ArrowLeft size={18} />}
                aria-label="返回添加方式"
                onClick={() => props.onModeChange('menu')}
              />
            ) : null}
            <div>
              <h2>{modeTitles[props.mode]}</h2>
              <p>{props.mode === 'menu' ? '一个入口，选择这次要怎样添加题目' : '结果都会加入当前题单，不会覆盖已有内容'}</p>
            </div>
          </div>
          <div className="add-question-header-actions">
            <div data-picker-selection-actions />
            <MetisButton type="borderless" icon={<X size={18} />} aria-label="关闭添加题目" onClick={props.onClose} />
          </div>
        </header>

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
            <div className="add-mode-content ai-mode-content">
              <div className="ai-mode-intro ai-mode-intro--create">
                <Sparkles size={21} />
                <div><strong>生成全新题目</strong><p>原创结果会标记“AI 原创 · 待校验”，确认后再加入当前题单。</p></div>
              </div>
              <AiComposer
                compact
                kind="create"
                value={props.createPrompt}
                error={props.createError}
                status={props.createStatus}
                disabled={props.contentBusy}
                onChange={props.onCreatePromptChange}
                onSubmit={props.onCreate}
              />
              {props.createPreview.length > 0 ? (
                <div className="create-preview-block">
                  <div className="create-preview-heading"><strong>生成预览</strong><span>{props.createPreview.length} 道 · AI 原创 · 待校验</span></div>
                  <div className="create-preview-list">
                    {props.createPreview.slice(0, 3).map((question, index) => (
                      <article key={question.id}><span>{index + 1}</span><p>{question.stem}</p></article>
                    ))}
                  </div>
                  <MetisButton type="primary" block icon={<Plus size={16} />} onClick={props.onAddCreated}>加入当前题单</MetisButton>
                </div>
              ) : (
                <div className="prompt-example-list">
                  <button type="button" onClick={() => props.onCreatePromptChange('原创 2 道校园义卖情境的一次函数应用题')}>校园情境应用题</button>
                  <button type="button" onClick={() => props.onCreatePromptChange('生成 3 道一次函数开放性探究题')}>开放性探究题</button>
                  <button type="button" onClick={() => props.onCreatePromptChange('出 4 道中等难度一次函数填空题')}>中等难度填空题</button>
                </div>
              )}
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

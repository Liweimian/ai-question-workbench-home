import { MetisButton } from '@yuanfudao/metis-web-component'
import {
  BookOpenCheck,
  FileStack,
  FileText,
  FileUp,
  ListChecks,
  Search,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import { sourceOptions } from '../data/workbenchData'
import type { AsyncStatus, SourceRecord, SourceType } from '../prototype/types'
import { AiComposer } from './AiComposer'

type SourceMode = 'resource' | 'upload' | 'generate'

interface SourceDrawerProps {
  mode: SourceMode
  resourceType: SourceType
  records: SourceRecord[]
  listStatus: AsyncStatus
  addStatus: AsyncStatus
  contentBusy: boolean
  prompt: string
  promptError: string
  generateStatus: AsyncStatus
  onModeChange: (mode: SourceMode) => void
  onResourceTypeChange: (type: SourceType) => void
  onAddSource: (type: SourceType, sourceId?: string) => void
  onPromptChange: (value: string) => void
  onGenerate: () => void
  onClose: () => void
}

const modeOptions = [
  { value: 'resource' as const, label: '资源库', icon: Search },
  { value: 'upload' as const, label: '上传材料', icon: FileUp },
  { value: 'generate' as const, label: 'AI 组题', icon: Sparkles },
]

const resourceIcons: Record<string, typeof BookOpenCheck> = {
  workbook: BookOpenCheck,
  paper: FileText,
  list: ListChecks,
  chapter: FileStack,
}

export function SourceDrawer(props: SourceDrawerProps) {
  const resourceOptions = sourceOptions.filter((option) =>
    ['workbook', 'paper', 'list', 'chapter'].includes(option.type),
  )

  return (
    <aside className="side-panel source-drawer" data-sec="3" aria-label="添加内容">
      <div className="side-panel-header">
        <div>
          <h2>添加内容</h2>
          <p>所有内容都会追加到当前画布</p>
        </div>
        <MetisButton type="borderless" icon={<X size={18} />} aria-label="关闭添加内容" onClick={props.onClose} />
      </div>

      <div className="panel-mode-tabs" role="tablist" aria-label="添加方式">
        {modeOptions.map(({ value, label, icon: Icon }) => (
          <MetisButton
            key={value}
            type={props.mode === value ? 'bordered' : 'borderless'}
            className={props.mode === value ? 'is-active' : ''}
            icon={<Icon size={16} />}
            disabled={props.contentBusy}
            onClick={() => props.onModeChange(value)}
            role="tab"
            aria-selected={props.mode === value}
          >
            {label}
          </MetisButton>
        ))}
      </div>

      <div className="side-panel-body">
        {props.mode === 'resource' ? (
          <>
            <div className="resource-type-tabs" aria-label="资源类型">
              {resourceOptions.map((option) => {
                const Icon = resourceIcons[option.type]
                const selected = props.resourceType === option.type
                return (
                  <button
                    key={option.type}
                    type="button"
                    className={selected ? 'is-active' : ''}
                    disabled={props.contentBusy}
                    onClick={() => props.onResourceTypeChange(option.type)}
                    data-track={`/click/aiQuestionHome/source${option.type} | 切换${option.title}来源 | 无`}
                  >
                    <Icon size={16} />
                    {option.title}
                  </button>
                )
              })}
            </div>

            {props.listStatus === 'loading' ? (
              <div className="source-loading" aria-label="资源加载中">
                <span /><span /><span />
              </div>
            ) : null}
            {props.listStatus === 'error' ? (
              <div className="panel-feedback">
                <strong>资源加载失败</strong>
                <p>请检查网络后重新加载。</p>
                <MetisButton onClick={() => props.onResourceTypeChange(props.resourceType)}>重新加载</MetisButton>
              </div>
            ) : null}
            {props.listStatus === 'success' && props.records.length === 0 ? (
              <div className="panel-feedback">
                <strong>暂无可用资源</strong>
                <p>可以切换资源类型，或上传自己的材料。</p>
              </div>
            ) : null}
            {props.listStatus === 'success' ? (
              <div className="source-record-list">
                {props.records.map((record) => (
                  <article className="source-record" key={record.id}>
                    <div className="source-record-copy">
                      {record.highlight ? <span>{record.highlight}</span> : null}
                      <h3>{record.title}</h3>
                      <p>{record.meta}</p>
                    </div>
                    <div className="source-record-footer">
                      <span>题库 {record.questionCount} 题</span>
                      <MetisButton
                        type="borderless"
                        loading={props.addStatus === 'loading'}
                        disabled={props.contentBusy}
                        onClick={() => props.onAddSource(record.sourceType, record.id)}
                        data-track="/click/aiQuestionHome/addResource | 整份加入画布 | resourceId#STRING"
                      >
                        加入 2 道示例
                      </MetisButton>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            {props.addStatus === 'error' ? <div className="inline-error">内容添加失败，请重试。</div> : null}
          </>
        ) : null}

        {props.mode === 'upload' ? (
          <div className="upload-panel">
            <div className="upload-dropzone">
              <div className="upload-icon"><UploadCloud size={28} /></div>
              <h3>上传后自动拆题与排版</h3>
              <p>支持 PDF、DOCX、JPG、PNG，单文件 20MB 内</p>
              <MetisButton
                type="primary"
                icon={<FileUp size={17} />}
                loading={props.addStatus === 'loading'}
                disabled={props.contentBusy}
                onClick={() => props.onAddSource('recording')}
                data-track="/click/aiQuestionHome/mockUpload | 模拟上传并识别 | 无"
              >
                选择文件并识别
              </MetisButton>
            </div>
            <div className="upload-steps">
              <span>1. 识别题目</span><span>2. 校对结构</span><span>3. 加入画布</span>
            </div>
            {props.addStatus === 'error' ? <div className="inline-error">材料识别失败，请重试。</div> : null}
          </div>
        ) : null}

        {props.mode === 'generate' ? (
          <div className="drawer-generate">
            <div className="drawer-generate-heading">
              <span><Sparkles size={18} /> AI 组题</span>
              <p>描述年级、知识点、题量和难度，生成结果直接加入画布。</p>
            </div>
            <AiComposer
              compact
              value={props.prompt}
              error={props.promptError}
              status={props.generateStatus}
              disabled={props.contentBusy}
              onChange={props.onPromptChange}
              onSubmit={props.onGenerate}
            />
            <div className="prompt-example-list">
              <button type="button" onClick={() => props.onPromptChange('生成 6 道一次函数基础题')}>6 道一次函数基础题</button>
              <button type="button" onClick={() => props.onPromptChange('按基础 6、提升 4 生成分层作业')}>基础与提升分层组题</button>
              <button type="button" onClick={() => props.onPromptChange('围绕函数实际应用生成 3 道解答题')}>实际应用解答题</button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="side-panel-footer">
        <span>已添加内容会保留在当前草稿中</span>
        <MetisButton type="primary" onClick={props.onClose}>完成</MetisButton>
      </div>
    </aside>
  )
}

import { useState } from 'react'
import { ChevronLeft, Download, Eye, Save, Settings2, X } from 'lucide-react'
import { MetisMessage } from '@yuanfudao/metis-web-component'
import type { WorkbenchDocument } from '../prototype/types'
import { getDocumentKind } from '../utils/documentEditorUtils'

interface AnswerSheetPanelProps {
  document: WorkbenchDocument
  onSave: () => void
  onMarkOutput: (kind: 'download' | 'print') => void
  onBackToPaper?: () => void
}

const optionLetters = ['A', 'B', 'C', 'D']

function AnswerSheetQr() {
  return (
    <svg className="answer-sheet-qr" viewBox="0 0 80 80" aria-label="答题卡二维码">
      <rect width="80" height="80" fill="#fff" />
      {[
        [4, 4],
        [52, 4],
        [4, 52],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="24" height="24" fill="#111" />
          <rect x={x + 4} y={y + 4} width="16" height="16" fill="#fff" />
          <rect x={x + 8} y={y + 8} width="8" height="8" fill="#111" />
        </g>
      ))}
      <rect x="36" y="8" width="6" height="6" fill="#111" />
      <rect x="46" y="16" width="6" height="6" fill="#111" />
      <rect x="36" y="24" width="6" height="6" fill="#111" />
      <rect x="56" y="36" width="6" height="6" fill="#111" />
      <rect x="36" y="40" width="6" height="6" fill="#111" />
      <rect x="46" y="48" width="6" height="6" fill="#111" />
      <rect x="64" y="48" width="6" height="6" fill="#111" />
      <rect x="36" y="56" width="6" height="6" fill="#111" />
      <rect x="48" y="64" width="6" height="6" fill="#111" />
      <rect x="64" y="64" width="6" height="6" fill="#111" />
      <rect x="16" y="36" width="6" height="6" fill="#111" />
    </svg>
  )
}

export function AnswerSheetPanel({ document, onSave, onMarkOutput, onBackToPaper }: AnswerSheetPanelProps) {
  const [layout, setLayout] = useState('a3-double')
  const [infoOpen, setInfoOpen] = useState(true)
  if (getDocumentKind(document) !== '试卷') return null

  const paperTitle = document.title.trim() || '新建试卷'
  const sheetTitle = `${paperTitle}答题卡`
  const crumbTitle = `${paperTitle}-答题卡`

  return (
    <div className="answer-sheet-page" aria-label="答题卡编辑页">
      <header className="answer-sheet-page-top">
        <div className="answer-sheet-page-nav">
          <button type="button" className="answer-sheet-page-back" aria-label="返回" onClick={onBackToPaper}>
            <ChevronLeft size={20} />
          </button>
          <nav aria-label="面包屑">
            <span>首页</span>
            <i>&gt;</i>
            <strong>{crumbTitle}</strong>
          </nav>
        </div>
        <div className="answer-sheet-page-actions">
          <button type="button" onClick={() => { onMarkOutput('print'); window.print() }}>
            <Eye size={16} />
            预览答题卡
          </button>
          <button type="button" onClick={onSave}>
            <Save size={16} />
            保存
          </button>
          <button type="button" onClick={() => { onMarkOutput('download'); MetisMessage.success('答题卡已开始下载') }}>
            <Download size={16} />
            下载
          </button>
        </div>
      </header>

      <div className="answer-sheet-page-toolbar">
        <label>
          <Settings2 size={15} />
          版面设置：
          <select value={layout} aria-label="版面设置" onChange={(event) => setLayout(event.target.value)}>
            <option value="a3-double">A3-双栏</option>
            <option value="a3-single">A3-单栏</option>
            <option value="a4-single">A4-单栏</option>
          </select>
        </label>
        <button type="button" onClick={() => MetisMessage.info('基础信息设置已打开（原型演示）')}>
          <Settings2 size={15} />
          基础信息设置
        </button>
      </div>

      <div className={`answer-sheet-page-body${infoOpen ? '' : ' is-info-collapsed'}`}>
        {infoOpen ? (
          <aside className="answer-sheet-info" aria-label="试卷信息">
            <header>
              <strong>试卷信息</strong>
              <button type="button" aria-label="关闭试卷信息" onClick={() => setInfoOpen(false)}><X size={16} /></button>
            </header>
            <p className="answer-sheet-info-meta">学号＿＿＿＿＿　姓名＿＿＿＿＿　年级＿＿＿班</p>
            <h3>{paperTitle}</h3>
            <ol>
              {document.questions.map((question, index) => (
                <li key={question.id}>
                  <p>
                    <b>{index + 1}.（{question.score || 0}分）</b>
                    {question.stem}
                  </p>
                  {question.options?.length ? (
                    <div className="answer-sheet-info-options">
                      {question.options.map((option) => <span key={option}>{option}</span>)}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </aside>
        ) : (
          <button type="button" className="answer-sheet-info-collapsed" onClick={() => setInfoOpen(true)}>试卷信息</button>
        )}

        <div className="answer-sheet-canvas">
          <article className={`answer-sheet-paper is-${layout}`}>
            <div className="answer-sheet-paper-head">
              <h1>{sheetTitle}</h1>
              <AnswerSheetQr />
            </div>
            <p className="answer-sheet-paper-meta">学号＿＿＿＿＿＿＿＿＿＿　姓名＿＿＿＿＿＿＿　年级＿＿＿班</p>
            <div className="answer-sheet-notice">
              <strong>注意事项</strong>
              <ol>
                <li>答题前请将学号、姓名、班级填写清楚。</li>
                <li>客观题必须使用 2B 铅笔填涂，修改时用橡皮擦干净。</li>
                <li>主观题必须使用黑色签字笔书写。</li>
                <li>必须在题对应的答题区域内作答，超出答题区域书写无效。</li>
                <li>保持卷面整洁，密封线内书写无效。</li>
              </ol>
              <div className="answer-sheet-sample">
                <b>填涂样例</b>
                <p><span>正确填涂：</span><i className="is-correct" /></p>
                <p>
                  <span>错误填涂：</span>
                  <i />
                  <i className="is-wrong-x" />
                  <i className="is-wrong-dot" />
                </p>
              </div>
            </div>
            <div className="answer-sheet-rows">
              {document.questions.map((question, index) => (
                <section key={question.id}>
                  {question.type === '选择题' ? (
                    <>
                      <b>{index + 1}.</b>
                      <div className="answer-sheet-bubbles">
                        {(question.options?.length ? question.options : optionLetters).slice(0, 4).map((_, optionIndex) => (
                          <span key={optionLetters[optionIndex]}>[{optionLetters[optionIndex]}]</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="answer-sheet-write">
                      <b>{index + 1}.（{question.score || 0}分）</b>
                      <div className="answer-sheet-write-lines" aria-hidden="true"><i /><i /><i /></div>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

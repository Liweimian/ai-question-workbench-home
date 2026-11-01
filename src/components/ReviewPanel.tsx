import { ClipboardList } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { referencePrdPages, reviewPageNavLabel } from '../data/referencePrdPages'
import {
  clearStoredPrdMarkdown,
  hasStoredPrdEdit,
  readStoredPrdMarkdown,
  writeStoredPrdMarkdown,
} from '../utils/reviewPrdStorage'
import { PrdMarkdown } from './PrdMarkdown'

type SourceTab = 'page' | 'full'

interface ReviewPanelProps {
  pageTitle: string
  onClose: () => void
}

function defaultMarkdownForTitle(title: string): string {
  const page = referencePrdPages.find((p) => p.title === title)
  if (page) return page.markdown
  const fallback = referencePrdPages.find((p) => p.title === '组题编辑') ?? referencePrdPages[0]
  return fallback.markdown
}

export function ReviewPanel({ pageTitle, onClose }: ReviewPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const dragRef = useRef<{ x: number; y: number; top: number; left: number } | null>(null)
  const [sourceTab, setSourceTab] = useState<SourceTab>('page')
  const [editing, setEditing] = useState(false)
  const [fullChapter, setFullChapter] = useState(pageTitle)
  const baseMarkdown = useMemo(() => defaultMarkdownForTitle(pageTitle), [pageTitle])
  const [markdown, setMarkdown] = useState(() => readStoredPrdMarkdown(pageTitle, baseMarkdown))
  const [draft, setDraft] = useState(markdown)
  const locallyEdited = hasStoredPrdEdit(pageTitle, baseMarkdown)

  useEffect(() => {
    const nextBase = defaultMarkdownForTitle(pageTitle)
    const stored = readStoredPrdMarkdown(pageTitle, nextBase)
    setMarkdown(stored)
    setDraft(stored)
    setEditing(false)
    setSourceTab('page')
    setFullChapter(pageTitle)
  }, [pageTitle])

  const persist = useCallback(
    (value: string) => {
      setMarkdown(value)
      setDraft(value)
      writeStoredPrdMarkdown(pageTitle, value)
    },
    [pageTitle],
  )

  const restoreDefault = () => {
    clearStoredPrdMarkdown(pageTitle)
    setMarkdown(baseMarkdown)
    setDraft(baseMarkdown)
    setEditing(false)
  }

  const onPointerDownHeader = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    const el = panelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.top = `${rect.top}px`
    el.style.left = `${rect.left}px`
    el.style.right = 'auto'
    dragRef.current = { x: event.clientX, y: event.clientY, top: rect.top, left: rect.left }
    ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
  }

  const onPointerMoveHeader = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const el = panelRef.current
    if (!drag || !el) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    el.style.top = `${drag.top + dy}px`
    el.style.left = `${drag.left + dx}px`
  }

  const onPointerUpHeader = () => {
    dragRef.current = null
  }

  const fullChapterMarkdown = useMemo(() => {
    const page = referencePrdPages.find((p) => p.title === fullChapter)
    if (!page) return defaultMarkdownForTitle(fullChapter)
    return readStoredPrdMarkdown(fullChapter, page.markdown)
  }, [fullChapter])

  return (
    <aside ref={panelRef} className="review-panel" role="dialog" aria-labelledby="review-panel-title">
      <div
        className="rp-header"
        onPointerDown={onPointerDownHeader}
        onPointerMove={onPointerMoveHeader}
        onPointerUp={onPointerUpHeader}
      >
        <h2 id="review-panel-title">
          <span className="rp-title-row">
            <ClipboardList size={16} strokeWidth={2.2} aria-hidden />
            产品稿 · {reviewPageNavLabel(pageTitle)}
          </span>
        </h2>
        <button type="button" className="rp-close" aria-label="关闭" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="rp-body">
        <div className="rp-source-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={sourceTab === 'page'} onClick={() => setSourceTab('page')}>
            本页产品稿
          </button>
          <button type="button" role="tab" aria-selected={sourceTab === 'full'} onClick={() => setSourceTab('full')}>
            完整需求说明
          </button>
        </div>

        {sourceTab === 'page' ? (
          <>
            <div className="rp-edit-bar">
              {!editing ? (
                <button type="button" className="primary" onClick={() => { setDraft(markdown); setEditing(true) }}>
                  编辑
                </button>
              ) : (
                <>
                  <button type="button" className="primary" onClick={() => { persist(draft); setEditing(false) }}>
                    保存
                  </button>
                  <button type="button" onClick={() => { setDraft(markdown); setEditing(false) }}>
                    取消
                  </button>
                </>
              )}
              {locallyEdited ? <span className="rp-edited">已本地编辑</span> : null}
              <button type="button" onClick={restoreDefault}>
                恢复默认
              </button>
              {editing ? <span className="rp-hint">保存后仅影响本机预览，不会提交到仓库。</span> : null}
            </div>
            {editing ? (
              <textarea
                className="rp-edit"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
              />
            ) : (
              <PrdMarkdown markdown={markdown} />
            )}
          </>
        ) : (
          <div className="rp-legacy rp-full-doc">
            <p className="rp-full-source-note">
              完整需求说明与参考原型一致，按页面分章展示；内容来自过稿 Markdown，可在「本页产品稿」中本地编辑各章。
            </p>
            <div className="rp-legacy-tabs" role="tablist">
              {referencePrdPages.map((page) => (
                <button
                  type="button"
                  key={page.title}
                  role="tab"
                  className={fullChapter === page.title ? 'active' : undefined}
                  aria-selected={fullChapter === page.title}
                  onClick={() => setFullChapter(page.title)}
                >
                  {page.navLabel ?? page.title}
                </button>
              ))}
            </div>
            <div className="rp-legacy-doc">
              <PrdMarkdown markdown={fullChapterMarkdown} className="rp-mdoc" />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

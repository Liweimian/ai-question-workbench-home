import { FileText } from 'lucide-react'
import { useMemo, useRef, useState, type PointerEvent } from 'react'
import { ReviewPanel } from './ReviewPanel'
import { resolveReviewPageTitle, type ReviewPageContext } from '../utils/resolveReviewPageTitle'

interface RequirementSpecControlsProps {
  context: ReviewPageContext
  reviewMode: boolean
}

export function RequirementSpecControls({ context, reviewMode }: RequirementSpecControlsProps) {
  const pageTitle = useMemo(() => resolveReviewPageTitle(context), [context])
  const [open, setOpen] = useState(reviewMode)
  const [offset, setOffset] = useState<{ left: number; top: number } | null>(null)
  const dockRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const movedRef = useRef(false)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const el = dockRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    movedRef.current = false
    dragRef.current = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top }
    el.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (!movedRef.current) {
      if (Math.abs(dx) <= 6 && Math.abs(dy) <= 6) return
      movedRef.current = true
    }
    const maxLeft = window.innerWidth - 48
    const maxTop = window.innerHeight - 48
    setOffset({
      left: Math.min(maxLeft, Math.max(8, drag.left + dx)),
      top: Math.min(maxTop, Math.max(8, drag.top + dy)),
    })
  }

  const onPointerUp = () => {
    const dragged = movedRef.current
    dragRef.current = null
    if (!dragged) setOpen(true)
  }

  return (
    <>
      <div
        ref={dockRef}
        className="requirement-spec-dock"
        style={offset ? { left: offset.left, top: offset.top, right: 'auto', bottom: 'auto' } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <button type="button" className="requirement-spec-trigger">
          <FileText size={16} aria-hidden />
          需求说明
        </button>
        {reviewMode ? <span className="requirement-spec-mode-tag">过稿模式</span> : null}
      </div>
      {open ? <ReviewPanel pageTitle={pageTitle} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

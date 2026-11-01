import { FileText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ReviewPanel } from './ReviewPanel'
import { resolveReviewPageTitle, type ReviewPageContext } from '../utils/resolveReviewPageTitle'

interface RequirementSpecControlsProps {
  context: ReviewPageContext
  reviewMode: boolean
}

export function RequirementSpecControls({ context, reviewMode }: RequirementSpecControlsProps) {
  const pageTitle = useMemo(() => resolveReviewPageTitle(context), [context])
  const [open, setOpen] = useState(reviewMode)

  return (
    <>
      <div className="requirement-spec-dock">
        <button type="button" className="requirement-spec-trigger" onClick={() => setOpen(true)}>
          <FileText size={16} aria-hidden />
          需求说明
        </button>
        {reviewMode ? <span className="requirement-spec-mode-tag">过稿模式</span> : null}
      </div>
      {open ? <ReviewPanel pageTitle={pageTitle} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

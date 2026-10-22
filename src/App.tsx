import { useEffect } from 'react'
import { applyFxZoom } from './design-system/fx-adapt'
import { WorkbenchHomePage } from './pages/WorkbenchHomePage'

export function App() {
  const reviewMode = new URLSearchParams(window.location.search).get('mode') === 'review'

  useEffect(() => applyFxZoom('.fx-zoom-area'), [])

  return (
    <>
      <WorkbenchHomePage />
      {reviewMode ? <div className="review-mode-badge">过稿模式 · 产品文档待下一阶段生成</div> : null}
    </>
  )
}

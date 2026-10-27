export function animateQuestionToDraft(source: HTMLElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const target = document.querySelector<HTMLElement>('.editor-scroll')
  if (!target) return

  const sourceRect = source.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const startX = sourceRect.left + sourceRect.width / 2 - 46
  const startY = sourceRect.top + sourceRect.height / 2 - 17
  const endX = targetRect.left + targetRect.width / 2 - 46
  const endY = Math.min(targetRect.top + 150, targetRect.bottom - 60)
  const deltaX = endX - startX
  const deltaY = endY - startY

  const card = document.createElement('div')
  card.className = 'question-fly-card'
  card.setAttribute('aria-hidden', 'true')
  card.innerHTML = '<span>＋</span><strong>题目</strong>'
  card.style.left = `${startX}px`
  card.style.top = `${startY}px`
  document.body.appendChild(card)

  const animation = card.animate([
    { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 0 },
    { transform: 'translate3d(0, -8px, 0) scale(1)', opacity: 1, offset: 0.12 },
    { transform: `translate3d(${deltaX * 0.48}px, ${deltaY * 0.32 - 72}px, 0) rotate(-4deg) scale(.92)`, opacity: 1, offset: 0.58 },
    { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) rotate(0) scale(.72)`, opacity: 0.15 },
  ], { duration: 720, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'forwards' })

  animation.finished.finally(() => card.remove())
}

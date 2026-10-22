export function applyFxZoom(selector: string) {
  const element = document.querySelector<HTMLElement>(selector)
  if (!element) return () => undefined

  const update = () => {
    const viewportWidth = Math.max(window.innerWidth, 1280)
    const zoom = Math.min(1, (viewportWidth - 132) / 1280)
    element.style.zoom = String(zoom)
  }

  update()
  window.addEventListener('resize', update)
  return () => window.removeEventListener('resize', update)
}

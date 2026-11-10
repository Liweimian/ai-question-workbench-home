import { Check, ChevronDown, GripVertical, Layers3, Route } from 'lucide-react'
import { useRef, useState, type PointerEvent } from 'react'

export type WorkspaceNavigationScheme = 'tabs' | 'breadcrumb'

interface WorkspaceSchemeControlsProps {
  value: WorkspaceNavigationScheme
  onChange: (value: WorkspaceNavigationScheme) => void
}

const schemeOptions: Array<{
  value: WorkspaceNavigationScheme
  label: string
  description: string
  icon: typeof Layers3
}> = [
  { value: 'tabs', label: '方案一', description: '多任务 Tab', icon: Layers3 },
  { value: 'breadcrumb', label: '方案二', description: '单任务面包屑', icon: Route },
]

export function WorkspaceSchemeControls({ value, onChange }: WorkspaceSchemeControlsProps) {
  const [open, setOpen] = useState(false)
  const [offset, setOffset] = useState<{ left: number; top: number } | null>(null)
  const dockRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const movedRef = useRef(false)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('.workspace-scheme-menu')) return
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
      setOpen(false)
    }
    const width = dockRef.current?.offsetWidth ?? 96
    const height = dockRef.current?.offsetHeight ?? 36
    setOffset({
      left: Math.min(window.innerWidth - width - 8, Math.max(8, drag.left + dx)),
      top: Math.min(window.innerHeight - height - 8, Math.max(8, drag.top + dy)),
    })
  }

  const onPointerUp = () => {
    if (!dragRef.current) return
    const dragged = movedRef.current
    dragRef.current = null
    if (!dragged) setOpen((current) => !current)
  }

  return (
    <div
      ref={dockRef}
      className="workspace-scheme-dock"
      style={offset ? { left: offset.left, top: offset.top, right: 'auto' } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <button type="button" className="workspace-scheme-trigger" aria-expanded={open}>
        <GripVertical size={14} aria-hidden />
        <span>{value === 'tabs' ? '方案一' : '方案二'}</span>
        <ChevronDown size={14} aria-hidden />
      </button>
      {open ? (
        <div className="workspace-scheme-menu" role="menu" aria-label="选择工作区导航方案">
          {schemeOptions.map((option) => {
            const Icon = option.icon
            const active = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`workspace-scheme-option${active ? ' is-active' : ''}`}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <Icon size={17} aria-hidden />
                <span><strong>{option.label}</strong><small>{option.description}</small></span>
                {active ? <Check size={16} aria-hidden /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

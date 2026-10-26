import { AlignJustify, MoveHorizontal, Rows3 } from 'lucide-react'
import type { DocumentFormat } from '../prototype/types'

interface DocumentFormatToolbarProps {
  value: DocumentFormat
  onChange: (patch: Partial<DocumentFormat>) => void
}

export function DocumentFormatToolbar({ value, onChange }: DocumentFormatToolbarProps) {
  return (
    <div className="document-format-toolbar" role="toolbar" aria-label="题单全局格式设置">
      <label title="字号">
        <span className="document-format-size-icon" aria-hidden="true">T</span>
        <select value={value.fontSize} onChange={(event) => onChange({ fontSize: event.target.value as DocumentFormat['fontSize'] })} aria-label="题单字号">
          <option value="14">小五</option>
          <option value="16">五号</option>
          <option value="18">小四</option>
        </select>
      </label>
      <label title="段落间距">
        <AlignJustify size={15} aria-hidden="true" />
        <select value={value.paragraphSpacing} onChange={(event) => onChange({ paragraphSpacing: event.target.value as DocumentFormat['paragraphSpacing'] })} aria-label="题单段落间距">
          <option value="1">1.0</option>
          <option value="1.5">1.5</option>
          <option value="2">2.0</option>
        </select>
      </label>
      <label title="行距">
        <Rows3 size={15} aria-hidden="true" />
        <select value={value.lineHeight} onChange={(event) => onChange({ lineHeight: event.target.value as DocumentFormat['lineHeight'] })} aria-label="题单行距">
          <option value="1.5">1.5</option>
          <option value="1.7">1.7</option>
          <option value="2">2.0</option>
        </select>
      </label>
      <label title="字距">
        <MoveHorizontal size={15} aria-hidden="true" />
        <select value={value.letterSpacing} onChange={(event) => onChange({ letterSpacing: event.target.value as DocumentFormat['letterSpacing'] })} aria-label="题单字距">
          <option value="0">标准</option>
          <option value="0.5">0.5</option>
          <option value="1">1.0</option>
        </select>
      </label>
    </div>
  )
}

import { AlignJustify, Bold, Italic, MoveHorizontal, Rows3, Underline } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { DocumentFormat } from '../prototype/types'

interface DocumentFormatToolbarProps {
  value: DocumentFormat
  onChange: (patch: Partial<DocumentFormat>) => void
}

export function DocumentFormatToolbar({ value, onChange }: DocumentFormatToolbarProps) {
  return (
    <div className="document-format-toolbar" role="toolbar" aria-label="题单全局格式设置">
      <button type="button" className={value.bold ? 'is-active' : ''} onClick={() => onChange({ bold: !value.bold })} aria-label="题单加粗" title="加粗"><Bold size={15} /></button>
      <button type="button" className={value.italic ? 'is-active' : ''} onClick={() => onChange({ italic: !value.italic })} aria-label="题单斜体" title="斜体"><Italic size={15} /></button>
      <button type="button" className={value.underline ? 'is-active' : ''} onClick={() => onChange({ underline: !value.underline })} aria-label="题单下划线" title="下划线"><Underline size={15} /></button>
      <label className="document-color-control" title="文字颜色" style={{ '--document-color': value.textColor } as CSSProperties}><span aria-hidden="true">A</span><input type="color" value={value.textColor} onChange={(event) => onChange({ textColor: event.target.value })} aria-label="题单文字颜色" /></label>
      <span className="document-format-divider" />
      <label title="字体">
        <select value={value.fontFamily} onChange={(event) => onChange({ fontFamily: event.target.value as DocumentFormat['fontFamily'] })} aria-label="题单字体"><option value="serif">宋体</option><option value="sans">黑体</option><option value="kaiti">楷体</option></select>
      </label>
      <label title="字号">
        <span className="document-format-size-icon" aria-hidden="true">T</span>
        <select value={value.fontSize} onChange={(event) => onChange({ fontSize: event.target.value as DocumentFormat['fontSize'] })} aria-label="题单字号"><option value="14">小五</option><option value="16">五号</option><option value="18">小四</option></select>
      </label>
      <span className="document-format-divider" />
      <label title="段落间距">
        <AlignJustify size={15} aria-hidden="true" />
        <select value={value.paragraphSpacing} onChange={(event) => onChange({ paragraphSpacing: event.target.value as DocumentFormat['paragraphSpacing'] })} aria-label="题单段落间距"><option value="1">1.0</option><option value="1.5">1.5</option><option value="2">2.0</option></select>
      </label>
      <label title="行距">
        <Rows3 size={15} aria-hidden="true" />
        <select value={value.lineHeight} onChange={(event) => onChange({ lineHeight: event.target.value as DocumentFormat['lineHeight'] })} aria-label="题单行距"><option value="1.5">1.5</option><option value="1.7">1.7</option><option value="2">2.0</option></select>
      </label>
      <label title="字距">
        <MoveHorizontal size={15} aria-hidden="true" />
        <select value={value.letterSpacing} onChange={(event) => onChange({ letterSpacing: event.target.value as DocumentFormat['letterSpacing'] })} aria-label="题单字距"><option value="0">标准</option><option value="0.5">0.5</option><option value="1">1.0</option></select>
      </label>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { MetisButton } from '@yuanfudao/metis-web-component'
import { AlertCircle, CheckCircle2, ImagePlus, LoaderCircle, RotateCcw, Trash2 } from 'lucide-react'

export type ImageQuestionSearchStatus = 'recognizing' | 'success' | 'error'

export interface ImageQuestionSearchState {
  fileName: string
  previewUrl: string
  status: ImageQuestionSearchStatus
  errorMessage?: string
}

interface ImageQuestionSearchPanelProps {
  value: ImageQuestionSearchState
  compact?: boolean
  onRetry: () => void
  onReplace: () => void
  onRemove: () => void
}

export function useImageQuestionSearch(onRecognized: () => void) {
  const timerRef = useRef<number>()
  const previewUrlRef = useRef('')
  const [imageSearch, setImageSearch] = useState<ImageQuestionSearchState | null>(null)

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const startRecognition = (file: File) => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = URL.createObjectURL(file)
    setImageSearch({ fileName: file.name, previewUrl: previewUrlRef.current, status: 'recognizing' })
    timerRef.current = window.setTimeout(() => {
      if (/fail|失败/i.test(file.name)) {
        setImageSearch((current) => current ? {
          ...current,
          status: 'error',
          errorMessage: '图片内容不清晰，请重新上传或重试',
        } : current)
        return
      }
      setImageSearch((current) => current ? { ...current, status: 'success' } : current)
      onRecognized()
    }, 900)
  }

  const retry = () => {
    setImageSearch((current) => current ? { ...current, status: 'recognizing', errorMessage: undefined } : current)
    timerRef.current = window.setTimeout(() => {
      setImageSearch((current) => current ? { ...current, status: 'success' } : current)
      onRecognized()
    }, 900)
  }

  const clear = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ''
    setImageSearch(null)
  }

  return { imageSearch, startRecognition, retry, clear }
}

export function validateQuestionImage(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return '仅支持 JPG、PNG 或 WebP 图片'
  if (file.size > 10 * 1024 * 1024) return '图片不能超过 10MB'
  return ''
}

export function ImageQuestionSearchPanel({
  value,
  compact = false,
  onRetry,
  onReplace,
  onRemove,
}: ImageQuestionSearchPanelProps) {
  return (
    <section className={`image-question-search-panel${compact ? ' is-compact' : ''}`} aria-live="polite">
      <div className="image-question-search-preview">
        <img src={value.previewUrl} alt="已上传的题目图片" />
        <span title={value.fileName}>{value.fileName}</span>
      </div>
      <div className="image-question-search-progress">
        {value.status === 'recognizing' ? (
          <><LoaderCircle className="is-spinning" size={20} /><div><strong>正在识别题目…</strong><small>正在提取题干、选项和知识点</small></div></>
        ) : null}
        {value.status === 'success' ? (
          <><CheckCircle2 size={20} /><div><strong>已识别题目</strong><small>题干：已知一次函数 y = 2x - 3，当 x = 2 时…</small></div></>
        ) : null}
        {value.status === 'error' ? (
          <><AlertCircle size={20} /><div><strong>识别失败</strong><small>{value.errorMessage || '请换一张更清晰的图片重试'}</small></div></>
        ) : null}
      </div>
      <div className="image-question-search-actions">
        {value.status === 'error' ? <MetisButton type="bordered" icon={<RotateCcw size={14} />} onClick={onRetry}>重新识别</MetisButton> : null}
        <MetisButton type="borderless" icon={<ImagePlus size={14} />} onClick={onReplace}>重新上传</MetisButton>
        <MetisButton type="borderless" icon={<Trash2 size={14} />} onClick={onRemove}>删除图片</MetisButton>
      </div>
    </section>
  )
}

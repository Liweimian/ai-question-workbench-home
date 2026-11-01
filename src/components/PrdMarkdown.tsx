import type { ReactNode } from 'react'

function inlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    parts.push(<strong key={key++}>{match[1]}</strong>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : [text]
}

function sectionIdFromHeading(line: string): string | undefined {
  const m = line.match(/^##\s+\d+\.\s+/)
  if (!m) return undefined
  const title = line.replace(/^##\s+/, '').trim()
  return `sec-${title.replace(/\s+/g, '-')}`
}

interface PrdMarkdownProps {
  markdown: string
  className?: string
}

export function PrdMarkdown({ markdown, className }: PrdMarkdownProps) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const nodes: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('# ')) {
      nodes.push(<h1 key={key++}>{inlineMarkdown(line.slice(2).trim())}</h1>)
      i += 1
      continue
    }

    if (line.startsWith('## ')) {
      const secId = sectionIdFromHeading(line)
      nodes.push(
        <h2 key={key++} id={secId} data-sec={secId}>
          {inlineMarkdown(line.slice(3).trim())}
        </h2>,
      )
      i += 1
      continue
    }

    if (line.startsWith('### ')) {
      nodes.push(<h3 key={key++}>{inlineMarkdown(line.slice(4).trim())}</h3>)
      i += 1
      continue
    }

    if (line.trim() === '---') {
      nodes.push(<hr key={key++} />)
      i += 1
      continue
    }

    const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)\s*$/)
    if (imageMatch) {
      const [, alt, src] = imageMatch
      nodes.push(
        <figure className="rp-figure" key={key++}>
          <img src={src} alt={alt} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <figcaption>{alt || '参考截图（本地 Demo 未附带图片资源时可忽略）'}</figcaption>
        </figure>,
      )
      i += 1
      continue
    }

    if (line.startsWith('> ') || line.startsWith('[!]')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i].startsWith('[!]'))) {
        quoteLines.push(lines[i].replace(/^>\s?/, '').replace(/^\[!]\s?/, ''))
        i += 1
      }
      nodes.push(<blockquote key={key++}>{quoteLines.map((q) => <p key={q}>{inlineMarkdown(q)}</p>)}</blockquote>)
      continue
    }

    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i += 1
      }
      nodes.push(
        <ul key={key++}>
          {items.map((item) => (
            <li key={item}>{inlineMarkdown(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (line.trim() === '') {
      i += 1
      continue
    }

    const paraLines: string[] = [line]
    i += 1
    while (i < lines.length && lines[i].trim() !== '' && !/^#{1,3}\s/.test(lines[i]) && !lines[i].startsWith('- ') && !lines[i].startsWith('![')) {
      paraLines.push(lines[i])
      i += 1
    }
    nodes.push(<p key={key++}>{inlineMarkdown(paraLines.join(' '))}</p>)
  }

  return <div className={className ?? 'rp-mdoc'}>{nodes}</div>
}

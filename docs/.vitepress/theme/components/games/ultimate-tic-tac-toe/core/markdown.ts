export function renderRulesMarkdown(markdown: string): string {
  const blocks: string[] = []
  const paragraphLines: string[] = []
  const listItems: string[] = []
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')

  const flushParagraph = (): void => {
    if (paragraphLines.length === 0) return
    blocks.push(`<p>${renderInlineMarkdown(paragraphLines.join(' '))}</p>`)
    paragraphLines.length = 0
  }

  const flushList = (): void => {
    if (listItems.length === 0) return
    blocks.push(`<ul>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`)
    listItems.length = 0
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      blocks.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`)
      continue
    }

    const listItem = /^[-*]\s+(.+)$/.exec(trimmed)
    if (listItem) {
      flushParagraph()
      listItems.push(listItem[1])
      continue
    }

    flushList()
    paragraphLines.push(trimmed)
  }

  flushParagraph()
  flushList()
  return blocks.join('\n')
}

function renderInlineMarkdown(text: string): string {
  const codeSegments: string[] = []
  const escapedText = escapeHtml(text).replace(/`([^`]+)`/g, (_match, code: string) => {
    const index = codeSegments.push(`<code>${code}</code>`) - 1
    return `\uE000${index}\uE001`
  })

  return escapedText
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt: string, url: string) => {
      const imageUrl = sanitizeMarkdownUrl(url)
      if (!imageUrl) return alt
      return `<img src="${escapeAttribute(imageUrl)}" alt="${alt}" loading="lazy">`
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, url: string) => {
      const linkUrl = sanitizeMarkdownUrl(url)
      if (!linkUrl) return label
      return `<a href="${escapeAttribute(linkUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\uE000(\d+)\uE001/g, (_match, index: string) => codeSegments[Number(index)] ?? '')
}

function sanitizeMarkdownUrl(url: string): string {
  const trimmed = url.trim()
  if (/^(https?:\/\/|\/|\.\.?\/)/i.test(trimmed)) return trimmed
  return ''
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

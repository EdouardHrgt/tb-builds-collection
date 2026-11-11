// A tiny formatting language for the build description (no HTML, no library: the page builds its own elements,
// so what users type can never inject code).
//   # Title            a heading (## and ### work too, same look)
//   - item  (or * )    a bullet list (consecutive lines)
//   blank line         a new paragraph; a plain line break inside a paragraph is kept
//   **bold**  __underlined__   inside a line (no nesting)
// parseRich(text) -> [{ type: 'h', parts }, { type: 'ul', items: [parts] }, { type: 'p', lines: [parts] }]
// where parts = [{ text, bold?, underline? }]
const INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__)/

export function parseInline(line) {
  return line
    .split(INLINE)
    .filter((s) => s !== '')
    .map((s) => {
      if (s.startsWith('**') && s.endsWith('**') && s.length > 4) return { text: s.slice(2, -2), bold: true }
      if (s.startsWith('__') && s.endsWith('__') && s.length > 4) return { text: s.slice(2, -2), underline: true }
      return { text: s }
    })
}

export function parseRich(text) {
  const blocks = []
  let para = null
  let list = null
  for (const raw of String(text ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      para = list = null
      continue
    }
    let m
    if ((m = /^#{1,3}\s+(.+)$/.exec(line))) {
      blocks.push({ type: 'h', parts: parseInline(m[1]) })
      para = list = null
    } else if ((m = /^\s*[-*]\s+(.+)$/.exec(line))) {
      if (!list) blocks.push((list = { type: 'ul', items: [] }))
      list.items.push(parseInline(m[1]))
      para = null
    } else {
      if (!para) blocks.push((para = { type: 'p', lines: [] }))
      para.lines.push(parseInline(line))
      list = null
    }
  }
  return blocks
}

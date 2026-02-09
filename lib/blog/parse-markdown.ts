import { remark } from 'remark'
import html from 'remark-html'

/**
 * Convert raw markdown string to sanitized HTML.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html, { sanitize: false }).process(markdown)
  return result.toString()
}

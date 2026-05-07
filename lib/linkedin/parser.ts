/**
 * LinkedIn Export Parser
 *
 * LinkedIn lets users download their data at:
 * Settings → Data Privacy → Get a copy of your data
 *
 * The export is a zip file containing CSVs.
 * This parser handles the Articles and Posts CSVs.
 */

export interface ParsedLinkedInPost {
  externalId:  string
  title?:      string
  body:        string
  url?:        string
  publishedAt: Date | null
  platform:    'linkedin'
}

// ── Parse LinkedIn Articles CSV ────────────────────────────────────────────
// File: Share_Info.csv or Articles.csv from LinkedIn export

export function parseLinkedInCSV(csvText: string): ParsedLinkedInPost[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
  const posts: ParsedLinkedInPost[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] ?? '' })

    const body = row['sharecommentary'] || row['body'] || row['content'] || ''
    if (!body.trim()) continue

    posts.push({
      externalId:  row['shareid'] || row['id'] || `linkedin-${i}`,
      title:       row['title'] || undefined,
      body:        body.trim(),
      url:         row['sharelink'] || row['url'] || undefined,
      publishedAt: parseDate(row['date'] || row['publishedat'] || row['created']),
      platform:    'linkedin',
    })
  }

  return posts
}

// ── Parse raw text / markdown documents ───────────────────────────────────
// For uploaded notes, newsletters, talk slides, etc.

export function parseDocumentText(text: string, fileName: string): ParsedLinkedInPost {
  const lines = text.split('\n')
  const title = lines[0]?.replace(/^#+\s*/, '').trim() || fileName
  const body = lines.slice(1).join('\n').trim() || text

  return {
    externalId:  `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    body,
    publishedAt: null,
    platform:    'linkedin',
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  values.push(current.trim())
  return values
}

function parseDate(raw: string): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

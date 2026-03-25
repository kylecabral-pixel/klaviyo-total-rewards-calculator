import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PDFParse } from 'pdf-parse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PDF_NAME = '2026 Klaviyo US Benefits At-a-Glance (1).pdf'
const JSON_FALLBACK = path.join(__dirname, 'data', 'us-benefits.json')

function splitSections(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const sections = []
  let current = null
  for (const line of lines) {
    const short = line.length < 80 && line === line.toUpperCase()
    const looksHeading = short || /^[A-Z][^.]{0,60}$/.test(line)
    if (looksHeading && line.length < 70 && !line.includes('$')) {
      if (current) sections.push(current)
      current = { heading: line, body: '' }
    } else if (current) {
      current.body += (current.body ? ' ' : '') + line
    } else {
      sections.push({ heading: 'Overview', body: line })
    }
  }
  if (current) sections.push(current)
  return sections.length ? sections : [{ heading: 'Benefits', body: text.slice(0, 8000) }]
}

export async function loadUsBenefits() {
  const pdfPath = path.join(__dirname, '..', 'Source', PDF_NAME)
  if (fs.existsSync(pdfPath)) {
    const buffer = fs.readFileSync(pdfPath)
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    await parser.destroy()
    const rawText = (result.text || '').trim()
    return {
      source: 'pdf',
      title: 'US benefits (from PDF)',
      rawText,
      sections: splitSections(rawText),
    }
  }

  const raw = fs.readFileSync(JSON_FALLBACK, 'utf8')
  const j = JSON.parse(raw)
  return {
    source: j.source || 'fallback',
    title: j.title,
    rawText: j.rawText || '',
    sections: j.sections || [],
  }
}

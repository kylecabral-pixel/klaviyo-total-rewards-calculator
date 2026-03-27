import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const US_BENEFITS_PDF_FILENAME =
  '2026 Klaviyo US Benefits At-a-Glance (1).pdf'

const JSON_FALLBACK = path.join(__dirname, 'data', 'us-benefits.json')

/** Absolute path to the US benefits PDF under `Source/`. */
export function getUsBenefitsPdfAbsolutePath() {
  return path.join(__dirname, '..', 'Source', US_BENEFITS_PDF_FILENAME)
}

export function isUsBenefitsPdfAvailable() {
  try {
    return fs.existsSync(getUsBenefitsPdfAbsolutePath())
  } catch {
    return false
  }
}

/**
 * Metadata for the Benefits tab (no PDF body — client offers download only).
 * @returns {Promise<{ ok: true, title: string, source: string, pdfAvailable: boolean }>}
 */
export async function getUsBenefitsMeta() {
  if (isUsBenefitsPdfAvailable()) {
    return {
      ok: true,
      source: 'pdf',
      title: 'US benefits — At-a-Glance',
      pdfAvailable: true,
    }
  }
  const raw = fs.readFileSync(JSON_FALLBACK, 'utf8')
  const j = JSON.parse(raw)
  return {
    ok: true,
    source: j.source || 'fallback',
    title: j.title || 'US benefits',
    pdfAvailable: false,
  }
}

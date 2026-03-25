/**
 * Parse free-text role for level (L0–L6) and compensation track / equity path.
 */

const LEVEL_RE = /\b(L[0-6])\b/i

const TRACK_RULES = [
  { track: 'ML', keywords: ['machine learning', 'ml engineer', ' mle ', 'deep learning'] },
  { track: 'Design', keywords: ['designer', 'design ', ' ux ', ' ui ', 'user experience'] },
  { track: 'Product', keywords: ['product manager', ' pm ', 'tpm', 'technical program', 'product owner'] },
  { track: 'IT', keywords: ['it ', ' information technology', 'sysadmin', 'network eng'] },
  { track: 'People', keywords: ['people ', 'hr ', 'human resources', 'talent ', 'recruiter'] },
  { track: 'Finance', keywords: ['finance', 'accounting', 'fp&a', 'controller'] },
  { track: 'Legal', keywords: ['legal', 'counsel', 'attorney'] },
  { track: 'Marketing', keywords: ['marketing', 'growth', 'demand gen', 'brand'] },
  { track: 'CS', keywords: ['customer success', ' csm ', ' solutions consultant'] },
  { track: 'Sales', keywords: ['sales', 'account executive', ' ae ', 'sdr', 'bdr'] },
  { track: 'Eng', keywords: ['engineer', 'engineering', 'developer', 'software', 'swe', 'data science', 'ds ', 'backend', 'frontend', 'full stack', 'infrastructure', 'devops', 'security eng'] },
]

export function parseRoleText(roleText) {
  const raw = String(roleText ?? '').trim()
  if (!raw) {
    return {
      level: null,
      track: 'Eng',
      equityPath: 'engineering',
      confidence: 'none',
      reason: 'empty',
    }
  }

  const levelMatch = raw.match(LEVEL_RE)
  const level = levelMatch ? levelMatch[1].toUpperCase() : null

  const lower = raw.toLowerCase()
  let track = 'Eng'
  let matchedRule = false
  for (const rule of TRACK_RULES) {
    if (rule.keywords.some((k) => lower.includes(k.trim()))) {
      track = rule.track
      matchedRule = true
      break
    }
  }

  const equityPath =
    track === 'Product' ||
    lower.includes('product manager') ||
    lower.includes('tpm') ||
    lower.includes('technical program')
      ? 'pm'
      : 'engineering'

  let confidence = 'high'
  if (!level) confidence = 'low'
  if (!matchedRule) confidence = level ? 'medium' : 'low'

  return {
    level,
    track,
    equityPath,
    confidence,
    reason: matchedRule ? 'keyword' : 'default_eng',
  }
}

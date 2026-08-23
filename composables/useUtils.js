// Shared utility functions used across components and composables.
//
// These were duplicated in ProjectCard, ProjectsWindow,
// ProjectDetailWindow, and useTerminal — keeping one copy here
// so they stay consistent and easier to maintain.

/**
 * Split a tech stack string on common delimiters (comma, slash,
 * pipe, semicolon) and return clean, trimmed entries.
 */
export function splitTech(techString) {
  if (!techString) return []
  return techString
    .split(/\s*[,\/\|\;]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Split a comma-separated skills string into trimmed entries.
 */
export function splitSkills(skillsString) {
  if (!skillsString) return []
  return skillsString
    .split(/\s*[,]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Format a date string to a short readable form like "Jan 2024".
 * Falls back to the raw string if parsing fails.
 */
export function formatDateShort(raw) {
  if (!raw) return ''
  const iso = Date.parse(raw)
  if (!isNaN(iso)) {
    const d = new Date(iso)
    const month = d.toLocaleString('en-US', { month: 'short' })
    return `${month} ${d.getFullYear()}`
  }
  const m = (raw + '').match(/(19|20)\d{2}/)
  return m ? m[0] : raw
}

/**
 * Parse a date string into a Date object, returning null on failure.
 */
export function parseDate(d) {
  if (!d) return null
  const iso = Date.parse(d)
  if (!isNaN(iso)) return new Date(iso)
  const m = d.match(/(19|20)\d{2}/)
  if (m) return new Date(parseInt(m[0], 10), 0, 1)
  return null
}

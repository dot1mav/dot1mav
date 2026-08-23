// A fake DOS filesystem built from data.json.
//
// Everything is generated on the fly from the content file, so the
// terminal's `cd` / `dir` / `type` commands always stay in sync with
// what the rest of the site shows. It's read-only — there's no
// mkdir, del or anything that could mutate the underlying data.
//
// Layout looks like this:
//
//   C:\PORTFOLIO\
//     README.TXT
//     CONTACT.TXT
//     ABOUT.TXT
//     PROJECTS\        (one TXT per project)
//     SKILLS\          (one TXT per skill category)
//     EXPERIENCES\     (one TXT per job)
//     CERTIFICATIONS\  (one TXT per certification)
//
// A node in the tree is either a directory (plain object) or a file
// ({ content: '...' }). A `_dir` marker is avoided by convention:
// files are the only nodes that carry a content string.

// Plain import so Vite resolves it exactly like every other module
// does — attaching `with { type: 'json' }` here while other files
// import the same file without it trips a build warning.
import siteData from '../public/data.json'

// Fake timestamps so `dir` looks like a real listing without
// pretending to track anything.
const STAMP = '08-08-2026  12:00 PM'

const VOLUME = 'Volume in drive C is DOT1MAV\nVolume Serial Number is 1998-0506'

function upper(name) {
  return String(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function txtFile(title, lines) {
  const body = [title, '='.repeat(title.length), '']
    .concat(lines)
    .join('\n')
  return { content: body }
}

function projectFile(project) {
  const lines = []
  if (project.date) lines.push(`Date:   ${project.date}`)
  if (project.tech_stack) lines.push(`Tech:   ${project.tech_stack}`)
  lines.push('')
  lines.push(project.description_full || project.description_short || '')
  if (project.demo_link) {
    lines.push('')
    lines.push(`Demo:   ${project.demo_link}`)
  }
  if (project.github) {
    lines.push(`GitHub: ${project.github}`)
  }
  return txtFile(project.title, lines)
}

function experienceFile(experience) {
  const lines = [
    `${experience.title} at ${experience.company}`,
    `Location: ${experience.location}`,
    `Dates:    ${experience.dates}`,
    '',
  ].concat(experience.duties.map((duty) => `- ${duty}`))
  return txtFile(experience.title, lines)
}

function skillFile(name, value) {
  const items = String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return txtFile(`${name} skills`, items.map((s) => `- ${s}`))
}

function certFile(cert) {
  const lines = [
    `Issuer: ${cert.issuer}`,
    cert.date ? `Date:   ${cert.date}` : '',
    cert.link ? `Link:   ${cert.link}` : '',
  ].filter(Boolean)
  return txtFile(cert.name, lines)
}

function buildFileSystem() {
  const projects = {}
  for (const project of siteData.projects || []) {
    projects[`${upper(project.title)}.TXT`] = projectFile(project)
  }

  const skills = {}
  for (const [category, value] of Object.entries(siteData.skills || {})) {
    skills[`${upper(category)}.TXT`] = skillFile(category, value)
  }

  const experiences = {}
  for (const experience of siteData.experiences || []) {
    experiences[`${upper(experience.title)}.TXT`] = experienceFile(experience)
  }

  const certifications = {}
  for (const cert of siteData.certifications || []) {
    certifications[`${upper(cert.name)}.TXT`] = certFile(cert)
  }

  const basics = siteData.basics || {}

  return {
    PORTFOLIO: {
      'README.TXT': txtFile('MAV Portfolio — README', [
        `${basics.name} — ${basics.label}`,
        '',
        siteData.aboutText1 || '',
        '',
        siteData.aboutText2 || '',
        '',
        siteData.aboutText3 || '',
      ]),
      'CONTACT.TXT': txtFile('Contact', [
        `Email:   ${basics.email || 'dot1mav@gmail.com'}`,
        'GitHub:  https://github.com/dot1mav',
        'LinkedIn: https://ir.linkedin.com/in/dot1mav',
        `Web:     ${basics.website || 'https://dot1mav.ir'}`,
        'Telegram: https://t.me/dot1mav',
      ]),
      'ABOUT.TXT': txtFile('About', [
        `${basics.name} — ${basics.label}`,
        '',
        `Location: ${basics.location?.city || ''}, ${basics.location?.region || ''}, Iran`,
        '',
        basics.summary || '',
      ]),
      PROJECTS: projects,
      SKILLS: skills,
      EXPERIENCES: experiences,
      CERTIFICATIONS: certifications,
    },
  }
}

const root = buildFileSystem()

// The path stack, e.g. ['PORTFOLIO', 'PROJECTS'] means C:\PORTFOLIO\PROJECTS
let path = ['PORTFOLIO']

function nodeAt(pathStack) {
  let node = root
  for (const segment of pathStack) {
    if (!node || typeof node.content !== 'undefined') return null
    node = node[segment]
  }
  return node ?? null
}

function findChild(dir, name) {
  const key = Object.keys(dir).find((k) => k.toUpperCase() === name.toUpperCase())
  return key ? dir[key] : null
}

export function pwd() {
  return `C:\\${path.join('\\')}`
}

export function cd(target) {
  // No argument just reports where we are.
  if (!target) return { ok: true, message: pwd() }

  const raw = target.trim()

  // Build the candidate path on a copy first, then validate before
  // committing — a failed `cd projects\back` shouldn't leave us
  // halfway there. Supports relative (PROJECTS, ..) and absolute
  // (\PORTFOLIO\PROJECTS, C:\...) style paths.
  let candidate
  if (/^C:[\\/]/i.test(raw) || /^[\\/]/.test(raw)) {
    candidate = raw
      .replace(/^C:[\\/]/i, '')
      .split(/[\\/]+/)
      .filter(Boolean)
      .map((segment) => segment.toUpperCase())
  } else {
    candidate = path.slice()
    for (const segment of raw.split(/[\\/]+/).filter(Boolean)) {
      if (segment === '..') {
        candidate.pop()
      } else if (segment === '.') {
        // no-op
      } else {
        candidate.push(segment.toUpperCase())
      }
    }
  }

  const node = nodeAt(candidate)
  if (!node || typeof node.content !== 'undefined') {
    return { ok: false, error: 'The system cannot find the path specified.' }
  }

  path = candidate
  return { ok: true }
}

export function dirContents() {
  const node = nodeAt(path)
  if (!node) return []

  return Object.entries(node).map(([name, child]) => {
    const isFile = typeof child.content === 'string'
    return {
      name,
      isFile,
      size: isFile ? child.content.length * 2 : null,
    }
  })
}

export function typeFile(name) {
  const node = nodeAt(path)
  if (!node) return null

  const child = findChild(node, name)
  if (!child) return null
  if (typeof child.content !== 'string') {
    return { isDir: true }
  }
  return { content: child.content }
}

// Simple tree view of everything reachable from the current dir.
export function tree() {
  const lines = []
  const walk = (node, prefix) => {
    const entries = Object.entries(node)
    entries.forEach(([name, child], index) => {
      const last = index === entries.length - 1
      const isFile = typeof child.content === 'string'
      lines.push(`${prefix}${last ? '└── ' : '├── '}${name}${isFile ? '' : '\\'}`)
      if (!isFile) {
        walk(child, prefix + (last ? '    ' : '│   '))
      }
    })
  }
  lines.push('C:\\')
  walk(root, '')
  return lines.join('\n')
}

export function formatDirListing() {
  const items = dirContents().sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1
    return a.name.localeCompare(b.name)
  })

  const fileTotal = items.filter((i) => i.isFile).reduce((n, i) => n + i.size, 0)

  return [
    VOLUME,
    ` Directory of ${pwd()}`,
    '',
    ...items.map((item) => {
      if (item.isFile) {
        return `${STAMP}    ${String(item.size).padStart(9)} ${item.name}`
      }
      return `${STAMP}    <DIR>          ${item.name}`
    }),
    '',
    `               ${items.filter((i) => i.isFile).length} File(s)  ${fileTotal.toLocaleString('en-US')} bytes`,
    `               ${items.filter((i) => !i.isFile).length} Dir(s)  102,400,000 bytes free`,
  ].join('\n')
}

// Generates Windows-98-styled placeholder images for every project
// and adds an `images` array to data.json when one is missing.
//
// Run from the project root:
//   node scripts/generate-project-images.mjs
//
// It's idempotent: projects that already have images are left alone.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = join(root, 'public', 'data.json')
const imagesDir = join(root, 'public', 'images', 'projects')

function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function svgFor(project) {
  const title = esc(project.title)
  const tech = esc(project.tech_stack || '')
  const date = esc(project.date || '')

  // Long titles get split so they don't spill off the image.
  const titleLines = []
  let current = ''
  for (const word of title.split(' ')) {
    if ((current + ' ' + word).trim().length > 26) {
      titleLines.push(current)
      current = word
    } else {
      current = (current + ' ' + word).trim()
    }
  }
  if (current) titleLines.push(current)

  const titleText = titleLines
    .map(
      (line, i) =>
        `<text x="14" y="${26 + i * 22}" font-family="monospace" font-size="18" font-weight="bold" fill="#ffffff">${line}</text>`
    )
    .join('\n    ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#c0c0c0"/>
  <rect x="1" y="1" width="638" height="358" fill="#c0c0c0" stroke="#000000" stroke-width="2"/>

  <!-- title bar -->
  <rect x="4" y="4" width="632" height="44" fill="url(#titlebar)"/>
  <defs>
    <linearGradient id="titlebar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000080"/>
      <stop offset="100%" stop-color="#1084d0"/>
    </linearGradient>
  </defs>
  ${titleText}

  <!-- body -->
  <rect x="4" y="52" width="632" height="304" fill="#3f3f46"/>

  <text x="24" y="96" font-family="monospace" font-size="14" fill="#00d7ff">project details</text>
  <text x="24" y="126" font-family="monospace" font-size="14" fill="#00d7ff">================</text>

  <text x="24" y="162" font-family="monospace" font-size="14" fill="#ffff55">date: ${date || 'n/a'}</text>
  <text x="24" y="190" font-family="monospace" font-size="14" fill="#ffffff">tech:</text>
  ${esc(tech)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map(
      (t, i) =>
        `<text x="48" y="${214 + i * 22}" font-family="monospace" font-size="14" fill="#6cb8ff">- ${t}</text>`
    )
    .join('\n    ')}

  <text x="24" y="336" font-family="monospace" font-size="12" fill="#8b8b8b">MAV PORTFOLIO - dot1mav.ir</text>
</svg>
`
}

const data = JSON.parse(readFileSync(dataPath, 'utf8'))
mkdirSync(imagesDir, { recursive: true })

let added = 0
for (const project of data.projects || []) {
  if (project.images && project.images.length) continue

  const slug = slugify(project.title)
  const imagePath = `/images/projects/${slug}.svg`
  writeFileSync(join(imagesDir, `${slug}.svg`), svgFor(project))
  project.images = [imagePath]
  added++
}

writeFileSync(dataPath, JSON.stringify(data, null, 4) + '\n')

console.log(`Generated ${added} image(s). data.json updated.`)

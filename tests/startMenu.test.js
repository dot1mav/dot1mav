import { describe, expect, it } from 'vitest'
import { buildStartMenuSections, filterStartMenuSections } from '../composables/useStartMenu'

const labelsOf = (sections) => sections.flatMap((section) => section.items.map((item) => item.label))

describe('buildStartMenuSections', () => {
  it('exposes every launchable program plus the system actions', () => {
    const labels = labelsOf(buildStartMenuSections(false))
    for (const expected of ['Projects', 'About Me', 'MS-DOS Prompt', 'Minesweeper', 'Solitaire']) {
      expect(labels).toContain(expected)
    }
    expect(labels).toContain('Restart')
    expect(labels).toContain('Shut Down')
  })

  it('flips the theme entry with the current mode', () => {
    expect(labelsOf(buildStartMenuSections(false))).toContain('Dark Mode')
    expect(labelsOf(buildStartMenuSections(true))).toContain('Light Mode')
  })

  it('marks the power entries as destructive', () => {
    const power = buildStartMenuSections(false).at(-1)
    expect(power.items.every((item) => item.danger)).toBe(true)
  })
})

describe('filterStartMenuSections', () => {
  const sections = buildStartMenuSections(false)

  it('returns everything for an empty query', () => {
    expect(filterStartMenuSections(sections, '')).toHaveLength(sections.length)
    expect(filterStartMenuSections(sections, '   ')).toHaveLength(sections.length)
  })

  it('matches labels case-insensitively and drops empty sections', () => {
    const result = filterStartMenuSections(sections, 'SOL')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Games')
    expect(result[0].items.map((item) => item.label)).toEqual(['Solitaire'])
  })

  it('keeps every section that has a match', () => {
    const titles = filterStartMenuSections(sections, 'e').map((section) => section.title)
    expect(titles).toContain('Programs')
    expect(titles).toContain('Accessories')
  })

  it('returns nothing when there is no match', () => {
    expect(filterStartMenuSections(sections, 'zzzz')).toEqual([])
  })

  it('preserves section extras like separators', () => {
    const games = filterStartMenuSections(sections, 'mines').find((s) => s.title === 'Games')
    expect(games.separatorAfter).toBe(true)
  })
})

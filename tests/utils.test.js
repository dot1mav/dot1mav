import { describe, expect, it } from 'vitest'
import { formatDateShort, parseDate, splitSkills, splitTech } from '../composables/useUtils'

describe('useUtils', () => {
  it('splits tech stacks on supported delimiters', () => {
    expect(splitTech('Vue, Django / Flask | PostgreSQL; Redis')).toEqual(['Vue', 'Django', 'Flask', 'PostgreSQL', 'Redis'])
  })
  it('splits skills and handles empty values', () => {
    expect(splitSkills(' Python,  Vue.js,')).toEqual(['Python', 'Vue.js'])
    expect(splitSkills('')).toEqual([])
  })
  it('formats and parses dates', () => {
    expect(formatDateShort('2024-07-15')).toBe('Jul 2024')
    expect(formatDateShort('September 2020 – Present')).toBe('2020')
    expect(formatDateShort('not-a-date')).toBe('not-a-date')
    expect(parseDate('2024-01-15')?.getFullYear()).toBe(2024)
    expect(parseDate('unknown')).toBeNull()
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { cd, dirContents, formatDirListing, pwd, tree, typeFile } from '../services/dosFilesystem'

describe('DOS portfolio filesystem', () => {
  beforeEach(() => { cd('C:\\PORTFOLIO') })
  it('lists generated portfolio content', () => {
    expect(pwd()).toBe('C:\\PORTFOLIO')
    expect(dirContents().map((item) => item.name)).toEqual(expect.arrayContaining(['README.TXT', 'PROJECTS', 'SKILLS']))
  })
  it('supports navigation and preserves state on invalid paths', () => {
    expect(cd('projects').ok).toBe(true)
    expect(pwd()).toBe('C:\\PORTFOLIO\\PROJECTS')
    expect(cd('missing\\child').ok).toBe(false)
    expect(pwd()).toBe('C:\\PORTFOLIO\\PROJECTS')
    expect(cd('C:\\PORTFOLIO\\SKILLS').ok).toBe(true)
  })
  it('reads files and renders listing/tree', () => {
    cd('C:\\PORTFOLIO')
    expect(typeFile('readme.txt')?.content).toContain('MAV Portfolio')
    expect(typeFile('PROJECTS')).toEqual({ isDir: true })
    expect(typeFile('missing.txt')).toBeNull()
    expect(formatDirListing()).toContain('Directory of C:\\PORTFOLIO')
    expect(tree()).toContain('PROJECTS\\')
  })
})

import { describe, expect, it } from 'vitest'
import { snapRect, snapZoneFor } from '../composables/useWindows'

// A stand-in for the browser viewport: 1200x800 with the 30px taskbar
// leaves 770px of usable height.
const view = { width: 1200, height: 800 }

describe('snapZoneFor', () => {
  it('treats the top edge as maximize and the sides as halves', () => {
    expect(snapZoneFor(600, 2, view)).toBe('maximize')
    expect(snapZoneFor(2, 400, view)).toBe('left')
    expect(snapZoneFor(1198, 400, view)).toBe('right')
  })

  it('gives quarters at the corners', () => {
    expect(snapZoneFor(2, 2, view)).toBe('top-left')
    expect(snapZoneFor(1198, 2, view)).toBe('top-right')
    expect(snapZoneFor(2, 798, view)).toBe('bottom-left')
    expect(snapZoneFor(1198, 798, view)).toBe('bottom-right')
  })

  it('ignores the middle of the screen', () => {
    expect(snapZoneFor(600, 400, view)).toBeNull()
    expect(snapZoneFor(600, 40, view)).toBeNull()
  })
})

describe('snapRect', () => {
  it('fills the viewport above the taskbar when maximizing', () => {
    expect(snapRect('maximize', view)).toEqual({ x: 0, y: 0, width: 1200, height: 770 })
  })

  it('splits the screen in half for the side edges', () => {
    expect(snapRect('left', view)).toEqual({ x: 0, y: 0, width: 600, height: 770 })
    expect(snapRect('right', view)).toEqual({ x: 600, y: 0, width: 600, height: 770 })
  })

  it('gives a quarter for each corner', () => {
    expect(snapRect('top-left', view)).toEqual({ x: 0, y: 0, width: 600, height: 385 })
    expect(snapRect('bottom-right', view)).toEqual({ x: 600, y: 385, width: 600, height: 385 })
  })

  it('returns nothing for an unknown zone', () => {
    expect(snapRect(null, view)).toBeNull()
  })
})

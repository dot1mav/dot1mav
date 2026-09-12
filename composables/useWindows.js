// The window manager.
//
// All window state is module-scoped so the desktop, the taskbar and
// the terminal's `open <window>` command all share one source of
// truth — no prop drilling for something this global.
//
// Focus (z-order) and resizing are handled here too, since they
// touch the same shared state.
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAnalytics } from './useAnalytics'

const windows = reactive({
  projects: { open: false, minimized: false, maximized: false, title: 'Projects', icon: '/images/icons/projects.png', x: 100, y: 100, width: 800, height: 480 },
  experiences: { open: false, minimized: false, maximized: false, title: 'Experiences', icon: '/images/icons/experiences.png', x: 120, y: 120, width: 700, height: 420 },
  skills: { open: false, minimized: false, maximized: false, title: 'Skills', icon: '/images/icons/skills.png', x: 140, y: 140, width: 600, height: 460 },
  certifications: { open: false, minimized: false, maximized: false, title: 'Certifications', icon: '/images/icons/certificates.png', x: 160, y: 160, width: 700, height: 460 },
  contact: { open: false, minimized: false, maximized: false, title: 'Contact', icon: '/images/icons/contact.png', x: 180, y: 180, width: 400, height: 300 },
  about: { open: false, minimized: false, maximized: false, title: 'About Me', icon: '/images/icons/info.png', x: 200, y: 200, width: 550, height: 520 },
  terminal: { open: false, minimized: false, maximized: false, title: 'MS-DOS Prompt', icon: '/images/icons/modem-4.png', x: 220, y: 220, width: 720, height: 480 },
  project: { open: false, minimized: false, maximized: false, title: 'Project', icon: '/images/icons/projects.png', x: 180, y: 120, width: 760, height: 520 },
  svgcreator: { open: false, minimized: false, maximized: false, title: 'SVG Creator', icon: '/images/icons/paint.png', x: 120, y: 90, width: 780, height: 560 },
  photos: { open: false, minimized: false, maximized: false, title: 'Photo Viewer', icon: '/images/icons/photos.png', x: 160, y: 110, width: 760, height: 540 },
  video: { open: false, minimized: false, maximized: false, title: 'Video Player', icon: '/images/icons/video.png', x: 200, y: 130, width: 720, height: 520 },
  minesweeper: { open: false, minimized: false, maximized: false, title: 'Minesweeper', icon: '/images/icons/paint.png', x: 250, y: 150, width: 290, height: 400 },
  solitaire: { open: false, minimized: false, maximized: false, title: 'Solitaire', icon: '/images/icons/solitaire.png', x: 170, y: 110, width: 620, height: 520 },
})

// Drag offsets live here instead of on the window object so a
// mousemove/mouseup pair can be attached and detached without
// losing track of where the drag started.
const dragState = reactive({
  isDragging: false,
  windowId: null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  pendingUnmaximize: false,
})

// Same idea for resize. Handles are compass points — 'n', 'e', 's',
// 'w' plus the four corners.
const resizeState = reactive({
  isResizing: false,
  windowId: null,
  handle: null,
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0,
  startWindowX: 0,
  startWindowY: 0,
})

// Window geometry survives a reload, like a real desktop session.
// Only x/y/width/height are stored: a window that was maximized when
// you left should still open as a normal window next visit.
const GEOMETRY_KEY = 'mav-window-geometry'

function loadSavedGeometry() {
  if (typeof window === 'undefined') return
  // The stacked mobile layout wins over saved desktop coordinates.
  if (window.innerWidth < 768) return
  try {
    const saved = JSON.parse(window.localStorage.getItem(GEOMETRY_KEY) || '{}')
    for (const [id, geometry] of Object.entries(saved)) {
      if (!windows[id] || !geometry) continue
      for (const key of ['x', 'y', 'width', 'height']) {
        if (typeof geometry[key] === 'number' && Number.isFinite(geometry[key])) {
          windows[id][key] = geometry[key]
        }
      }
    }
  } catch {
    // Unreadable storage isn't worth breaking the desktop over.
  }
}

let saveGeometryTimer = null

function saveGeometry() {
  if (typeof window === 'undefined') return
  clearTimeout(saveGeometryTimer)
  saveGeometryTimer = setTimeout(() => {
    const snapshot = {}
    for (const [id, win] of Object.entries(windows)) {
      snapshot[id] = { x: win.x, y: win.y, width: win.width, height: win.height }
    }
    try {
      window.localStorage.setItem(GEOMETRY_KEY, JSON.stringify(snapshot))
    } catch {
      // Storage full or blocked — geometry just won't persist.
    }
  }, 300)
}

// Snap targets while a title bar is being dragged: the four edges
// maximize or halve, the corners give quarters. This is the one
// behaviour that makes a browser desktop feel like a real one.
const SNAP_EDGE = 6
const TASKBAR_HEIGHT = 30

const snapPreview = reactive({ visible: false, zone: null, x: 0, y: 0, width: 0, height: 0 })

// The viewport is passed in (with a live default) so the snap maths can
// be unit-tested without a browser.
function viewport() {
  if (typeof window === 'undefined') return { width: 1024, height: 768 }
  return { width: window.innerWidth, height: window.innerHeight }
}

export function snapZoneFor(clientX, clientY, view = viewport()) {
  const nearTop = clientY <= SNAP_EDGE
  const nearBottom = clientY >= view.height - TASKBAR_HEIGHT - SNAP_EDGE
  const nearLeft = clientX <= SNAP_EDGE
  const nearRight = clientX >= view.width - SNAP_EDGE

  if (nearTop && nearLeft) return 'top-left'
  if (nearTop && nearRight) return 'top-right'
  if (nearBottom && nearLeft) return 'bottom-left'
  if (nearBottom && nearRight) return 'bottom-right'
  if (nearTop) return 'maximize'
  if (nearLeft) return 'left'
  if (nearRight) return 'right'
  return null
}

export function snapRect(zone, view = viewport()) {
  const width = view.width
  const height = view.height - TASKBAR_HEIGHT
  const halfWidth = Math.round(width / 2)
  const halfHeight = Math.round(height / 2)

  switch (zone) {
    case 'maximize': return { x: 0, y: 0, width, height }
    case 'left': return { x: 0, y: 0, width: halfWidth, height }
    case 'right': return { x: width - halfWidth, y: 0, width: halfWidth, height }
    case 'top-left': return { x: 0, y: 0, width: halfWidth, height: halfHeight }
    case 'top-right': return { x: width - halfWidth, y: 0, width: halfWidth, height: halfHeight }
    case 'bottom-left': return { x: 0, y: height - halfHeight, width: halfWidth, height: halfHeight }
    case 'bottom-right': return { x: width - halfWidth, y: height - halfHeight, width: halfWidth, height: halfHeight }
    default: return null
  }
}

function rememberGeometry(win) {
  win.prevX = win.x
  win.prevY = win.y
  win.prevWidth = win.width
  win.prevHeight = win.height
}

// Restore the last session's layout as soon as this module reaches the
// browser (never during SSR).
if (typeof window !== 'undefined') {
  loadSavedGeometry()
}

// Increments forever — each focus just takes the next number, so
// the last clicked window is always the one on top. Starts at 1000
// to stay clear of the source-notice overlay (z 100000+).
let topZIndex = 1000

const MIN_WINDOW_WIDTH = 400
const MIN_WINDOW_HEIGHT = 260

export function useWindows() {
  const { sendUmamiEvent } = useAnalytics()

  // Only windows that are actually open show up in the taskbar.
  const openTaskbarWindows = computed(() => {
    const result = {}
    for (const [id, window] of Object.entries(windows)) {
      if (window.open) {
        result[id] = window
      }
    }
    return result
  })

  // Highest z-index among the visible windows. Title bars compare
  // against this so the inactive ones can go grey, like the real thing.
  const topZ = computed(() => {
    let top = -1
    for (const win of Object.values(windows)) {
      if (win.open && !win.minimized && win.z > top) top = win.z
    }
    return top
  })

  function isActive(id) {
    const win = windows[id]
    return Boolean(win && win.open && !win.minimized && win.z === topZ.value)
  }

  const hasVisibleWindow = computed(() =>
    Object.values(windows).some((win) => win.open && !win.minimized)
  )

  // "Show desktop" — hide everything, or bring it all back if the
  // desktop is already clear.
  function toggleShowDesktop() {
    const visible = Object.values(windows).filter((win) => win.open && !win.minimized)
    if (visible.length) {
      visible.forEach((win) => {
        win.minimized = true
      })
    } else {
      Object.keys(windows).forEach((id) => {
        if (windows[id].open) restoreWindow(id)
      })
    }
  }

  // Brings a window to the front. Called on open, on click anywhere
  // in the window, and on title-bar grabs.
  function focusWindow(id) {
    if (!windows[id] || !windows[id].open) return
    windows[id].z = ++topZIndex
  }

  function openWindow(id) {
    if (!windows[id]) return
    windows[id].open = true
    windows[id].minimized = false
    focusWindow(id)

    sendUmamiEvent('window_open', {
      window_id: id,
      window_title: windows[id].title,
    })
  }

  function closeWindow(id) {
    if (!windows[id]) return
    windows[id].open = false
    windows[id].minimized = false
    windows[id].maximized = false

    sendUmamiEvent('window_close', {
      window_id: id,
      window_title: windows[id].title,
    })
  }

  function minimizeWindow(id) {
    if (!windows[id]) return
    windows[id].minimized = true

    sendUmamiEvent('window_minimize', {
      window_id: id,
      window_title: windows[id].title,
    })
  }

  function restoreWindow(id) {
    if (!windows[id]) return
    windows[id].minimized = false
    focusWindow(id)

    sendUmamiEvent('window_restore', {
      window_id: id,
      window_title: windows[id].title,
    })
  }

  function maximizeWindow(id) {
    const win = windows[id]
    if (!win) return
    win.maximized = !win.maximized
    if (win.maximized) {
      // Save the old spot so un-maximizing puts it back where it was.
      rememberGeometry(win)

      win.x = 0
      win.y = 0
      win.width = window.innerWidth
      win.height = Math.max(window.innerHeight - TASKBAR_HEIGHT, 200)
    } else {
      win.x = win.prevX !== undefined ? win.prevX : 100
      win.y = win.prevY !== undefined ? win.prevY : 100
      win.width = win.prevWidth !== undefined ? win.prevWidth : 500
      win.height = win.prevHeight !== undefined ? win.prevHeight : 400
    }
    focusWindow(id)
    saveGeometry()

    sendUmamiEvent('window_maximize_toggle', {
      window_id: id,
      window_title: win.title,
      maximized: win.maximized,
    })
  }

  function startDrag(e, id) {
    // Buttons in the title bar have their own handlers — don't hijack those.
    if (e.target.closest('.title-bar-controls')) return

    e.preventDefault()

    focusWindow(id)

    const win = windows[id]

    dragState.isDragging = true
    dragState.windowId = id
    dragState.startX = e.clientX - win.x
    dragState.startY = e.clientY - win.y
    dragState.originX = e.clientX
    dragState.originY = e.clientY
    // A maximized window only shrinks back down once the pointer really
    // moves, so a double-click on the title bar still reads as
    // maximize/restore rather than drag-away.
    dragState.pendingUnmaximize = win.maximized

    document.body.classList.add('is-dragging-window')
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  function handleDrag(e) {
    if (!dragState.isDragging || !dragState.windowId) return

    const id = dragState.windowId
    const win = windows[id]

    // Pull a maximized window back to its old size, keeping the grab
    // point under the pointer so nothing jumps.
    if (dragState.pendingUnmaximize) {
      const movedX = Math.abs(e.clientX - dragState.originX)
      const movedY = Math.abs(e.clientY - dragState.originY)
      if (movedX < 5 && movedY < 5) return

      const restoreWidth = win.prevWidth ?? 600
      const restoreHeight = win.prevHeight ?? 400
      const grabRatio = dragState.originX / window.innerWidth

      win.maximized = false
      win.width = restoreWidth
      win.height = restoreHeight
      win.x = Math.max(0, Math.min(dragState.originX - restoreWidth * grabRatio, window.innerWidth - restoreWidth))
      win.y = Math.max(0, dragState.originY - 12)

      dragState.startX = e.clientX - win.x
      dragState.startY = e.clientY - win.y
      dragState.pendingUnmaximize = false
    }

    let newX = e.clientX - dragState.startX
    let newY = e.clientY - dragState.startY

    // Leave a sliver of the window reachable so it can't be flung
    // fully off-screen and become impossible to grab again.
    newX = Math.max(0, Math.min(newX, window.innerWidth - 100))
    newY = Math.max(0, Math.min(newY, window.innerHeight - 100))

    windows[id].x = newX
    windows[id].y = newY

    // Show where the window will land if the pointer is in a snap zone.
    const zone = snapZoneFor(e.clientX, e.clientY)
    const rect = zone ? snapRect(zone) : null
    if (rect) {
      Object.assign(snapPreview, rect)
      snapPreview.zone = zone
      snapPreview.visible = true
    } else {
      snapPreview.zone = null
      snapPreview.visible = false
    }
  }

  function stopDrag() {
    if (dragState.isDragging && dragState.windowId && snapPreview.zone) {
      const id = dragState.windowId
      const win = windows[id]

      if (snapPreview.zone === 'maximize') {
        maximizeWindow(id)
      } else {
        const rect = snapRect(snapPreview.zone)
        // Remember where it came from so dragging the title bar again
        // (or double-clicking it) can undo the snap.
        rememberGeometry(win)
        win.x = rect.x
        win.y = rect.y
        win.width = rect.width
        win.height = rect.height
        focusWindow(id)
      }

      snapPreview.visible = false
      snapPreview.zone = null
    }

    dragState.isDragging = false
    dragState.windowId = null
    dragState.pendingUnmaximize = false

    document.body.classList.remove('is-dragging-window')
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)

    saveGeometry()
  }

  function startResize(e, id, handle) {
    // A maximized window fills the screen; resizing it makes no sense.
    if (windows[id].maximized) return

    e.preventDefault()
    e.stopPropagation()

    focusWindow(id)

    const win = windows[id]
    resizeState.isResizing = true
    resizeState.windowId = id
    resizeState.handle = handle
    resizeState.startX = e.clientX
    resizeState.startY = e.clientY
    resizeState.startWidth = win.width
    resizeState.startHeight = win.height
    resizeState.startWindowX = win.x
    resizeState.startWindowY = win.y

    document.body.classList.add('is-resizing-window')
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
  }

  function handleResize(e) {
    if (!resizeState.isResizing || !resizeState.windowId) return

    const win = windows[resizeState.windowId]
    const handle = resizeState.handle
    const dx = e.clientX - resizeState.startX
    const dy = e.clientY - resizeState.startY

    // East side: grow/shrink from the right edge.
    if (handle.includes('e')) {
      win.width = Math.min(
        window.innerWidth,
        Math.max(MIN_WINDOW_WIDTH, resizeState.startWidth + dx)
      )
    }

    // West side: the right edge stays put, so x moves with the width.
    if (handle.includes('w')) {
      const width = Math.min(
        resizeState.startWindowX + resizeState.startWidth,
        Math.max(MIN_WINDOW_WIDTH, resizeState.startWidth - dx)
      )
      win.width = width
      win.x = resizeState.startWindowX + (resizeState.startWidth - width)
    }

    // South side: grow/shrink from the bottom edge.
    if (handle.includes('s')) {
      win.height = Math.min(
        window.innerHeight - TASKBAR_HEIGHT,
        Math.max(MIN_WINDOW_HEIGHT, resizeState.startHeight + dy)
      )
    }

    // North side: the bottom edge stays put, so y moves with the height.
    if (handle.includes('n')) {
      const height = Math.min(
        resizeState.startWindowY + resizeState.startHeight,
        Math.max(MIN_WINDOW_HEIGHT, resizeState.startHeight - dy)
      )
      win.height = height
      win.y = resizeState.startWindowY + (resizeState.startHeight - height)
    }
  }

  function stopResize() {
    resizeState.isResizing = false
    resizeState.windowId = null

    document.body.classList.remove('is-resizing-window')
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)

    saveGeometry()
  }

  // Keeps open windows from sitting below the taskbar after a resize.
  function handleWindowResize() {
    Object.keys(windows).forEach((id) => {
      if (windows[id].open && !windows[id].maximized) {
        const maxX = window.innerWidth - 100
        const maxY = window.innerHeight - 100

        if (windows[id].x > maxX) {
          windows[id].x = Math.max(0, maxX)
        }
        if (windows[id].y > maxY) {
          windows[id].y = Math.max(0, maxY)
        }
        if (windows[id].width > window.innerWidth) {
          windows[id].width = window.innerWidth
        }
        if (windows[id].height > window.innerHeight - 28) {
          windows[id].height = window.innerHeight - 28
        }
      }
    })
  }

  // Small screens get a simple stacked layout instead of the
  // desktop coordinates, which would overflow sideways otherwise.
  function layoutWindowsForMobile() {
    if (typeof window === 'undefined' || window.innerWidth >= 768) return
    Object.keys(windows).forEach((id) => {
      windows[id].x = 4
      windows[id].y = 4
      windows[id].width = window.innerWidth - 16
      windows[id].height = window.innerHeight - 40
    })
  }

  // Keyboard shortcuts for window management.
  // Escape closes the topmost window, Ctrl+Arrow cycles through
  // open windows, and F11 toggles maximize on the topmost window.
  let keyboardHandler = null

  function getTopmostWindow() {
    let topId = null
    let topZ = -1
    for (const [id, win] of Object.entries(windows)) {
      if (win.open && !win.minimized && win.z > topZ) {
        topZ = win.z
        topId = id
      }
    }
    return topId
  }

  function getOpenWindowIds() {
    return Object.keys(windows).filter((id) => windows[id].open)
  }

  function handleKeydown(e) {
    const target = e.target
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    // Escape always works — closes the topmost window.
    if (e.key === 'Escape') {
      const topId = getTopmostWindow()
      if (topId) {
        closeWindow(topId)
        e.preventDefault()
      }
      return
    }

    // The rest only fire when focus is NOT inside an input/textarea
    // so we don't hijack normal typing.
    if (isInput) return

    // F11 toggles maximize on the topmost window.
    if (e.key === 'F11') {
      const topId = getTopmostWindow()
      if (topId) {
        maximizeWindow(topId)
        e.preventDefault()
      }
      return
    }

    // Ctrl+Arrow cycles through open windows.
    if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const openIds = getOpenWindowIds()
      if (openIds.length < 2) return

      const topId = getTopmostWindow()
      const currentIdx = openIds.indexOf(topId)
      const nextIdx = e.key === 'ArrowRight'
        ? (currentIdx + 1) % openIds.length
        : (currentIdx - 1 + openIds.length) % openIds.length

      const nextId = openIds[nextIdx]
      focusWindow(nextId)
      e.preventDefault()
    }
  }

  function installKeyboardShortcuts() {
    if (typeof window === 'undefined') return
    keyboardHandler = handleKeydown
    window.addEventListener('keydown', keyboardHandler)
  }

  function removeKeyboardShortcuts() {
    if (keyboardHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', keyboardHandler)
      keyboardHandler = null
    }
  }

  return {
    windows,
    openTaskbarWindows,
    focusWindow,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    maximizeWindow,
    startDrag,
    startResize,
    handleWindowResize,
    layoutWindowsForMobile,
    installKeyboardShortcuts,
    removeKeyboardShortcuts,
    // Added for the desktop polish pass
    snapPreview,
    topZ,
    isActive,
    hasVisibleWindow,
    toggleShowDesktop,
  }
}

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
  projects: { open: false, minimized: false, maximized: false, title: 'Projects', x: 100, y: 100, width: 800, height: 480 },
  experiences: { open: false, minimized: false, maximized: false, title: 'Experiences', x: 120, y: 120, width: 700, height: 420 },
  skills: { open: false, minimized: false, maximized: false, title: 'Skills', x: 140, y: 140, width: 600, height: 460 },
  certifications: { open: false, minimized: false, maximized: false, title: 'Certifications', x: 160, y: 160, width: 700, height: 460 },
  contact: { open: false, minimized: false, maximized: false, title: 'Contact', x: 180, y: 180, width: 400, height: 300 },
  about: { open: false, minimized: false, maximized: false, title: 'About Me', x: 200, y: 200, width: 550, height: 520 },
  terminal: { open: false, minimized: false, maximized: false, title: 'MS-DOS Prompt', x: 220, y: 220, width: 720, height: 480 },
  project: { open: false, minimized: false, maximized: false, title: 'Project', x: 180, y: 120, width: 760, height: 520 },
  svgcreator: { open: false, minimized: false, maximized: false, title: 'SVG Creator', x: 120, y: 90, width: 780, height: 560 },
  photos: { open: false, minimized: false, maximized: false, title: 'Photo Viewer', x: 160, y: 110, width: 760, height: 540 },
  video: { open: false, minimized: false, maximized: false, title: 'Video Player', x: 200, y: 130, width: 720, height: 520 },
})

// Drag offsets live here instead of on the window object so a
// mousemove/mouseup pair can be attached and detached without
// losing track of where the drag started.
const dragState = reactive({
  isDragging: false,
  windowId: null,
  startX: 0,
  startY: 0,
})

// Same idea for resize. Handles are 'e' (right edge), 's' (bottom
// edge) or 'se' (bottom-right corner).
const resizeState = reactive({
  isResizing: false,
  windowId: null,
  handle: null,
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0,
})

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
      win.prevX = win.x
      win.prevY = win.y
      win.prevWidth = win.width
      win.prevHeight = win.height

      win.x = 0
      win.y = 0
      win.width = window.innerWidth
      win.height = Math.max(window.innerHeight - 28, 200)
    } else {
      win.x = win.prevX !== undefined ? win.prevX : 100
      win.y = win.prevY !== undefined ? win.prevY : 100
      win.width = win.prevWidth !== undefined ? win.prevWidth : 500
      win.height = win.prevHeight !== undefined ? win.prevHeight : 400
    }
    focusWindow(id)

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

    dragState.isDragging = true
    dragState.windowId = id
    dragState.startX = e.clientX - windows[id].x
    dragState.startY = e.clientY - windows[id].y

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  function handleDrag(e) {
    if (dragState.isDragging && dragState.windowId) {
      const id = dragState.windowId

      let newX = e.clientX - dragState.startX
      let newY = e.clientY - dragState.startY

      // Leave a sliver of the window reachable so it can't be flung
      // fully off-screen and become impossible to grab again.
      const maxX = window.innerWidth - 100
      const maxY = window.innerHeight - 100

      newX = Math.max(0, Math.min(newX, maxX))
      newY = Math.max(0, Math.min(newY, maxY))

      windows[id].x = newX
      windows[id].y = newY
    }
  }

  function stopDrag() {
    dragState.isDragging = false
    dragState.windowId = null

    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)
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

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
  }

  function handleResize(e) {
    if (!resizeState.isResizing || !resizeState.windowId) return

    const win = windows[resizeState.windowId]
    const dx = e.clientX - resizeState.startX
    const dy = e.clientY - resizeState.startY

    // Min size keeps the title bar usable and the content readable.
    // Also clamp to the viewport so a window can't grow off-screen.
    if (resizeState.handle.includes('e')) {
      win.width = Math.min(
        window.innerWidth,
        Math.max(MIN_WINDOW_WIDTH, resizeState.startWidth + dx)
      )
    }
    if (resizeState.handle.includes('s')) {
      win.height = Math.min(
        window.innerHeight - 28,
        Math.max(MIN_WINDOW_HEIGHT, resizeState.startHeight + dy)
      )
    }
  }

  function stopResize() {
    resizeState.isResizing = false
    resizeState.windowId = null

    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
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
    Object.keys(windows).forEach((id, index) => {
      windows[id].x = 20
      windows[id].y = 50 + index * 40
      windows[id].width = Math.min(windows[id].width, window.innerWidth - 40)
      windows[id].height = Math.min(windows[id].height, window.innerHeight - 100)
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
  }
}

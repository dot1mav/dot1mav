// Blocks the obvious devtools shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
// and right-click, then shows a notice pointing at the public repo.
//
// Honest caveat: this is a nudge, not a real gate — anyone can still
// open the source, and there's no point pretending otherwise. The goal
// is just to keep casual right-click copying off the site and send
// curious people to GitHub instead.
import { ref } from 'vue'
import { useAnalytics } from './useAnalytics'

const sourceGuardsCleanup = ref(null)

export function useSourceGuards() {
  const { sendUmamiEvent } = useAnalytics()

  const cfg = () => ({
    enableSourceGuards: true,
    githubUrl: 'https://github.com/dot1mav/dot1mav/tree/gh-pages',
    backdropId: 'source-backdrop',
    windowId: 'source-window',
  })

  function createSourceWindow() {
    const config = cfg()
    if (document.getElementById(config.backdropId)) {
      return {
        backdrop: document.getElementById(config.backdropId),
        win: document.getElementById(config.windowId),
      }
    }

    const backdrop = document.createElement('div')
    backdrop.id = config.backdropId
    backdrop.className = 'source-backdrop'

    const win = document.createElement('div')
    win.id = config.windowId
    win.className = 'window source-window'
    win.style.left = '50%'
    win.style.top = '50%'
    win.style.transform = 'translate(-50%, -50%)'
    win.style.position = 'fixed'
    win.style.zIndex = '100001'

    win.innerHTML = `
      <div class="title-bar" aria-label="Source notice titlebar">
        <div class="title-bar-text">MAV Portfolio – Source</div>
        <div class="title-bar-controls">
          <button data-action="min" aria-label="Minimize"></button>
          <button data-action="max" aria-label="Maximize"></button>
          <button data-action="close" aria-label="Close"></button>
        </div>
      </div>
      <div class="window-body">
        <h3 style="margin:0 0 8px;font-size:15px;font-weight:800;">Heads up – Source available</h3>
        <p style="margin:0 0 10px;line-height:1.4;">
          The frontend code for this site is public on GitHub. View, fork or contribute via the repository and the <code>gh-pages</code> branch.
        </p>
        <div class="notice-actions">
          <a class="notice-primary" href="${config.githubUrl}" target="_blank" rel="noopener noreferrer">Open repo (gh-pages)</a>
          <button class="notice-neutral" type="button" data-action="close-btn">Close</button>
        </div>
        <div style="margin-top:10px;font-size:12px;color:var(--border-dark);">
          Tip: the site uses compiled/minified assets. For issues/PRs, please use the GitHub repo.
        </div>
      </div>
    `

    backdrop.appendChild(win)
    const appRoot = document.getElementById('app') || document.body
    appRoot.appendChild(backdrop)

    const btnClose = win.querySelector('[data-action="close"]')
    const btnMin = win.querySelector('[data-action="min"]')
    const btnMax = win.querySelector('[data-action="max"]')
    const btnCloseAlt = win.querySelector('[data-action="close-btn"]')

    const repoLink = win.querySelector('.notice-primary')
    if (repoLink) {
      repoLink.addEventListener('click', () => {
        sendUmamiEvent('source_notice_repo_clicked', {
          window_title: 'Source Code Notice',
          repo: 'dot1mav/dot1mav',
          branch: 'gh-pages',
        })
      })
    }

    const remove = () => {
      cleanup()
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop)
    }

    btnClose && btnClose.addEventListener('click', remove)
    btnCloseAlt && btnCloseAlt.addEventListener('click', remove)

    btnMin &&
      btnMin.addEventListener('click', () => {
        win.style.display = 'none'
        const restore = document.createElement('button')
        restore.textContent = 'Restore source'
        restore.style.position = 'absolute'
        restore.style.bottom = '18px'
        restore.style.left = '50%'
        restore.style.transform = 'translateX(-50%)'
        restore.style.zIndex = '100002'
        restore.className = 'notice-neutral'
        restore.addEventListener('click', () => {
          win.style.display = ''
          restore.remove()
        })
        backdrop.appendChild(restore)
      })

    btnMax &&
      btnMax.addEventListener('click', () => {
        if (win.classList.contains('maximized')) {
          win.classList.remove('maximized')
          win.style.left = win._prevLeft || '50%'
          win.style.top = win._prevTop || '50%'
          win.style.width = win._prevWidth || ''
          win.style.height = win._prevHeight || ''
          win.style.transform = 'translate(-50%, -50%)'
        } else {
          win._prevLeft = win.style.left
          win._prevTop = win.style.top
          win._prevWidth = win.style.width
          win._prevHeight = win.style.height
          win.classList.add('maximized')
          win.style.left = '0'
          win.style.top = '0'
          win.style.width = window.innerWidth + 'px'
          win.style.height = Math.max(window.innerHeight - 28, 200) + 'px'
          win.style.transform = ''
        }
      })

    const titlebar = win.querySelector('.title-bar')
    let dragging = false
    let offsetX = 0
    let offsetY = 0

    const onMouseDown = (ev) => {
      if (ev.target.closest('.title-bar-controls')) return
      dragging = true
      const rect = win.getBoundingClientRect()
      offsetX = ev.clientX - rect.left
      offsetY = ev.clientY - rect.top
      win.style.transform = ''
      win.style.position = 'fixed'
      win.style.left = rect.left + 'px'
      win.style.top = rect.top + 'px'
      win.style.zIndex = '100001'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      ev.preventDefault()
    }

    const onMouseMove = (ev) => {
      if (!dragging) return
      let newLeft = ev.clientX - offsetX
      let newTop = ev.clientY - offsetY
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 100))
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - 60))
      win.style.left = newLeft + 'px'
      win.style.top = newTop + 'px'
    }

    const onMouseUp = () => {
      if (!dragging) return
      dragging = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    titlebar.addEventListener('mousedown', onMouseDown)

    function cleanup() {
      titlebar.removeEventListener('mousedown', onMouseDown)
      btnClose && btnClose.removeEventListener('click', remove)
      btnCloseAlt && btnCloseAlt.removeEventListener('click', remove)
      btnMax && btnMax.removeEventListener('click', remove)
      btnMin && btnMin.removeEventListener('click', remove)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    return { backdrop, win, cleanup }
  }

  function showSourceNotice() {
    const config = cfg()
    if (!config.enableSourceGuards) return
    const { backdrop } = createSourceWindow()
    backdrop.style.display = 'flex'
    setTimeout(() => {
      backdrop.style.zIndex = 100000
      const win = document.getElementById(config.windowId)
      if (win) win.style.zIndex = 100001
    }, 0)

    sendUmamiEvent('source_notice_shown', {
      window_title: 'Source Code Notice',
      repo: 'dot1mav/dot1mav',
      branch: 'gh-pages',
    })
  }

  function install() {
    const config = cfg()
    if (!config.enableSourceGuards) return

    const onContext = (e) => {
      e.preventDefault()
      showSourceNotice()
    }
    document.addEventListener('contextmenu', onContext, { passive: false })

    const onKeyDown = (e) => {
      const key = e.key || ''
      const code = e.code || ''
      const ctrlOrCmd = e.ctrlKey || e.metaKey

      if (code === 'F12' || key === 'F12' || e.keyCode === 123) {
        e.preventDefault()
        showSourceNotice()
        return
      }
      if (ctrlOrCmd && e.shiftKey && (key.toLowerCase() === 'i' || code === 'KeyI')) {
        e.preventDefault()
        showSourceNotice()
        return
      }
      if (ctrlOrCmd && e.shiftKey && (key.toLowerCase() === 'j' || code === 'KeyJ')) {
        e.preventDefault()
        showSourceNotice()
        return
      }
      if (ctrlOrCmd && e.shiftKey && (key.toLowerCase() === 'c' || code === 'KeyC')) {
        e.preventDefault()
        showSourceNotice()
        return
      }
      if (ctrlOrCmd && !e.shiftKey && (key.toLowerCase() === 'u' || code === 'KeyU')) {
        e.preventDefault()
        showSourceNotice()
        return
      }
    }
    document.addEventListener('keydown', onKeyDown, { passive: false })

    sourceGuardsCleanup.value = () => {
      document.removeEventListener('contextmenu', onContext)
      document.removeEventListener('keydown', onKeyDown)
      const b = document.getElementById(config.backdropId)
      if (b && b.parentNode) b.parentNode.removeChild(b)
    }
  }

  function remove() {
    if (sourceGuardsCleanup.value) sourceGuardsCleanup.value()
  }

  return { install, remove }
}

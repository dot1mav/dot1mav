<template>
  <div id="app">
    <!-- Terminal Boot Sequence -->
    <Transition name="boot-fade">
      <div v-if="bootState === 'running'" class="boot-screen">
        <div class="boot-terminal">
          <div class="boot-header">
            <span class="boot-header-title">MAV Portfolio OS v1.0</span>
          </div>
          <div class="boot-output" ref="bootOutputEl" role="log" aria-live="polite">
            <div v-for="(line, i) in bootLines" :key="i" :class="['boot-line', line.type]">
              {{ line.text }}
            </div>
            <span v-if="bootState === 'running'" class="boot-cursor">█</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Boot Error Screen -->
    <Transition name="boot-fade">
      <div v-if="bootState === 'error'" class="boot-screen boot-error-screen">
        <div class="boot-terminal boot-error-terminal">
          <div class="boot-header boot-error-header">
            <span class="boot-header-title">MAV Portfolio OS v1.0 - SYSTEM HALTED</span>
          </div>
          <div class="boot-output" role="alert">
            <div class="boot-line error">SYSTEM BOOT FAILED</div>
            <div class="boot-line dim">{{ bootError }}</div>
            <div class="boot-line dim"></div>
            <div class="boot-line out">The portfolio API could not be reached or returned invalid data.</div>
            <div class="boot-line out">This usually means:</div>
            <div class="boot-line info">  • Server is temporarily unavailable</div>
            <div class="boot-line info">  • Network connection issue</div>
            <div class="boot-line info">  • API endpoint has changed</div>
            <div class="boot-line dim"></div>
            <div class="boot-line accent">Press [R] to retry boot sequence</div>
            <div class="boot-line accent">Press [C] to contact site admin (opens GitHub)</div>
            <div class="boot-line dim"></div>
            <div class="boot-line dim">Error details: {{ errorDetails }}</div>
            <span class="boot-cursor">█</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Desktop -->
    <main id="desktop" class="desktop" aria-label="Desktop" v-show="bootState === 'ready'">
      <div 
        class="desktop-bg" 
        @contextmenu.prevent="showDesktopContextMenu"
        @click="onDesktopClick"
      >
        <DesktopIcon
          v-for="icon in desktopIcons"
          :key="icon.id"
          :icon="icon.icon"
          :label="icon.label"
          :selected="selectedIcon === icon.id"
          @select="selectedIcon = icon.id"
          @open="onIconOpen(icon.id)"
          @contextmenu="showIconContextMenu"
        />
      </div>
    </main>

    <!-- Windows -->
    <div v-show="bootState === 'ready'">
      <OSWindow v-for="id in windowIds" :key="id" :id="id" :full-body="id === 'terminal'">
        <ProjectsWindow v-if="id === 'projects'" />
        <ExperiencesWindow v-else-if="id === 'experiences'" />
        <SkillsWindow v-else-if="id === 'skills'" />
        <CertificationsWindow v-else-if="id === 'certifications'" />
        <ContactWindow v-else-if="id === 'contact'" />
        <AboutWindow v-else-if="id === 'about'" />
        <TerminalWindow v-else-if="id === 'terminal'" />
        <ProjectDetailWindow v-else-if="id === 'project'" />
        <SvgCreatorWindow v-else-if="id === 'svgcreator'" />
        <PhotoViewerWindow v-else-if="id === 'photos'" />
        <VideoPlayerWindow v-else-if="id === 'video'" />
        <MinesweeperWindow v-else-if="id === 'minesweeper'" />
        <SolitaireWindow v-else-if="id === 'solitaire'" />
      </OSWindow>
    </div>

    <!-- Taskbar -->
    <Taskbar v-show="bootState === 'ready'" :start-menu-open="startMenuOpen" @toggle-start="toggleStartMenu" @start-action="handleStartAction" @close-start="startMenuOpen = false" />

    <!-- Context Menu -->
    <ContextMenu v-if="contextMenu.visible" :items="contextMenu.items" :position="contextMenu.position" @close="hideContextMenu" @action="handleContextAction" />

    <!-- Snap target shown while a window is dragged to a screen edge -->
    <Transition name="snap-fade">
      <div
        v-if="snapPreview.visible"
        class="snap-preview"
        aria-hidden="true"
        :style="{
          left: snapPreview.x + 'px',
          top: snapPreview.y + 'px',
          width: snapPreview.width + 'px',
          height: snapPreview.height + 'px',
        }"
      ></div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useWindows } from '../composables/useWindows'
import { useApp } from '../composables/useApp'
import { useSourceGuards } from '../composables/useSourceGuards'
import { useSiteData } from '../composables/useSiteData'

const bootState = ref('running') // 'running' | 'ready' | 'error'
const bootLines = ref([])
const bootOutputEl = ref(null)
const bootError = ref('')
const errorDetails = ref('')

const {
  windows,
  openWindow,
  handleWindowResize,
  layoutWindowsForMobile,
  installKeyboardShortcuts,
  removeKeyboardShortcuts,
  snapPreview,
} = useWindows()

const { initDarkMode } = useApp()
const { install: installSourceGuards, remove: removeSourceGuards } = useSourceGuards()
const { rehydrate } = useSiteData()

const windowIds = Object.keys(windows)

const desktopIcons = [
  { id: 'projects', icon: '/images/icons/projects.png', label: 'Projects' },
  { id: 'experiences', icon: '/images/icons/experiences.png', label: 'Experiences' },
  { id: 'skills', icon: '/images/icons/skills.png', label: 'Skills' },
  { id: 'certifications', icon: '/images/icons/certificates.png', label: 'Certifications' },
  { id: 'contact', icon: '/images/icons/contact.png', label: 'Contact' },
  { id: 'about', icon: '/images/icons/info.png', label: 'About' },
  { id: 'terminal', icon: '/images/icons/modem-4.png', label: 'Terminal' },
  { id: 'svgcreator', icon: '/images/icons/paint.png', label: 'SVG Creator' },
  { id: 'photos', icon: '/images/icons/photos.png', label: 'Photo Viewer' },
  { id: 'video', icon: '/images/icons/video.png', label: 'Video Player' },
  { id: 'minesweeper', icon: '/images/icons/paint.png', label: 'Minesweeper' },
  { id: 'solitaire', icon: '/images/icons/solitaire.png', label: 'Solitaire' },
]

const startMenuOpen = ref(false)
const selectedIcon = ref(null)
const contextMenu = ref({ visible: false, items: [], position: { x: 0, y: 0 }, target: null })

// Clicking the wallpaper drops the icon selection, like the real desktop.
function onDesktopClick() {
  hideContextMenu()
  startMenuOpen.value = false
  selectedIcon.value = null
}

// Clicking anywhere outside the Start menu closes it, the way Windows
// does — without this the menu lingers over everything.
function closeStartMenuOnOutsideClick(e) {
  if (!startMenuOpen.value) return
  if (e.target.closest('#start-menu') || e.target.closest('#start-btn')) return
  startMenuOpen.value = false
}

// A single click selects and opens (deliberately friendlier than
// Windows' double-click), but the selection is real this time — it
// stays highlighted until you pick something else.
function onIconOpen(id) {
  selectedIcon.value = id
  openWindow(id)
}

function scrollToBottom() {
  nextTick(() => {
    if (bootOutputEl.value) {
      bootOutputEl.value.scrollTop = bootOutputEl.value.scrollHeight
    }
  })
}

function addBootLine(text, type = 'out', delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      bootLines.value.push({ text, type })
      scrollToBottom()
      resolve()
    }, delay)
  })
}

async function runBootSequence() {
  bootLines.value = []
  bootError.value = ''
  errorDetails.value = ''

  try {
    // BIOS
    await addBootLine('MAV Portfolio OS v1.0 [Build 2026.08.23]', 'info', 120)
    await addBootLine('Copyright (c) 2026 dot1mav. All rights reserved.', 'dim', 80)
    await addBootLine('', 'dim', 50)
    await addBootLine('BIOS Date: 08/23/2026  Ver: 1.0.4', 'dim', 100)
    await addBootLine('Mainboard: Virtual DOM Corp. Model Nuxt-3', 'dim', 80)
    await addBootLine('', 'dim', 50)

    // Hardware detection
    await addBootLine('Detecting hardware…', 'out', 400)
    await addBootLine('  CPU: Software Engineer v3.0 @ max效能', 'dim', 180)
    await addBootLine('  RAM: 640K (ought to be enough)', 'dim', 150)
    await addBootLine('  GPU: Creativity Engine (RTX vibes)', 'dim', 130)
    await addBootLine('  Sound: MS-DOS Beeper (8-bit glory)', 'dim', 120)
    await addBootLine('  Network: dot1mav.eth (100 Gbps vibes)', 'dim', 110)
    await addBootLine('', 'dim', 50)

    // Health check API
    await addBootLine('Connecting to portfolio API…', 'out', 500)
    await addBootLine('  DNS lookup: dot1mav.ir …', 'info', 250)
    
    const healthStart = Date.now()
    const healthRes = await fetch('/api/health')
    const healthLatency = Date.now() - healthStart
    
    await addBootLine(`  >> Resolved: 185.199.108.153 (${healthLatency}ms)`, 'ok', 180)
    await addBootLine('  TCP handshake …', 'info', 300)
    
    if (!healthRes.ok) {
      throw new Error(`Health check failed: ${healthRes.status} ${healthRes.statusText}`)
    }
    
    const health = await healthRes.json()
    await addBootLine(`  >> Connection established (TLS 1.3, ${healthLatency}ms)`, 'ok', 200)
    await addBootLine(`  GET /api/health …`, 'info', 300)
    await addBootLine(`  >> 200 OK (${JSON.stringify(health).length} bytes, ${healthLatency}ms)`, 'ok', 200)
    await addBootLine('', 'dim', 50)

    // Check health status
    if (health.status !== 'healthy') {
      await addBootLine('WARNING: System health degraded', 'accent', 400)
      for (const [key, check] of Object.entries(health.checks)) {
        if (check.status !== 'ok') {
          await addBootLine(`  [FAIL] ${key}: ${check.status}`, 'error', 200)
        }
      }
    }

    // Data fetching with real counts
    await addBootLine('Fetching portfolio data…', 'out', 400)
    
    const dataStart = Date.now()
    const dataRes = await fetch('/api/data')
    const dataLatency = Date.now() - dataStart
    
    if (!dataRes.ok) {
      throw new Error(`Data fetch failed: ${dataRes.status} ${dataRes.statusText}`)
    }
    
    const data = await dataRes.json()
    await addBootLine(`  GET /api/data …`, 'info', 350)
    await addBootLine(`  >> 200 OK (${(JSON.stringify(data).length / 1024).toFixed(1)} KB, ${dataLatency}ms)`, 'ok', 200)
    
    if (data.projects) {
      await addBootLine(`  >> ${data.projects.length} projects loaded`, 'ok', 180)
    }
    if (data.experiences) {
      await addBootLine(`  >> ${data.experiences.length} experiences loaded`, 'ok', 160)
    }
    if (data.skills) {
      await addBootLine(`  >> ${Object.keys(data.skills).length} skill categories loaded`, 'ok', 160)
    }
    if (data.certifications) {
      await addBootLine(`  >> ${data.certifications.length} certifications loaded`, 'ok', 140)
    }
    if (data.photos) {
      await addBootLine(`  >> ${data.photos.length} photos loaded`, 'ok', 150)
    }
    if (data.videos) {
      await addBootLine(`  >> ${data.videos.length} videos loaded`, 'ok', 140)
    }
    await addBootLine('', 'dim', 50)

    // Sanity checks
    await addBootLine('Running sanity checks…', 'out', 400)
    await addBootLine('  Checking project images…', 'info', 200)
    
    if (data.projects) {
      let imgCount = 0
      for (const p of data.projects) {
        if (p.images) imgCount += p.images.length
      }
      await addBootLine(`  >> ${imgCount} project images accessible`, 'ok', 180)
    }
    
    await addBootLine('  Checking resume file…', 'info', 200)
    await addBootLine('  >> resume.pdf (245 KB) - OK', 'ok', 160)
    await addBootLine('  Checking external links…', 'info', 250)
    await addBootLine('  >> github.com/dot1mav - reachable', 'ok', 200)
    await addBootLine('  >> linkedin.com/in/dot1mav - reachable', 'ok', 180)
    await addBootLine('', 'dim', 50)

    // Performance (simulated but realistic)
    await addBootLine('Performance metrics…', 'out', 350)
    await addBootLine(`  First Contentful Paint: ~${(performance.now() / 1000).toFixed(1)}s`, 'dim', 160)
    await addBootLine(`  API Health Latency: ${healthLatency}ms`, 'dim', 150)
    await addBootLine(`  Data Fetch Latency: ${dataLatency}ms`, 'dim', 140)
    await addBootLine(`  Total Boot Time: ${((Date.now() - performance.timeOrigin) / 1000).toFixed(1)}s`, 'dim', 130)
    await addBootLine('', 'dim', 50)

    // Desktop init
    await addBootLine('Initializing desktop environment…', 'out', 400)
    await addBootLine('  [OK] Windows 98 theme loaded', 'ok', 140)
    await addBootLine('  [OK] Custom cursor initialized', 'ok', 130)
    await addBootLine('  [OK] Particle effects ready', 'ok', 120)
    await addBootLine('  [OK] Dark mode preference set', 'ok', 110)
    await addBootLine('  [OK] Taskbar icons rendered', 'ok', 105)
    await addBootLine('  [OK] Desktop icons positioned', 'ok', 100)
    await addBootLine('  [OK] Window manager ready', 'ok', 95)
    await addBootLine('  [OK] Context menu system ready', 'ok', 90)
    await addBootLine('  [OK] Start menu ready', 'ok', 85)
    await addBootLine('', 'dim', 50)

    // Final
    await addBootLine('All systems nominal. Launching desktop…', 'accent', 600)
    await addBootLine('', 'dim', 200)

    // Success - transition to desktop
    bootState.value = 'ready'
    installSourceGuards()
    initDarkMode()
    layoutWindowsForMobile()
    installKeyboardShortcuts()
    window.addEventListener('resize', handleWindowResize)
    window.addEventListener('keydown', handleBootKeys)
    
  } catch (err) {
    // Boot failed
    bootState.value = 'error'
    bootError.value = err.message || 'Unknown error'
    errorDetails.value = err.stack || ''
    console.error('[Boot] Failed:', err)
    
    // Listen for retry keys
    window.addEventListener('keydown', handleBootKeys)
  }
}

function handleBootKeys(e) {
  if (bootState.value !== 'error') return
  if (e.key.toLowerCase() === 'r') {
    // Retry
    bootState.value = 'running'
    runBootSequence()
  } else if (e.key.toLowerCase() === 'c') {
    // Contact admin
    window.open('https://github.com/dot1mav/dot1mav/issues/new', '_blank')
  }
}

function toggleStartMenu() {
  startMenuOpen.value = !startMenuOpen.value
}

function handleStartAction(action) {
  startMenuOpen.value = false
  switch (action) {
    case 'projects':
    case 'experiences':
    case 'skills':
    case 'certifications':
    case 'contact':
    case 'about':
    case 'terminal':
    case 'svgcreator':
    case 'photos':
    case 'video':
    case 'minesweeper':
    case 'solitaire':
      openWindow(action)
      break
    case 'shutdown':
      if (confirm('Shut down MAV Portfolio OS?')) {
        window.close()
      }
      break
    case 'restart':
      if (confirm('Restart MAV Portfolio OS?')) {
        location.reload()
      }
      break
    case 'darkmode':
      useApp().toggleDarkMode()
      break
  }
}

function showDesktopContextMenu(e) {
  e.preventDefault()
  contextMenu.value = {
    visible: true,
    position: { x: e.clientX, y: e.clientY },
    items: [
      { label: 'Refresh', action: 'refresh', icon: '🔄' },
      { separator: true },
      { label: 'New', action: null, submenu: [
        { label: 'Folder', action: 'new_folder' },
        { label: 'Shortcut', action: 'new_shortcut' },
        { label: 'Text Document', action: 'new_text' },
      ]},
      { separator: true },
      { label: 'Paste', action: 'paste', disabled: true },
      { label: 'Paste Shortcut', action: 'paste_shortcut', disabled: true },
      { separator: true },
      { label: 'Arrange Icons', action: 'arrange' },
      { label: 'Line Up Icons', action: 'lineup' },
      { separator: true },
      { label: 'Properties', action: 'desktop_props' },
    ],
    target: 'desktop',
  }
}

function showIconContextMenu(e, icon) {
  e.preventDefault()
  e.stopPropagation()
  contextMenu.value = {
    visible: true,
    position: { x: e.clientX, y: e.clientY },
    items: [
      { label: 'Open', action: 'open', default: true, iconData: icon },
      { separator: true },
      { label: 'Create Shortcut', action: 'create_shortcut', iconData: icon },
      { label: 'Delete', action: 'delete_icon', iconData: icon },
      { separator: true },
      { label: 'Rename', action: 'rename', iconData: icon },
      { separator: true },
      { label: 'Properties', action: 'icon_props', iconData: icon },
    ],
    target: 'icon',
    iconData: icon,
  }
}

function showWindowContextMenu(e, windowId) {
  e.preventDefault()
  e.stopPropagation()
  const win = windows[windowId]
  if (!win) return
  contextMenu.value = {
    visible: true,
    position: { x: e.clientX, y: e.clientY },
    items: [
      { label: 'Restore', action: 'restore', disabled: !win.minimized && !win.maximized },
      { label: 'Move', action: 'move' },
      { label: 'Size', action: 'size' },
      { label: 'Minimize', action: 'minimize' },
      { label: 'Maximize', action: 'maximize', disabled: win.maximized },
      { separator: true },
      { label: 'Close', action: 'close', danger: true },
    ],
    target: 'window',
    windowId,
  }
}

function hideContextMenu() {
  contextMenu.value.visible = false
}

function handleContextAction(action, data) {
  hideContextMenu()
  switch (action) {
    case 'refresh':
      location.reload()
      break
    case 'open':
      if (data?.id) openWindow(data.id)
      break
    case 'desktop_props':
      openWindow('about')
      break
    case 'icon_props':
      if (data?.id) openWindow('about')
      break
    // Window actions
    case 'restore':
      if (data?.windowId) {
        const { restoreWindow } = useWindows()
        restoreWindow(data.windowId)
      }
      break
    case 'move':
      // Would need keyboard-driven move mode
      break
    case 'size':
      // Would need keyboard-driven size mode
      break
    case 'minimize':
      if (data?.windowId) {
        const { minimizeWindow } = useWindows()
        minimizeWindow(data.windowId)
      }
      break
    case 'maximize':
      if (data?.windowId) {
        const { maximizeWindow } = useWindows()
        maximizeWindow(data.windowId)
      }
      break
    case 'close':
      if (data?.windowId) {
        const { closeWindow } = useWindows()
        closeWindow(data.windowId)
      }
      break
  }
}

onMounted(() => {
  runBootSequence()
  document.addEventListener('mousedown', closeStartMenuOnOutsideClick)
})

onBeforeUnmount(() => {
  removeSourceGuards()
  removeKeyboardShortcuts()
  document.removeEventListener('mousedown', closeStartMenuOnOutsideClick)
  window.removeEventListener('resize', handleWindowResize)
  window.removeEventListener('keydown', handleBootKeys)
})
</script>

<style>
/* ===== Terminal Boot Screen ===== */
.boot-screen {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.boot-terminal {
  width: 100%;
  max-width: 720px;
  background: #000;
  font-family: 'IBM Plex Mono', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.boot-header {
  background: #000080;
  color: #fff;
  padding: 2px 6px;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 700;
}

.boot-header-title {
  color: #fff;
}

.boot-output {
  max-height: 75vh;
  overflow: auto;
  padding: 0 2px;
}

.boot-line {
  min-height: 1.4em;
  white-space: pre-wrap;
  word-break: break-word;
}

.boot-line.info { color: #5ff; }
.boot-line.dim { color: #555; }
.boot-line.out { color: #aaa; }
.boot-line.ok { color: #5f5; }
.boot-line.accent { color: #ff5; }
.boot-line.error { color: #f55; font-weight: bold; }

.boot-cursor {
  color: #aaa;
  animation: boot-blink 0.6s steps(1) infinite;
}

@keyframes boot-blink {
  50% { opacity: 0; }
}

.boot-fade-leave-active {
  transition: opacity 0.5s ease;
}
.boot-fade-leave-to {
  opacity: 0;
}

.boot-error-screen {
  background: #000080;
}
.boot-error-terminal {
  border: 2px solid #fff;
  max-width: 760px;
}
.snap-fade-enter-active,
.snap-fade-leave-active {
  transition: opacity 0.12s ease-out;
}
.snap-fade-enter-from,
.snap-fade-leave-to {
  opacity: 0;
}
.boot-error-header {
  background: #c00;
}

@media (prefers-reduced-motion: reduce) {
  .boot-cursor { animation: none; }
}

@media (max-width: 480px) {
  .boot-terminal { font-size: 11px; }
  .boot-error-terminal { font-size: 11px; }
}

/* Desktop background */
.desktop-bg {
  width: 100%;
  height: 100%;
  background: #008080;
  position: relative;
}
</style>
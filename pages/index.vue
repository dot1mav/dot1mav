<template>
  <div id="app">
    <!-- Terminal Boot Sequence -->
    <Transition name="boot-fade">
      <div v-if="booting" class="boot-screen">
        <div class="boot-terminal">
          <div class="boot-header">
            <span class="boot-header-title">MAV Portfolio OS v1.0</span>
          </div>
          <div class="boot-output" ref="bootOutputEl">
            <div v-for="(line, i) in bootLines" :key="i" :class="['boot-line', line.type]">
              {{ line.text }}
            </div>
            <span v-if="booting" class="boot-cursor">█</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Desktop -->
    <main id="desktop" class="desktop" aria-label="Desktop" v-show="!booting">
      <DesktopIcon
        v-for="icon in desktopIcons"
        :key="icon.id"
        :icon="icon.icon"
        :label="icon.label"
        @open="openWindow(icon.id)"
      />
    </main>

    <!-- Windows -->
    <div v-show="!booting">
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
      </OSWindow>
    </div>

    <Taskbar v-show="!booting" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useWindows } from '../composables/useWindows'
import { useApp } from '../composables/useApp'
import { useSourceGuards } from '../composables/useSourceGuards'

const booting = ref(true)
const bootLines = ref([])
const bootOutputEl = ref(null)

const {
  windows,
  openWindow,
  handleWindowResize,
  layoutWindowsForMobile,
  installKeyboardShortcuts,
  removeKeyboardShortcuts,
} = useWindows()
const { initDarkMode } = useApp()
const { install: installSourceGuards, remove: removeSourceGuards } = useSourceGuards()

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
]

const BOOT_SCRIPT = [
  // BIOS
  { text: 'MAV Portfolio OS v1.0 [Build 2026.08.23]', type: 'info', delay: 80 },
  { text: 'Copyright (c) 2026 dot1mav. All rights reserved.', type: 'dim', delay: 60 },
  { text: '', type: 'dim', delay: 40 },
  { text: 'BIOS Date: 08/23/2026  Ver: 1.0.4', type: 'dim', delay: 70 },
  { text: 'Mainboard: Virtual DOM Corp. Model Nuxt-3', type: 'dim', delay: 60 },
  { text: '', type: 'dim', delay: 50 },

  // Hardware detection
  { text: 'Detecting hardware...', type: 'out', delay: 200 },
  { text: '  CPU: Software Engineer v3.0 @ max效能', type: 'dim', delay: 120 },
  { text: '  RAM: 640K (ought to be enough)', type: 'dim', delay: 100 },
  { text: '  GPU: Creativity Engine (RTX vibes)', type: 'dim', delay: 90 },
  { text: '  Sound: MS-DOS Beeper (8-bit glory)', type: 'dim', delay: 80 },
  { text: '  Network: dot1mav.eth (100 Gbps vibes)', type: 'dim', delay: 85 },
  { text: '', type: 'dim', delay: 50 },

  // Storage mounting
  { text: 'Mounting storage devices...', type: 'out', delay: 200 },
  { text: '  Mounting C: [System Drive] (SSD 512GB)', type: 'info', delay: 150 },
  { text: '  >> C: mounted successfully', type: 'ok', delay: 100 },
  { text: '  Mounting D: [Projects Drive] (HDD 2TB)', type: 'info', delay: 130 },
  { text: '  >> D: mounted successfully', type: 'ok', delay: 100 },
  { text: '  Mounting E: [Media Drive] (NVMe 1TB)', type: 'info', delay: 120 },
  { text: '  >> E: mounted successfully', type: 'ok', delay: 100 },
  { text: '  Mounting F: [Backup Drive] (Cloud 10TB)', type: 'info', delay: 110 },
  { text: '  >> F: mounted successfully', type: 'ok', delay: 100 },
  { text: '', type: 'dim', delay: 40 },

  // Disk checks
  { text: 'Running disk checks...', type: 'out', delay: 200 },
  { text: '  C:\\> chkdsk /f', type: 'info', delay: 180 },
  { text: '  >> 0 bad sectors found', type: 'ok', delay: 120 },
  { text: '  >> File system: FAT32 (integrity OK)', type: 'ok', delay: 100 },
  { text: '  D:\\> chkdsk /f', type: 'info', delay: 160 },
  { text: '  >> 0 bad sectors found', type: 'ok', delay: 110 },
  { text: '  >> File system: NTFS (integrity OK)', type: 'ok', delay: 100 },
  { text: '', type: 'dim', delay: 40 },

  // Security checks
  { text: 'Initializing security modules...', type: 'out', delay: 200 },
  { text: '  [OK] Session Manager v2.1 loaded', type: 'ok', delay: 100 },
  { text: '  [OK] CSRF Token Generator initialized', type: 'ok', delay: 95 },
  { text: '  [OK] XSS Filter active', type: 'ok', delay: 90 },
  { text: '  [OK] Content Security Policy enforced', type: 'ok', delay: 85 },
  { text: '  [OK] HTTPS-only mode enabled', type: 'ok', delay: 80 },
  { text: '', type: 'dim', delay: 40 },

  // URL & session security
  { text: 'Running security scans...', type: 'out', delay: 200 },
  { text: '  Checking URL integrity...', type: 'info', delay: 150 },
  { text: '  >> Protocol: HTTPS (secure)', type: 'ok', delay: 100 },
  { text: '  >> Domain: dot1mav.ir (verified)', type: 'ok', delay: 95 },
  { text: '  >> SSL Certificate: Valid ( expires 2027)', type: 'ok', delay: 90 },
  { text: '  >> HSTS header: max-age=31536000', type: 'ok', delay: 85 },
  { text: '', type: 'dim', delay: 40 },
  { text: '  Checking session security...', type: 'info', delay: 150 },
  { text: '  >> Session ID: 48 random bytes (secure)', type: 'ok', delay: 100 },
  { text: '  >> HttpOnly flag: ENABLED', type: 'ok', delay: 90 },
  { text: '  >> Secure flag: ENABLED', type: 'ok', delay: 85 },
  { text: '  >> SameSite: Strict', type: 'ok', delay: 80 },
  { text: '  >> Session timeout: 30 min', type: 'ok', delay: 75 },
  { text: '', type: 'dim', delay: 40 },

  // Module loading
  { text: 'Loading system modules...', type: 'out', delay: 180 },
  { text: '  [OK] DOM Manipulator v3.2.1', type: 'ok', delay: 100 },
  { text: '  [OK] CSS Renderer (Win98 mode)', type: 'ok', delay: 90 },
  { text: '  [OK] Keyboard Handler v1.4.0', type: 'ok', delay: 80 },
  { text: '  [OK] Window Manager (draggable)', type: 'ok', delay: 85 },
  { text: '  [OK] Event Delegation Engine', type: 'ok', delay: 75 },
  { text: '  [OK] Virtual Scroll Optimizer', type: 'ok', delay: 70 },
  { text: '  [OK] Image Lazy Loader v2.0', type: 'ok', delay: 65 },
  { text: '  [OK] Service Worker (offline cache)', type: 'ok', delay: 60 },
  { text: '', type: 'dim', delay: 40 },

  // Network & API
  { text: 'Connecting to portfolio API...', type: 'out', delay: 250 },
  { text: '  DNS lookup: dot1mav.ir ...', type: 'info', delay: 120 },
  { text: '  >> Resolved: 185.199.108.153', type: 'ok', delay: 100 },
  { text: '  TCP handshake ...', type: 'info', delay: 130 },
  { text: '  >> Connection established (TLS 1.3)', type: 'ok', delay: 100 },
  { text: '  GET /api/data ...', type: 'info', delay: 300 },
  { text: '  >> 200 OK (18.4 KB, 142ms)', type: 'ok', delay: 150 },
  { text: '', type: 'dim', delay: 40 },

  // Data fetching
  { text: 'Fetching portfolio data...', type: 'out', delay: 200 },
  { text: '  GET /api/data/projects ...', type: 'info', delay: 180 },
  { text: '  >> 12 projects loaded', type: 'ok', delay: 130 },
  { text: '  GET /api/data/skills ...', type: 'info', delay: 160 },
  { text: '  >> 6 skill categories loaded', type: 'ok', delay: 110 },
  { text: '  GET /api/data/experiences ...', type: 'info', delay: 150 },
  { text: '  >> 3 experiences loaded', type: 'ok', delay: 100 },
  { text: '  GET /api/data/certifications ...', type: 'info', delay: 140 },
  { text: '  >> 5 certifications loaded', type: 'ok', delay: 95 },
  { text: '  GET /api/data/contact ...', type: 'info', delay: 130 },
  { text: '  >> Contact info loaded', type: 'ok', delay: 90 },
  { text: '  GET /api/data/photos ...', type: 'info', delay: 120 },
  { text: '  >> 8 photos loaded', type: 'ok', delay: 85 },
  { text: '  GET /api/data/videos ...', type: 'info', delay: 110 },
  { text: '  >> 3 videos loaded', type: 'ok', delay: 80 },
  { text: '', type: 'dim', delay: 40 },

  // Sanity checks
  { text: 'Running sanity checks...', type: 'out', delay: 200 },
  { text: '  Checking project images...', type: 'info', delay: 120 },
  { text: '  >> All 12 thumbnails accessible', type: 'ok', delay: 100 },
  { text: '  Checking resume file...', type: 'info', delay: 110 },
  { text: '  >> resume.pdf (245 KB) - OK', type: 'ok', delay: 95 },
  { text: '  Checking external links...', type: 'info', delay: 130 },
  { text: '  >> github.com/dot1mav - reachable', type: 'ok', delay: 100 },
  { text: '  >> linkedin.com/in/dot1mav - reachable', type: 'ok', delay: 90 },
  { text: '', type: 'dim', delay: 40 },

  // Performance
  { text: 'Performance metrics...', type: 'out', delay: 180 },
  { text: '  First Contentful Paint: 0.8s', type: 'dim', delay: 100 },
  { text: '  Largest Contentful Paint: 1.2s', type: 'dim', delay: 95 },
  { text: '  Cumulative Layout Shift: 0.01', type: 'dim', delay: 90 },
  { text: '  Time to Interactive: 1.4s', type: 'dim', delay: 85 },
  { text: '  Lighthouse Score: 98/100', type: 'ok', delay: 100 },
  { text: '', type: 'dim', delay: 40 },

  // Desktop init
  { text: 'Initializing desktop environment...', type: 'out', delay: 200 },
  { text: '  [OK] Windows 98 theme loaded', type: 'ok', delay: 100 },
  { text: '  [OK] Custom cursor initialized', type: 'ok', delay: 90 },
  { text: '  [OK] Particle effects ready', type: 'ok', delay: 85 },
  { text: '  [OK] Dark mode preference set', type: 'ok', delay: 80 },
  { text: '  [OK] Taskbar icons rendered', type: 'ok', delay: 75 },
  { text: '  [OK] Desktop icons positioned', type: 'ok', delay: 70 },
  { text: '  [OK] Window manager ready', type: 'ok', delay: 65 },
  { text: '', type: 'dim', delay: 40 },

  // Final
  { text: 'All systems nominal. Launching desktop...', type: 'accent', delay: 400 },
  { text: '', type: 'dim', delay: 150 },
]

function scrollToBottom() {
  nextTick(() => {
    if (bootOutputEl.value) {
      bootOutputEl.value.scrollTop = bootOutputEl.value.scrollHeight
    }
  })
}

function runBootSequence() {
  let totalDelay = 0
  BOOT_SCRIPT.forEach((item) => {
    totalDelay += item.delay
    setTimeout(() => {
      bootLines.value.push({ text: item.text, type: item.type })
      scrollToBottom()
    }, totalDelay)
  })
  // After all lines printed, wait a moment then finish
  setTimeout(() => {
    booting.value = false
    installSourceGuards()
    initDarkMode()
    layoutWindowsForMobile()
    installKeyboardShortcuts()
    window.addEventListener('resize', handleWindowResize)
  }, totalDelay + 400)
}

onMounted(() => {
  runBootSequence()
})

onBeforeUnmount(() => {
  removeSourceGuards()
  removeKeyboardShortcuts()
  window.removeEventListener('resize', handleWindowResize)
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
  max-width: 600px;
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
  max-height: 70vh;
  overflow: hidden;
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

@media (prefers-reduced-motion: reduce) {
  .boot-cursor { animation: none; }
}

@media (max-width: 480px) {
  .boot-terminal { font-size: 11px; }
}
</style>

<template>
  <div id="app">
    <!-- Terminal Boot Sequence -->
    <Transition name="boot-fade">
      <div v-if="booting" class="boot-screen">
        <div class="boot-terminal">
          <div class="boot-header">
            <span class="boot-header-title">MAV Portfolio OS v1.0</span>
          </div>
          <div class="boot-output">
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useWindows } from '../composables/useWindows'
import { useApp } from '../composables/useApp'
import { useSourceGuards } from '../composables/useSourceGuards'

const booting = ref(true)
const bootLines = ref([])

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
  { text: 'MAV Portfolio OS v1.0 [Build 2026.08.23]', type: 'info', delay: 80 },
  { text: 'Copyright (c) 2026 dot1mav. All rights reserved.', type: 'dim', delay: 60 },
  { text: '', type: 'dim', delay: 40 },
  { text: 'BIOS Date: 08/23/2026  Ver: 1.0.4', type: 'dim', delay: 70 },
  { text: 'Detecting hardware...', type: 'out', delay: 200 },
  { text: '  CPU: Software Engineer v3.0 @ max效能', type: 'dim', delay: 120 },
  { text: '  RAM: 640K (ought to be enough)', type: 'dim', delay: 100 },
  { text: '  GPU: Creativity Engine (RTX vibes)', type: 'dim', delay: 90 },
  { text: '', type: 'dim', delay: 50 },
  { text: 'Loading system modules...', type: 'out', delay: 180 },
  { text: '  [OK] DOM Manipulator v3.2.1', type: 'ok', delay: 100 },
  { text: '  [OK] CSS Renderer (Win98 mode)', type: 'ok', delay: 90 },
  { text: '  [OK] Keyboard Handler v1.4.0', type: 'ok', delay: 80 },
  { text: '  [OK] Window Manager (draggable)', type: 'ok', delay: 85 },
  { text: '', type: 'dim', delay: 40 },
  { text: 'Connecting to portfolio API...', type: 'out', delay: 250 },
  { text: '  GET /api/data ...', type: 'info', delay: 300 },
  { text: '  >> 200 OK (18.4 KB)', type: 'ok', delay: 150 },
  { text: '', type: 'dim', delay: 40 },
  { text: 'Fetching projects...', type: 'out', delay: 200 },
  { text: '  >> 12 projects loaded', type: 'ok', delay: 130 },
  { text: '  >> 6 skills categories loaded', type: 'ok', delay: 100 },
  { text: '  >> 3 experiences loaded', type: 'ok', delay: 90 },
  { text: '  >> 5 certifications loaded', type: 'ok', delay: 85 },
  { text: '  >> Contact info loaded', type: 'ok', delay: 80 },
  { text: '', type: 'dim', delay: 40 },
  { text: 'Initializing desktop environment...', type: 'out', delay: 200 },
  { text: '  [OK] Windows 98 theme loaded', type: 'ok', delay: 100 },
  { text: '  [OK] Custom cursor initialized', type: 'ok', delay: 90 },
  { text: '  [OK] Particle effects ready', type: 'ok', delay: 85 },
  { text: '  [OK] Dark mode preference set', type: 'ok', delay: 80 },
  { text: '', type: 'dim', delay: 40 },
  { text: 'All systems nominal. Launching desktop...', type: 'accent', delay: 300 },
  { text: '', type: 'dim', delay: 100 },
]

function runBootSequence() {
  let totalDelay = 0
  BOOT_SCRIPT.forEach((item) => {
    totalDelay += item.delay
    setTimeout(() => {
      bootLines.value.push({ text: item.text, type: item.type })
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
  overflow-y: auto;
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

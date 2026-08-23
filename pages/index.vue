<template>
  <div id="app">
    <!-- Win98 Boot Screen -->
    <Transition name="boot-fade">
      <div v-if="booting" class="boot-screen">
        <div class="boot-content">
          <div class="boot-logo">
            <div class="boot-windows-logo">
              <div class="win-flag">
                <span class="win-r"></span><span class="win-g"></span>
                <span class="win-b"></span><span class="win-y"></span>
              </div>
            </div>
            <div class="boot-title">dot1mav Portfolio OS</div>
          </div>
          <div class="boot-progress">
            <div class="boot-progress-bar"></div>
          </div>
          <div class="boot-text">dot1mav Portfolio OS is loading...</div>
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

// Order here is the order they appear on the desktop, left to right.
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

onMounted(() => {
  // Win98 boot sequence
  setTimeout(() => {
    booting.value = false
    installSourceGuards()
    initDarkMode()
    layoutWindowsForMobile()
    installKeyboardShortcuts()
    window.addEventListener('resize', handleWindowResize)
  }, 2200)
})

onBeforeUnmount(() => {
  removeSourceGuards()
  removeKeyboardShortcuts()
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<style>
/* ===== Win98 Boot Screen ===== */
.boot-screen {
  position: fixed;
  inset: 0;
  background: #000080;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.boot-content {
  text-align: center;
  color: #fff;
}

.boot-logo {
  margin-bottom: 40px;
}

.boot-windows-logo {
  margin-bottom: 16px;
}

.win-flag {
  display: inline-grid;
  grid-template-columns: 18px 18px;
  grid-template-rows: 18px 18px;
  gap: 3px;
  transform: skewX(-8deg);
}

.win-r { background: #ff0000; border-radius: 2px; }
.win-g { background: #00aa00; border-radius: 2px; }
.win-b { background: #0000ff; border-radius: 2px; }
.win-y { background: #ffcc00; border-radius: 2px; }

.boot-title {
  font-family: 'Times New Roman', Times, serif;
  font-size: 28px;
  font-weight: 400;
  letter-spacing: 1px;
}

.boot-progress {
  width: 260px;
  height: 18px;
  margin: 0 auto 12px;
  background: #000;
  border: 2px solid #808080;
  padding: 2px;
}

.boot-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #000080, #0000cc, #000080);
  animation: boot-load 2s ease-in-out;
  border-radius: 1px;
}

@keyframes boot-load {
  0% { width: 0%; }
  20% { width: 15%; }
  40% { width: 35%; }
  60% { width: 60%; }
  80% { width: 85%; }
  100% { width: 100%; }
}

.boot-text {
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 12px;
  color: #c0c0c0;
}

.boot-fade-leave-active {
  transition: opacity 0.4s ease;
}
.boot-fade-leave-to {
  opacity: 0;
}
</style>

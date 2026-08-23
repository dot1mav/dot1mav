<template>
  <div id="app">
    <main id="desktop" class="desktop" aria-label="Desktop">
      <DesktopIcon
        v-for="icon in desktopIcons"
        :key="icon.id"
        :icon="icon.icon"
        :label="icon.label"
        @open="openWindow(icon.id)"
      />
    </main>

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

    <Taskbar />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useWindows } from '../composables/useWindows'
import { useApp } from '../composables/useApp'
import { useSourceGuards } from '../composables/useSourceGuards'

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
  installSourceGuards()
  initDarkMode()
  layoutWindowsForMobile()
  installKeyboardShortcuts()

  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  removeSourceGuards()
  removeKeyboardShortcuts()
  window.removeEventListener('resize', handleWindowResize)
})
</script>

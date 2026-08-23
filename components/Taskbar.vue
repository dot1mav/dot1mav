<template>
  <div id="taskbar" role="navigation" aria-label="Taskbar">
    <div id="taskbar-buttons">
      <button v-for="(window, id) in openTaskbarWindows" :key="id" @click="restoreWindow(id)">
        {{ window.title }}
      </button>
    </div>
    <div id="taskbar-copyright">&copy; {{ currentYear }} Mohammad Amin Vakili</div>
    <div id="taskbar-clock">{{ currentTime }}</div>
    <button id="dark-mode-toggle" @click="toggleDarkMode" :aria-label="isDarkMode ? 'Light Mode' : 'Dark Mode'">
      {{ isDarkMode ? '☀️' : '🌙' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useWindows } from '../composables/useWindows'
import { useApp } from '../composables/useApp'

const { openTaskbarWindows, restoreWindow } = useWindows()
const { isDarkMode, toggleDarkMode } = useApp()

const currentTime = ref('')
const currentYear = new Date().getFullYear()
let clockInterval = null

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })
}

onMounted(() => {
  updateClock()
  clockInterval = setInterval(updateClock, 60000)
})

onBeforeUnmount(() => {
  if (clockInterval) clearInterval(clockInterval)
})
</script>

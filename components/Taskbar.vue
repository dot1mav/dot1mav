<template>
  <div id="taskbar" role="navigation" aria-label="Taskbar">
    <button id="start-btn" @click="toggleStartMenu" aria-label="Start Menu">
      <span class="start-flag">
        <span class="sf-r"></span><span class="sf-g"></span>
        <span class="sf-b"></span><span class="sf-y"></span>
      </span>
      <span class="start-text">Start</span>
    </button>

    <!-- Start Menu -->
    <Transition name="start-menu">
      <div v-if="showStartMenu" class="start-menu" @click.stop>
        <div class="start-menu-sidebar">
          <span class="start-sidebar-text">Windows<sup style="font-size:6px">®</sup> 98</span>
        </div>
        <div class="start-menu-items">
          <div class="start-menu-item" @click="openFromMenu('projects')">
            <span class="smi-icon">📁</span>
            <span class="smi-label">Projects</span>
          </div>
          <div class="start-menu-item" @click="openFromMenu('experiences')">
            <span class="smi-icon">💼</span>
            <span class="smi-label">Experiences</span>
          </div>
          <div class="start-menu-item" @click="openFromMenu('skills')">
            <span class="smi-icon">🔧</span>
            <span class="smi-label">Skills</span>
          </div>
          <div class="start-menu-item" @click="openFromMenu('contact')">
            <span class="smi-icon">📧</span>
            <span class="smi-label">Contact</span>
          </div>
          <div class="start-menu-item" @click="openFromMenu('about')">
            <span class="smi-icon">ℹ️</span>
            <span class="smi-label">About Me</span>
          </div>
          <div class="start-menu-sep"></div>
          <div class="start-menu-item" @click="openFromMenu('terminal')">
            <span class="smi-icon">💻</span>
            <span class="smi-label">MS-DOS Prompt</span>
          </div>
          <div class="start-menu-item" @click="openFromMenu('photos')">
            <span class="smi-icon">🖼️</span>
            <span class="smi-label">Photo Viewer</span>
          </div>
          <div class="start-menu-item" @click="openFromMenu('video')">
            <span class="smi-icon">🎬</span>
            <span class="smi-label">Video Player</span>
          </div>
        </div>
      </div>
    </Transition>

    <div id="taskbar-sep"></div>

    <div id="taskbar-buttons">
      <button v-for="(win, id) in openTaskbarWindows" :key="id" @click="restoreWindow(id)"
        :class="{ active: !win.minimized && win.z === topZ }">
        {{ win.title }}
      </button>
    </div>
    <div id="taskbar-copyright">&copy; {{ currentYear }} dot1mav</div>
    <div id="taskbar-clock">{{ currentTime }}</div>
    <button id="dark-mode-toggle" @click="toggleDarkMode" :aria-label="isDarkMode ? 'Light Mode' : 'Dark Mode'">
      {{ isDarkMode ? '☀️' : '🌙' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useWindows } from '../composables/useWindows'
import { useApp } from '../composables/useApp'

const { windows, openTaskbarWindows, restoreWindow } = useWindows()
const { isDarkMode, toggleDarkMode } = useApp()

const showStartMenu = ref(false)
const currentTime = ref('')
const currentYear = new Date().getFullYear()
let clockInterval = null

const topZ = computed(() => {
  let top = -1
  for (const win of Object.values(windows)) {
    if (win.open && !win.minimized && win.z > top) top = win.z
  }
  return top
})

function toggleStartMenu() {
  showStartMenu.value = !showStartMenu.value
}

function openFromMenu(id) {
  showStartMenu.value = false
  restoreWindow(id)
}

function closeStartMenu() {
  showStartMenu.value = false
}

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
  document.addEventListener('click', closeStartMenu)
})

onBeforeUnmount(() => {
  if (clockInterval) clearInterval(clockInterval)
  document.removeEventListener('click', closeStartMenu)
})
</script>

<style scoped>
/* Start Button */
#start-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  height: 24px;
  background: var(--button-face);
  border-top: 2px solid var(--border-light);
  border-left: 2px solid var(--border-light);
  border-right: 2px solid var(--border-darkest);
  border-bottom: 2px solid var(--border-darkest);
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-color);
  cursor: pointer;
  flex-shrink: 0;
}

#start-btn:active {
  border-top: 2px solid var(--border-darkest);
  border-left: 2px solid var(--border-darkest);
  border-right: 2px solid var(--border-light);
  border-bottom: 2px solid var(--border-light);
  padding: 3px 7px 1px 9px;
}

.start-flag {
  display: inline-grid;
  grid-template-columns: 6px 6px;
  grid-template-rows: 6px 6px;
  gap: 1px;
  transform: skewX(-6deg);
}

.sf-r { background: #ff0000; }
.sf-g { background: #00aa00; }
.sf-b { background: #0000ff; }
.sf-y { background: #ffcc00; }

.start-text {
  font-style: italic;
}

/* Taskbar separator */
#taskbar-sep {
  width: 2px;
  height: 22px;
  background: #808080;
  border-left: 1px solid #fff;
  flex-shrink: 0;
  margin: 0 2px;
}

/* Active taskbar button */
#taskbar-buttons button.active {
  border-top: 2px solid var(--border-darkest);
  border-left: 2px solid var(--border-darkest);
  border-right: 2px solid var(--border-light);
  border-bottom: 2px solid var(--border-light);
  background: #e0e0e0;
  font-weight: 700;
}

/* ===== Start Menu ===== */
.start-menu {
  position: fixed;
  bottom: 28px;
  left: 2px;
  display: flex;
  background: #c0c0c0;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #000;
  border-right: 2px solid #000;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5);
  z-index: 1000;
  min-width: 200px;
}

.start-menu-sidebar {
  width: 22px;
  background: linear-gradient(to top, #000080, #1084d0);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
}

.start-sidebar-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  color: #fff;
  font-family: 'Times New Roman', Times, serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  white-space: nowrap;
}

.start-menu-items {
  flex: 1;
  padding: 2px 0;
}

.start-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  cursor: pointer;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 12px;
  color: #000;
}

.start-menu-item:hover {
  background: #000080;
  color: #fff;
}

.smi-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.start-menu-sep {
  height: 1px;
  margin: 2px 4px;
  border-top: 1px solid #808080;
  border-bottom: 1px solid #fff;
}

/* Start menu transition */
.start-menu-enter-active {
  transition: all 0.15s ease-out;
}
.start-menu-leave-active {
  transition: all 0.1s ease-in;
}
.start-menu-enter-from,
.start-menu-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

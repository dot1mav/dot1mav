<template>
  <div id="taskbar" role="navigation" aria-label="Taskbar">
    <button id="start-btn" :class="{ active: startMenuOpen }" @click="$emit('toggle-start')"
      aria-label="Start Menu" aria-haspopup="menu" :aria-expanded="startMenuOpen" aria-controls="start-menu">
      <span class="start-flag">
        <span class="sf-r"></span><span class="sf-g"></span>
        <span class="sf-b"></span><span class="sf-y"></span>
      </span>
      <span class="start-text">Start</span>
    </button>

    <!-- Start Menu -->
    <Transition name="start-menu">
      <div v-if="startMenuOpen" id="start-menu" class="start-menu" @click.stop>
        <div class="start-menu-sidebar">
          <span class="start-sidebar-text">Windows<sup style="font-size:6px">®</sup> 98</span>
        </div>
        <div class="start-menu-items">
          <div class="start-menu-section">
            <div class="start-menu-section-title">Programs</div>
            <button type="button" class="start-menu-item" @click="emitAction('projects')">
              <img class="smi-icon" src="/images/icons/projects.png" alt="" width="16" height="16" />
              <span class="smi-label">Projects</span>
            </button>
            <button type="button" class="start-menu-item" @click="emitAction('experiences')">
              <img class="smi-icon" src="/images/icons/experiences.png" alt="" width="16" height="16" />
              <span class="smi-label">Experiences</span>
            </button>
            <button type="button" class="start-menu-item" @click="emitAction('skills')">
              <img class="smi-icon" src="/images/icons/skills.png" alt="" width="16" height="16" />
              <span class="smi-label">Skills</span>
            </button>
            <button type="button" class="start-menu-item" @click="emitAction('certifications')">
              <img class="smi-icon" src="/images/icons/certificates.png" alt="" width="16" height="16" />
              <span class="smi-label">Certifications</span>
            </button>
            <button type="button" class="start-menu-item" @click="emitAction('contact')">
              <img class="smi-icon" src="/images/icons/contact.png" alt="" width="16" height="16" />
              <span class="smi-label">Contact</span>
            </button>
            <button type="button" class="start-menu-item" @click="emitAction('about')">
              <img class="smi-icon" src="/images/icons/info.png" alt="" width="16" height="16" />
              <span class="smi-label">About Me</span>
            </button>
          </div>

          <div class="start-menu-section">
            <div class="start-menu-section-title">Accessories</div>
            <button type="button" class="start-menu-item" @click="emitAction('terminal')">
              <img class="smi-icon" src="/images/icons/modem-4.png" alt="" width="16" height="16" />
              <span class="smi-label">MS-DOS Prompt</span>
            </button>
            <button type="button" class="start-menu-item" @click="emitAction('svgcreator')">
              <img class="smi-icon" src="/images/icons/paint.png" alt="" width="16" height="16" />
              <span class="smi-label">SVG Creator</span>
            </button>
            <button type="button" class="start-menu-item" @click="emitAction('photos')">
              <img class="smi-icon" src="/images/icons/photos.png" alt="" width="16" height="16" />
              <span class="smi-label">Photo Viewer</span>
            </button>
            <button type="button" class="start-menu-item" @click="emitAction('video')">
              <img class="smi-icon" src="/images/icons/video.png" alt="" width="16" height="16" />
              <span class="smi-label">Video Player</span>
            </button>
          </div>

          <div class="start-menu-section">
            <div class="start-menu-section-title">Games</div>
            <button type="button" class="start-menu-item" @click="emitAction('minesweeper')">
              <img class="smi-icon" src="/images/icons/paint.png" alt="" width="16" height="16" />
              <span class="smi-label">Minesweeper</span>
            </button>
            <button type="button" class="start-menu-item" @click="emitAction('solitaire')">
              <img class="smi-icon" src="/images/icons/solitaire.png" alt="" width="16" height="16" />
              <span class="smi-label">Solitaire</span>
            </button>
          </div>

          <div class="start-menu-sep"></div>

          <div class="start-menu-section">
            <button type="button" class="start-menu-item" @click="emitAction('darkmode')">
              <span class="smi-icon" aria-hidden="true">{{ isDarkMode ? '☀️' : '🌙' }}</span>
              <span class="smi-label">{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</span>
            </button>
          </div>

          <div class="start-menu-sep"></div>

          <div class="start-menu-section">
            <button type="button" class="start-menu-item start-menu-item--danger" @click="emitAction('restart')">
              <span class="smi-icon" aria-hidden="true">🔄</span>
              <span class="smi-label">Restart</span>
            </button>
            <button type="button" class="start-menu-item start-menu-item--danger" @click="emitAction('shutdown')">
              <span class="smi-icon" aria-hidden="true">⏻</span>
              <span class="smi-label">Shut Down</span>
            </button>
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

const props = defineProps({
  startMenuOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-start', 'start-action'])

const { windows, openTaskbarWindows, restoreWindow } = useWindows()
const { isDarkMode, toggleDarkMode } = useApp()

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

function emitAction(action) {
  emit('start-action', action)
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
})

onBeforeUnmount(() => {
  if (clockInterval) clearInterval(clockInterval)
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

#start-btn:active,
#start-btn.active {
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
  min-width: 240px;
}

.start-menu-sidebar {
  width: 28px;
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

.start-menu-section {
  padding: 0 4px;
}

.start-menu-section-title {
  font-size: 10px;
  font-weight: 700;
  color: #808080;
  text-transform: uppercase;
  padding: 2px 8px 4px;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
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
  border-radius: 2px;
  /* Native button reset so keyboard users get the same menu */
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
}

.start-menu-item:hover {
  background: #000080;
  color: #fff;
}

.start-menu-item--danger:hover {
  background: #800;
  color: #fff;
}

.smi-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.start-menu-sep {
  height: 1px;
  margin: 4px 4px;
  border-top: 1px solid #808080;
  border-bottom: 1px solid #fff;
}

/* Start menu transition */
.start-menu-enter-active {
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}
.start-menu-leave-active {
  transition: all 0.1s ease-in;
}
.start-menu-enter-from,
.start-menu-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Dark mode adjustments */
:global(.dark-mode) .start-menu {
  background: #2a2a2a;
  border-top: 2px solid #3a3a3a;
  border-left: 2px solid #3a3a3a;
  border-bottom: 2px solid #101010;
  border-right: 2px solid #101010;
}

:global(.dark-mode) .start-menu-item {
  color: #ddd;
}

:global(.dark-mode) .start-menu-item:hover {
  background: #0033cc;
  color: #fff;
}

:global(.dark-mode) .start-menu-sep {
  border-top: 1px solid #444;
  border-bottom: 1px solid #1a1a1a;
}

:global(.dark-mode) .start-menu-section-title {
  color: #888;
}
</style>
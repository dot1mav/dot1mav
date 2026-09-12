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
      <div v-if="startMenuOpen" id="start-menu" class="start-menu" @click.stop @keydown="onMenuKeydown">
        <div class="start-menu-sidebar">
          <span class="start-sidebar-text">Windows<sup style="font-size:6px">®</sup> 98</span>
        </div>
        <div class="start-menu-items">
          <div class="start-menu-search">
            <span class="sms-icon" aria-hidden="true">🔍</span>
            <input
              ref="searchEl"
              v-model="menuFilter"
              type="search"
              class="sms-input"
              placeholder="Search programs…"
              aria-label="Search programs"
              autocomplete="off"
              spellcheck="false"
              @keydown.esc.prevent="closeMenu"
            />
          </div>

          <template v-for="section in filteredMenu" :key="section.title || section.items[0].action">
            <div class="start-menu-section">
              <div v-if="section.title" class="start-menu-section-title">{{ section.title }}</div>
              <button
                v-for="item in section.items"
                :key="item.action"
                type="button"
                class="start-menu-item"
                :class="{ 'start-menu-item--danger': item.danger }"
                @click="emitAction(item.action)"
              >
                <img v-if="item.icon" class="smi-icon" :src="item.icon" alt="" width="16" height="16" />
                <span v-else class="smi-icon" aria-hidden="true">{{ item.glyph }}</span>
                <span class="smi-label">{{ item.label }}</span>
              </button>
            </div>
            <div v-if="section.separatorAfter" class="start-menu-sep"></div>
          </template>

          <p v-if="!filteredMenu.length" class="start-menu-empty">
            Nothing matches “{{ menuFilter }}”.
          </p>
        </div>
      </div>
    </Transition>

    <div id="taskbar-sep"></div>

    <div id="taskbar-buttons">
      <button
        v-for="(win, id) in openTaskbarWindows"
        :key="id"
        @click="toggleTaskbarWindow(id)"
        :class="{ active: !win.minimized && win.z === topZ }"
        :title="win.minimized ? `Restore ${win.title}` : win.title"
      >
        <img v-if="win.icon" class="taskbar-btn-icon" :src="win.icon" alt="" width="16" height="16" />
        <span class="taskbar-btn-label">{{ win.title }}</span>
      </button>
    </div>

    <div id="taskbar-tray">
      <span id="taskbar-copyright">&copy; {{ new Date().getFullYear() }} dot1mav</span>
      <button
        id="show-desktop-btn"
        type="button"
        @click="toggleShowDesktop"
        :title="hasVisibleWindow ? 'Show desktop' : 'Restore windows'"
        :aria-label="hasVisibleWindow ? 'Show desktop' : 'Restore windows'"
      >
        <span class="tray-glyph" aria-hidden="true">🖥</span>
      </button>
      <span id="taskbar-clock" :title="currentDate">{{ currentTime }}</span>
    </div>

    <button id="dark-mode-toggle" @click="toggleDarkMode" :aria-label="isDarkMode ? 'Light Mode' : 'Dark Mode'">
      {{ isDarkMode ? '☀️' : '🌙' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useWindows } from '../composables/useWindows'
import { useApp } from '../composables/useApp'

const props = defineProps({
  startMenuOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-start', 'start-action', 'close-start'])

const {
  openTaskbarWindows,
  restoreWindow,
  minimizeWindow,
  topZ,
  hasVisibleWindow,
  toggleShowDesktop,
} = useWindows()
const { isDarkMode, toggleDarkMode } = useApp()

const currentTime = ref('')
const currentDate = ref('')
let clockInterval = null

// The Start menu is data now, which is what lets the search box and
// arrow-key navigation work over it. Sections without a title are the
// unlabelled groups Windows 98 used for the theme and power items.
const menuSections = computed(() => [
  {
    title: 'Programs',
    items: [
      { label: 'Projects', action: 'projects', icon: '/images/icons/projects.png' },
      { label: 'Experiences', action: 'experiences', icon: '/images/icons/experiences.png' },
      { label: 'Skills', action: 'skills', icon: '/images/icons/skills.png' },
      { label: 'Certifications', action: 'certifications', icon: '/images/icons/certificates.png' },
      { label: 'Contact', action: 'contact', icon: '/images/icons/contact.png' },
      { label: 'About Me', action: 'about', icon: '/images/icons/info.png' },
    ],
  },
  {
    title: 'Accessories',
    items: [
      { label: 'MS-DOS Prompt', action: 'terminal', icon: '/images/icons/modem-4.png' },
      { label: 'SVG Creator', action: 'svgcreator', icon: '/images/icons/paint.png' },
      { label: 'Photo Viewer', action: 'photos', icon: '/images/icons/photos.png' },
      { label: 'Video Player', action: 'video', icon: '/images/icons/video.png' },
    ],
  },
  {
    title: 'Games',
    separatorAfter: true,
    items: [
      { label: 'Minesweeper', action: 'minesweeper', icon: '/images/icons/paint.png' },
      { label: 'Solitaire', action: 'solitaire', icon: '/images/icons/solitaire.png' },
    ],
  },
  {
    separatorAfter: true,
    items: [
      {
        label: isDarkMode.value ? 'Light Mode' : 'Dark Mode',
        action: 'darkmode',
        glyph: isDarkMode.value ? '☀️' : '🌙',
      },
    ],
  },
  {
    items: [
      { label: 'Restart', action: 'restart', glyph: '🔄', danger: true },
      { label: 'Shut Down', action: 'shutdown', glyph: '⏻', danger: true },
    ],
  },
])

const menuFilter = ref('')
const searchEl = ref(null)

const filteredMenu = computed(() => {
  const needle = menuFilter.value.trim().toLowerCase()
  if (!needle) return menuSections.value
  return menuSections.value
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.label.toLowerCase().includes(needle)),
    }))
    .filter((section) => section.items.length)
})

function emitAction(action) {
  emit('start-action', action)
}

function closeMenu() {
  emit('close-start')
}

// Arrow keys walk the menu, Home/End jump to the ends, Escape backs
// out — and typing in the search box filters it down live.
function onMenuKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    closeMenu()
    return
  }

  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return

  const items = Array.from(e.currentTarget.querySelectorAll('.start-menu-item'))
  if (!items.length) return

  e.preventDefault()
  if (e.key === 'Home') {
    items[0].focus()
    return
  }
  if (e.key === 'End') {
    items[items.length - 1].focus()
    return
  }

  const current = items.indexOf(document.activeElement)
  const direction = e.key === 'ArrowDown' ? 1 : -1
  const next = current === -1
    ? (direction === 1 ? 0 : items.length - 1)
    : (current + direction + items.length) % items.length
  items[next].focus()
}

// Opening the menu puts the caret straight in the search box.
watch(
  () => props.startMenuOpen,
  async (open) => {
    if (!open) {
      menuFilter.value = ''
      return
    }
    await nextTick()
    searchEl.value?.focus()
  }
)

// Clicking the button of the window you're already in minimizes it,
// exactly like the real taskbar.
function toggleTaskbarWindow(id) {
  const win = openTaskbarWindows.value[id]
  if (!win) return
  if (!win.minimized && win.z === topZ.value) {
    minimizeWindow(id)
  } else {
    restoreWindow(id)
  }
}

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })
  currentDate.value = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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

/* Window buttons carry the window's icon and truncate the title, so
   a wide-open desktop still reads at a glance. */
#taskbar-buttons button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.taskbar-btn-icon {
  flex-shrink: 0;
  image-rendering: pixelated;
}

.taskbar-btn-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== Tray: show-desktop + clock ===== */
#taskbar-tray {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

#show-desktop-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 6px;
  background: var(--button-face);
  border-top: 2px solid var(--border-light);
  border-left: 2px solid var(--border-light);
  border-right: 2px solid var(--border-darkest);
  border-bottom: 2px solid var(--border-darkest);
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
}

#show-desktop-btn:active {
  border-top-color: var(--border-darkest);
  border-left-color: var(--border-darkest);
  border-right-color: var(--border-light);
  border-bottom-color: var(--border-light);
  padding: 1px 5px 0 7px;
}

.tray-glyph {
  font-size: 12px;
}

/* ===== Start menu search ===== */
.start-menu-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--border-dark);
}

.sms-icon {
  font-size: 11px;
  flex-shrink: 0;
}

.sms-input {
  flex: 1;
  min-width: 0;
  padding: 2px 4px;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 11px;
  color: #000;
  background: #fff;
  border: 2px inset var(--button-face);
}

.sms-input:focus-visible {
  outline: 1px dotted #000;
  outline-offset: -3px;
}

.start-menu-empty {
  padding: 6px 10px;
  margin: 0;
  font-size: 11px;
  color: #404040;
}

:global(.dark-mode) .sms-input {
  color: #eee;
  background: #1b1b1b;
  border-color: #444;
}

:global(.dark-mode) .start-menu-empty {
  color: #bbb;
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
<template>
  <div
    :class="['window', 'draggable', { minimized: window.minimized, maximized: window.maximized }]"
    role="dialog"
    :aria-label="window.title"
    :aria-hidden="!window.open"
    :style="{
      left: window.x + 'px',
      top: window.y + 'px',
      width: window.width + 'px',
      height: window.height + 'px',
      display: window.open ? 'block' : 'none',
      zIndex: window.z,
    }"
    @mousedown="focus"
  >
    <div class="title-bar" @mousedown="onTitleBarMouseDown">
      <div class="title-bar-text">{{ window.title }}</div>
      <div class="title-bar-controls">
        <button @click="minimize" aria-label="Minimize"></button>
        <button @click="maximize" aria-label="Maximize"></button>
        <button @click="close" aria-label="Close"></button>
      </div>
    </div>
    <div class="window-body" :class="{ 'full-body': fullBody }">
      <slot />
    </div>

    <template v-if="!window.maximized">
      <div class="resize-handle resize-e" @mousedown="onResizeStart($event, 'e')"></div>
      <div class="resize-handle resize-s" @mousedown="onResizeStart($event, 's')"></div>
      <div class="resize-handle resize-se" @mousedown="onResizeStart($event, 'se')"></div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWindows } from '../composables/useWindows'

// Windows are rendered once and hidden with display:none when closed,
// never unmounted. That's what lets the terminal keep its history
// and scroll position, and why the state lives in a composable
// instead of on the component itself.
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  // fullBody lets a window's content own the entire body area —
  // no padding, no body-level scrollbar. The terminal uses it so
  // its own output area can be the single scrolling region.
  fullBody: {
    type: Boolean,
    default: false,
  },
})

const {
  windows,
  focusWindow,
  startDrag,
  startResize,
  minimizeWindow,
  maximizeWindow,
  closeWindow,
} = useWindows()

const window = computed(() => windows[props.id])

// Any click inside the window brings it to the front, not just
// the title bar — that's how the real Windows behaved too.
function focus() {
  focusWindow(props.id)
}

function onTitleBarMouseDown(e) {
  startDrag(e, props.id)
}

function onResizeStart(e, handle) {
  startResize(e, props.id, handle)
}

function minimize() {
  minimizeWindow(props.id)
}

function maximize() {
  maximizeWindow(props.id)
}

function close() {
  closeWindow(props.id)
}
</script>

<style scoped>
.window {
  resize: none;
}

/* Full-bleed windows (the terminal): the body is pinned to fill
   everything below the title bar. Absolute positioning instead of
   flex so the math is simple and can't fall apart — the window has
   a fixed height, the title bar is always 22px + 2px borders, and
   the body just fills what's left. Content inside then owns its
   own scrolling. */
.full-body {
  position: absolute;
  top: 24px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  margin: 0;
  padding: 0;
  max-height: none;
  overflow: hidden;
}

.resize-handle {
  position: absolute;
  z-index: 10;
}

.resize-e {
  top: 0;
  right: -2px;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
}

.resize-s {
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 6px;
  cursor: ns-resize;
}

.resize-se {
  bottom: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  background:
    linear-gradient(135deg, transparent 50%, var(--border-darkest) 50%, var(--border-darkest) 55%, transparent 55%),
    linear-gradient(135deg, transparent 60%, var(--border-darkest) 60%, var(--border-darkest) 65%, transparent 65%),
    linear-gradient(135deg, transparent 70%, var(--border-darkest) 70%, var(--border-darkest) 75%, transparent 75%);
}

@media (pointer: coarse) {
  .resize-handle {
    display: none;
  }
}
</style>

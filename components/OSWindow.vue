<template>
  <div
    :class="[
      'window',
      'draggable',
      {
        minimized: window.minimized,
        maximized: window.maximized,
        inactive: !active,
        'animate-geometry': animating,
      },
    ]"
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
    <div
      class="title-bar"
      :class="{ inactive: !active }"
      @mousedown="onTitleBarMouseDown"
      @dblclick="toggleMaximize"
    >
      <div class="title-bar-text">{{ window.title }}</div>
      <div class="title-bar-controls">
        <button @click="minimize" aria-label="Minimize"></button>
        <button @click="maximize" :aria-label="window.maximized ? 'Restore' : 'Maximize'"></button>
        <button @click="close" aria-label="Close"></button>
      </div>
    </div>
    <div class="window-body" :class="{ 'full-body': fullBody }">
      <slot />
    </div>

    <template v-if="!window.maximized">
      <div
        v-for="handle in resizeHandles"
        :key="handle"
        class="resize-handle"
        :class="`resize-${handle}`"
        @mousedown="onResizeStart($event, handle)"
      ></div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
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
  isActive,
} = useWindows()

const window = computed(() => windows[props.id])

// Windows are grey when they're not the one you're working in — the
// clearest signal of which window has focus on a stack of them.
const active = computed(() => isActive(props.id))

// Every edge and corner is grabbable, like a real window frame.
const resizeHandles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']

// Geometry changes (maximize/restore) get a short eased transition,
// but only for those moments — dragging and resizing must stay 1:1
// with the pointer, so the class is added just for the toggle.
const animating = ref(false)
let animationTimer = null

function withGeometryAnimation(callback) {
  animating.value = true
  callback()
  clearTimeout(animationTimer)
  animationTimer = setTimeout(() => {
    animating.value = false
  }, 220)
}

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
  withGeometryAnimation(() => maximizeWindow(props.id))
}

function toggleMaximize(e) {
  e.preventDefault()
  withGeometryAnimation(() => maximizeWindow(props.id))
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

@media (prefers-reduced-motion: reduce) {
  .full-body {
    transition: none;
  }
}
</style>

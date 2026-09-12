<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ left: `${x}px`, top: `${y}px` }"
    tabindex="-1"
    @click.prevent
    @contextmenu.prevent
    @keydown="handleMenuKeydown"
    ref="menuEl"
  >
    <div class="context-menu-inner" role="menu">
      <template v-for="(item, index) in items" :key="index">
        <div v-if="item.separator" class="context-menu-separator" />
        <div
          v-else
          class="context-menu-item"
          role="menuitem"
          tabindex="-1"
          :class="{ 
            'context-menu-item--disabled': item.disabled,
            'context-menu-item--danger': item.danger,
            'context-menu-item--has-submenu': item.submenu,
            'context-menu-item--default': item.default,
          }"
          :aria-disabled="item.disabled || undefined"
          :aria-haspopup="item.submenu ? 'menu' : undefined"
          @click="handleItemClick(item)"
          @mouseenter="handleMouseEnter(item, index)"
          @mouseleave="handleMouseLeave(item)"
        >
          <span v-if="item.icon" class="context-menu-icon" aria-hidden="true">{{ item.icon }}</span>
          <span v-else-if="item.iconData?.icon" class="context-menu-icon">
            <img :src="item.iconData.icon" :alt="item.iconData.label" width="16" height="16" />
          </span>
          <span class="context-menu-label">{{ item.label }}</span>
          <span v-if="item.submenu" class="context-menu-arrow" aria-hidden="true">▶</span>
          <span v-if="item.default" class="context-menu-check" aria-hidden="true">✓</span>
        </div>
      </template>
    </div>
    
    <!-- Submenu -->
    <div
      v-if="activeSubmenu !== null"
      class="context-menu-submenu"
      :style="submenuPosition"
      ref="submenuEl"
    >
      <div class="context-menu-inner" role="menu">
        <template v-for="(item, index) in items[activeSubmenu].submenu" :key="index">
          <div v-if="item.separator" class="context-menu-separator" />
          <div
            v-else
            class="context-menu-item"
            role="menuitem"
            tabindex="-1"
            :class="{ 'context-menu-item--disabled': item.disabled }"
            :aria-disabled="item.disabled || undefined"
            @click="$emit('action', item.action, item)"
            @mouseenter="submenuHoverIndex = index"
            @mouseleave="submenuHoverIndex = -1"
          >
            <span class="context-menu-label">{{ item.label }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  position: { type: Object, required: true },
})

const emit = defineEmits(['close', 'action'])

const activeSubmenu = ref(null)
const submenuHoverIndex = ref(-1)
const menuEl = ref(null)
const submenuEl = ref(null)

const x = computed(() => props.position.x)
const y = computed(() => props.position.y)
const visible = computed(() => props.items.length > 0)

const submenuPosition = computed(() => {
  if (activeSubmenu.value === null) return {}
  const itemEl = menuEl.value?.querySelectorAll('.context-menu-item')[activeSubmenu.value]
  if (!itemEl) return {}
  const rect = itemEl.getBoundingClientRect()
  const menuRect = menuEl.value?.getBoundingClientRect()
  if (!menuRect) return {}
  
  // Position submenu to the right of parent menu
  return {
    left: `${menuRect.width}px`,
    top: `${rect.top - menuRect.top}px`,
  }
})

function handleItemClick(item) {
  if (item.disabled) return
  if (item.submenu) return // Submenu handled by hover
  emit('action', item.action, item)
  emit('close')
}

function handleMouseEnter(item, index) {
  if (item.disabled) return
  if (item.submenu) {
    activeSubmenu.value = index
  } else {
    activeSubmenu.value = null
  }
}

function handleMouseLeave(item) {
  if (!item.submenu) {
    activeSubmenu.value = null
  }
}

// Close on outside click
function handleOutsideClick(e) {
  if (menuEl.value && !menuEl.value.contains(e.target)) {
    if (submenuEl.value && !submenuEl.value.contains(e.target)) {
      emit('close')
    }
  }
}

// Close on Escape
function handleKeydown(e) {
  if (e.key === 'Escape') {
    if (activeSubmenu.value !== null) {
      activeSubmenu.value = null
    } else {
      emit('close')
    }
  }
}

// Roving-focus keyboard navigation for the top-level menu:
// ArrowUp/ArrowDown move between enabled items, Enter/Space activate,
// Escape closes (handled above).
function mainItemEls() {
  if (!menuEl.value) return []
  return Array.from(
    menuEl.value.querySelectorAll(':scope > .context-menu-inner > .context-menu-item')
  )
}

function nextEnabledIndex(els, start, dir) {
  const n = els.length
  for (let i = 1; i <= n; i++) {
    const idx = (((start + dir * i) % n) + n) % n
    if (!els[idx].classList.contains('context-menu-item--disabled')) return idx
  }
  return -1
}

function handleMenuKeydown(e) {
  const els = mainItemEls()
  if (!els.length) return
  const current = els.indexOf(document.activeElement)
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const dir = e.key === 'ArrowDown' ? 1 : -1
    const start = current === -1 ? (dir === 1 ? -1 : 0) : current
    const idx = nextEnabledIndex(els, start, dir)
    if (idx !== -1) els[idx].focus()
  } else if ((e.key === 'Enter' || e.key === ' ') && current !== -1) {
    e.preventDefault()
    els[current].click()
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleKeydown)
  
  // Adjust position if menu goes off screen
  nextTick(() => {
    if (menuEl.value) {
      // Focus the menu so keyboard users can navigate it immediately
      menuEl.value.focus({ preventScroll: true })

      const rect = menuEl.value.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      
      if (rect.right > vw) {
        menuEl.value.style.left = `${vw - rect.width - 4}px`
      }
      if (rect.bottom > vh) {
        menuEl.value.style.top = `${vh - rect.height - 4}px`
      }
    }
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 100000;
  font-family: 'IBM Plex Mono', 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  user-select: none;
  pointer-events: auto;
}

.context-menu-inner {
  background: #c0c0c0;
  border: 2px outset #fff;
  border-bottom-color: #808080;
  border-right-color: #808080;
  min-width: 180px;
  box-shadow: 4px 4px 8px rgba(0,0,0,0.3);
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 3px 24px 3px 6px;
  cursor: default;
  white-space: nowrap;
  border: 1px solid transparent;
  gap: 8px;
}

.context-menu-item:hover:not(.context-menu-item--disabled) {
  background: #000080;
  color: #fff;
  border: 1px solid #fff;
  border-bottom-color: #000080;
  border-right-color: #000080;
}

.context-menu-item--disabled {
  color: #808080;
  cursor: not-allowed;
}

.context-menu-item:focus-visible {
  background: #000080;
  color: #fff;
  outline: 1px dotted #fff;
  outline-offset: -1px;
}

.context-menu-item--danger:hover:not(.context-menu-item--disabled) {
  background: #800;
  color: #fff;
}

.context-menu-item--default {
  font-weight: bold;
}

.context-menu-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.context-menu-icon img {
  width: 16px;
  height: 16px;
}

.context-menu-label {
  flex: 1;
}

.context-menu-arrow {
  font-size: 10px;
  color: #000;
}

.context-menu-item:hover .context-menu-arrow {
  color: #fff;
}

.context-menu-check {
  color: #000;
  font-weight: bold;
}

.context-menu-item:hover .context-menu-check {
  color: #fff;
}

.context-menu-separator {
  height: 1px;
  background: #808080;
  margin: 4px 2px;
  border-top: 1px solid #fff;
}

.context-menu-submenu {
  position: absolute;
  z-index: 100001;
  pointer-events: auto;
}

.context-menu-submenu .context-menu-inner {
  border: 2px outset #fff;
  border-bottom-color: #808080;
  border-right-color: #808080;
}
</style>
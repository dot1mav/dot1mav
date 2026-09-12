<template>
  <div
    ref="iconEl"
    :class="['icon', { selected }]"
    role="button"
    :aria-label="`Open ${label}`"
    tabindex="0"
    @click="handleClick"
    @focus="$emit('select')"
    @keydown.enter.prevent="$emit('open')"
    @keydown.space.prevent="$emit('open')"
    @keydown="handleArrowKeys"
  >
    <img :src="icon" :alt="label" draggable="false">
    <span class="icon-label">{{ label }}</span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  icon: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['open', 'select'])

const iconEl = ref(null)

function handleClick() {
  emit('select')
  emit('open')
}

// Arrow keys walk the icon grid the way the real desktop does:
// left/right step through the DOM order, up/down find the closest
// icon in that direction so irregular wrapping still behaves.
function handleArrowKeys(e) {
  const directions = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  }
  const delta = directions[e.key]
  if (!delta || !iconEl.value) return

  const parent = iconEl.value.parentElement
  if (!parent) return

  const siblings = Array.from(parent.querySelectorAll(':scope > .icon'))
  const currentIndex = siblings.indexOf(iconEl.value)
  if (currentIndex === -1) return

  const [dx, dy] = delta
  let target = null

  if (dx !== 0) {
    target = siblings[currentIndex + dx] || null
  } else {
    const current = iconEl.value.getBoundingClientRect()
    let bestScore = Infinity
    for (const candidate of siblings) {
      if (candidate === iconEl.value) continue
      const rect = candidate.getBoundingClientRect()
      const vertical = (rect.top - current.top) * dy
      // Must actually be in the pressed direction, and prefer the
      // column that lines up best so movement feels predictable.
      if (vertical <= 4) continue
      const score = vertical + Math.abs(rect.left - current.left) * 3
      if (score < bestScore) {
        bestScore = score
        target = candidate
      }
    }
  }

  if (!target) return
  e.preventDefault()
  // Moving focus fires @focus on the target, which selects it — so
  // selection always follows the keyboard.
  target.focus()
}
</script>

<style scoped>
.icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 8px;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  border-radius: 0;
  min-width: 64px;
  max-width: 80px;
  text-align: center;
  transition: none;
}

.icon:focus {
  outline: 1px dotted #fff;
  outline-offset: -2px;
}

.icon img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.3));
}

.icon-label {
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 11px;
  color: #fff;
  text-shadow: 1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000;
  line-height: 1.2;
  word-break: break-word;
  max-width: 72px;
}

.icon.selected {
  background: rgba(0, 0, 128, 0.5);
  border: 1px dotted #fff;
}

.icon.selected img {
  filter: brightness(0.7) drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.3));
}

.icon.selected .icon-label {
  background: #000080;
  color: #fff;
  text-shadow: none;
  padding: 0 2px;
}

@media (max-width: 480px) {
  .icon {
    min-width: 56px;
    padding: 4px 6px;
  }
  .icon img {
    width: 28px;
    height: 28px;
  }
  .icon-label {
    font-size: 10px;
  }
}
</style>

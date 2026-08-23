<template>
  <div
    :class="['icon', { selected }]"
    role="button"
    :aria-label="`Open ${label}`"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="$emit('open')"
  >
    <img :src="icon" :alt="label">
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
})

const emit = defineEmits(['open'])

const selected = ref(false)

function handleClick() {
  selected.value = true
  setTimeout(() => {
    selected.value = false
    emit('open')
  }, 150)
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

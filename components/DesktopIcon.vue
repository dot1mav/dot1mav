<template>
  <div
    class="icon"
    role="button"
    :aria-label="`Open ${label}`"
    tabindex="0"
    @click="$emit('open')"
    @dblclick="$emit('open')"
    @keydown.enter="$emit('open')"
  >
    <img :src="icon" :alt="label">
    <span>{{ label }}</span>
  </div>
</template>

<script setup>
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

defineEmits(['open'])
</script>

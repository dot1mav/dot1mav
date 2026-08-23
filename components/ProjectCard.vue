<template>
  <article class="project-card">
    <div class="project-card-head">
      <div class="project-title">{{ project.title }}</div>
      <div class="project-tech">
        <span class="tech-tag" v-for="tag in splitTech(project.tech_stack)" :key="tag">{{ tag }}</span>
      </div>
    </div>
    <p class="project-desc">
      <span v-if="!expanded">{{ project.description_short }}</span>
      <span v-else>{{ project.description_full }}</span>
    </p>
    <div class="project-meta">
      <span v-if="project.date" class="project-date">{{ formatDateShort(project.date) }}</span>
      <div class="project-actions">
        <a
          v-if="project.demo_link"
          :href="project.demo_link"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-primary"
          @click="onDemoClick"
        >View</a>
        <button class="btn-detail" @click="$emit('details')">Details</button>
        <button class="btn-toggle" @click="$emit('toggle')">{{ expanded ? 'Collapse' : 'Read more' }}</button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { splitTech, formatDateShort } from '../composables/useUtils'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
  expanded: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle', 'details', 'demo'])

function onDemoClick(e) {
  emit('demo', {
    project_title: props.project.title,
    demo: true,
  })
}
</script>

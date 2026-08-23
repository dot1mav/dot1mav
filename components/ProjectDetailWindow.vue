<template>
  <div v-if="project" class="project-detail">
    <div class="detail-gallery">
      <div class="detail-image-frame">
        <img :src="currentImage" :alt="project.title" class="detail-image">
        <button v-if="imageCount > 1" class="gallery-nav gallery-prev" @click="prevImage" aria-label="Previous image">◀</button>
        <button v-if="imageCount > 1" class="gallery-nav gallery-next" @click="nextImage" aria-label="Next image">▶</button>
        <span v-if="imageCount > 1" class="gallery-counter">{{ activeImageIndex + 1 }} / {{ imageCount }}</span>
      </div>
      <div v-if="imageCount > 1" class="gallery-thumbs">
        <button
          v-for="(image, index) in images"
          :key="image"
          class="gallery-thumb"
          :class="{ active: index === activeImageIndex }"
          @click="selectImage(index)"
          :aria-label="`Image ${index + 1}`"
        >
          <img :src="image" :alt="`${project.title} ${index + 1}`">
        </button>
      </div>
    </div>

    <div class="detail-header">
      <div class="detail-title-row">
        <h2 class="detail-title">{{ project.title }}</h2>
        <span v-if="project.date" class="detail-date">{{ project.date }}</span>
      </div>
      <div class="project-tech">
        <span class="tech-tag" v-for="tag in splitTech(project.tech_stack)" :key="tag">{{ tag }}</span>
      </div>
    </div>

    <p class="detail-description">{{ project.description_full || project.description_short }}</p>

    <div v-if="project.features && project.features.length" class="detail-features">
      <h3 class="detail-section-title">Highlights</h3>
      <ul>
        <li v-for="feature in project.features" :key="feature">{{ feature }}</li>
      </ul>
    </div>

    <div v-if="hasLinks || hasImages" class="detail-links">
      <button v-if="hasImages" type="button" class="btn-toggle" title="Open the Photo Viewer for this project" @click="openPhotos">Photos</button>
      <button type="button" class="btn-toggle" title="Open the Video Player for this project" @click="openVideo">Video</button>
      <a v-if="project.demo_link" :href="project.demo_link" target="_blank" rel="noopener noreferrer" class="btn-primary">
        View Demo
        <svg class="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
      <a v-if="project.github" :href="project.github" target="_blank" rel="noopener noreferrer" class="btn-toggle">
        GitHub
        <svg class="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectDetail } from '../composables/useProjectDetail'
import { splitTech } from '../composables/useUtils'

const {
  selectedProject: project,
  activeImageIndex,
  projectImages,
  nextImage,
  prevImage,
  selectImage,
  openProjectPhotos,
  openProjectVideo,
} = useProjectDetail()

function openPhotos() {
  openProjectPhotos(project.value)
}

function openVideo() {
  openProjectVideo(project.value)
}

const hasImages = computed(() => Boolean(project.value?.images?.length))

const images = computed(() => (project.value ? projectImages(project.value) : []))

const imageCount = computed(() => {
  return (project.value?.images || []).length || 1
})

const currentImage = computed(() => {
  const list = images.value
  const idx = Math.min(activeImageIndex.value, list.length - 1)
  return list[idx] || ''
})

const hasLinks = computed(() => {
  return Boolean(project.value && (project.value.demo_link || project.value.github))
})
</script>

<style scoped>
.project-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-gallery {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-image-frame {
  position: relative;
  background: #000;
  border-top: 1px solid var(--border-darkest);
  border-left: 1px solid var(--border-darkest);
  border-right: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  overflow: hidden;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  background: rgba(192, 192, 192, 0.9);
  border-top: 1px solid var(--border-light);
  border-left: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-darkest);
  border-right: 1px solid var(--border-darkest);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.gallery-prev {
  left: 6px;
}

.gallery-next {
  right: 6px;
}

.gallery-counter {
  position: absolute;
  bottom: 6px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  padding: 2px 6px;
}

.gallery-thumbs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
}

.gallery-thumb {
  width: 64px;
  height: 44px;
  flex: 0 0 auto;
  padding: 0;
  border-top: 1px solid var(--border-light);
  border-left: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-darkest);
  border-right: 1px solid var(--border-darkest);
  cursor: pointer;
  background: var(--button-face);
  overflow: hidden;
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gallery-thumb.active {
  outline: 2px dotted var(--text-color);
  outline-offset: -2px;
}

.detail-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.detail-title {
  margin: 0;
  font-size: 15px;
}

.detail-date {
  font-size: 12px;
  color: var(--text-color);
  opacity: 0.8;
  white-space: nowrap;
}

.detail-description {
  margin: 0;
  line-height: 1.5;
}

.detail-section-title {
  margin: 0 0 4px;
  font-size: 13px;
}

.detail-features ul {
  margin: 0;
  padding-left: 18px;
}

.detail-features li {
  line-height: 1.45;
}

.detail-links {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.detail-links a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.external-icon {
  width: 11px;
  height: 11px;
  flex: 0 0 auto;
}

.detail-links button {
  font-family: inherit;
}
</style>

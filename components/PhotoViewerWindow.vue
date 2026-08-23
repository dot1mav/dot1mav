<template>
  <div class="photos-app">
    <div class="photos-toolbar">
      <div class="photos-toolgroup">
        <button type="button" class="photos-btn" title="Previous image (←)" :disabled="!canPrev" @click="prev">◀ Prev</button>
        <button type="button" class="photos-btn" title="Next image (→)" :disabled="!canNext" @click="next">Next ▶</button>
      </div>

      <div class="photos-sep"></div>

      <div class="photos-toolgroup">
        <button type="button" class="photos-btn" title="Zoom in (+)" :disabled="zoom >= 4" @click="zoomIn">Zoom in</button>
        <button type="button" class="photos-btn" title="Zoom out (−)" :disabled="zoom <= 0.25" @click="zoomOut">Zoom out</button>
        <button type="button" class="photos-btn" title="Fit to window (0)" @click="zoomFit">Fit</button>
        <button type="button" class="photos-btn" title="Actual size (1)" :disabled="zoom === 1" @click="zoomActual">100%</button>
      </div>

      <div class="photos-sep"></div>

      <div class="photos-toolgroup">
        <select v-model="filterProject" aria-label="Filter by project" class="photos-filter">
          <option value="">All projects</option>
          <option v-for="p in photoProjects" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>

      <div class="photos-spacer"></div>

      <div class="photos-toolgroup">
        <button type="button" class="photos-btn" title="Open this image in a new tab" @click="openInNewTab">Open in tab</button>
      </div>
    </div>

    <div class="photos-viewport" @click="onViewportClick" @keydown.stop>
      <div v-if="gallery.length === 0" class="photos-empty">
        No project images found.<br />Add entries to the <code>images</code> array of a project in
        <code>public/data.json</code>.
      </div>
      <template v-else>
        <img v-if="current" :src="current.src" :alt="current.label" class="photos-image"
          :style="{ transform: `scale(${zoom})` }" draggable="false" @load="onImageLoad" />
      </template>
    </div>

    <div class="photos-thumbstrip">
      <button type="button" class="photos-thumb" v-for="(img, index) in filteredGallery" :key="img.src"
        :class="{ active: index === currentIndex }" :title="img.label" @click="selectIndex(index)">
        <img :src="img.src" :alt="img.label" draggable="false" loading="lazy" />
      </button>
    </div>

    <div class="photos-status">
      <span v-if="current">{{ currentIndex + 1 }} / {{ gallery.length }}</span>
      <span v-else>No images</span>
      <span class="photos-status-name" :title="current && current.label">{{ current ? current.label : '' }}</span>
      <span v-if="current" class="photos-status-zoom">{{ Math.round(zoom * 100) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useProjectDetail } from '../composables/useProjectDetail'
import { fetchPhotos } from '../services/portfolio'

const { requestedPhotosProject } = useProjectDetail()

// The gallery is fetched from /api/photos (or built from data.json on
// static hosting), so adding a screenshot to data.json is all it
// takes to show it here.
const gallery = ref([])
const galleryLoaded = ref(false)

async function loadGallery(filterProjectTitle) {
  const photos = await fetchPhotos(filterProjectTitle)
  if (Array.isArray(photos)) {
    gallery.value = photos.map((p) => ({ src: p.src, label: p.project || '' }))
    galleryLoaded.value = true
  }
}

// Load all photos on mount so the gallery is always available
onMounted(() => {
  if (!galleryLoaded.value) loadGallery()
})

const photoProjects = computed(() => {
  const set = new Set()
  gallery.value.forEach((img) => {
    if (img.label) set.add(img.label)
  })
  return Array.from(set).sort()
})

const currentIndex = ref(0)
const zoom = ref(1)
const filterProject = ref('')

const filteredGallery = computed(() => {
  if (!filterProject.value) return gallery.value
  return gallery.value.filter((img) => img.label === filterProject.value)
})

// currentIndex is an index into the FULL gallery; when a filter is
// active we map it to the filtered list.
const current = computed(() => filteredGallery.value[currentIndex.value] || null)
const canPrev = computed(() => filteredGallery.value.length > 1 && currentIndex.value > 0)
const canNext = computed(() => filteredGallery.value.length > 1 && currentIndex.value < filteredGallery.value.length - 1)

// A project's detail window can ask for its own photos — pre-filter
// the strip and jump to that project's first image.
watch(requestedPhotosProject, (title) => {
  if (title) {
    filterProject.value = title
    currentIndex.value = 0
    zoomFit()
  }
})

function selectIndex(index) {
  if (index >= 0 && index < filteredGallery.value.length) {
    currentIndex.value = index
  }
}

function prev() {
  if (canPrev.value) {
    currentIndex.value--
    zoomFit()
  }
}

function next() {
  if (canNext.value) {
    currentIndex.value++
    zoomFit()
  }
}

function zoomIn() {
  zoom.value = Math.min(4, Math.round((zoom.value * 1.25) * 100) / 100)
}

function zoomOut() {
  zoom.value = Math.max(0.25, Math.round((zoom.value / 1.25) * 100) / 100)
}

function zoomFit() {
  zoom.value = 1
}

function zoomActual() {
  zoom.value = 1
}

function openInNewTab() {
  if (current.value) window.open(current.value.src, '_blank', 'noopener')
}

function onImageLoad() {
  zoomFit()
}

// Click on empty area of the viewport advances; arrows navigate.
function onViewportClick(e) {
  if (e.target === e.currentTarget && canNext.value) {
    next()
  }
}

function onKeydown(e) {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    next()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault()
    zoomIn()
  } else if (e.key === '-') {
    e.preventDefault()
    zoomOut()
  } else if (e.key === '0') {
    zoomFit()
  } else if (e.key === '1') {
    zoomActual()
  }
}

onMounted(() => {
  loadGallery()
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.photos-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #c0c0c0;
  color: #000;
  font-family: 'MS Sans Serif', 'Segoe UI', Tahoma, sans-serif;
  overflow: hidden;
}

.photos-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 5px 6px;
  border-bottom: 1px solid #808080;
  background: #c0c0c0;
}

.photos-toolgroup {
  display: flex;
  align-items: center;
  gap: 2px;
}

.photos-sep {
  width: 2px;
  height: 22px;
  background: #808080;
  border-left: 1px solid #fff;
}

.photos-btn {
  font-size: 11px;
  padding: 3px 8px;
  background: #c0c0c0;
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-bottom: 1px solid #808080;
  border-right: 1px solid #808080;
  cursor: pointer;
  font-family: 'MS Sans Serif', 'Segoe UI', Tahoma, sans-serif;
}

.photos-btn:active:not(:disabled) {
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
}

.photos-btn:disabled {
  color: #808080;
  cursor: default;
}

.photos-filter {
  font-size: 11px;
  max-width: 180px;
  background: #fff;
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
}

.photos-spacer {
  flex: 1 1 auto;
}

.photos-viewport {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #404040;
  cursor: zoom-in;
}

.photos-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.12s ease-out;
  image-rendering: auto;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.6);
}

.photos-empty {
  color: #d0d0d0;
  font-size: 12px;
  text-align: center;
  line-height: 1.8;
}

.photos-empty code {
  color: #ffd76a;
}

.photos-thumbstrip {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 6px;
  background: #c0c0c0;
  border-top: 1px solid #fff;
}

.photos-thumb {
  width: 56px;
  height: 44px;
  padding: 1px;
  flex: 0 0 auto;
  background: #c0c0c0;
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-bottom: 1px solid #808080;
  border-right: 1px solid #808080;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photos-thumb img {
  max-width: 100%;
  max-height: 100%;
}

.photos-thumb.active {
  border-top: 1px solid #000080;
  border-left: 1px solid #000080;
  border-bottom: 2px solid #000080;
  border-right: 2px solid #000080;
}

.photos-status {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 6px;
  font-size: 11px;
  border-top: 1px solid #fff;
  background: #c0c0c0;
  user-select: none;
}

.photos-status-name {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

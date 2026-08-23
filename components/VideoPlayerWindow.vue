<template>
  <div class="video-app">
    <div class="video-screen" @click="togglePlay">
      <video ref="videoEl" class="video-el" :src="currentSrc" preload="metadata"
        @timeupdate="onTimeUpdate" @durationchange="onDurationChange" @ended="onEnded"
        @loadedmetadata="onLoadedMetadata" @error="onError" playsinline></video>
      <div v-if="!currentSrc" class="video-empty">
        <span class="video-empty-title">No videos in the playlist</span>
        <span class="video-empty-hint">Drop an .mp4/.webm into <code>public/videos/projects/</code> and add it to
          <code>public/videos/manifest.json</code>, or play any URL below.</span>
      </div>
      <div v-if="playError" class="video-error">Could not play this video.</div>
      <div v-if="currentSrc && !playing && !playError" class="video-center-play">▶</div>
    </div>

    <!-- Playback controls -->
    <div class="video-controls">
      <button type="button" class="video-btn" title="Play (Space)" :disabled="!currentSrc" @click="togglePlay">
        {{ playing ? '❚❚' : '▶' }}
      </button>
      <button type="button" class="video-btn" title="Stop" :disabled="!currentSrc" @click="stop">■</button>

      <span class="video-time">{{ timeLabel }}</span>

      <input type="range" class="video-seek" min="0" max="1000" step="1" :value="seekPos" :disabled="!currentSrc"
        aria-label="Seek" @input="onSeekInput" @change="onSeekChange" />

      <span class="video-time">{{ durationLabel }}</span>

      <span class="video-volume-label" title="Volume">🔊</span>
      <input type="range" class="video-volume" min="0" max="100" step="1" :value="volumePct"
        aria-label="Volume" @input="onVolumeInput" />

      <div class="video-spacer"></div>

      <select v-model="currentSource" class="video-select" aria-label="Playlist" @change="onSourceChange">
        <option v-for="item in playlist" :key="item.src" :value="item.src">{{ item.title }}</option>
      </select>
    </div>

    <!-- URL bar -->
    <div class="video-urlbar">
      <span class="video-url-label">URL:</span>
      <input v-model="customUrl" type="text" spellcheck="false" placeholder="https://example.com/clip.mp4"
        aria-label="Video URL" @keydown.enter="playCustomUrl" />
      <button type="button" class="video-btn" title="Play this URL" @click="playCustomUrl">Play</button>
    </div>

    <div class="video-status">
      <span class="video-status-name" :title="currentTitle">{{ currentTitle || 'No video' }}</span>
      <span v-if="currentProject" class="video-status-project">{{ currentProject }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useProjectDetail } from '../composables/useProjectDetail'
import { fetchVideos } from '../services/portfolio'

const { requestedVideoProject } = useProjectDetail()

// Playlist = /api/videos (project videos + manifest clips). On static
// hosting the caller falls back to fetching the manifest directly and
// merging the project videos from data.json, so both paths behave the
// same. Loaded at runtime because static hosts can't list directories.
const playlistItems = ref([])

async function loadVideos() {
  const list = await fetchVideos()
  if (Array.isArray(list)) playlistItems.value = list
}

const playlist = computed(() => playlistItems.value)

// A project's detail window can ask for its own video — select it in
// the playlist and start playing. The playlist loads asynchronously,
// so this watcher also fires when the list arrives or grows.
watch([requestedVideoProject, playlist], ([title]) => {
  if (!title) return
  const item = playlist.value.find((i) => i.project === title)
  if (item) {
    currentSource.value = item.src
    onSourceChange()
  } else if (playlist.value.length && !currentSource.value) {
    // No dedicated clip for this project yet — land on the first one
    // so the window never opens to an empty screen.
    currentSource.value = playlist.value[0].src
    onSourceChange()
  }
})

const currentSource = ref('')
const customUrl = ref('')
const currentSrc = computed(() => currentSource.value || '')
const currentMeta = computed(() =>
  playlist.value.find((item) => item.src === currentSource.value) || null
)
const currentTitle = computed(() => (currentMeta.value && currentMeta.value.title) || currentSource.value)
const currentProject = computed(() => (currentMeta.value && currentMeta.value.project) || null)

const videoEl = ref(null)
const playing = ref(false)
const playError = ref(false)
const time = ref(0)
const duration = ref(0)
const volumePct = ref(80)
const seekPos = ref(0)
let lastSeek = -1

const timeLabel = computed(() => fmtTime(time.value))
const durationLabel = computed(() => (duration.value ? fmtTime(duration.value) : '0:00'))

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function onLoadedMetadata() {
  const v = videoEl.value
  if (!v) return
  duration.value = v.duration
  playError.value = false
}

function onDurationChange() {
  if (videoEl.value) duration.value = videoEl.value.duration
}

function onTimeUpdate() {
  const v = videoEl.value
  if (!v) return
  time.value = v.currentTime
  if (lastSeek < 0) {
    seekPos.value = duration.value ? (v.currentTime / duration.value) * 1000 : 0
  }
}

function onEnded() {
  playing.value = false
}

function onError() {
  playError.value = true
  playing.value = false
}

function togglePlay() {
  const v = videoEl.value
  if (!v || !currentSrc.value) return
  playError.value = false
  if (v.paused) {
    v.play().catch(() => {
      playError.value = true
    })
    playing.value = true
  } else {
    v.pause()
    playing.value = false
  }
}

function stop() {
  const v = videoEl.value
  if (!v) return
  v.pause()
  v.currentTime = 0
  playing.value = false
  time.value = 0
  seekPos.value = 0
}

function onSeekInput(e) {
  seekPos.value = Number(e.target.value)
  lastSeek = seekPos.value
  const v = videoEl.value
  if (v && duration.value) {
    v.currentTime = (seekPos.value / 1000) * duration.value
    time.value = v.currentTime
  }
}

function onSeekChange() {
  lastSeek = -1
}

function onVolumeInput(e) {
  volumePct.value = Number(e.target.value)
  if (videoEl.value) {
    videoEl.value.volume = volumePct.value / 100
  }
}

function onSourceChange() {
  playError.value = false
  playing.value = false
  time.value = 0
  duration.value = 0
  seekPos.value = 0
  lastSeek = -1
  if (currentSrc.value && videoEl.value) {
    videoEl.value.load()
    togglePlay()
  }
}

function playCustomUrl() {
  const url = (customUrl.value || '').trim()
  if (!url) return
  currentSource.value = url
  onSourceChange()
}

function onKeydown(e) {
  const tag = (e.target.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return
  if (e.key === ' ' || e.key === 'k') {
    e.preventDefault()
    togglePlay()
  } else if (e.key === 'ArrowRight') {
    if (videoEl.value) videoEl.value.currentTime = Math.min(videoEl.value.currentTime + 5, duration.value)
  } else if (e.key === 'ArrowLeft') {
    if (videoEl.value) videoEl.value.currentTime = Math.max(videoEl.value.currentTime - 5, 0)
  } else if (e.key === 'm') {
    const v = videoEl.value
    if (v) v.muted = !v.muted
  }
}

onMounted(() => {
  loadVideos()
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.video-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #c0c0c0;
  color: #000;
  font-family: 'MS Sans Serif', 'Segoe UI', Tahoma, sans-serif;
  overflow: hidden;
}

.video-screen {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}

.video-el {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #a0a0a0;
  font-size: 12px;
  text-align: center;
  padding: 20px;
}

.video-empty-title {
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.video-empty-hint code {
  color: #6cb8ff;
}

.video-error {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: #800000;
  color: #fff;
  font-size: 12px;
  padding: 4px 10px;
}

.video-center-play {
  position: absolute;
  font-size: 44px;
  color: rgba(255, 255, 255, 0.85);
  pointer-events: none;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

.video-controls {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-top: 1px solid #fff;
  background: #c0c0c0;
}

.video-btn {
  font-size: 12px;
  min-width: 30px;
  padding: 3px 6px;
  background: #c0c0c0;
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-bottom: 1px solid #808080;
  border-right: 1px solid #808080;
  cursor: pointer;
  font-family: 'MS Sans Serif', 'Segoe UI', Tahoma, sans-serif;
}

.video-btn:active:not(:disabled) {
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
}

.video-btn:disabled {
  color: #808080;
  cursor: default;
}

.video-time {
  font-size: 11px;
  min-width: 34px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.video-seek {
  flex: 1 1 auto;
  min-width: 80px;
  accent-color: #000080;
}

.video-volume {
  width: 70px;
  accent-color: #000080;
}

.video-volume-label {
  font-size: 11px;
  user-select: none;
}

.video-spacer {
  flex: 0 0 auto;
  width: 4px;
}

.video-select {
  font-size: 11px;
  max-width: 240px;
  background: #fff;
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
}

.video-urlbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-top: 1px solid #808080;
  background: #c0c0c0;
}

.video-url-label {
  font-size: 11px;
}

.video-urlbar input {
  flex: 1 1 auto;
  font-size: 11px;
  padding: 2px 4px;
  background: #fff;
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
  font-family: Consolas, 'Courier New', monospace;
}

.video-status {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 8px;
  font-size: 11px;
  border-top: 1px solid #fff;
  background: #c0c0c0;
  user-select: none;
}

.video-status-name {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-status-project {
  color: #000080;
}
</style>

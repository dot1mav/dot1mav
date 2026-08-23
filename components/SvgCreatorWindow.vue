<template>
  <div class="svg-app">
    <!-- Toolbar -->
    <div class="svg-toolbar">
      <div class="svg-toolgroup" role="group" aria-label="Tools">
        <button type="button" :class="['svg-tool', { active: tool === 'pen' }]" title="Freehand pen (P)"
          @click="setTool('pen')">✏</button>
        <button type="button" :class="['svg-tool', { active: tool === 'line' }]" title="Line (L)"
          @click="setTool('line')">╱</button>
        <button type="button" :class="['svg-tool', { active: tool === 'rect' }]" title="Rectangle (R)"
          @click="setTool('rect')">▭</button>
        <button type="button" :class="['svg-tool', { active: tool === 'ellipse' }]" title="Ellipse (O)"
          @click="setTool('ellipse')">◯</button>
      </div>

      <div class="svg-sep"></div>

      <div class="svg-toolgroup" role="group" aria-label="Stroke width">
        <label class="svg-label" for="svg-stroke">Width</label>
        <select id="svg-stroke" v-model="strokeWidth" aria-label="Stroke width">
          <option v-for="w in strokeWidths" :key="w" :value="w">{{ w }}px</option>
        </select>
      </div>

      <div class="svg-sep"></div>

      <div class="svg-toolgroup" role="group" aria-label="Stroke color">
        <span class="svg-color-sample" :style="{ background: strokeColor }" title="Stroke color"></span>
        <button type="button" v-for="c in palette" :key="c" class="svg-swatch"
          :class="{ active: c === strokeColor }" :style="{ background: c }"
          :aria-label="`Stroke color ${c}`" @click="strokeColor = c"></button>
      </div>

      <div class="svg-sep"></div>

      <div class="svg-toolgroup" role="group" aria-label="Fill">
        <label class="svg-check" title="Fill shapes with the stroke color">
          <input type="checkbox" v-model="fillEnabled" /> Fill
        </label>
      </div>

      <div class="svg-sep"></div>

      <div class="svg-toolgroup" role="group" aria-label="Actions">
        <button type="button" class="svg-btn" title="Undo (Ctrl+Z)" :disabled="!canUndo" @click="undo">Undo</button>
        <button type="button" class="svg-btn" title="Redo (Ctrl+Y)" :disabled="!canRedo" @click="redo">Redo</button>
        <button type="button" class="svg-btn" title="Clear all" :disabled="shapes.length === 0" @click="clearAll">Clear</button>
      </div>

      <div class="svg-spacer"></div>

      <div class="svg-toolgroup" role="group" aria-label="Export">
        <button type="button" class="svg-btn svg-btn-primary" title="Save as .svg (Ctrl+S)" @click="exportSvg">Export SVG</button>
        <button type="button" class="svg-btn" title="View the SVG source" :disabled="shapes.length === 0" @click="showCode = true">Code</button>
      </div>
    </div>

    <!-- Canvas -->
    <div class="svg-canvas-wrap" ref="canvasWrapEl">
      <svg ref="svgEl" class="svg-canvas" :viewBox="`0 0 ${canvasW} ${canvasH}`" preserveAspectRatio="none"
        @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp"
        @pointercancel="onPointerUp">
        <g v-for="(shape, index) in shapes" :key="index">
          <rect v-if="shape.type === 'rect'" :x="shape.x" :y="shape.y" :width="shape.w" :height="shape.h"
            :fill="shape.fill" :stroke="shape.stroke" :stroke-width="shape.strokeWidth" />
          <ellipse v-else-if="shape.type === 'ellipse'" :cx="shape.cx" :cy="shape.cy" :rx="shape.rx" :ry="shape.ry"
            :fill="shape.fill" :stroke="shape.stroke" :stroke-width="shape.strokeWidth" />
          <line v-else-if="shape.type === 'line'" :x1="shape.x1" :y1="shape.y1" :x2="shape.x2" :y2="shape.y2"
            :stroke="shape.stroke" :stroke-width="shape.strokeWidth" stroke-linecap="round" />
          <path v-else-if="shape.type === 'path'" :d="shape.d" fill="none" :stroke="shape.stroke"
            :stroke-width="shape.strokeWidth" stroke-linecap="round" stroke-linejoin="round" />
        </g>
        <!-- Live preview of the shape being dragged -->
        <rect v-if="preview && preview.type === 'rect'" :x="preview.x" :y="preview.y" :width="preview.w"
          :height="preview.h" :fill="preview.fill" :stroke="preview.stroke" :stroke-width="preview.strokeWidth"
          stroke-dasharray="4 3" />
        <ellipse v-if="preview && preview.type === 'ellipse'" :cx="preview.cx" :cy="preview.cy" :rx="preview.rx"
          :ry="preview.ry" :fill="preview.fill" :stroke="preview.stroke" :stroke-width="preview.strokeWidth"
          stroke-dasharray="4 3" />
        <line v-if="preview && preview.type === 'line'" :x1="preview.x1" :y1="preview.y1" :x2="preview.x2"
          :y2="preview.y2" :stroke="preview.stroke" :stroke-width="preview.strokeWidth" stroke-linecap="round" stroke-dasharray="4 3" />
      </svg>
    </div>

    <!-- Status bar -->
    <div class="svg-status">
      <span class="svg-status-tool">{{ toolLabel }}</span>
      <span class="svg-status-coords">{{ cursorText || '—' }}</span>
      <span class="svg-status-count">{{ shapes.length }} shape{{ shapes.length === 1 ? '' : 's' }}</span>
      <span class="svg-status-size">{{ canvasW }} × {{ canvasH }}px</span>
    </div>

    <!-- Code viewer -->
    <div v-if="showCode" class="svg-code-overlay" @click.self="showCode = false">
      <div class="svg-code-panel">
        <div class="svg-code-title">
          <span>SVG source</span>
          <button type="button" class="svg-btn" @click="showCode = false">Close</button>
        </div>
        <textarea ref="codeEl" class="svg-code-text" readonly spellcheck="false" :value="svgSource"></textarea>
        <div class="svg-code-actions">
          <button type="button" class="svg-btn" @click="copySvg">Copy to clipboard</button>
          <button type="button" class="svg-btn svg-btn-primary" @click="downloadSvg">Download .svg</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const canvasW = 800
const canvasH = 500
const strokeWidths = [1, 2, 3, 5, 8]

// The classic 16-color palette.
const palette = [
  '#000000', '#808080', '#c0c0c0', '#ffffff',
  '#800000', '#ff0000', '#808000', '#ffff00',
  '#008000', '#00ff00', '#008080', '#00ffff',
  '#000080', '#0000ff', '#800080', '#ff00ff',
]

const tool = ref('pen')
const strokeWidth = ref(3)
const strokeColor = ref('#000000')
const fillEnabled = ref(false)
const shapes = ref([])
const preview = ref(null)
const cursorText = ref('')
const showCode = ref(false)
const codeEl = ref(null)
const svgEl = ref(null)
const canvasWrapEl = ref(null)

// Undo/redo: every committed edit is one entry in the history.
const undoStack = ref([])
const redoStack = ref([])
const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

const toolLabel = computed(
  () => ({ pen: 'Freehand pen', line: 'Line', rect: 'Rectangle', ellipse: 'Ellipse' }[tool.value])
)

function setTool(next) {
  tool.value = next
  cancelStroke()
}

// Converts a pointer event to SVG user coordinates. The canvas is
// scaled by CSS, so the viewBox math has to go through the SVG
// transform matrix to stay accurate.
function toSvgPoint(e) {
  if (svgEl.value && typeof svgEl.value.getScreenCTM === 'function') {
    const pt = svgEl.value.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const inverse = svgEl.value.getScreenCTM().inverse()
    const mapped = pt.matrixTransform(inverse)
    return { x: mapped.x, y: mapped.y }
  }
  const rect = svgEl.value.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvasW,
    y: ((e.clientY - rect.top) / rect.height) * canvasH,
  }
}

const drawingState = ref(null) // { start, lastPoint, d }

function onPointerDown(e) {
  const pt = toSvgPoint(e)
  cursorText.value = `${Math.round(pt.x)}, ${Math.round(pt.y)}`

  if (tool.value === 'pen') {
    drawingState.value = {
      d: `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
      last: pt,
    }
    try {
      svgEl.value.setPointerCapture(e.pointerId)
    } catch (err) {}
  } else {
    drawingState.value = { start: pt }
    try {
      svgEl.value.setPointerCapture(e.pointerId)
    } catch (err) {}
    updatePreview(pt)
  }
}

function onPointerMove(e) {
  const pt = toSvgPoint(e)
  cursorText.value = `${Math.round(pt.x)}, ${Math.round(pt.y)}`

  if (!drawingState.value) return

  if (tool.value === 'pen') {
    const last = drawingState.value.last
    const dx = pt.x - last.x
    const dy = pt.y - last.y
    if (dx * dx + dy * dy > 2) {
      drawingState.value.d += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
      drawingState.value.last = pt
      preview.value = { type: 'path', d: drawingState.value.d }
    }
  } else {
    updatePreview(pt)
  }
}

function updatePreview(pt) {
  const s = drawingState.value.start
  const x = Math.min(s.x, pt.x)
  const y = Math.min(s.y, pt.y)
  const w = Math.abs(pt.x - s.x)
  const h = Math.abs(pt.y - s.y)
  const fill = fillEnabled.value ? strokeColor.value : 'none'
  const attrs = {
    stroke: strokeColor.value,
    strokeWidth: strokeWidth.value,
    fill,
  }
  if (tool.value === 'line') {
    preview.value = { type: 'line', x1: s.x, y1: s.y, x2: pt.x, y2: pt.y, ...attrs }
  } else if (tool.value === 'rect') {
    preview.value = { type: 'rect', x, y, w, h, ...attrs }
  } else if (tool.value === 'ellipse') {
    preview.value = { type: 'ellipse', cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2, ...attrs }
  }
}

function onPointerUp() {
  if (!drawingState.value) return
  const s = drawingState.value

  if (tool.value === 'pen') {
    if (preview.value && preview.value.d && preview.value.d.length > 2) {
      commit({
        type: 'path',
        d: preview.value.d,
        stroke: strokeColor.value,
        strokeWidth: strokeWidth.value,
      })
    }
  } else if (preview.value) {
    // Skip degenerate shapes (a click without a drag).
    const p = preview.value
    const isReal =
      p.type === 'rect' ? p.w > 0 && p.h > 0
      : p.type === 'ellipse' ? p.rx > 0 && p.ry > 0
      : true
    if (isReal) {
      commit(p)
    }
  }
  cancelStroke()
}

function cancelStroke() {
  drawingState.value = null
  preview.value = null
}

function commit(shape) {
  undoStack.value.push(shapes.value)
  shapes.value = [...shapes.value, shape]
  redoStack.value = []
}

function undo() {
  if (!canUndo.value) return
  redoStack.value.push(shapes.value)
  shapes.value = undoStack.value.pop()
}

function redo() {
  if (!canRedo.value) return
  undoStack.value.push(shapes.value)
  shapes.value = redoStack.value.pop()
}

function clearAll() {
  undoStack.value.push(shapes.value)
  shapes.value = []
  redoStack.value = []
}

function buildSvgSource() {
  const body = shapes.value
    .map((s) => {
      const stroke = ` stroke="${s.stroke}" stroke-width="${s.strokeWidth}"`
      const fill = ` fill="${s.fill}"`
      switch (s.type) {
        case 'rect':
          return `<rect x="${r(s.x)}" y="${r(s.y)}" width="${r(s.w)}" height="${r(s.h)}"${stroke}${fill} />`
        case 'ellipse':
          return `<ellipse cx="${r(s.cx)}" cy="${r(s.cy)}" rx="${r(s.rx)}" ry="${r(s.ry)}"${stroke}${fill} />`
        case 'line':
          return `<line x1="${r(s.x1)}" y1="${r(s.y1)}" x2="${r(s.x2)}" y2="${r(s.y2)}"${stroke} stroke-linecap="round" />`
        case 'path':
          return `<path d="${s.d}"${stroke} stroke-linecap="round" stroke-linejoin="round" />`
        default:
          return ''
      }
    })
    .join('\n  ')
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">`,
    `  <!-- Created with MAV OS SVG Creator -->`,
    `  <rect width="100%" height="100%" fill="#ffffff" />`,
    body ? `  ${body}` : `  <!-- canvas is empty -->`,
    `</svg>`,
  ].join('\n')
}

function r(n) {
  return Math.round(n * 10) / 10
}

const svgSource = computed(buildSvgSource)

function downloadSvg() {
  const blob = new Blob([buildSvgSource()], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'drawing.svg'
  a.click()
  URL.revokeObjectURL(url)
}

function exportSvg() {
  if (shapes.value.length === 0) {
    downloadSvg()
    return
  }
  showCode.value = true
}

async function copySvg() {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(svgSource.value)
    }
  } catch (err) {}
}

function onKeydown(e) {
  const key = e.key.toLowerCase()
  if ((e.ctrlKey || e.metaKey) && key === 'z') {
    e.preventDefault()
    e.shiftKey ? redo() : undo()
  } else if ((e.ctrlKey || e.metaKey) && key === 'y') {
    e.preventDefault()
    redo()
  } else if ((e.ctrlKey || e.metaKey) && key === 's') {
    e.preventDefault()
    exportSvg()
  } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
    const map = { p: 'pen', l: 'line', r: 'rect', o: 'ellipse' }
    if (map[key]) {
      setTool(map[key])
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.svg-app {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #c0c0c0;
  color: #000;
  font-family: 'MS Sans Serif', 'Segoe UI', Tahoma, sans-serif;
  overflow: hidden;
}

/* Toolbar ------------------------------------------------------- */
.svg-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 5px 6px;
  border-bottom: 1px solid #808080;
  background: #c0c0c0;
}

.svg-toolgroup {
  display: flex;
  align-items: center;
  gap: 2px;
}

.svg-sep {
  width: 2px;
  height: 22px;
  background: #808080;
  border-left: 1px solid #fff;
}

.svg-tool {
  width: 28px;
  height: 26px;
  background: #c0c0c0;
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-bottom: 1px solid #808080;
  border-right: 1px solid #808080;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-tool:hover {
  background: #d8d8d8;
}

.svg-tool.active {
  background: #e0e0e0;
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
}

.svg-label {
  font-size: 11px;
  margin-right: 2px;
}

.svg-toolbar select {
  font-size: 11px;
  background: #fff;
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
  padding: 1px 2px;
}

.svg-color-sample {
  width: 16px;
  height: 16px;
  border: 1px solid #808080;
  margin-right: 4px;
}

.svg-swatch {
  width: 15px;
  height: 15px;
  padding: 0;
  border: 1px solid #808080;
  cursor: pointer;
}

.svg-swatch.active {
  outline: 1px dotted #000;
  outline-offset: 1px;
}

.svg-check {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.svg-btn {
  font-size: 11px;
  padding: 3px 10px;
  background: #c0c0c0;
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-bottom: 1px solid #808080;
  border-right: 1px solid #808080;
  cursor: pointer;
  font-family: 'MS Sans Serif', 'Segoe UI', Tahoma, sans-serif;
}

.svg-btn:active:not(:disabled) {
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
}

.svg-btn:disabled {
  color: #808080;
  cursor: default;
}

.svg-btn-primary {
  background: #000080;
  color: #fff;
  border-top: 1px solid #6060c0;
  border-left: 1px solid #6060c0;
  border-bottom: 1px solid #000040;
  border-right: 1px solid #000040;
}

.svg-btn-primary:active:not(:disabled) {
  border-top: 1px solid #000040;
  border-left: 1px solid #000040;
  border-bottom: 1px solid #6060c0;
  border-right: 1px solid #6060c0;
}

.svg-spacer {
  flex: 1 1 auto;
}

/* Canvas -------------------------------------------------------- */
.svg-canvas-wrap {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: #808080;
}

.svg-canvas {
  width: 100%;
  height: 100%;
  background: #fff;
  touch-action: none;
  cursor: crosshair;
  border-top: 1px solid #000;
  border-left: 1px solid #000;
  border-right: 1px solid #fff;
  border-bottom: 1px solid #fff;
}

/* Status bar ---------------------------------------------------- */
.svg-status {
  flex: 0 0 auto;
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 2px 6px;
  font-size: 11px;
  border-top: 1px solid #fff;
  background: #c0c0c0;
  user-select: none;
}

.svg-status-coords {
  min-width: 80px;
}

.svg-status-count {
  margin-left: auto;
}

/* Code viewer --------------------------------------------------- */
.svg-code-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-code-panel {
  width: 85%;
  max-width: 560px;
  background: #c0c0c0;
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-bottom: 1px solid #808080;
  border-right: 1px solid #808080;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.4);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.svg-code-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
}

.svg-code-text {
  width: 100%;
  height: 260px;
  resize: none;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 11px;
  background: #fff;
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
  padding: 6px;
  white-space: pre;
}

.svg-code-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
</style>

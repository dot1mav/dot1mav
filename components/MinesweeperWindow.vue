<template>
  <div class="ms">
    <div class="ms-toolbar">
      <div class="ms-difficulty" role="tablist" aria-label="Difficulty">
        <button
          v-for="d in DIFFICULTIES"
          :key="d.key"
          type="button"
          role="tab"
          :aria-selected="difficulty.key === d.key"
          class="ms-diff-btn"
          :class="{ active: difficulty.key === d.key }"
          @click="setDifficulty(d.key)"
        >{{ d.label }}</button>
      </div>
      <div class="ms-readouts">
        <div class="ms-lcd" aria-label="Mines remaining">
          <span class="ms-lcd-digits">{{ lcd(minesLeft) }}</span>
        </div>
        <button
          type="button"
          class="ms-face"
          :class="`ms-face--${faceState}`"
          :aria-label="`Reset game (currently ${faceState})`"
          @click="resetGame"
        >
          <svg viewBox="0 0 24 24" class="ms-face-glyph" aria-hidden="true">
            <template v-if="faceState === 'won'">
              <rect x="3" y="9" width="18" height="2" fill="currentColor" />
              <rect x="6" y="6" width="3" height="3" fill="currentColor" />
              <rect x="15" y="6" width="3" height="3" fill="currentColor" />
              <rect x="4" y="13" width="2" height="2" fill="currentColor" />
              <rect x="18" y="13" width="2" height="2" fill="currentColor" />
              <rect x="6" y="13" width="2" height="2" fill="currentColor" />
              <rect x="10" y="14" width="4" height="1" fill="currentColor" />
              <rect x="11" y="15" width="2" height="1" fill="currentColor" />
              <rect x="9" y="16" width="6" height="1" fill="currentColor" />
            </template>
            <template v-else-if="faceState === 'dead'">
              <rect x="3" y="9" width="18" height="2" fill="currentColor" />
              <line x1="5" y1="6" x2="9" y2="10" stroke="currentColor" stroke-width="2" />
              <line x1="9" y1="6" x2="5" y2="10" stroke="currentColor" stroke-width="2" />
              <line x1="15" y1="6" x2="19" y2="10" stroke="currentColor" stroke-width="2" />
              <line x1="19" y1="6" x2="15" y2="10" stroke="currentColor" stroke-width="2" />
              <rect x="6" y="14" width="12" height="1" fill="currentColor" />
            </template>
            <template v-else-if="faceState === 'ooh'">
              <rect x="3" y="9" width="18" height="2" fill="currentColor" />
              <circle cx="8" cy="7" r="2" fill="currentColor" />
              <circle cx="16" cy="7" r="2" fill="currentColor" />
              <rect x="8" y="14" width="8" height="1" fill="currentColor" />
            </template>
            <template v-else>
              <rect x="3" y="9" width="18" height="2" fill="currentColor" />
              <circle cx="8" cy="7" r="1.5" fill="currentColor" />
              <circle cx="16" cy="7" r="1.5" fill="currentColor" />
              <rect x="9" y="14" width="6" height="1" fill="currentColor" />
            </template>
          </svg>
        </button>
        <div class="ms-lcd" aria-label="Seconds elapsed">
          <span class="ms-lcd-digits">{{ lcd(timer) }}</span>
        </div>
      </div>
    </div>

    <div
      ref="boardEl"
      class="ms-board"
      :class="{ 'ms-board--win': gameWon, 'ms-board--dead': gameOver }"
      :style="boardStyle"
      role="grid"
      :aria-rowcount="ROWS"
      :aria-colcount="COLS"
      @contextmenu.prevent
      @mouseleave="chordArmed = false"
    >
      <div
        v-for="(row, y) in grid"
        :key="y"
        class="ms-row"
        role="row"
      >
        <button
          v-for="(cell, x) in row"
          :key="x"
          type="button"
          class="ms-cell"
          :class="cellClass(cell)"
          :style="{ '--flash': cell.flash ? '1' : '0' }"
          :role="cell.revealed ? 'gridcell' : 'button'"
          :aria-label="ariaCell(x, y)"
          :tabindex="(x === focusX && y === focusY) ? 0 : -1"
          @click.left="onLeft(x, y, $event)"
          @click.right.prevent="onRight(x, y, $event)"
          @mousedown.middle="onChordPress(x, y, $event)"
          @mouseup.middle="onChordRelease(x, y, $event)"
        >
          <span v-if="cell.revealed && cell.mine" class="ms-glyph ms-glyph--mine" aria-hidden="true">*</span>
          <span
            v-else-if="cell.revealed && cell.adjacent > 0"
            :class="['ms-glyph', 'ms-glyph--num', `ms-num-${cell.adjacent}`]"
            aria-hidden="true"
          >{{ cell.adjacent }}</span>
          <span v-else-if="!cell.revealed && cell.flagged" class="ms-glyph ms-glyph--flag" aria-hidden="true">F</span>
          <span
            v-else-if="!cell.revealed && cell.questioned"
            class="ms-glyph ms-glyph--q"
            aria-hidden="true"
          >?</span>
        </button>
      </div>
      <div class="ms-scanlines" aria-hidden="true"></div>
    </div>

    <div class="ms-hint">
      <span>Left: reveal · Right: flag · Arrows + Space/Enter: keyboard · R: reset</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const DIFFICULTIES = [
  { key: 'beginner', label: 'B', title: 'Beginner · 9×9 · 10 mines', rows: 9, cols: 9, mines: 10 },
  { key: 'intermediate', label: 'I', title: 'Intermediate · 16×16 · 40 mines', rows: 16, cols: 16, mines: 40 },
  { key: 'expert', label: 'E', title: 'Expert · 30×16 · 99 mines', rows: 16, cols: 30, mines: 99 },
]

const STORAGE_KEY = 'dot1mav.minesweeper.difficulty'

function loadDifficulty() {
  if (typeof window === 'undefined') return DIFFICULTIES[0]
  const saved = window.localStorage.getItem(STORAGE_KEY)
  return DIFFICULTIES.find(d => d.key === saved) || DIFFICULTIES[0]
}

const difficulty = reactive(loadDifficulty())

const ROWS = computed(() => difficulty.rows)
const COLS = computed(() => difficulty.cols)
const MINES = computed(() => difficulty.mines)

const grid = ref([])
const playing = ref(false)
const gameOver = ref(false)
const gameWon = ref(false)
const timer = ref(0)
const timerInterval = ref(null)
const minesLeft = ref(MINES.value)
const revealedCount = ref(0)
const firstMove = ref(true)

const focusX = ref(0)
const focusY = ref(0)
const boardEl = ref(null)
const chordArmed = ref(false)
const reducedMotion = ref(false)

const faceState = computed(() => {
  if (gameWon.value) return 'won'
  if (gameOver.value) return 'dead'
  if (playing.value) return 'ooh'
  return 'smile'
})

const boardStyle = computed(() => ({
  '--rows': ROWS.value,
  '--cols': COLS.value,
}))

function lcd(n) {
  const clamped = Math.max(-99, Math.min(999, n))
  return String(clamped).padStart(3, '0').replace('-', '_')
}

function cellClass(cell) {
  return {
    'ms-cell--revealed': cell.revealed,
    'ms-cell--flagged': cell.flagged && !cell.revealed,
    'ms-cell--questioned': cell.questioned && !cell.revealed,
    'ms-cell--mine': cell.revealed && cell.mine,
    'ms-cell--wrong': cell.revealed && cell.wrong,
    'ms-cell--flash': cell.flash,
  }
}

function ariaCell(x, y) {
  const c = grid.value[y]?.[x]
  if (!c) return ''
  if (c.revealed) {
    if (c.mine) return 'Mine'
    if (c.adjacent === 0) return 'Empty'
    return `${c.adjacent} adjacent`
  }
  if (c.flagged) return 'Flagged'
  if (c.questioned) return 'Questioned'
  return `Hidden, row ${y + 1}, column ${x + 1}`
}

function createCell() {
  return {
    mine: false,
    revealed: false,
    flagged: false,
    questioned: false,
    wrong: false,
    adjacent: 0,
    flash: false,
  }
}

function initGrid() {
  const g = []
  for (let y = 0; y < ROWS.value; y++) {
    const row = []
    for (let x = 0; x < COLS.value; x++) row.push(createCell())
    g.push(row)
  }
  return g
}

function placeMines(g, safeX, safeY) {
  const safe = new Set()
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = safeX + dx, ny = safeY + dy
      if (nx >= 0 && nx < COLS.value && ny >= 0 && ny < ROWS.value) safe.add(`${nx},${ny}`)
    }
  }
  let placed = 0
  const total = ROWS.value * COLS.value
  const candidates = []
  for (let i = 0; i < total; i++) {
    const x = i % COLS.value, y = Math.floor(i / COLS.value)
    if (!safe.has(`${x},${y}`)) candidates.push(i)
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  for (let i = 0; i < MINES.value && i < candidates.length; i++) {
    const idx = candidates[i]
    const x = idx % COLS.value, y = Math.floor(idx / COLS.value)
    g[y][x].mine = true
  }
}

function calcAdjacent(g) {
  for (let y = 0; y < ROWS.value; y++) {
    for (let x = 0; x < COLS.value; x++) {
      if (g[y][x].mine) continue
      let count = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx, ny = y + dy
          if (nx >= 0 && nx < COLS.value && ny >= 0 && ny < ROWS.value && g[ny][nx].mine) count++
        }
      }
      g[y][x].adjacent = count
    }
  }
}

function resetGame() {
  clearInterval(timerInterval.value)
  timer.value = 0
  playing.value = false
  gameOver.value = false
  gameWon.value = false
  firstMove.value = true
  revealedCount.value = 0
  minesLeft.value = MINES.value
  grid.value = initGrid()
  focusX.value = Math.floor(COLS.value / 2)
  focusY.value = Math.floor(ROWS.value / 2)
}

function startTimer() {
  if (playing.value) return
  playing.value = true
  timerInterval.value = setInterval(() => {
    if (timer.value < 999) timer.value++
  }, 1000)
}

function revealCell(x, y) {
  const cell = grid.value[y]?.[x]
  if (!cell || cell.revealed || cell.flagged) return false
  cell.revealed = true
  cell.questioned = false
  if (!reducedMotion.value) {
    cell.flash = true
    setTimeout(() => { cell.flash = false }, 140)
  }
  if (!cell.mine) revealedCount.value++
  if (cell.adjacent === 0 && !cell.mine) floodReveal(x, y)
  return true
}

function floodReveal(x, y) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx, ny = y + dy
      if (nx >= 0 && nx < COLS.value && ny >= 0 && ny < ROWS.value) {
        revealCell(nx, ny)
      }
    }
  }
}

function detonate(x, y) {
  gameOver.value = true
  clearInterval(timerInterval.value)
  for (let yy = 0; yy < ROWS.value; yy++) {
    for (let xx = 0; xx < COLS.value; xx++) {
      const c = grid.value[yy][xx]
      if (c.mine) c.revealed = true
      else if (c.flagged) c.wrong = true
    }
  }
  grid.value[y][x].flash = true
  setTimeout(() => { grid.value[y][x].flash = false }, 600)
}

function checkWin() {
  if (revealedCount.value === ROWS.value * COLS.value - MINES.value) {
    gameWon.value = true
    clearInterval(timerInterval.value)
    for (const row of grid.value) {
      for (const cell of row) {
        if (cell.mine) cell.flagged = true
      }
    }
    minesLeft.value = 0
  }
}

function onLeft(x, y, ev) {
  if (gameOver.value || gameWon.value) return
  const cell = grid.value[y][x]
  if (cell.revealed && cell.adjacent > 0) {
    chord(x, y)
    return
  }
  if (cell.flagged || cell.questioned) return
  if (firstMove.value) {
    placeMines(grid.value, x, y)
    calcAdjacent(grid.value)
    firstMove.value = false
  }
  startTimer()
  revealCell(x, y)
  if (cell.mine) detonate(x, y)
  else checkWin()
}

function onRight(x, y, ev) {
  if (gameOver.value || gameWon.value) return
  const cell = grid.value[y][x]
  if (cell.revealed) return
  if (cell.flagged) {
    cell.flagged = false
    cell.questioned = true
    minesLeft.value++
  } else if (cell.questioned) {
    cell.questioned = false
  } else {
    cell.flagged = true
    minesLeft.value--
  }
}

function chord(x, y) {
  const cell = grid.value[y][x]
  let flagCount = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx, ny = y + dy
      if (nx >= 0 && nx < COLS.value && ny >= 0 && ny < ROWS.value) {
        if (grid.value[ny][nx].flagged) flagCount++
      }
    }
  }
  if (flagCount !== cell.adjacent) return
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx, ny = y + dy
      if (nx >= 0 && nx < COLS.value && ny >= 0 && ny < ROWS.value) {
        const c = grid.value[ny][nx]
        if (!c.revealed && !c.flagged) {
          if (firstMove.value) {
            placeMines(grid.value, x, y)
            calcAdjacent(grid.value)
            firstMove.value = false
          }
          startTimer()
          revealCell(nx, ny)
          if (c.mine) {
            detonate(nx, ny)
            return
          }
        }
      }
    }
  }
  checkWin()
}

function onChordPress() { chordArmed.value = true }
function onChordRelease(x, y) {
  if (!chordArmed.value) return
  chordArmed.value = false
  chord(x, y)
}

function setDifficulty(key) {
  const d = DIFFICULTIES.find(x => x.key === key)
  if (!d || d.key === difficulty.key) return
  Object.assign(difficulty, d)
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, d.key)
  resetGame()
}

function moveFocus(dx, dy) {
  const nx = Math.max(0, Math.min(COLS.value - 1, focusX.value + dx))
  const ny = Math.max(0, Math.min(ROWS.value - 1, focusY.value + dy))
  focusX.value = nx
  focusY.value = ny
  queueMicrotask(() => {
    const root = boardEl.value
    if (!root) return
    const btn = root.querySelectorAll('.ms-cell')[ny * COLS.value + nx]
    if (btn) btn.focus()
  })
}

function onKeydown(ev) {
  if (gameOver.value || gameWon.value) {
    if (ev.key === 'r' || ev.key === 'R') resetGame()
    return
  }
  switch (ev.key) {
    case 'ArrowLeft': moveFocus(-1, 0); ev.preventDefault(); break
    case 'ArrowRight': moveFocus(1, 0); ev.preventDefault(); break
    case 'ArrowUp': moveFocus(0, -1); ev.preventDefault(); break
    case 'ArrowDown': moveFocus(0, 1); ev.preventDefault(); break
    case 'Enter':
    case ' ':
      onLeft(focusX.value, focusY.value, ev)
      ev.preventDefault()
      break
    case 'f':
    case 'F':
      onRight(focusX.value, focusY.value, ev)
      ev.preventDefault()
      break
    case 'r':
    case 'R':
      resetGame()
      break
  }
}

watch(() => boardEl.value, (el) => {
  if (!el) return
  el.addEventListener('keydown', onKeydown)
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  resetGame()
})

onBeforeUnmount(() => {
  clearInterval(timerInterval.value)
  if (boardEl.value) boardEl.value.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.ms {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: var(--button-face);
  border-top: 2px solid var(--button-highlight);
  border-left: 2px solid var(--button-highlight);
  border-bottom: 2px solid var(--button-shadow);
  border-right: 2px solid var(--button-shadow);
  user-select: none;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
}

.ms-toolbar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 8px;
  background: var(--button-face);
  border-top: 2px solid var(--button-shadow);
  border-left: 2px solid var(--button-shadow);
  border-bottom: 2px solid var(--button-highlight);
  border-right: 2px solid var(--button-highlight);
}

.ms-difficulty {
  display: flex;
  gap: 4px;
}

.ms-diff-btn {
  flex: 1;
  padding: 2px 0;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  color: var(--text);
  background: var(--button-face);
  border-top: 1px solid var(--button-highlight);
  border-left: 1px solid var(--button-highlight);
  border-bottom: 1px solid var(--button-shadow);
  border-right: 1px solid var(--button-shadow);
  cursor: pointer;
}

.ms-diff-btn.active {
  border-top-color: var(--button-shadow);
  border-left-color: var(--button-shadow);
  border-bottom-color: var(--button-highlight);
  border-right-color: var(--button-highlight);
  background: var(--surface-muted, #edf0ef);
}

.ms-readouts {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ms-lcd {
  background: #0a1208;
  padding: 2px 4px;
  border-top: 1px solid var(--button-shadow);
  border-left: 1px solid var(--button-shadow);
  border-bottom: 1px solid var(--button-highlight);
  border-right: 1px solid var(--button-highlight);
  min-width: 48px;
}

.ms-lcd-digits {
  font-family: 'DSEG7-Classic', 'Courier New', monospace;
  font-weight: 700;
  font-size: 20px;
  color: #ff3a1a;
  letter-spacing: 1px;
  text-shadow: 0 0 4px rgba(255, 58, 26, 0.45);
  display: inline-block;
}

.ms-face {
  width: 30px;
  height: 30px;
  background: var(--button-face);
  border-top: 2px solid var(--button-highlight);
  border-left: 2px solid var(--button-highlight);
  border-bottom: 2px solid var(--button-shadow);
  border-right: 2px solid var(--button-shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.ms-face:active {
  border-top-color: var(--button-shadow);
  border-left-color: var(--button-shadow);
  border-bottom-color: var(--button-highlight);
  border-right-color: var(--button-highlight);
}

.ms-face-glyph {
  width: 22px;
  height: 22px;
  color: var(--text);
}

.ms-face--dead .ms-face-glyph { color: var(--text); }
.ms-face--won .ms-face-glyph { color: var(--accent, #176b72); }
.ms-face--ooh .ms-face-glyph { color: var(--accent, #176b72); }

.ms-board {
  position: relative;
  display: grid;
  grid-template-rows: repeat(var(--rows), 24px);
  grid-auto-flow: row;
  gap: 1px;
  padding: 1px;
  background: rgba(123, 227, 154, 0.18);
  border-top: 2px solid var(--button-shadow);
  border-left: 2px solid var(--button-shadow);
  border-bottom: 2px solid var(--button-highlight);
  border-right: 2px solid var(--button-highlight);
  outline: none;
}

.ms-row {
  display: grid;
  grid-template-columns: repeat(var(--cols), 24px);
  gap: 1px;
}

.ms-cell {
  width: 24px;
  height: 24px;
  background: var(--button-face);
  border-top: 1px solid var(--button-highlight);
  border-left: 1px solid var(--button-highlight);
  border-bottom: 1px solid var(--button-shadow);
  border-right: 1px solid var(--button-shadow);
  color: var(--text);
  font-family: 'VT323', 'Courier New', monospace;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: filter 140ms ease-out;
}

.ms-cell--revealed {
  background: #0b1a14;
  border: 1px solid #14302a;
  color: #7be39a;
}

.ms-cell--revealed.ms-cell--mine {
  background: #2a0d05;
  border-color: #5a1a08;
  color: #ffb648;
}

.ms-cell--revealed.ms-cell--wrong {
  background: #1a0d05;
  border-color: #3a1a08;
  color: #ffb648;
}

.ms-cell--flagged {
  color: #7be39a;
}

.ms-cell--questioned {
  color: #2a6b48;
}

.ms-cell--flash {
  filter: brightness(1.7);
}

.ms-glyph {
  font-family: inherit;
}

.ms-glyph--mine::before { content: '*'; font-size: 22px; }
.ms-glyph--flag::before { content: 'F'; font-size: 16px; font-weight: 700; }
.ms-glyph--q::before { content: '?'; font-size: 16px; }

.ms-num-1 { color: #7be39a; }
.ms-num-2 { color: #b6f0c8; }
.ms-num-3 { color: #ffb648; }
.ms-num-4 { color: #5fb8ff; }
.ms-num-5 { color: #ff8a8a; }
.ms-num-6 { color: #9ce0c8; }
.ms-num-7 { color: #f0f0f0; }
.ms-num-8 { color: #ffb648; }

.ms-scanlines {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 2px,
    rgba(123, 227, 154, 0.05) 2px,
    rgba(123, 227, 154, 0.05) 3px
  );
  mix-blend-mode: screen;
}

.ms-board--win {
  animation: ms-pulse 700ms ease-out 1;
}

.ms-board--dead .ms-cell--revealed:not(.ms-cell--mine):not(.ms-cell--wrong) {
  filter: saturate(0.4);
}

@keyframes ms-pulse {
  0% { box-shadow: inset 0 0 0 0 rgba(255, 182, 72, 0); }
  40% { box-shadow: inset 0 0 24px 4px rgba(255, 182, 72, 0.45); }
  100% { box-shadow: inset 0 0 0 0 rgba(255, 182, 72, 0); }
}

.ms-hint {
  font-size: 10px;
  color: var(--text);
  opacity: 0.7;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .ms-cell { transition: none; }
  .ms-board--win { animation: none; }
  .ms-cell--flash { filter: none; }
}
</style>

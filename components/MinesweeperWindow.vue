<template>
  <div class="minesweeper">
    <div class="ms-header">
      <div class="ms-counter">
        <span class="ms-digit">{{ String(minesLeft).padStart(3, '0') }}</span>
      </div>
      <button class="ms-face" :class="{ dead: gameOver, won: gameWon }" @click="resetGame">
        {{ gameWon ? '😎' : gameOver ? '😵' : playing ? '😮' : '🙂' }}
      </button>
      <div class="ms-counter">
        <span class="ms-digit">{{ String(timer).padStart(3, '0') }}</span>
      </div>
    </div>
    <div class="ms-grid" @contextmenu.prevent>
      <div v-for="(row, y) in grid" :key="y" class="ms-row">
        <button
          v-for="(cell, x) in row"
          :key="x"
          class="ms-cell"
          :class="cellClass(cell)"
          @click.left="reveal(x, y)"
          @click.right="flag(x, y)"
          @contextmenu.prevent
        >
          <template v-if="cell.revealed">
            <span v-if="cell.mine" class="ms-mine">💣</span>
            <span v-else-if="cell.adjacent > 0" :class="'ms-num-' + cell.adjacent">{{ cell.adjacent }}</span>
          </template>
          <template v-else-if="cell.flagged">
            <span class="ms-flag">🚩</span>
          </template>
        </button>
      </div>
    </div>
    <div class="ms-footer">
      <span>Right-click to flag | Click face to reset</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'

const COLS = 9
const ROWS = 9
const MINES = 10

const grid = ref([])
const playing = ref(false)
const gameOver = ref(false)
const gameWon = ref(false)
const timer = ref(0)
const timerInterval = ref(null)
const minesLeft = ref(MINES)
const revealedCount = ref(0)

function createCell() {
  return { mine: false, revealed: false, flagged: false, adjacent: 0 }
}

function initGrid() {
  const g = []
  for (let y = 0; y < ROWS; y++) {
    const row = []
    for (let x = 0; x < COLS; x++) {
      row.push(createCell())
    }
    g.push(row)
  }
  return g
}

function placeMines(g) {
  let placed = 0
  while (placed < MINES) {
    const x = Math.floor(Math.random() * COLS)
    const y = Math.floor(Math.random() * ROWS)
    if (!g[y][x].mine) {
      g[y][x].mine = true
      placed++
    }
  }
}

function calcAdjacent(g) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (g[y][x].mine) continue
      let count = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy, nx = x + dx
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && g[ny][nx].mine) count++
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
  revealedCount.value = 0
  minesLeft.value = MINES
  const g = initGrid()
  placeMines(g)
  calcAdjacent(g)
  grid.value = g
}

function startTimer() {
  if (playing.value) return
  playing.value = true
  timer.value = 0
  timerInterval.value = setInterval(() => {
    if (timer.value < 999) timer.value++
  }, 1000)
}

function reveal(x, y) {
  if (gameOver.value || gameWon.value) return
  const cell = grid.value[y][x]
  if (cell.revealed || cell.flagged) return

  startTimer()
  cell.revealed = true

  if (cell.mine) {
    gameOver.value = true
    clearInterval(timerInterval.value)
    revealAllMines()
    return
  }

  revealedCount.value++
  if (cell.adjacent === 0) floodReveal(x, y)
  checkWin()
}

function floodReveal(x, y) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const ny = y + dy, nx = x + dx
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
        const c = grid.value[ny][nx]
        if (!c.revealed && !c.flagged && !c.mine) {
          c.revealed = true
          revealedCount.value++
          if (c.adjacent === 0) floodReveal(nx, ny)
        }
      }
    }
  }
}

function flag(x, y) {
  if (gameOver.value || gameWon.value) return
  const cell = grid.value[y][x]
  if (cell.revealed) return
  cell.flagged = !cell.flagged
  minesLeft.value += cell.flagged ? -1 : 1
}

function revealAllMines() {
  for (const row of grid.value) {
    for (const cell of row) {
      if (cell.mine) cell.revealed = true
    }
  }
}

function checkWin() {
  if (revealedCount.value === COLS * ROWS - MINES) {
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

function cellClass(cell) {
  return {
    revealed: cell.revealed,
    flagged: cell.flagged,
    mine: cell.revealed && cell.mine,
  }
}

resetGame()

onBeforeUnmount(() => clearInterval(timerInterval.value))
</script>

<style scoped>
.minesweeper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 6px;
  background: #c0c0c0;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #808080;
  border-right: 2px solid #808080;
  user-select: none;
}

.ms-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 6px;
  background: #c0c0c0;
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-bottom: 2px solid #fff;
  border-right: 2px solid #fff;
}

.ms-counter {
  background: #000;
  padding: 2px 4px;
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
}

.ms-digit {
  font-family: 'Courier New', monospace;
  font-size: 20px;
  font-weight: 700;
  color: #ff0000;
  letter-spacing: 2px;
  min-width: 3ch;
  display: inline-block;
  text-align: center;
}

.ms-face {
  width: 30px;
  height: 30px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #c0c0c0;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #808080;
  border-right: 2px solid #808080;
  padding: 0;
}

.ms-face:active,
.ms-face.dead,
.ms-face.won {
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-bottom: 2px solid #fff;
  border-right: 2px solid #fff;
}

.ms-grid {
  display: flex;
  flex-direction: column;
  border-top: 3px solid #808080;
  border-left: 3px solid #808080;
  border-bottom: 3px solid #fff;
  border-right: 3px solid #fff;
}

.ms-row {
  display: flex;
}

.ms-cell {
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #c0c0c0;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #808080;
  border-right: 2px solid #808080;
  padding: 0;
  line-height: 1;
}

.ms-cell.revealed {
  border: 1px solid #808080;
  background: #c0c0c0;
}

.ms-cell:active:not(.revealed) {
  border: 1px solid #808080;
}

.ms-mine { font-size: 14px; }
.ms-flag { font-size: 14px; }

.ms-num-1 { color: #0000ff; }
.ms-num-2 { color: #008000; }
.ms-num-3 { color: #ff0000; }
.ms-num-4 { color: #000080; }
.ms-num-5 { color: #800000; }
.ms-num-6 { color: #008080; }
.ms-num-7 { color: #000000; }
.ms-num-8 { color: #808080; }

.ms-footer {
  font-size: 10px;
  color: #555;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
}
</style>

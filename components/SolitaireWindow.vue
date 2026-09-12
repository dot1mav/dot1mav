<template>
  <div class="solitaire">
    <div class="felt">
      <div class="top-row">
        <button class="deck" type="button" aria-label="Shuffle and deal" @click="deal">
          <span class="card back"><span class="logo">♠</span></span>
          <span class="deck-count">{{ deck.length }} in deck</span>
        </button>
        <p class="hint">Klondike is being built — click the deck to shuffle, click a card to flip it.</p>
      </div>
      <div class="tableau">
        <div v-for="(col, c) in columns" :key="c" class="column">
          <div
            v-for="(card, i) in col"
            :key="card.id"
            class="card"
            :class="[card.up ? 'face ' + card.color : 'back']"
            :style="{ top: `${i * 18}px` }"
            @click="flip(card)"
          >
            <template v-if="card.up">
              <span class="corner">{{ card.rank }}<br />{{ card.suit }}</span>
              <span class="pip">{{ card.suit }}</span>
            </template>
            <span v-else class="logo">♠</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const SUITS = [
  { suit: '♠', color: 'black' },
  { suit: '♥', color: 'red' },
  { suit: '♦', color: 'red' },
  { suit: '♣', color: 'black' },
]
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

let cardId = 0
function buildDeck() {
  const cards = []
  for (const { suit, color } of SUITS) {
    for (const rank of RANKS) {
      cards.push({ id: ++cardId, suit, color, rank, up: false })
    }
  }
  return cards
}

function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

function deal() {
  const cards = shuffle(buildDeck())
  const columns = []
  for (let c = 0; c < 7; c++) {
    const col = cards.splice(0, c + 1)
    if (col.length) col[col.length - 1].up = true
    columns.push(col)
  }
  deck.value = cards
  columns.value = columns
}

const deck = ref([])
const columns = ref([])

function flip(card) {
  card.up = !card.up
}

deal()
</script>

<style scoped>
.solitaire {
  width: 100%;
}

.felt {
  background: #008000;
  border: 2px inset var(--border-darkest, #000);
  border-radius: 3px;
  padding: 10px;
  min-height: 300px;
}

.top-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.deck {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.deck-count {
  color: #fff;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 11px;
}

.hint {
  color: #dfe8df;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 11px;
  margin: 0;
}

.tableau {
  display: flex;
  gap: 8px;
}

.column {
  position: relative;
  width: 44px;
  min-height: 140px;
  flex-shrink: 0;
}

.card {
  position: absolute;
  left: 0;
  width: 44px;
  height: 62px;
  border-radius: 4px;
  border: 1px solid #000;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  user-select: none;
}

.card.back {
  background: #1a3a8f;
  background-image: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.12) 0 3px, transparent 3px 6px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card.face {
  background: #fff;
  cursor: pointer;
}

.card.red { color: #c00; }
.card.black { color: #111; }

.logo {
  color: #fff;
  font-size: 14px;
}

.corner {
  position: absolute;
  top: 2px;
  left: 3px;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.05;
}

.pip {
  position: absolute;
  bottom: 3px;
  right: 5px;
  font-size: 16px;
}
</style>

<template>
  <div class="terminal" @click="handleTerminalClick">
    <!-- Title bar - classic Win98 MS-DOS blue -->
    <div class="terminal-header">
      <div class="terminal-header-left">
        <span class="terminal-icon">⬛</span>
        <span class="terminal-header-title">MS-DOS Prompt</span>
      </div>
      <div class="terminal-header-right">
        <button type="button" class="t-menu-btn" :class="{ active: terminalMenu === 'file' }"
          @click.stop="toggleTerminalMenu('file')">File</button>
        <button type="button" class="t-menu-btn" :class="{ active: terminalMenu === 'edit' }"
          @click.stop="toggleTerminalMenu('edit')">Edit</button>
        <button type="button" class="t-menu-btn" :class="{ active: terminalMenu === 'help' }"
          @click.stop="toggleTerminalMenu('help')">Help</button>
      </div>
    </div>

    <!-- Dropdown menus -->
    <div class="terminal-menus">
      <ul v-if="terminalMenu === 'file'" class="terminal-menu">
        <li><button type="button" class="terminal-menu-item"
            @click="terminalMenu = null; closeTerminal()">Exit</button></li>
      </ul>
      <ul v-else-if="terminalMenu === 'edit'" class="terminal-menu">
        <li><button type="button" class="terminal-menu-item"
            @click="terminalMenu = null; clearTerminal()">Clear Screen</button></li>
        <li><button type="button" class="terminal-menu-item"
            @click="terminalMenu = null; copyTerminalOutput()">Copy</button></li>
      </ul>
      <ul v-else-if="terminalMenu === 'help'" class="terminal-menu">
        <li><button type="button" class="terminal-menu-item"
            @click="terminalMenu = null; printAbout()">About</button></li>
      </ul>
    </div>

    <!-- Terminal output -->
    <div class="terminal-output" ref="terminalOutputEl" role="log" aria-live="polite" aria-label="Terminal output">
      <div v-for="(line, index) in terminalLines" :key="index" :class="['t-line', line.type]">
        <a v-if="line.type === 'link'" class="t-link" :href="line.href" target="_blank"
          rel="noopener noreferrer">{{ line.text }}</a>
        <template v-else>{{ line.text }}</template>
      </div>
    </div>

    <!-- Input line -->
    <div class="terminal-input-line">
      <span class="t-prompt">{{ terminalPrompt }}</span>
      <input ref="terminalInputEl" v-model="terminalInput" type="text" autocomplete="off"
        spellcheck="false" aria-label="Terminal input" @keydown="onTerminalKeydown"
        :style="{ width: terminalInputWidth }" />
      <span class="t-cursor"></span>
      <span class="t-hint">Tab autocomplete | ↑↓ history | F1 help</span>
    </div>
  </div>
</template>

<script setup>
import { useTerminal } from '../composables/useTerminal'

const {
  terminalLines,
  terminalInput,
  terminalOutputEl,
  terminalInputEl,
  terminalMenu,
  terminalInputWidth,
  terminalPrompt,
  handleTerminalClick,
  toggleTerminalMenu,
  clearTerminal,
  onTerminalKeydown,
  closeTerminal,
  printAbout,
  copyTerminalOutput,
} = useTerminal()
</script>

<style scoped>
/* ---- Authentic MS-DOS Prompt ---- */
.terminal {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #000;
  color: #aaa;
  font-family: 'IBM Plex Mono', 'Consolas', 'Courier New', monospace !important;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
}

/* ---- Header bar ---- */
.terminal-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #000080;
  color: #fff;
  padding: 1px 3px;
  user-select: none;
  height: 20px;
  min-height: 20px;
}

.terminal-header-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.terminal-icon {
  font-size: 10px;
  line-height: 1;
}

.terminal-header-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #fff;
  font-style: italic;
}

.terminal-header-right {
  display: flex;
  gap: 1px;
}

.t-menu-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #fff;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 11px;
  padding: 0 5px;
  cursor: pointer;
  line-height: 18px;
  height: 18px;
}

.t-menu-btn:hover,
.t-menu-btn.active {
  background: #fff;
  color: #000080;
}

/* ---- Dropdown ---- */
.terminal-menus {
  position: relative;
  height: 0;
  z-index: 20;
}

.terminal-menu {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 160px;
  list-style: none;
  margin: 0;
  padding: 2px;
  background: #c0c0c0;
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-bottom: 1px solid #000;
  border-right: 1px solid #000;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}

.terminal-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 2px 12px;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 12px;
  color: #000;
  cursor: pointer;
  line-height: 18px;
}

.terminal-menu-item:hover {
  background: #000080;
  color: #fff;
}

/* ---- Output area ---- */
.terminal-output {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 8px;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
  -webkit-user-select: text;
  background: #000;
}

.terminal-output::-webkit-scrollbar {
  width: 14px;
}

.terminal-output::-webkit-scrollbar-track {
  background: #000;
  border-left: 1px solid #333;
}

.terminal-output::-webkit-scrollbar-thumb {
  background: #444;
  border: 2px solid #000;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
  background: #666;
}

.terminal ::selection {
  background: #000080;
  color: #fff;
}

/* ---- Line types ---- */
.t-line {
  min-height: 1.3em;
}

.t-cmd {
  color: #fff;
}

.t-out {
  color: #aaa;
}

.t-info {
  color: #5ff;  /* light cyan */
}

.t-success {
  color: #5f5;  /* light green */
}

.t-err {
  color: #f55;  /* light red */
}

.t-accent {
  color: #ff5;  /* light yellow */
}

.t-link {
  color: #55f;
  text-decoration: underline;
  cursor: pointer;
}

.t-link:hover {
  color: #99f;
  background: rgba(0, 60, 255, 0.25);
}

/* ---- Input line ---- */
.terminal-input-line {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 4px 8px 6px;
  background: #000;
  border-top: 1px solid #222;
  min-height: 26px;
  overflow: hidden;
}

.t-prompt {
  color: #aaa;
  font-weight: 700;
  white-space: nowrap;
  user-select: none;
}

.terminal-input-line input {
  flex: 0 1 auto;
  min-width: 3ch;
  max-width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-family: 'IBM Plex Mono', 'Consolas', 'Courier New', monospace !important;
  font-size: 13px;
  padding: 0;
  caret-color: transparent;
  overflow: hidden;
  text-overflow: clip;
}

.t-cursor {
  display: inline-block;
  flex: 0 0 auto;
  width: 7px;
  height: 13px;
  background: #aaa;
  animation: blink 1s steps(1) infinite;
  margin-left: 1px;
  vertical-align: middle;
}

@keyframes blink {
  50% { opacity: 0; }
}

.t-hint {
  margin-left: auto;
  color: #444;
  font-size: 9px;
  white-space: nowrap;
  user-select: none;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
}

@media (prefers-reduced-motion: reduce) {
  .t-cursor { animation: none; }
}

@media (max-width: 480px) {
  .terminal { font-size: 11px; }
  .terminal-input-line input { font-size: 11px; }
  .t-cursor { width: 5px; height: 10px; }
  .t-hint { display: none; }
}
</style>

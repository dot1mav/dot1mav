<template>
  <div class="terminal" @click="handleTerminalClick">
    <!-- MS-DOS title bar (blue, like the real thing) -->
    <div class="terminal-header">
      <div class="terminal-header-left">
        <button type="button" class="t-menu-btn" :class="{ active: terminalMenu === 'file' }"
          @click.stop="toggleTerminalMenu('file')">File</button>
        <button type="button" class="t-menu-btn" :class="{ active: terminalMenu === 'edit' }"
          @click.stop="toggleTerminalMenu('edit')">Edit</button>
        <button type="button" class="t-menu-btn" :class="{ active: terminalMenu === 'help' }"
          @click.stop="toggleTerminalMenu('help')">Help</button>
      </div>
      <span class="terminal-header-title">MS-DOS Prompt</span>
    </div>

    <!-- Dropdown menus -->
    <div class="terminal-menus">
      <ul v-if="terminalMenu === 'file'" class="terminal-menu">
        <li><button type="button" class="terminal-menu-item"
            @click="terminalMenu = null; closeTerminal()">Exit</button></li>
      </ul>
      <ul v-else-if="terminalMenu === 'edit'" class="terminal-menu">
        <li><button type="button" class="terminal-menu-item"
            @click="terminalMenu = null; clearTerminal()">Clear</button></li>
        <li><button type="button" class="terminal-menu-item"
            @click="terminalMenu = null; copyTerminalOutput()">Copy output</button></li>
      </ul>
      <ul v-else-if="terminalMenu === 'help'" class="terminal-menu">
        <li><button type="button" class="terminal-menu-item"
            @click="terminalMenu = null; printAbout()">About Terminal</button></li>
      </ul>
    </div>

    <!-- Terminal output (scrolling region) -->
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
      <span class="t-caret"></span>
      <span class="t-hint">Tab=autocomplete  ↑↓=history  F1=help</span>
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
/* Authentic MS-DOS Prompt styling */
.terminal {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #000;
  color: #c0c0c0;
  font-family: 'IBM Plex Mono', 'Consolas', 'Courier New', monospace !important;
  font-size: 14px;
  line-height: 1.3;
  overflow: hidden;
  border: 2px solid;
  border-color: #808080 #fff #fff #808080;
}

/* Menu bar - classic blue gradient */
.terminal-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: linear-gradient(90deg, #000080, #1084d0);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 4px;
  border-bottom: 1px solid #000040;
  user-select: none;
}

.terminal-header-left {
  display: flex;
  gap: 0;
}

.terminal-header-title {
  letter-spacing: 0.5px;
  opacity: 0.95;
  font-style: italic;
}

.t-menu-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #fff;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 11px;
  font-weight: 400;
  padding: 1px 6px;
  cursor: pointer;
  line-height: 1.4;
}

.t-menu-btn:hover,
.t-menu-btn.active {
  background: rgba(255, 255, 255, 0.15);
  outline: 1px dotted #fff;
  outline-offset: -2px;
}

.terminal-menus {
  position: relative;
  height: 0;
  z-index: 20;
}

.terminal-menu {
  position: absolute;
  top: 4px;
  left: 4px;
  min-width: 170px;
  list-style: none;
  margin: 0;
  padding: 2px;
  background: #c0c0c0;
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-bottom: 1px solid #000;
  border-right: 1px solid #000;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.55);
}

.terminal-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 3px 12px;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 12px;
  color: #000;
  cursor: pointer;
}

.terminal-menu-item:hover {
  background: #000080;
  color: #fff;
}

/* Output area */
.terminal-output {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 10px;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
  -webkit-user-select: text;
}

.terminal-output::-webkit-scrollbar {
  width: 16px;
}

.terminal-output::-webkit-scrollbar-track {
  background: #000;
  border-left: 1px solid #333;
}

.terminal-output::-webkit-scrollbar-thumb {
  background: #555;
  border: 2px solid #000;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
  background: #777;
}

.terminal ::selection {
  background: #000080;
  color: #fff;
}

/* Line types */
.t-line {
  min-height: 1.3em;
}

.t-cmd {
  color: #fff;
  font-weight: 700;
}

.t-out {
  color: #c0c0c0;
}

.t-info {
  color: #00d7ff;
}

.t-success {
  color: #55ff55;
}

.t-err {
  color: #ff5555;
}

.t-accent {
  color: #ffff55;
  font-weight: 700;
}

.t-link {
  color: #5599ff;
  text-decoration: underline;
  cursor: pointer;
}

.t-link:hover {
  color: #99ccff;
  background: rgba(0, 80, 180, 0.4);
}

/* Input line */
.terminal-input-line {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 6px 10px 8px;
  border-top: 1px solid #333;
  background: #0a0a0a;
  min-height: 30px;
  overflow: hidden;
}

.t-prompt {
  color: #c0c0c0;
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
  font-size: 14px;
  padding: 0;
  caret-color: transparent;
  overflow: hidden;
  text-overflow: clip;
}

.t-caret {
  display: inline-block;
  flex: 0 0 auto;
  width: 8px;
  height: 15px;
  background: #c0c0c0;
  animation: t-blink 1s steps(1) infinite;
  margin-left: 1px;
}

.t-hint {
  margin-left: auto;
  color: #555;
  font-size: 10px;
  white-space: nowrap;
  user-select: none;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
}

@keyframes t-blink {
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .t-caret { animation: none; }
}

@media (max-width: 480px) {
  .terminal { font-size: 12px; }
  .terminal-input-line input { font-size: 12px; }
  .t-caret { width: 6px; height: 12px; }
  .t-hint { display: none; }
}
</style>

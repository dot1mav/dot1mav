<template>
  <div class="terminal" @click="handleTerminalClick">
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

    <div class="terminal-output" ref="terminalOutputEl" role="log" aria-live="polite" aria-label="Terminal output">
      <div v-for="(line, index) in terminalLines" :key="index" :class="['t-line', line.type]">
        <a v-if="line.type === 'link'" class="t-link" :href="line.href" target="_blank"
          rel="noopener noreferrer">{{ line.text }}</a>
        <template v-else>{{ line.text }}</template>
      </div>
    </div>

    <div class="terminal-input-line">
      <span class="t-prompt">{{ terminalPrompt }}</span>
      <input ref="terminalInputEl" v-model="terminalInput" type="text" autocomplete="off"
        spellcheck="false" aria-label="Terminal input" @keydown="onTerminalKeydown"
        :style="{ width: terminalInputWidth }" />
      <span class="t-caret"></span>
      <span class="t-hint">Tab = autocomplete · ↑↓ = history</span>
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
/* Fills the window body exactly (the body is absolutely pinned
   below the title bar by OSWindow). The output area is the only
   scrolling region, so jumping to the bottom always works. */
.terminal {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #000;
  color: #c0c0c0;
  font-family: 'IBM Plex Mono', monospace !important;
  font-size: 13px;
  line-height: 1.5;
  overflow: hidden;
}

/* Menu bar, MS-DOS Prompt style. */
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
  padding: 2px 6px;
  border-bottom: 1px solid #000060;
  user-select: none;
}

.terminal-header-left {
  display: flex;
  gap: 2px;
}

.terminal-header-title {
  letter-spacing: 0.3px;
  opacity: 0.9;
}

.t-menu-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  cursor: pointer;
  line-height: 1.4;
}

.t-menu-btn:hover,
.t-menu-btn.active {
  background: rgba(255, 255, 255, 0.25);
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
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: #000;
  cursor: pointer;
}

.terminal-menu-item:hover {
  background: #000080;
  color: #fff;
}

/* Output region. min-height:0 is what lets this element shrink
   and scroll instead of pushing the input line out of the window. */
.terminal-output {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 10px 8px;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
  -webkit-user-select: text;
}

.terminal-output::-webkit-scrollbar {
  width: 14px;
}

.terminal-output::-webkit-scrollbar-track {
  background: #000;
}

.terminal-output::-webkit-scrollbar-thumb {
  background: #7f7f7f;
  border: 3px solid #000;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}

.terminal ::selection {
  background: #000080;
  color: #fff;
}

.t-line {
  min-height: 1.2em;
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
  color: #00d000;
}

.t-err {
  color: #ff6060;
}

.t-accent {
  color: #ffff55;
}

.t-link {
  color: #6cb8ff;
  text-decoration: underline;
  cursor: pointer;
}

.t-link:hover {
  color: #a8dcff;
  background: rgba(0, 80, 180, 0.35);
}

/* Input strip: distinct background so it reads as the live line.
   The input can never exceed the line width, so a long command
   clips instead of shoving the caret or hint off-screen. */
.terminal-input-line {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px 7px;
  border-top: 1px solid #2a2a2a;
  background: #0a0a0a;
  min-height: 28px;
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
  font-family: 'IBM Plex Mono', monospace !important;
  font-size: 13px;
  padding: 0;
  caret-color: transparent;
  overflow: hidden;
  text-overflow: clip;
}

.t-caret {
  display: inline-block;
  flex: 0 0 auto;
  width: 7px;
  height: 14px;
  background: #c0c0c0;
  animation: t-blink 1s steps(1) infinite;
}

.t-hint {
  margin-left: auto;
  color: #5a5a5a;
  font-size: 10px;
  white-space: nowrap;
  user-select: none;
}

@keyframes t-blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .t-caret {
    animation: none;
  }
}

@media (max-width: 480px) {
  .terminal {
    font-size: 11px;
  }
  .terminal-input-line input {
    font-size: 11px;
  }
  .t-caret {
    width: 6px;
    height: 12px;
  }
  .t-hint {
    display: none;
  }
}
</style>

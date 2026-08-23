// The fake MS-DOS shell.
//
// All the terminal state lives here so the window keeps its scroll
// position and history even while it's minimized or closed (the
// window is only hidden with display:none, never unmounted).
import { ref, computed, nextTick, watch } from 'vue'
import { useSiteData } from './useSiteData'
import { useWindows } from './useWindows'
import { useApp } from './useApp'
import { useAnalytics } from './useAnalytics'
import { splitTech, splitSkills, formatDateShort } from './useUtils'
import { pwd, cd, typeFile, tree, formatDirListing, dirContents } from '../services/dosFilesystem'

// Known commands, used for Tab autocomplete and nothing else.
const TERMINAL_COMMANDS = [
  'help', 'about', 'projects', 'skills', 'experiences', 'certifications',
  'contact', 'open', 'start', 'cd', 'dir', 'ls', 'type', 'tree', 'pwd',
  'neofetch', 'ver', 'echo', 'date', 'time', 'theme', 'github', 'linkedin',
  'email', 'resume', 'whoami', 'history', 'clear', 'cls', 'exit', 'sudo',
]

export function useTerminal() {
  const siteData = useSiteData()
  const { windows, openWindow, closeWindow } = useWindows()
  const { isDarkMode, toggleDarkMode, downloadResume } = useApp()
  const { sendUmamiEvent } = useAnalytics()

  const terminalLines = ref([])
  const terminalInput = ref('')
  const terminalHistory = ref([])
  const terminalHistoryIndex = ref(0)
  const terminalOutputEl = ref(null)
  const terminalInputEl = ref(null)
  const terminalMenu = ref(null)
  const terminalInputWidth = computed(() => `${Math.min(terminalInput.value.length + 2, 70)}ch`)
  const terminalPrompt = computed(() => `${pwd()}>`)

  function printAbout() {
    printTerminal('Microsoft(R) MAV OS - MS-DOS Prompt', 'accent')
    printTerminal('(C)Copyright dot1mav 1998-2026. All rights reserved.', 'out')
  }

  // Split on \n so multi-line output (help, dir, neofetch) renders
  // as separate lines, and each one can carry its own styling.
  function printTerminal(text, type = 'out', href = null) {
    const lines = String(text).split('\n')
    for (const line of lines) {
      terminalLines.value.push({ text: line, type, href })
    }
    scrollTerminalToBottom()
  }

  function scrollTerminalToBottom() {
    nextTick(() => {
      if (terminalOutputEl.value) {
        terminalOutputEl.value.scrollTop = terminalOutputEl.value.scrollHeight
      }
    })
  }

  function clearTerminal() {
    terminalLines.value = []
  }

  // Pulls the current screen into the clipboard via the Copy menu.
  function copyTerminalOutput() {
    const text = terminalLines.value
      .map((line) => (line.type === 'link' && line.href ? `${line.text} (${line.href})` : line.text))
      .join('\n')
    if (!text) return
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {})
        printTerminal('Output copied to clipboard.', 'success')
      }
    } catch (err) {}
  }

  function focusTerminalInput() {
    nextTick(() => {
      if (terminalInputEl.value) terminalInputEl.value.focus()
    })
  }

  function handleTerminalClick() {
    terminalMenu.value = null
    focusTerminalInput()
  }

  function toggleTerminalMenu(menu) {
    terminalMenu.value = terminalMenu.value === menu ? null : menu
  }

  function terminalProjectList(query) {
    let list = (siteData.projects || []).slice()
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((p) =>
        [p.title, p.description_short, p.description_full, p.tech_stack]
          .some((f) => f && f.toLowerCase().includes(q))
      )
    }
    if (!list.length) {
      printTerminal(query ? `No projects match "${query}".` : 'No projects found.', 'err')
      return
    }
    printTerminal(`${list.length} project${list.length === 1 ? '' : 's'}${query ? ` matching "${query}"` : ''}`, 'accent')
    printTerminal('', 'out')
    list.forEach((p) => {
      const tags = splitTech(p.tech_stack)
      const meta = [
        p.date ? formatDateShort(p.date) : null,
        tags.length ? tags.join('  ·  ') : null,
      ].filter(Boolean).join('   |   ')
      printTerminal(`» ${p.title}`, 'cmd')
      if (meta) printTerminal(`  ${meta}`, 'info')
      if (p.description_short) printTerminal(`  ${p.description_short}`, 'out')
      if (p.demo_link) printTerminal(`  Link: ${p.demo_link}`, 'link', p.demo_link)
      printTerminal('', 'out')
    })
  }

  function terminalSkillsList() {
    const groups = [
      { name: 'Frontend', value: siteData.skills?.frontend },
      { name: 'Backend', value: siteData.skills?.backend },
      { name: 'Database', value: siteData.skills?.database },
      { name: 'Tools', value: siteData.skills?.tools },
      { name: 'Cloud', value: siteData.skills?.cloud },
      { name: 'Other', value: siteData.skills?.other },
    ]
    groups.forEach((g) => {
      const items = splitSkills(g.value)
      if (!items.length) return
      printTerminal(`» ${g.name}`, 'accent')
      printTerminal(`  ${items.join('  •  ')}`, 'info')
      printTerminal('', 'out')
    })
  }

  function terminalExperiencesList() {
    const exps = siteData.experiences || []
    if (!exps.length) {
      printTerminal('No experiences found.', 'err')
      return
    }
    exps.forEach((exp) => {
      printTerminal(`» ${exp.title} at ${exp.company}`, 'cmd')
      printTerminal(`  ${exp.location}  |  ${exp.dates}`, 'info')
      exp.duties.forEach((d) => printTerminal(`   •  ${d}`, 'out'))
      printTerminal('', 'out')
    })
  }

  function terminalCertificationsList() {
    const certs = siteData.certifications || []
    if (!certs.length) {
      printTerminal('No certifications found.', 'err')
      return
    }
    certs.forEach((cert) => {
      printTerminal(`» ${cert.name}`, 'cmd')
      printTerminal(`  ${cert.issuer}${cert.date ? '  |  ' + cert.date : ''}`, 'info')
      if (cert.link) printTerminal(`  Link: ${cert.link}`, 'link', cert.link)
      printTerminal('', 'out')
    })
  }

  // Tab completes commands when typing the first word, and files or
  // directories when typing an argument (e.g. `type READ` -> README.TXT).
  // Multiple matches print the list instead of guessing.
  function autocomplete() {
    const current = terminalInput.value
    const parts = current.split(/\s+/)
    const isFirstWord = parts.length === 1
    const prefix = (parts[parts.length - 1] || '').toUpperCase()

    const candidates = isFirstWord
      ? TERMINAL_COMMANDS
      : dirContents().map((item) => item.name)

    const matches = candidates
      .filter((name) => name.toUpperCase().startsWith(prefix))

    if (matches.length === 1) {
      const completed = parts.slice(0, -1).concat(matches[0]).join(' ')
      terminalInput.value = isFirstWord ? completed + ' ' : completed
    } else if (matches.length > 1) {
      printTerminal(matches.join('    '), 'info')
    }
  }

  function onTerminalKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      runTerminalCommand()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      autocomplete()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (terminalHistoryIndex.value > 0) {
        terminalHistoryIndex.value--
        terminalInput.value = terminalHistory.value[terminalHistoryIndex.value]
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (terminalHistoryIndex.value < terminalHistory.value.length) {
        terminalHistoryIndex.value++
        terminalInput.value = terminalHistoryIndex.value === terminalHistory.value.length
          ? ''
          : terminalHistory.value[terminalHistoryIndex.value]
      }
    } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault()
      clearTerminal()
    }
  }

  function runTerminalCommand() {
    const raw = terminalInput.value
    terminalMenu.value = null
    // Echo the command with the prompt that was current when typed,
    // like a real shell line, not a hardcoded C:\>.
    printTerminal(`${terminalPrompt.value} ${raw}`, 'cmd')
    const trimmed = raw.trim()
    if (trimmed) {
      terminalHistory.value.push(trimmed)
      executeTerminalCommand(trimmed)
    }
    terminalHistoryIndex.value = terminalHistory.value.length
    terminalInput.value = ''
    focusTerminalInput()
  }

  function executeTerminalCommand(raw) {
    const parts = raw.split(/\s+/)
    const cmd = (parts[0] || '').toLowerCase()
    const args = parts.slice(1)
    const arg = args.join(' ')

    sendUmamiEvent('terminal_command', { command: cmd })

    // If you add a command here, add it to the `help` output too —
    // easy to forget, and the terminal lies if they drift apart.

    switch (cmd) {
      case 'help':
      case 'h':
      case '?': {
        printTerminal([
          'Available commands:',
          '  help               Show this help',
          '  about              About me',
          '  projects [filter]  List projects (optional keyword filter)',
          '  skills             List skills by category',
          '  experiences        List work experiences',
          '  certifications     List certifications',
          '  contact            Contact info with links',
          '',
          '  Filesystem:',
          '  cd <path>          Change directory (cd projects, cd ..)',
          '  dir / ls           List current directory',
          '  type <file>        View a file (e.g. type README.TXT)',
          '  tree               Show the whole directory tree',
          '  pwd                Print working directory',
          '',
          '  Tip: Tab autocompletes commands and file names.',
          '',
          '  Other:',
          '  open <window>      Open a window by name',
          '  start <window>     Same as open',
          '  neofetch           System information',
          '  ver                Show version',
          '  echo <text>        Print text',
          '  date / time        Show current date / time',
          '  theme [dark|light] Toggle dark mode',
          '  github / linkedin  Open social links',
          '  email              Open email client',
          '  resume             Download resume',
          '  history            Show command history',
          '  clear / cls        Clear the terminal',
          '  exit               Close this window',
          '  sudo               (not available)',
        ].join('\n'), 'out')
        break
      }
      case 'about': {
        const name = siteData.basics?.name || 'Mohammad Amin Vakili'
        const label = siteData.basics?.label || 'Software Engineer'
        printTerminal(`${name} — ${label}`, 'accent')
        printTerminal('---------------------------------------------------', 'out')
        printTerminal('', 'out')
        printTerminal(siteData.aboutText1 || '', 'info')
        printTerminal('', 'out')
        printTerminal(siteData.aboutText2 || '', 'info')
        printTerminal('', 'out')
        printTerminal(siteData.aboutText3 || '', 'info')
        break
      }
      case 'projects':
      case 'p': {
        terminalProjectList(arg)
        break
      }
      case 'skills':
      case 'skill': {
        terminalSkillsList()
        break
      }
      case 'experiences':
      case 'exp': {
        terminalExperiencesList()
        break
      }
      case 'certifications':
      case 'certs': {
        terminalCertificationsList()
        break
      }
      case 'contact': {
        printTerminal('Mohammad Amin Vakili — Software Engineer', 'accent')
        printTerminal('', 'out')
        printTerminal('email:    dot1mav@gmail.com', 'out')
        printTerminal('github:   https://github.com/dot1mav', 'link', 'https://github.com/dot1mav')
        printTerminal('linkedin: https://ir.linkedin.com/in/dot1mav', 'link', 'https://ir.linkedin.com/in/dot1mav')
        printTerminal('website:  https://dot1mav.ir', 'link', 'https://dot1mav.ir')
        printTerminal('location: Bandar Abbas, Hormozgan, Iran', 'out')
        printTerminal('', 'out')
        printTerminal('Tip: "open contact" opens the Contact window.', 'info')
        break
      }
      case 'open':
      case 'start': {
        const target = arg.toLowerCase()
        if (windows[target]) {
          openWindow(target)
          printTerminal(`Opening ${windows[target].title} window...`, 'success')
        } else {
          printTerminal(`'${arg}' is not a valid window. Try: ${Object.keys(windows).join(', ')}`, 'err')
        }
        break
      }
      case 'neofetch': {
        printTerminal([
          '  +-------------------+',
          '  |  MAV OS Terminal  |',
          '  +-------------------+',
          '',
          '      OS: MAV Portfolio v1.0',
          '      Host: GitHub Pages',
          '      Kernel: Nuxt.js 3 (Vue 3)',
          '      Shell: MS-DOS (Windows 98 theme)',
          '      Theme: retro-blue',
          '      Uptime: infinity (a portfolio never sleeps)',
          '      Memory: 640K ought to be enough for anybody',
        ].join('\n'), 'accent')
        break
      }
      case 'cd': {
        const result = cd(arg)
        if (!result.ok) {
          printTerminal(result.error, 'err')
        } else if (result.message) {
          printTerminal(result.message, 'out')
        }
        break
      }
      case 'pwd': {
        printTerminal(pwd(), 'out')
        break
      }
      case 'type': {
        const target = arg.split(/\s+/)[0]
        if (!target) {
          printTerminal('The syntax of the command is incorrect.', 'err')
          break
        }
        const result = typeFile(target)
        if (!result) {
          printTerminal(`File not found — ${target}`, 'err')
        } else if (result.isDir) {
          printTerminal('Access denied. (It\'s a directory, not a file.)', 'err')
        } else {
          printTerminal(result.content, 'out')
        }
        break
      }
      case 'tree': {
        printTerminal(tree(), 'out')
        break
      }
      case 'dir':
      case 'ls': {
        printTerminal(formatDirListing(), 'out')
        break
      }
      case 'ver': {
        printTerminal('Microsoft(R) Windows 98\n   (C)Copyright Microsoft Corp 1981-1999.', 'info')
        break
      }
      case 'echo': {
        printTerminal(arg, 'out')
        break
      }
      case 'date': {
        printTerminal(new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }), 'info')
        break
      }
      case 'time': {
        printTerminal(new Date().toLocaleTimeString('en-US'), 'info')
        break
      }
      case 'theme': {
        if (arg === 'dark' && !isDarkMode.value) toggleDarkMode()
        else if (arg === 'light' && isDarkMode.value) toggleDarkMode()
        else if (!arg) toggleDarkMode()
        printTerminal(`Dark mode: ${isDarkMode.value ? 'ON' : 'OFF'}`, 'info')
        break
      }
      case 'github': {
        window.open('https://github.com/dot1mav', '_blank', 'noopener')
        printTerminal('Opening github.com/dot1mav...', 'success')
        break
      }
      case 'linkedin': {
        window.open('https://ir.linkedin.com/in/dot1mav', '_blank', 'noopener')
        printTerminal('Opening linkedin.com/in/dot1mav...', 'success')
        break
      }
      case 'email': {
        window.open('mailto:dot1mav@gmail.com', '_self')
        printTerminal('Opening email client...', 'success')
        break
      }
      case 'resume': {
        downloadResume()
        printTerminal('Downloading resume...', 'success')
        break
      }
      case 'whoami': {
        printTerminal('dot1mav', 'info')
        break
      }
      case 'history': {
        if (terminalHistory.value.length === 0) {
          printTerminal('No commands in history.', 'out')
        } else {
          printTerminal(terminalHistory.value
            .map((c, i) => `${String(i + 1).padStart(3)}  ${c}`)
            .join('\n'), 'out')
        }
        break
      }
      case 'clear':
      case 'cls': {
        clearTerminal()
        break
      }
      case 'exit': {
        closeWindow('terminal')
        break
      }
      case 'sudo': {
        printTerminal('Access denied. Nice try, but you are not root here.', 'err')
        break
      }
      default: {
        printTerminal(
          `'${cmd}' is not recognized as an internal or external command,\noperable program or batch file.`,
          'err'
        )
        break
      }
    }
  }

  // Welcome banner only prints on the first open — closing and
  // reopening the window shouldn't spam the screen again.
  watch(() => windows.terminal.open, (open) => {
    if (!open) return
    if (terminalLines.value.length === 0) {
      printTerminal('Microsoft(R) MAV OS - MS-DOS Prompt', 'accent')
      printTerminal('(C)Copyright dot1mav 1998-2026. All rights reserved.', 'out')
      printTerminal('', 'out')
      printTerminal("Type 'help' to see available commands.", 'info')
      printTerminal("Try 'cd projects', 'type README.TXT' or 'tree' to explore the file system.", 'info')
      printTerminal('', 'out')
    }
    focusTerminalInput()
    scrollTerminalToBottom()
  })

  return {
    terminalLines,
    terminalInput,
    terminalHistory,
    terminalHistoryIndex,
    terminalOutputEl,
    terminalInputEl,
    terminalMenu,
    terminalInputWidth,
    terminalPrompt,
    handleTerminalClick,
    toggleTerminalMenu,
    clearTerminal,
    copyTerminalOutput,
    onTerminalKeydown,
    closeTerminal: () => closeWindow('terminal'),
    printAbout,
  }
}

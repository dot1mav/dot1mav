// Small app-wide bits that don't belong to any one component.
//
// Dark mode lives outside the component tree on purpose: the
// terminal's `theme` command needs to flip it from a place that has
// no access to the Taskbar, and module scope makes that work.
import { ref } from 'vue'
import { useAnalytics } from './useAnalytics'
import { useSiteData } from './useSiteData'

const isDarkMode = ref(false)

export function useApp() {
  const { sendUmamiEvent } = useAnalytics()
  const siteData = useSiteData()

  // Called once on mount. localStorage is only readable on the client,
  // so this stays out of the server render.
  function initDarkMode() {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') {
      isDarkMode.value = true
      document.body.classList.add('dark-mode')
    }
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
    document.body.classList.toggle('dark-mode', isDarkMode.value)
    localStorage.setItem('darkMode', String(isDarkMode.value))

    sendUmamiEvent('dark_mode_toggle', {
      enabled: isDarkMode.value,
    })
  }

  // resume.pdf lives in public/. If you rename or regenerate it,
  // keep the filename here and in the README in sync.
  function downloadResume() {
    const resumeUrl = siteData.basics?.resume_url || '/resume.pdf'

    const link = document.createElement('a')
    link.href = resumeUrl
    link.download = 'Mohammad_Amin_Vakili_Resume.pdf'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    sendUmamiEvent('resume_download', {
      file_name: 'Mohammad_Amin_Vakili_Resume.pdf',
    })
  }

  return {
    isDarkMode,
    initDarkMode,
    toggleDarkMode,
    downloadResume,
  }
}

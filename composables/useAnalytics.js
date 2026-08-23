// Umami is loaded via the script tag in nuxt.config, so window.umami
// only exists once that script has finished loading. Everything here
// is guarded because we call it from all sorts of places (terminal,
// window controls, dark mode) and a broken tracker shouldn't break
// the page.
export function useAnalytics() {
  function sendUmamiEvent(name, data = {}) {
    try {
      if (!name) return
      const eventName = String(name).slice(0, 50)
      if (typeof window !== 'undefined' && typeof window.umami !== 'undefined') {
        if (data && Object.keys(data).length > 0) {
          window.umami.track(eventName, data)
        } else {
          window.umami.track(eventName)
        }
      }
    } catch (err) {}
  }

  return { sendUmamiEvent }
}

// Everything in data.json.
//
// Renders instantly from the bundled copy (SSR + static hosting),
// then hydrates from /api/data on the client when a real server is
// answering. Components read through here, so the source swap is
// invisible to them — identical shapes either way.
//
// Hydration mutates the reactive object in place (assign/merge, never
// re-assign) so any component that grabbed a reference keeps seeing
// the fresh data.
import { reactive } from 'vue'
import { fetchSiteData } from '../services/portfolio'
import bundledSiteData from '../public/data.json'

const siteData = reactive({ ...bundledSiteData })

let hydratePromise = null

function mergeInto(target, source) {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key]
    if (existing && value && typeof existing === 'object' && typeof value === 'object' && !Array.isArray(existing) && !Array.isArray(value)) {
      // Nested objects merge in place so references stay valid.
      mergeInto(existing, value)
    } else if (Array.isArray(value) && Array.isArray(existing)) {
      target[key].splice(0, target[key].length, ...value)
    } else {
      target[key] = value
    }
  }
}

export function useSiteData() {
  // Only the client talks to the API; the server keeps the bundled
  // copy so the first paint and static hosting work unchanged.
  if (typeof window !== 'undefined' && !hydratePromise) {
    hydratePromise = fetchSiteData()
      .then((fresh) => {
        if (fresh && typeof fresh === 'object') {
          mergeInto(siteData, fresh)
        }
      })
      .catch(() => {})
      .finally(() => {
        hydratePromise = null
      })
  }

  return siteData
}
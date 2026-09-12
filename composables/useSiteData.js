// Everything in data.json — now fetched from API only.
// The server serves the same data, but the client talks to /api/data.
// Hydration mutates the reactive object in place so references stay valid.
import { reactive } from 'vue'

const siteData = reactive({
  basics: {},
  aboutText1: '',
  aboutText2: '',
  aboutText3: '',
  experiences: [],
  projects: [],
  certifications: [],
  skills: {},
  languages: {},
})

let hydratePromise = null
let hydrateError = null

function mergeInto(target, source) {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key]
    if (existing && value && typeof existing === 'object' && typeof value === 'object' && !Array.isArray(existing) && !Array.isArray(value)) {
      mergeInto(existing, value)
    } else if (Array.isArray(value) && Array.isArray(existing)) {
      target[key].splice(0, target[key].length, ...value)
    } else {
      target[key] = value
    }
  }
}

async function fetchFromAPI() {
  const base = '/api/data'
  const res = await fetch(base)
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

export function useSiteData() {
  // Client-only: hydrate from API on first access
  if (typeof window !== 'undefined' && !hydratePromise && !hydrateError) {
    hydratePromise = fetchFromAPI()
      .then((fresh) => {
        if (fresh && typeof fresh === 'object') {
          mergeInto(siteData, fresh)
        }
        hydrateError = null
      })
      .catch((err) => {
        hydrateError = err
        console.error('[useSiteData] API hydration failed:', err)
      })
      .finally(() => {
        hydratePromise = null
      })
  }

  return {
    get data() { return siteData },
    get isHydrated() { return Object.keys(siteData).some(k => siteData[k] && (Array.isArray(siteData[k]) ? siteData[k].length : Object.keys(siteData[k]).length)) },
    get hydrateError() { return hydrateError },
    async rehydrate() {
      hydrateError = null
      hydratePromise = fetchFromAPI()
        .then((fresh) => {
          if (fresh && typeof fresh === 'object') {
            mergeInto(siteData, fresh)
          }
          hydrateError = null
        })
        .catch((err) => {
          hydrateError = err
        })
        .finally(() => {
          hydratePromise = null
        })
      await hydratePromise
    },
  }
}
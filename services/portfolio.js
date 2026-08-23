// Client-side access to the portfolio data.
//
// It tries the live API first and falls back to the bundled JSON,
// so the site keeps working on static hosting (gh-pages) where
// there is no server to answer /api calls. The data shapes are
// identical either way, so callers never have to care which
// source actually answered.

import localData from '../public/data.json'

const API_BASE = '/api'

// Short timeout on purpose — if the API isn't there (static hosting)
// we don't want the page waiting around for a request that can't work.
async function fetchJson(path) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)

    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    clearTimeout(timer)
    if (!res.ok) throw new Error(`${path} -> ${res.status}`)

    return await res.json()
  } catch {
    return null
  }
}

export async function fetchProjects() {
  return (await fetchJson('/projects')) ?? localData.projects ?? []
}

export async function fetchExperiences() {
  return (await fetchJson('/experiences')) ?? localData.experiences ?? []
}

export async function fetchSkills() {
  return (await fetchJson('/skills')) ?? localData.skills ?? {}
}

export async function fetchCertifications() {
  return (await fetchJson('/certifications')) ?? localData.certifications ?? []
}

export async function fetchAbout() {
  const remote = await fetchJson('/about')
  if (remote) return remote

  return {
    basics: localData.basics ?? {},
    aboutText1: localData.aboutText1 ?? '',
    aboutText2: localData.aboutText2 ?? '',
    aboutText3: localData.aboutText3 ?? '',
  }
}

// One request for everything, for the rare case you need it all.
export async function fetchSiteData() {
  return (await fetchJson('/data')) ?? localData
}

// All project photos as { src, project }, optionally filtered to one
// project. Falls back to building the same shape from bundled JSON.
export async function fetchPhotos(project) {
  const query = project ? `?project=${encodeURIComponent(project)}` : ''
  return (await fetchJson(`/photos${query}`)) ?? localPhotos()
}

function localPhotos() {
  const photos = []
  for (const p of localData.projects || []) {
    for (const src of p.images || []) {
      if (!src || src.includes('/images/background')) continue
      photos.push({ src, project: p.title })
    }
  }
  return photos
}

// The video playlist: per-project videos merged with the clips in
// public/videos/manifest.json. On static hosting the manifest is
// fetched directly, since there is no /api/videos to answer.
export async function fetchVideos() {
  return (await fetchJson('/videos')) ?? localVideos()
}

async function localVideos() {
  const manifest = await localManifest()
  const projectVideos = []
  for (const p of localData.projects || []) {
    if (p.video) {
      projectVideos.push({
        title: `${p.title} (video)`,
        src: p.video,
        project: p.title,
      })
    }
  }
  return [...manifest, ...projectVideos]
}

async function localManifest() {
  try {
    const res = await fetch('/videos/manifest.json', { cache: 'no-store' })
    return res.ok ? await res.json() : []
  } catch {
    return []
  }
}

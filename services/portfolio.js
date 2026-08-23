// Client-side access to the portfolio data.
//
// Fetches from the Django REST API backend, with fallback to bundled
// JSON for static hosting (gh-pages) where no backend is available.

import localData from '../public/data.json'

const API_BASE = 'http://127.0.0.1:8000/v0'

async function fetchJson(path) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)

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

// --- Projects ---
export async function fetchProjects() {
  const data = await fetchJson('/projects/')
  if (data && Array.isArray(data)) {
    return data.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description_short: p.description_short || '',
      description_full: p.description_full || '',
      tech_stack: p.tech_stack || '',
      image: p.image_url || '',
      images: p.images || [],
      demo_link: p.demo_link || '',
      source_link: p.source_link || '',
      date: p.date || '',
      is_featured: p.is_featured || false,
    }))
  }
  return localData.projects ?? []
}

// --- Experiences ---
export async function fetchExperiences() {
  const data = await fetchJson('/experiences/')
  if (data && Array.isArray(data)) {
    return data.map((e) => ({
      title: e.title,
      company: e.company,
      location: e.location,
      dates: e.end_date
        ? `${formatDate(e.start_date)} – ${formatDate(e.end_date)}`
        : e.is_current
          ? `${formatDate(e.start_date)} – Present`
          : formatDate(e.start_date),
      duties: e.description ? e.description.split('\n').filter(Boolean) : [],
    }))
  }
  return localData.experiences ?? []
}

// --- Skills ---
export async function fetchSkills() {
  const data = await fetchJson('/skills/')
  if (data && Array.isArray(data)) {
    const skills = {}
    const categoryMap = {
      'Frontend': 'frontend',
      'Backend': 'backend',
      'Database': 'database',
      'Tools': 'tools',
      'Cloud': 'cloud',
      'Other': 'other',
    }
    for (const cat of data) {
      const key = categoryMap[cat.title] || cat.title.toLowerCase()
      skills[key] = (cat.skills || []).map((s) => s.title).join(', ')
    }
    return skills
  }
  return localData.skills ?? {}
}

// --- Certifications ---
export async function fetchCertifications() {
  const data = await fetchJson('/certificates/')
  if (data && Array.isArray(data)) {
    return data.map((c) => ({
      name: c.title,
      issuer: c.issuer,
      date: c.issue_date || '',
      link: c.credential_url || '',
      image: c.image_url || '',
    }))
  }
  return localData.certifications ?? []
}

// --- About / Profile ---
export async function fetchAbout() {
  const data = await fetchJson('/profile/')
  if (data) {
    return {
      basics: {
        name: data.full_name || '',
        label: data.job_title || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website_url || '',
        summary: data.bio_full || data.bio_short || '',
        location: {
          address: data.location || '',
        },
        profiles: [
          data.github_url ? { network: 'GitHub', url: data.github_url } : null,
          data.linkedin_url ? { network: 'LinkedIn', url: data.linkedin_url } : null,
          data.telegram_url ? { network: 'Telegram', url: data.telegram_url } : null,
        ].filter(Boolean),
        avatar: data.avatar_url || '',
      },
      aboutText1: data.bio_short || '',
      aboutText2: data.bio_full || '',
      aboutText3: '',
    }
  }
  return {
    basics: localData.basics ?? {},
    aboutText1: localData.aboutText1 ?? '',
    aboutText2: localData.aboutText2 ?? '',
    aboutText3: localData.aboutText3 ?? '',
  }
}

// Full data for hydration
export async function fetchSiteData() {
  const [profile, projects, skills, experiences, certifications] = await Promise.all([
    fetchJson('/profile/'),
    fetchJson('/projects/'),
    fetchJson('/skills/'),
    fetchJson('/experiences/'),
    fetchJson('/certificates/'),
  ])

  if (profile && projects && skills) {
    return {
      basics: {
        name: profile.full_name || '',
        label: profile.job_title || '',
        email: profile.email || '',
        phone: profile.phone || '',
        website: profile.website_url || '',
        summary: profile.bio_full || profile.bio_short || '',
        location: { address: profile.location || '' },
        profiles: [
          profile.github_url ? { network: 'GitHub', url: profile.github_url } : null,
          profile.linkedin_url ? { network: 'LinkedIn', url: profile.linkedin_url } : null,
        ].filter(Boolean),
        avatar: profile.avatar_url || '',
      },
      aboutText1: profile.bio_short || '',
      aboutText2: profile.bio_full || '',
      aboutText3: '',
      projects: (projects || []).map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description_short: p.description_short || '',
        description_full: p.description_full || '',
        tech_stack: p.tech_stack || '',
        image: p.image_url || '',
        demo_link: p.demo_link || '',
        source_link: p.source_link || '',
        date: p.date || '',
        is_featured: p.is_featured || false,
      })),
      skills: (() => {
        const s = {}
        const map = { Frontend: 'frontend', Backend: 'backend', Database: 'database', Tools: 'tools', Cloud: 'cloud', Other: 'other' }
        for (const c of skills) { s[map[c.title] || c.title.toLowerCase()] = (c.skills || []).map((x) => x.title).join(', ') }
        return s
      })(),
      experiences: (experiences || []).map((e) => ({
        title: e.title,
        company: e.company,
        location: e.location,
        dates: e.end_date ? `${formatDate(e.start_date)} – ${formatDate(e.end_date)}` : `${formatDate(e.start_date)} – Present`,
        duties: e.description ? e.description.split('\n').filter(Boolean) : [],
      })),
      certifications: (certifications || []).map((c) => ({
        name: c.title,
        issuer: c.issuer,
        date: c.issue_date || '',
        link: c.credential_url || '',
        image: c.image_url || '',
      })),
    }
  }
  return localData
}

// --- Photos ---
export async function fetchPhotos(project) {
  const projects = await fetchProjects()
  const photos = []
  for (const p of projects) {
    if (p.images && p.images.length) {
      for (const src of p.images) {
        if (!src || src.includes('/images/background')) continue
        if (project && p.title !== project) continue
        photos.push({ src, project: p.title })
      }
    }
  }
  return photos.length ? photos : localPhotos()
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

// --- Videos ---
export async function fetchVideos() {
  const projects = await fetchProjects()
  const projectVideos = []
  for (const p of projects) {
    if (p.video) {
      projectVideos.push({ title: `${p.title} (video)`, src: p.video, project: p.title })
    }
  }
  const manifest = await localVideosManifest()
  return [...manifest, ...projectVideos]
}

async function localVideosManifest() {
  try {
    const res = await fetch('/videos/manifest.json', { cache: 'no-store' })
    return res.ok ? await res.json() : []
  } catch { return [] }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

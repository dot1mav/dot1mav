// Single source of content: the Django portfolio API.
// Every /api route reads through here so the response shape stays
// consistent with what the UI expects. There is deliberately no
// bundled-data fallback — if the backend is unreachable the routes
// fail and the UI shows its boot-error screen with a retry.
//
// The backend URL comes from runtime config (NUXT_PUBLIC_API_BASE,
// default http://127.0.0.1:8000/v0 — same default as nuxt.config.ts).

const CACHE_TTL_MS = 60_000
const FETCH_TIMEOUT_MS = 5_000

let cache: { data: any; fetchedAt: number } | null = null
let inflight: Promise<any> | null = null

async function fetchJson(path: string): Promise<any> {
  const base = useRuntimeConfig().public.apiBase
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`${base}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`${path} -> ${res.status} ${res.statusText}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

// --- Django shape -> UI shape (mirrors services/portfolio.js) ---

function mapProject(p: any) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description_short: p.description_short || '',
    description_full: p.description_full || '',
    tech_stack: p.tech_stack || '',
    image: p.image_url || '',
    images: p.images || [],
    video: p.video || '',
    demo_link: p.demo_link || '',
    source_link: p.source_link || '',
    date: p.date || '',
    is_featured: p.is_featured || false,
  }
}

function mapExperience(e: any) {
  const start = formatDate(e.start_date)
  const dates = e.end_date
    ? `${start} – ${formatDate(e.end_date)}`
    : e.is_current
      ? `${start} – Present`
      : start
  return {
    title: e.title,
    company: e.company,
    location: e.location,
    dates,
    duties: e.description ? String(e.description).split('\n').filter(Boolean) : [],
  }
}

function mapSkills(categories: any) {
  const skills: Record<string, string> = {}
  const map: Record<string, string> = {
    Frontend: 'frontend',
    Backend: 'backend',
    Database: 'database',
    Tools: 'tools',
    Cloud: 'cloud',
    Other: 'other',
  }
  for (const cat of categories || []) {
    const key = map[cat.title] || String(cat.title || '').toLowerCase()
    skills[key] = (cat.skills || []).map((s: any) => s.title).join(', ')
  }
  return skills
}

function mapCertification(c: any) {
  return {
    name: c.title,
    issuer: c.issuer,
    date: c.issue_date || '',
    link: c.credential_url || '',
    image: c.image_url || '',
  }
}

// The backend stores the bio as one blob (data.json's aboutText1–3,
// joined with blank lines by the import command). Split it back into
// paragraphs so the About window gets the same structure.
function bioParagraphs(profile: any): string[] {
  const paragraphs = String(profile.bio_full || '')
    .split(/\n\s*\n/)
    .map((s: string) => s.trim())
    .filter(Boolean)
  return paragraphs.length ? paragraphs : [profile.bio_short || ''].filter(Boolean)
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function projectPhotos(projects: any[]) {
  const photos: Array<{ src: string; project: string }> = []
  for (const p of projects || []) {
    for (const src of p.images || []) {
      if (!src || src.includes('/images/background')) continue
      photos.push({ src, project: p.title })
    }
  }
  return photos
}

function projectVideos(projects: any[]) {
  return (projects || [])
    .filter((p) => p.video)
    .map((p) => ({ title: `${p.title} (video)`, src: p.video, project: p.title }))
}

async function loadSiteData() {
  const results = await Promise.allSettled([
    fetchJson('/profile/'),
    fetchJson('/projects/'),
    fetchJson('/skills/'),
    fetchJson('/experiences/'),
    fetchJson('/certificates/'),
  ])
  const [profileRes, projectsRes, skillsRes, experiencesRes, certificatesRes] = results

  if (profileRes.status !== 'fulfilled' || !profileRes.value) {
    const reason =
      profileRes.status === 'rejected'
        ? profileRes.reason?.message || String(profileRes.reason)
        : 'empty response'
    throw new Error(`Django profile unavailable: ${reason}`)
  }
  const profile = profileRes.value

  const projectsRaw = projectsRes.status === 'fulfilled' ? projectsRes.value ?? [] : []
  const skillsRaw = skillsRes.status === 'fulfilled' ? skillsRes.value ?? [] : []
  const experiencesRaw = experiencesRes.status === 'fulfilled' ? experiencesRes.value ?? [] : []
  const certificatesRaw = certificatesRes.status === 'fulfilled' ? certificatesRes.value ?? [] : []

  const projects = Array.isArray(projectsRaw) ? projectsRaw.map(mapProject) : []
  const skills = Array.isArray(skillsRaw) ? mapSkills(skillsRaw) : {}
  const experiences = Array.isArray(experiencesRaw) ? experiencesRaw.map(mapExperience) : []
  const certifications = Array.isArray(certificatesRaw) ? certificatesRaw.map(mapCertification) : []

  const paragraphs = bioParagraphs(profile)

  const basics = {
    name: profile.full_name || '',
    label: profile.job_title || '',
    email: profile.email || '',
    phone: profile.phone || '',
    website: profile.website_url || '',
    resume_url: profile.resume_url || '',
    summary: profile.bio_short || profile.bio_full || '',
    location: { address: profile.location || '', city: '', region: '', countryCode: '' },
    profiles: [
      profile.website_url ? { network: 'Website', url: profile.website_url } : null,
      profile.github_url ? { network: 'GitHub', url: profile.github_url } : null,
      profile.linkedin_url ? { network: 'LinkedIn', url: profile.linkedin_url } : null,
      profile.telegram_url ? { network: 'Telegram', url: profile.telegram_url } : null,
    ].filter(Boolean),
    avatar: profile.avatar_url || '',
  }

  return {
    basics,
    aboutText1: paragraphs[0] || '',
    aboutText2: paragraphs[1] || '',
    aboutText3: paragraphs[2] || '',
    projects,
    skills,
    experiences,
    certifications,
    photos: projectPhotos(projects),
    videos: projectVideos(projects),
  }
}

export async function getSiteData(): Promise<any> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data
  if (!inflight) {
    inflight = loadSiteData()
      .then((data) => {
        cache = { data, fetchedAt: Date.now() }
        return data
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export async function getProjects() {
  return (await getSiteData()).projects ?? []
}

export async function getExperiences() {
  return (await getSiteData()).experiences ?? []
}

export async function getSkills() {
  return (await getSiteData()).skills ?? {}
}

export async function getCertifications() {
  return (await getSiteData()).certifications ?? []
}

export async function getAbout() {
  const data = await getSiteData()
  return {
    basics: data.basics ?? {},
    aboutText1: data.aboutText1 ?? '',
    aboutText2: data.aboutText2 ?? '',
    aboutText3: data.aboutText3 ?? '',
  }
}

// Every project image as { src, project }, matching the shape the
// Photo Viewer builds client-side. `background` shots are excluded
// exactly like the viewer does.
export async function getProjectPhotos() {
  return (await getSiteData()).photos ?? []
}

// Per-project videos declared in the backend, merged by the /api/videos
// route with the static /videos/manifest.json playlist.
export async function getProjectVideos() {
  return (await getSiteData()).videos ?? []
}

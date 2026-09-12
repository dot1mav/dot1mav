import { afterEach, describe, expect, it, vi } from 'vitest'

describe('portfolio API adapter', () => {
  afterEach(() => vi.restoreAllMocks())
  it('preserves project video fields from API data', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => String(url).endsWith('/projects/')
      ? new Response(JSON.stringify([{ id: 1, title: 'Demo', video: '/videos/demo.mp4', images: [] }]), { status: 200 })
      : new Response('[]', { status: 200 })))
    const { fetchProjects } = await import('../services/portfolio')
    expect((await fetchProjects())[0].video).toBe('/videos/demo.mp4')
  })
  it('does not label non-current experiences as Present', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => String(url).endsWith('/experiences/')
      ? new Response(JSON.stringify([{ title: 'Engineer', company: 'Acme', location: 'Remote', start_date: '2020-01-01', end_date: null, is_current: false, description: 'Built things' }]), { status: 200 })
      : new Response('[]', { status: 200 })))
    const { fetchExperiences } = await import('../services/portfolio')
    expect((await fetchExperiences())[0].dates).toBe('Jan 2020')
  })

  it('maps the backend resume URL into profile data', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => String(url).endsWith('/profile/')
      ? new Response(JSON.stringify({ full_name: 'A', resume_url: 'https://api.example.com/media/resumes/cv.pdf' }), { status: 200 })
      : new Response('[]', { status: 200 })))
    const { fetchAbout } = await import('../services/portfolio')
    expect((await fetchAbout()).basics.resume_url).toBe('https://api.example.com/media/resumes/cv.pdf')
  })
})

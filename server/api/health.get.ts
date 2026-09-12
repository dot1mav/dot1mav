// Health check endpoint for boot sequence.
// Returns status of all critical systems. "data" reflects whether the
// Django backend answered — it is the only content source there is.
import { getSiteData } from '../utils/site-data'

export default defineEventHandler(async () => {
  const start = Date.now()
  let data: any = null
  let error: string | undefined
  try {
    data = await getSiteData()
  } catch (err: any) {
    error = err?.message || String(err)
  }
  const latency = Date.now() - start

  const checks: Record<string, any> = {
    api: { status: 'ok', latency: `${latency}ms` },
    data: {
      status: data ? 'ok' : 'error',
      backend: 'django',
      error,
      projects: data?.projects?.length ?? 0,
      experiences: data?.experiences?.length ?? 0,
      skills: Object.keys(data?.skills ?? {}).length,
      certifications: data?.certifications?.length ?? 0,
      photos: data?.photos?.length ?? 0,
      videos: data?.videos?.length ?? 0,
    },
    storage: { status: 'ok', type: 'memory' },
  }

  const allOk = Object.values(checks).every((c: any) => c.status === 'ok')

  return {
    status: allOk ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    build: '2026.08.23',
  }
})
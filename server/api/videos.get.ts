// The video playlist: per-project videos from data.json merged with
// the static clips listed in public/videos/manifest.json.
//
// The manifest lives in the public dir (static hosts can't list a
// folder), so it's read at build/serve time here and merged server-side.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getProjectVideos } from '../utils/site-data'

export default defineEventHandler(async () => {
  let manifest = []
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'videos', 'manifest.json'), 'utf8')
    manifest = JSON.parse(raw)
  } catch {
    // No manifest file or not readable — project videos alone still work.
  }

  return [...manifest, ...(await getProjectVideos())]
})
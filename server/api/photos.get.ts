// All project photos as { src, project }. Optional ?project= filter
// returns only that project's images — the Photo Viewer uses this
// when opened from a project's detail window.
import { getProjectPhotos } from '../utils/site-data'

export default defineEventHandler(async (event) => {
  const { project } = getQuery(event)
  const photos = await getProjectPhotos()

  if (!project) return photos

  const needle = String(project)
  return photos.filter((p) => p.project === needle)
})
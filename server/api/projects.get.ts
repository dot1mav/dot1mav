// Accepts an optional ?q= to filter by title, tech or description.
import { getProjects } from '../utils/site-data'

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event)
  const projects = await getProjects()

  if (!q) return projects

  const needle = String(q).toLowerCase()
  return projects.filter((p) =>
    [p.title, p.description_short, p.description_full, p.tech_stack]
      .some((field) => field && field.toLowerCase().includes(needle))
  )
})

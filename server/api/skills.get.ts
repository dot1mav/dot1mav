// Skills grouped by category (frontend, backend, database, tools, ...).
import { getSkills } from '../utils/site-data'

export default defineEventHandler(() => getSkills())

// Basics (name, email, location...) plus the three about paragraphs.
import { getAbout } from '../utils/site-data'

export default defineEventHandler(() => getAbout())

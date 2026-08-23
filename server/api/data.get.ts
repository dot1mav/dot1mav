// Full site dump in one request — handy for scripts or
// for syncing a copy of the portfolio elsewhere.
import { getSiteData } from '../utils/site-data'

export default defineEventHandler(() => getSiteData())

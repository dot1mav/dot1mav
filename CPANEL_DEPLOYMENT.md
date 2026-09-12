# cPanel deployment

## Recommended: static hosting

Use this when the cPanel account is a normal Apache/PHP account and does not
provide a Node.js application manager.

```bash
npm ci
npm run generate
```

Upload **the contents of `.output/public/`** into the domain's document root
(usually `public_html/`). Do not upload the repository root and do not point
the domain at `.output` itself.

The generated output contains `index.html`, `200.html`, `_nuxt/`, `images/`,
`videos/`, and `data.json`. The included `public/.htaccess` is copied into
the generated output and keeps direct browser refreshes working.

This mode is fully functional only if the Django backend is reachable
and `/api/*` is reverse-proxied to it. All content is read exclusively
from the Django backend through the Nuxt server routes (`/api/*`),
which do not exist on static Apache hosting — without the proxy the
boot sequence halts on the boot-error screen.

## Node.js application mode

Use this only if cPanel exposes **Setup Node.js App**.

The current Nuxt/Nitro versions require Node `^20.19.0 || >=22.12.0`.
They cannot run on cPanel's Node 14.21.2. Do not try to fix this by only
changing `package.json`; the framework itself uses newer Node APIs.

```bash
npm ci --omit=dev
npm run build
```

Set the application startup file to:

```text
.output/server/index.mjs
```

Set `NODE_ENV=production` and use the port supplied by cPanel (the Nitro
server reads `PORT`). The application must be started by cPanel's Node
process manager, not by a browser or cron job.

This mode serves Nuxt API routes, which proxy the Django backend. The
backend URL comes from `NUXT_PUBLIC_API_BASE` (runtime env var, falls
back to `http://127.0.0.1:8000/v0`). Set it before starting the app,
for example:

```bash
NUXT_PUBLIC_API_BASE=https://api.example.com/v0 node .output/server/index.mjs
```

Configure that backend and its CORS policy separately. If
`NUXT_PUBLIC_API_BASE` is not set, the server tries the local
development URL `http://127.0.0.1:8000/v0`.

## Before going live

- Add `public/resume.pdf` if the Resume terminal command/download is required.
- Replace the hard-coded `127.0.0.1:8000` API URL with a production
  environment/runtime configuration when using the external API.
- Confirm the domain and HTTPS URLs in `app.vue`, `robots.txt`, and
  `sitemap.xml`.
- After upload, verify `/`, `/images/self.jpg`, `/videos/manifest.json`, and
  `/resume.pdf` (if added), then hard-refresh the page.

# MAV Portfolio

My portfolio, dressed up as a Windows 98 desktop. Build with Nuxt 3.

Open the site, and you're on a desktop with icons. Each icon opens a
draggable window — Projects, Experience, Skills, Certifications,
Contact, About, and a fake MS-DOS prompt. The terminal isn't just for
show: type `help` and you can list projects, skills, experience and
certifications right in the shell, open windows with `open projects`,
or flip to dark mode with `theme dark`. There's a dark mode button in
the taskbar too.

Live at [dot1mav.ir](https://dot1mav.ir).

## Running it locally

```bash
npm install
npm run dev
```

That's it. The dev server also runs the JSON API (see below), which
you can poke at with curl while the site is up.

## Building

Two builds, depending on where it's going:

```bash
npm run generate   # static site → .output/public (for static hosting)
npm run build      # node server build — required: all content comes from
                   # the Django backend through the /api routes
```

`npm run build` + `node .output/server/index.mjs` is the normal way to
run it (see CPANEL_DEPLOYMENT.md). Set `NUXT_PUBLIC_API_BASE` to the
Django backend URL. The static `generate` output only works if the
host reverse-proxies `/api/*` to the backend — without it the boot
sequence halts on the boot-error screen.

## Project structure

```
app.vue                 — shell, SEO head, JSON-LD, noscript fallback
nuxt.config.ts          — fonts, 98.css, Umami script, global CSS
pages/index.vue         — the desktop: icons, windows, taskbar
components/             — window frame + one component per window
composables/            — shared state (windows, terminal, dark mode)
services/portfolio.js   — client-side access to the data
services/dosFilesystem.js — fake DOS file system for the terminal
server/api/             — the JSON API
server/utils/           — shared data loader for the API
scripts/                — small generators (e.g. project placeholder images)
public/data.json        — every piece of content on the site
public/images/          — icons, background, profile photo, project images
```

## Where the content lives

Everything you see — projects, jobs, skills, certifications, the about
paragraphs — is `public/data.json`, one file. To update the site, edit
that file, regenerate, push. The JSON follows the JSON Resume layout,
roughly, so moving to a real resume parser later wouldn't hurt.

## The API

The content comes from one place only: the Django REST backend
(`NUXT_PUBLIC_API_BASE`, default `http://127.0.0.1:8000/v0`). The
Nuxt server routes below proxy and reshape it for the UI — there is
no bundled-JSON fallback, so if the backend is down the site shows
its boot-error screen:

```
GET /api/data           # everything in one response
GET /api/health         # backend reachability + record counts
GET /api/projects       # optional ?q= filters by title / tech / description
GET /api/experiences
GET /api/skills
GET /api/certifications
GET /api/about
```

Point `NUXT_PUBLIC_API_BASE` at the deployed backend (e.g.
`https://api.example.com/v0`) and allow the site origin in the
backend's `CORS_ALLOWED_ORIGINS`. `public/data.json` now only seeds
the backend (via `import_portfolio_data`) and the build-time SEO
meta in `app.vue`.

## Terminal commands

`help` prints the full list. Highlights:

```
projects [filter]   list projects, optionally filter by keyword
skills              skills by category
experiences         work history
cd <path>           browse a fake C:\PORTFOLIO file system
type <file>         view a file, e.g. type README.TXT
tree                dump the whole directory tree
open <window>       e.g. open projects
neofetch            system info, obviously fake
theme [dark|light]  switch theme
resume              downloads the resume (make sure resume.pdf is in public/)
```

The file system is generated from data.json on the fly, so `cd
projects` + `dir` always shows the same projects as the rest of the
site.

## Desktop

The desktop behaves like a window manager, not a picture of one:

```
drag a title bar        move the window
drag to a screen edge   snap: top maximizes, sides halve, corners quarter,
                        with a translucent preview of where it will land
drag a maximized window pulls it back down to its old size
double-click title bar  maximize / restore
drag any edge or corner resize (all 8 directions)
click a taskbar button  restores it, or minimizes it if it is already focused
Show Desktop (tray)     minimize everything; click again to restore
F11                     maximize / restore the window on top
Ctrl+← / Ctrl+→         cycle the open windows
arrow keys on icons     walk the icon grid; Enter opens
Start → search box      filter programs live, ↑/↓/Enter to launch
```

Window positions and sizes are remembered in `localStorage`, so the
desktop comes back the way you left it. Only the focused window has the
blue title bar; the rest go grey.

## Misc

- Analytics via Umami, loaded from the cloud script in `nuxt.config.ts`.
  Event names like `window_open` and `terminal_command` land in the
  dashboard.
- Right-click and devtools shortcuts are blocked and replaced with a
  notice linking to the public repo. It's a deterrent, not a real
  gate — the code is on GitHub by design.
- The custom cursor, particle bursts and ripple effects respect
  `prefers-reduced-motion` and skip on mobile.

## Credits

- [98.css](https://github.com/jdan/98.css) for the Windows 98 look
- [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) for
  the terminal font
- Windows 98, for the nostalgia

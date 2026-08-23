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
npm run generate   # static site → .output/public (used for GitHub Pages)
npm run build      # node server build (needed if you want the /api routes to actually run)
```

`npm run generate` is what gets pushed to `gh-pages`. It prerenders
`/`, `404.html` and `200.html`, and everything else is client-side.
The `CNAME` file in `public/` keeps `dot1mav.ir` pointing here.

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

The same data is also served as JSON when the site runs as a server:

```
GET /api/data           # everything in one response
GET /api/projects       # optional ?q= filters by title / tech / description
GET /api/experiences
GET /api/skills
GET /api/certifications
GET /api/about
```

Why both the API and a bundled JSON? GitHub Pages is static hosting —
no server, so `/api` can't work there. The site therefore ships with
`data.json` bundled into the JS and reads that directly. The API
exists for when it runs as a real server (local dev, or if it ever
moves to a VPS). `services/portfolio.js` knows how to talk to the API
and falls back to the bundled copy, so both paths return the same
shapes.

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

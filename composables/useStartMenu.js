// The Start menu's contents and filtering.
//
// Kept as plain functions (no Vue, no DOM) so the menu can be
// unit-tested without mounting the Taskbar. Sections without a title
// are the unlabelled groups Windows 98 used for theme and power items.
export function buildStartMenuSections(isDarkMode) {
  return [
    {
      title: 'Programs',
      items: [
        { label: 'Projects', action: 'projects', icon: '/images/icons/projects.png' },
        { label: 'Experiences', action: 'experiences', icon: '/images/icons/experiences.png' },
        { label: 'Skills', action: 'skills', icon: '/images/icons/skills.png' },
        { label: 'Certifications', action: 'certifications', icon: '/images/icons/certificates.png' },
        { label: 'Contact', action: 'contact', icon: '/images/icons/contact.png' },
        { label: 'About Me', action: 'about', icon: '/images/icons/info.png' },
      ],
    },
    {
      title: 'Accessories',
      items: [
        { label: 'MS-DOS Prompt', action: 'terminal', icon: '/images/icons/modem-4.png' },
        { label: 'SVG Creator', action: 'svgcreator', icon: '/images/icons/paint.png' },
        { label: 'Photo Viewer', action: 'photos', icon: '/images/icons/photos.png' },
        { label: 'Video Player', action: 'video', icon: '/images/icons/video.png' },
      ],
    },
    {
      title: 'Games',
      separatorAfter: true,
      items: [
        { label: 'Minesweeper', action: 'minesweeper', icon: '/images/icons/paint.png' },
        { label: 'Solitaire', action: 'solitaire', icon: '/images/icons/solitaire.png' },
      ],
    },
    {
      separatorAfter: true,
      items: [
        {
          label: isDarkMode ? 'Light Mode' : 'Dark Mode',
          action: 'darkmode',
          glyph: isDarkMode ? '☀️' : '🌙',
        },
      ],
    },
    {
      items: [
        { label: 'Restart', action: 'restart', glyph: '🔄', danger: true },
        { label: 'Shut Down', action: 'shutdown', glyph: '⏻', danger: true },
      ],
    },
  ]
}

// Case-insensitive label search. Sections that end up empty are
// dropped so the menu never shows a heading with nothing under it.
export function filterStartMenuSections(sections, query) {
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return sections

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.label.toLowerCase().includes(needle)),
    }))
    .filter((section) => section.items.length)
}

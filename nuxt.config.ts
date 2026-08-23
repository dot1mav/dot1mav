export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap',
        },
        { rel: 'stylesheet', href: 'https://unpkg.com/98.css' },
        { rel: 'icon', href: 'https://img.icons8.com/3d-fluency/94/computer.png', type: 'image/png' },
      ],
      script: [
        {
          src: 'https://cloud.umami.is/script.js',
          defer: true,
          'data-website-id': 'f1fcf1fc-9414-4a1d-ab0e-26d38c123dcb',
        },
      ],
    },
  },
  css: [
    '~/assets/css/style.css',
  ],
})

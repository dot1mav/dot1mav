<template>
  <div>
    <a href="#desktop" class="skip-link">Skip to desktop</a>
    <NuxtPage />

    <noscript>
      <div style="font-family: sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px;">
        <h1>Mohammad Amin Vakili — Software Engineer</h1>
        <p>Software engineer experienced in web and desktop systems, process automation, IoT data integration,
          backend services, and data-driven applications. Specializes in Python, Django, Flask, Vue.js,
          Electron.js, database design, and server management.</p>
        <h2>Contact</h2>
        <ul>
          <li>Email: dot1mav@gmail.com</li>
          <li>GitHub: <a href="https://github.com/dot1mav">github.com/dot1mav</a></li>
          <li>LinkedIn: <a href="https://ir.linkedin.com/in/dot1mav">linkedin.com/in/dot1mav</a></li>
          <li>Website: <a href="https://dot1mav.ir">dot1mav.ir</a></li>
        </ul>
        <p><em>This site uses JavaScript for its interactive Windows 98-style interface. Please enable
          JavaScript to explore projects, experience, and skills.</em></p>
      </div>
    </noscript>
  </div>
</template>

<script setup>
import { useHead } from '#imports'
import siteData from './public/data.json'

const siteUrl = 'https://dot1mav.ir'
const basics = siteData.basics || {}

const knownSkills = []
for (const group of Object.values(siteData.skills || {})) {
  if (!group) continue
  for (const skill of String(group).split(',')) {
    const s = skill.trim()
    if (s) knownSkills.push(s)
  }
}

const credentials = (siteData.certifications || []).map((cert) => ({
  '@type': 'EducationalOccupationalCredential',
  name: cert.name,
  credentialCategory: 'certification',
  issuedBy: {
    '@type': 'Organization',
    name: cert.issuer,
  },
}))

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'MAV Portfolio',
      url: siteUrl,
      inLanguage: 'en',
      author: { '@id': `${siteUrl}/#person` },
    },
    {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
      name: basics.name,
      jobTitle: basics.label,
      url: siteUrl,
      email: basics.email,
      image: `${siteUrl}/images/self.jpg`,
      description: basics.summary,
      address: {
        '@type': 'PostalAddress',
        addressLocality: basics.location?.city,
        addressRegion: basics.location?.region,
        addressCountry: basics.location?.countryCode,
      },
      sameAs: [
        'https://github.com/dot1mav',
        'https://ir.linkedin.com/in/dot1mav',
        'https://t.me/dot1mav',
      ],
      knowsAbout: knownSkills,
      hasCredential: credentials,
    },
  ],
}

// The interactive UI itself is client-side (windows only render once
// opened), so this is where SEO actually happens: server-rendered
// meta tags plus a JSON-LD graph describing the person behind the site.
useHead({
  titleTemplate: (title) =>
    title ? `${title} · ${basics.name}` : `${basics.label} — ${basics.name}`,
  htmlAttrs: {
    lang: 'en',
    dir: 'ltr',
  },
  meta: [
    { name: 'description', content: basics.summary },
    { name: 'author', content: basics.name },
    { name: 'robots', content: 'index, follow' },
    { name: 'theme-color', content: '#000080' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'MAV Portfolio' },
    { property: 'og:title', content: `${basics.label} — ${basics.name}` },
    { property: 'og:description', content: basics.summary },
    { property: 'og:url', content: siteUrl },
    { property: 'og:image', content: `${siteUrl}/images/background.jpg` },
    { property: 'og:locale', content: 'en_US' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: `${basics.label} — ${basics.name}` },
    { name: 'twitter:description', content: basics.summary },
    { name: 'twitter:image', content: `${siteUrl}/images/background.jpg` },
  ],
  link: [
    { rel: 'canonical', href: siteUrl },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(jsonLd),
    },
  ],
})
</script>

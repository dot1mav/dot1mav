// Single place that loads the content file.
// Every API route reads through here so the response shape
// stays consistent with what the UI already expects.
import siteData from '../../public/data.json'

export function getSiteData() {
  return siteData
}

export function getProjects() {
  return siteData.projects ?? []
}

export function getExperiences() {
  return siteData.experiences ?? []
}

export function getSkills() {
  return siteData.skills ?? {}
}

export function getCertifications() {
  return siteData.certifications ?? []
}

export function getAbout() {
  return {
    basics: siteData.basics ?? {},
    aboutText1: siteData.aboutText1 ?? '',
    aboutText2: siteData.aboutText2 ?? '',
    aboutText3: siteData.aboutText3 ?? '',
  }
}

// Every project image as { src, project }, matching the shape the
// Photo Viewer builds client-side. `background` shots are excluded
// exactly like the viewer does.
export function getProjectPhotos() {
  const photos = []
  for (const project of siteData.projects ?? []) {
    for (const src of project.images ?? []) {
      if (!src || src.includes('/images/background')) continue
      photos.push({ src, project: project.title })
    }
  }
  return photos
}

// Per-project videos declared in data.json (projects with a `video`
// field). The player merges these with /videos/manifest.json.
export function getProjectVideos() {
  const videos = []
  for (const project of siteData.projects ?? []) {
    if (project.video) {
      videos.push({
        title: `${project.title} (video)`,
        src: project.video,
        project: project.title,
      })
    }
  }
  return videos
}

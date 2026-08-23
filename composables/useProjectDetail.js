// State for the project detail window.
//
// Module-scoped like everything else, so any window (projects list,
// terminal...) can open a detail view without prop drilling.
import { ref, nextTick } from 'vue'
import { useWindows } from './useWindows'

const selectedProject = ref(null)
const activeImageIndex = ref(0)

// Targets for the Photo Viewer / Video Player apps. When a project's
// detail window asks for its media, these hold the project title so
// the two apps can pre-filter themselves to that project.
const requestedPhotosProject = ref(null)
const requestedVideoProject = ref(null)

export function useProjectDetail() {
  const { windows, openWindow } = useWindows()

  function openProject(project) {
    if (!project) return
    selectedProject.value = project
    activeImageIndex.value = 0
    windows.project.title = project.title
    openWindow('project')
  }

  // Images are optional in data.json; pick a sane default when missing.
  function projectImages(project) {
    const images = project.images || []
    if (images.length) return images
    const slug = project.image_slug || 'placeholder'
    return [`/images/projects/${slug}.svg`]
  }

  function nextImage() {
    const count = (selectedProject.value?.images || []).length
    if (count > 1) activeImageIndex.value = (activeImageIndex.value + 1) % count
  }

  function prevImage() {
    const count = (selectedProject.value?.images || []).length
    if (count > 1) {
      activeImageIndex.value = (activeImageIndex.value - 1 + count) % count
    }
  }

  function selectImage(index) {
    activeImageIndex.value = index
  }

  // Open the Photo Viewer pre-filtered to this project's images.
  // The null-then-set dance re-triggers the watcher even when the
  // same project is requested twice in a row.
  function openProjectPhotos(project) {
    if (!project) return
    requestedPhotosProject.value = null
    nextTick(() => {
      requestedPhotosProject.value = project.title
      windows.photos.title = `${project.title} — Photo Viewer`
      openWindow('photos')
    })
  }

  // Open the Video Player pointed at this project's demo video.
  function openProjectVideo(project) {
    if (!project) return
    requestedVideoProject.value = null
    nextTick(() => {
      requestedVideoProject.value = project.title
      windows.video.title = `${project.title} — Video Player`
      openWindow('video')
    })
  }

  return {
    selectedProject,
    activeImageIndex,
    requestedPhotosProject,
    requestedVideoProject,
    openProject,
    openProjectPhotos,
    openProjectVideo,
    projectImages,
    nextImage,
    prevImage,
    selectImage,
  }
}

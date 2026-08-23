<template>
  <div>
    <div class="projects-controls">
      <input v-model="projectsSearch" type="search"
        placeholder="Search projects (title, description, tech)..." aria-label="Search projects" />
      <select v-model="projectsTechFilter" aria-label="Filter by technology">
        <option value="">All technologies</option>
        <option v-for="t in allProjectTags" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="projectsSort" aria-label="Sort projects">
        <option value="title_asc">Title ↑</option>
        <option value="title_desc">Title ↓</option>
        <option value="date_desc">Date ↓ (Newest)</option>
        <option value="date_asc">Date ↑ (Oldest)</option>
      </select>
      <label class="group-toggle">
        <input type="checkbox" v-model="groupByYear" />
        Group by year (if date exists)
      </label>
    </div>

    <template v-if="groupByYear">
      <div v-for="group in groupedProjects" :key="group.year" class="projects-group">
        <h3 class="group-title">{{ group.year }}</h3>
        <ProjectCard
          v-for="project in group.projects"
          :key="project.title"
          :project="project"
          :expanded="isExpanded(project)"
          @toggle="toggleExpand(project)"
          @details="openProject(project)"
          @demo="onDemoOpen"
        />
      </div>
    </template>

    <div v-else class="projects-cards">
      <ProjectCard
        v-for="project in filteredAndSortedProjects"
        :key="project.title"
        :project="project"
        :expanded="isExpanded(project)"
        @toggle="toggleExpand(project)"
        @details="openProject(project)"
        @demo="onDemoOpen"
      />
    </div>

    <div v-if="filteredAndSortedProjects.length === 0" class="no-results">
      No results found.
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSiteData } from '../composables/useSiteData'
import { useAnalytics } from '../composables/useAnalytics'
import { useProjectDetail } from '../composables/useProjectDetail'
import { splitTech, parseDate } from '../composables/useUtils'

const siteData = useSiteData()
const { sendUmamiEvent } = useAnalytics()
const { openProject } = useProjectDetail()

const projects = ref(siteData.projects || [])
const projectsSearch = ref('')
const projectsTechFilter = ref('')
const projectsSort = ref('date_desc')
const groupByYear = ref(true)
const expandedProjects = ref([])

const allProjectTags = computed(() => {
  const tags = new Set()
  ;(projects.value || []).forEach((p) => {
    splitTech(p.tech_stack).forEach((t) => tags.add(t))
  })
  return Array.from(tags).sort()
})

const filteredAndSortedProjects = computed(() => {
  let list = (projects.value || []).slice()

  if (projectsTechFilter.value) {
    list = list.filter((p) => splitTech(p.tech_stack).includes(projectsTechFilter.value))
  }

  const q = (projectsSearch.value || '').trim().toLowerCase()
  if (q) {
    list = list.filter((p) => {
      return (
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description_short && p.description_short.toLowerCase().includes(q)) ||
        (p.description_full && p.description_full.toLowerCase().includes(q)) ||
        (p.tech_stack && p.tech_stack.toLowerCase().includes(q))
      )
    })
  }

  list.forEach((p) => {
    p._parsedDate = parseDate(p.date || p.dates || null)
  })

  switch (projectsSort.value) {
    case 'title_asc':
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      break
    case 'title_desc':
      list.sort((a, b) => (b.title || '').localeCompare(a.title || ''))
      break
    case 'date_asc':
      list.sort((a, b) => {
        const A = a._parsedDate ? a._parsedDate.getTime() : -Infinity
        const B = b._parsedDate ? b._parsedDate.getTime() : -Infinity
        return A - B
      })
      break
    case 'date_desc':
    default:
      list.sort((a, b) => {
        const A = a._parsedDate ? a._parsedDate.getTime() : -Infinity
        const B = b._parsedDate ? b._parsedDate.getTime() : -Infinity
        return B - A
      })
      break
  }

  return list
})

const groupedProjects = computed(() => {
  const groups = {}

  for (const p of filteredAndSortedProjects.value) {
    let year = 'Undated'
    if (p._parsedDate instanceof Date && !isNaN(p._parsedDate)) {
      year = String(p._parsedDate.getFullYear())
    } else {
      const candidate = (p.date || p.dates || '').toString()
      const m = candidate.match(/(19|20)\d{2}/)
      if (m) year = m[0]
    }

    if (!groups[year]) groups[year] = []
    groups[year].push(p)
  }

  const entries = Object.entries(groups).map(([year, projects]) => ({
    year,
    projects,
  }))

  entries.sort((a, b) => {
    if (a.year === 'Undated') return 1
    if (b.year === 'Undated') return -1
    return Number(b.year) - Number(a.year)
  })

  return entries
})

function isExpanded(project) {
  return expandedProjects.value.includes(project.title)
}

function toggleExpand(project) {
  const key = project.title
  const idx = expandedProjects.value.indexOf(key)
  if (idx === -1) expandedProjects.value.push(key)
  else expandedProjects.value.splice(idx, 1)
}

function onDemoOpen(detail) {
  sendUmamiEvent('project_demo_open', detail)
}
</script>

<template>
  <div>
    <div class="section-header">
      <span class="section-header-icon">💻</span>
      <h2 class="section-header-title">Technical Skills</h2>
    </div>

    <div class="skills-grid">
      <div v-for="card in skillCards" :key="card.id" class="skill-card">
        <div class="skill-card-header">
          <span class="skill-icon">{{ card.icon }}</span>
          <h3 class="skill-card-title">{{ card.title }}</h3>
        </div>
        <div class="skill-tags">
          <span class="skill-tag" v-for="skill in splitSkills(card.value)" :key="skill">
            {{ skill }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSiteData } from '../composables/useSiteData'
import { splitSkills } from '../composables/useUtils'

const siteData = useSiteData()

const skills = siteData.skills || {}

const skillCards = [
  { id: 'frontend', icon: '🎨', title: 'Frontend', value: skills.frontend },
  { id: 'backend', icon: '⚙️', title: 'Backend', value: skills.backend },
  { id: 'database', icon: '🗄️', title: 'Database', value: skills.database },
  { id: 'tools', icon: '🛠️', title: 'Tools', value: skills.tools },
  { id: 'cloud', icon: '☁️', title: 'Cloud', value: skills.cloud },
  { id: 'other', icon: '🔧', title: 'Other', value: skills.other },
].filter((card) => card.value)
</script>

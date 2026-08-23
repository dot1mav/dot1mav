<template>
  <div>
    <div v-for="exp in experiences" :key="exp.title" class="experience-item">
      <h3>{{ exp.title }} at {{ exp.company }}</h3>
      <p><strong>Location:</strong> {{ exp.location }}</p>
      <p><strong>Dates:</strong> {{ exp.dates }}</p>
      <ul>
        <li v-for="duty in exp.duties" :key="duty">{{ duty }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useSiteData } from '../composables/useSiteData'

const siteData = useSiteData()
const experiences = siteData.experiences || []
</script>

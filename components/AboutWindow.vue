<template>
  <div>
    <img src="/images/self.jpg" alt="Mohammad Amin Vakili" class="profile-photo">
    <h1>{{ basics.name }}</h1>
    <p>{{ basics.label }}</p>
    <p><strong>Email:</strong> {{ basics.email }}</p>
    <p><strong>Website:</strong>
      <a :href="basics.website" target="_blank" rel="noopener noreferrer">{{ basics.website }}</a>
    </p>
    <p v-if="address"><strong>Address:</strong> {{ address }}</p>

    <h2>About Me</h2>
    <p v-for="(paragraph, i) in aboutParagraphs" :key="i">{{ paragraph }}</p>

    <h2>Educational Background</h2>
    <p>Bachelor's in Computer Engineering - Software</p>
    <p>Hormozgan University, Bandar Abbas</p>
    <p>2016 - Present</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSiteData } from '../composables/useSiteData'

const siteData = useSiteData()
const basics = siteData.basics || {}

const aboutParagraphs = computed(() =>
  [siteData.aboutText1, siteData.aboutText2, siteData.aboutText3].filter(Boolean)
)

const address = computed(() => basics.location?.address || '')
</script>

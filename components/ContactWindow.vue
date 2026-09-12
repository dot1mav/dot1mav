<template>
  <div>
    <p><strong>Email:</strong>
      <a :href="'mailto:' + basics.email" rel="noopener noreferrer">{{ basics.email }}</a>
    </p>
    <p><strong>GitHub:</strong>
      <a href="https://github.com/dot1mav" target="_blank" rel="noopener noreferrer">github.com/dot1mav</a>
    </p>
    <p><strong>LinkedIn:</strong>
      <a href="https://ir.linkedin.com/in/dot1mav" target="_blank" rel="noopener noreferrer">linkedin.com/in/dot1mav</a>
    </p>
    <p><strong>Website:</strong>
      <a :href="basics.website" target="_blank" rel="noopener noreferrer">{{ basics.website }}</a>
    </p>
    <p><strong>Telegram:</strong>
      <a href="https://t.me/dot1mav" target="_blank" rel="noopener noreferrer">t.me/dot1mav</a>
    </p>
    <p v-if="address"><strong>Location:</strong> {{ address }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSiteData } from '../composables/useSiteData'

const siteData = useSiteData()
const basics = siteData.basics || {}

const address = computed(() => {
  const loc = basics.location || {}
  return loc.address || [loc.city, loc.region].filter(Boolean).join(', ')
})
</script>

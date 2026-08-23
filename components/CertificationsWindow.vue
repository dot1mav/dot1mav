<template>
  <div>
    <div class="section-header">
      <span class="section-header-icon">🏆</span>
      <h2 class="section-header-title">Certifications & Licenses</h2>
    </div>

    <div v-if="certifications && certifications.length > 0" class="certifications-grid">
      <div class="cert-card" v-for="(cert, index) in certifications" :key="index">
        <div class="cert-card-header">
          <div class="cert-icon">🎓</div>
          <div class="cert-content">
            <h3 class="cert-name">{{ cert.name }}</h3>
            <p class="cert-issuer">{{ cert.issuer }}</p>
            <p class="cert-date" v-if="cert.date">{{ cert.date }}</p>
          </div>
        </div>
        <div class="cert-actions" v-if="cert.link">
          <a :href="cert.link" target="_blank" rel="noopener noreferrer" class="cert-link">
            <span>📄</span>
            <span>View Certificate</span>
          </a>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-state-icon">📜</div>
      <p class="empty-state-text">No certifications available</p>
    </div>
  </div>
</template>

<script setup>
import { useSiteData } from '../composables/useSiteData'

const siteData = useSiteData()
const certifications = siteData.certifications || []
</script>

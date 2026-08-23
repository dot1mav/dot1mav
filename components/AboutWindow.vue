<template>
  <div>
    <img src="/images/self.jpg" alt="Mohammad Amin Vakili" class="profile-photo">
    <h1>{{ basics.name }}</h1>
    <p>{{ basics.label }}</p>
    <p><strong>Email:</strong> {{ basics.email }}</p>
    <p><strong>Website:</strong>
      <a :href="basics.website" target="_blank" rel="noopener noreferrer">{{ basics.website }}</a>
    </p>
    <p><strong>Address:</strong> {{ basics.location.city }}, {{ basics.location.region }}, Iran</p>
    <p><strong>Birthdate:</strong> 1998-05-30</p>
    <p><strong>Marital Status:</strong> {{ basics.maritalStatus }}</p>
    <p><strong>Military Status:</strong> {{ basics.militaryStatus }}</p>

    <h2>Resume Summary</h2>
    <p>{{ basics.summary }}</p>

    <h2>Educational Background</h2>
    <p>Bachelor's in Computer Engineering - Software</p>
    <p>Hormozgan University, Bandar Abbas</p>
    <p>2016 - Present</p>
  </div>
</template>

<script setup>
import { useSiteData } from '../composables/useSiteData'

const siteData = useSiteData()
const basics = siteData.basics || {}
</script>

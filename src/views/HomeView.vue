<script setup lang="ts">
import { RouterLink } from 'vue-router'

const quicklinks = [
  {
    icon: 'i-iv:moodle',
    url: 'https://moodle.innopolis.university',
  },
  {
    icon: 'i-iv:iu',
    url: 'https://my.university.innopolis.ru',
  },
]

const actions = [
  {
    title: 'Room Booking',
    subtitle: 'Book a room in the university.',
    path: '/room-booking',
    icon: 'i-ph:door-open',
  },
  {
    title: 'Scholarship',
    subtitle: 'Calculate your scholarship.',
    path: '/scholarship',
    icon: 'i-ph:currency-circle-dollar',
  },
  {
    title: 'Music Room',
    subtitle: 'Book a music room for free.',
    path: '/music-room',
    icon: 'i-ph:music-notes',
  },
]
</script>

<template>
  <div class="grid grid-cols-8 mx-auto gap-4 pt-6xl md:w-700px">
    <div class="window col-span-4 px-6 py-4 text-xl">
      <h2>
        September 19, Thursday
      </h2>
      <h2 class="text-sm text-gray-5">
        Week 7 of 18
      </h2>
    </div>
    <div class="col-span-4" />
    <div v-for="(link, i) in quicklinks" :key="i" class="window group relative aspect-square">
      <a
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="absolute inset-0 flex items-center justify-center"
      >
        <span
          class="block text-32px color-gray-6 filter-grayscale transition-all group-hover:filter-none"
          :class="link.icon"
        />
      </a>
    </div>
    <div class="col-span-6" />
    <div
      v-for="action in actions"
      :key="action.title"
      class="group window relative col-span-4 flex items-center justify-between px-6 py-4"
    >
      <div class="flex flex-col justify-center">
        <h3 class="flex items-center gap-1 text-lg">
          {{ action.title }}
          <span class="i-ph:arrow-right inline-block transition-transform group-hover:translate-x-1" />
        </h3>
        <p class="text-sm text-gray-5">
          {{ action.subtitle }}
        </p>
      </div>

      <span
        class="inline-block text-32px text-gray-6 transition-colors group-hover:text-purple-6"
        :class="action.icon"
      />

      <RouterLink :to="action.path" class="absolute inset-0" />
    </div>
  </div>
</template>

<style scoped>
.window {
  box-shadow: inset 0 1px 1px 0 hsla(0, 0%, 100%, 0.15);
  border: 1px solid hsla(0, 0%, 100%, 0.06);
  border-radius: 10px;
  @apply bg-black bg-op-5;
}
</style>

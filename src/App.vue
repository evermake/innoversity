<script setup lang="ts">
import { usePreferredColorScheme } from '@vueuse/core'
import { watch } from 'vue'
import { RouterView } from 'vue-router'

const scheme = usePreferredColorScheme()
watch(scheme, (newScheme) => {
  if (newScheme === 'dark')
    document.documentElement.classList.add('dark')
  else
    document.documentElement.classList.remove('dark')
}, { immediate: true })
</script>

<template>
  <main class="h-full">
    <RouterView />
  </main>
</template>

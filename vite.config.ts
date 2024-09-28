import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import unocss from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    unocss(),
  ],

  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: '@use "~/assets/css/_colors.scss" as colors;',
      },
    },
  },
})

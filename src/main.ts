import { createApp } from 'vue'
import App from '~/App.vue'
import { router } from '~/routing'

import '@unocss/reset/tailwind-compat.css'
import '~/assets/style.scss'
import 'virtual:uno.css'

createApp(App)
  .use(router)
  .mount('#app')

import { createRouter, createWebHistory } from 'vue-router'

import HomeView from './views/HomeView.vue'
import RoomBookingView from './views/RoomBookingView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/room-booking', component: RoomBookingView },
]

export const router = createRouter({
  routes,
  history: createWebHistory(),
})

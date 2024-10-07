<script setup lang="ts">
import BookingTimeline, { type Booking, type NewBooking } from '~/components/BookingTimeline.vue'

// TODO: in the title form check that title is ASCII, otherwise
// my.uni will break
function getBookingUrl(booking: {
  myUniRoomId: number
  title: string
  from: Date
  to: Date
}) {
  // Need to add Moscow offset.
  const fmtDate = (d: Date) => (new Date(d.getTime() + 3 * (1000 * 60 * 60))).toISOString().slice(0, 16)

  const url = new URL(import.meta.env.VITE_APP_BOOKING_BASE_URL)
  url.searchParams.set('room', booking.myUniRoomId.toString())
  url.searchParams.set('title', booking.title)
  url.searchParams.set('start', fmtDate(booking.from))
  url.searchParams.set('end', fmtDate(booking.to))
  return url.toString()
}

function handleBook({ room, from, to }: NewBooking) {
  // eslint-disable-next-line no-alert
  const title = prompt('Title of the booking')

  if (!title)
    return

  window.open(
    getBookingUrl({
      myUniRoomId: room.my_uni_id,
      title,
      from,
      to,
    }),
  )
}

function handleBookingClick(booking: Booking) {
  // eslint-disable-next-line no-alert
  alert(JSON.stringify(booking))
}
</script>

<template>
  <div class="h-full w-full p-48px">
    <BookingTimeline
      @book="handleBook"
      @booking-click="handleBookingClick"
    />
  </div>
</template>

<script setup lang="ts">
import BookingTimeline from '~/components/BookingTimeline.vue'

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

function handleBooking({ from, to, roomId }: { from: Date, to: Date, roomId: number }) {
  // eslint-disable-next-line no-alert
  const title = prompt('Title of the booking')

  if (!title)
    return

  window.open(getBookingUrl({ myUniRoomId: roomId, title, from, to }))
}
</script>

<template>
  <div class="h-full w-full p-48px">
    <BookingTimeline
      class="h-full"
      @booking="({ from, to, room }) => handleBooking({ from, to, roomId: room.my_uni_id })"
    />
  </div>
</template>

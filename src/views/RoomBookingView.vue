<script setup lang="ts">
import type { MaybeRef } from 'vue'
import type { components, paths } from '../api/room-booking'
import { useEventListener, useNow } from '@vueuse/core'
import createClient from 'openapi-fetch'
import { computed, ref, shallowRef, unref } from 'vue'
import { svgToDataUrl } from '../utils/svg'

const PIXELS_PER_MINUTE = 100 / 30
const MIN_BOOKING_DURATION_MINUTES = 15
const BOOKING_DURATION_STEP = 5

const T = {
  Ms: 1,
  Sec: 1000,
  Min: 1000 * 60,
  Hour: 1000 * 60 * 60,
  Day: 1000 * 60 * 60 * 24,
}

// TODO: in the title form check that title is ASCII, otherwise
// my.uni will break
function getBookingUrl(booking: {
  myUniRoomId: number
  title: string
  start: Date
  end: Date
}) {
  // Need to add Moscow offset.
  const fmtDate = (d: Date) => (new Date(d.getTime() + 3 * T.Hour)).toISOString().slice(0, 16)

  const url = new URL(import.meta.env.VITE_APP_BOOKING_BASE_URL)
  url.searchParams.set('room', booking.myUniRoomId.toString())
  url.searchParams.set('title', booking.title)
  url.searchParams.set('start', fmtDate(booking.start))
  url.searchParams.set('end', fmtDate(booking.end))
  return url.toString()
}

type Room = components['schemas']['Room']

interface Booking {
  id: string
  roomId: string
  title: string
  startsAt: Date
  endsAt: Date
}

const msToPx = (ms: number) => (ms / T.Min) * PIXELS_PER_MINUTE
const px = (n: number) => `${n}px`

function msBetween(a: MaybeRef<Date | number>, b: MaybeRef<Date | number>) {
  a = unref(a)
  b = unref(b)
  return (
    (b instanceof Date ? b.getTime() : b)
    - (a instanceof Date ? a.getTime() : a)
  )
}

function dateBoundsMinutes(d: Date, step: number, size: number): [Date, Date] {
  const l = new Date(d)
  l.setMinutes(0, 0, 0)

  // Find the nearest point before `d` that is divisible by step.
  while (l.getTime() + step * T.Min < d.getTime()) {
    l.setMinutes(l.getMinutes() + step)
  }

  // Go back until `d` is after the middle.
  while (l.getTime() + (size * T.Min / 2) - (step * T.Min) > d.getTime()) {
    l.setMinutes(l.getMinutes() - step)
  }

  const r = new Date(l.getTime() + size * T.Min)

  return [l, r]
}

function overlappingDates(...items: Date[]): [Date, Date] {
  items.sort((a, b) => a.getTime() - b.getTime())
  return [items.at(0)!, items.at(-1)!]
}

function durationFormatted(durationMs: number): string {
  const hours = Math.floor(durationMs / T.Hour)
  const minutes = Math.floor((durationMs % T.Hour) / T.Min)
  return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`
}

function dayTitle(d: Date) {
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  })
}

const today = new Date()
today.setHours(0, 0, 0, 0)

const twoDaysLater = new Date(today.getTime() + 3 * T.Day)

const SIDEBAR_WIDTH = 200
const HEADER_HEIGHT = 60
const ROW_HEIGHT = 50

const SIDEBAR_WIDTH_PX = px(SIDEBAR_WIDTH)
const HEADER_HEIGHT_PX = px(HEADER_HEIGHT)
const ROW_HEIGHT_PX = px(ROW_HEIGHT)

const client = createClient<paths>({ baseUrl: import.meta.env.VITE_APP_BOOKING_API_BASE_URL })
const actualRooms = shallowRef<Room[]>([])
const actualBookings = shallowRef<Booking[]>([])
client.GET('/rooms/')
  .then(({ data, error }) => {
    if (error) {
      console.error(error)
      return
    }

    actualRooms.value = data
  })
client.GET('/bookings/', { params: { query: { start: today.toISOString(), end: twoDaysLater.toISOString() } } })
  .then(({ data, error }) => {
    if (error) {
      console.error(error)
      return
    }

    actualBookings.value = data.map(({ title, room_id, start, end }) => ({
      id: `${room_id}_${start}_${end}`,
      title,
      roomId: room_id,
      startsAt: new Date(start),
      endsAt: new Date(end),
    }))
  })

const HOURS = Array.from({ length: 24 }).fill(null).map((_, i) => i)
const HOURS_TIMES = HOURS.map(h => `${h.toString().padStart(2, '0')}:00`)

const timelineStart = shallowRef(today)
const timelineEnd = shallowRef(twoDaysLater)

const now = useNow({ interval: T.Sec })
const nowRulerX = computed(() => px(msToPx(msBetween(timelineStart, now))))

const timelineDates = computed(() => {
  const dates = []
  let date = new Date(timelineStart.value.getTime())
  const end = timelineEnd.value
  while (date < end) {
    dates.push(date)
    date = new Date(date.getTime() + T.Day)
  }
  return dates
})

const RULERS_BG = svgToDataUrl(
  `<svg width="${PIXELS_PER_MINUTE * 60}" height="1000">`
  + `<rect x="0" y="0" height="100%" width="1" fill="#fff" opacity="0.2"/>`
  + `<rect x="${PIXELS_PER_MINUTE * 15}" y="0" height="100%" width="1" fill="#fff" opacity="0.025"/>`
  + `<rect x="${PIXELS_PER_MINUTE * 30}" y="0" height="100%" width="1" fill="#fff" opacity="0.075"/>`
  + `<rect x="${PIXELS_PER_MINUTE * 45}" y="0" height="100%" width="1" fill="#fff" opacity="0.025"/>`
  + `</svg>`,
)

interface BookingData {
  id: string
  title: string
  offsetX: string // e.g. "123px"
  length: string // e.g. "123px"
  startsAt: Date
  endsAt: Date
}

const bookingsDataByRoomId = computed(() => {
  const start = timelineStart.value
  const bookingsData = new Map<string, BookingData[]>()
  const totalLengths = new Map<string, number>()
  for (const { id, title, roomId, startsAt, endsAt } of actualBookings.value) {
    const roomLength = totalLengths.get(roomId) ?? 0
    if (!bookingsData.has(roomId))
      bookingsData.set(roomId, [])

    const roomData = bookingsData.get(roomId)!
    const length = msToPx(msBetween(startsAt, endsAt))
    roomData.push({
      id,
      title,
      length: px(length),
      offsetX: px(msToPx(msBetween(start, startsAt)) - roomLength),
      startsAt,
      endsAt,
    })
    totalLengths.set(roomId, roomLength + length)
  }

  // Need to sort arrays, because later the binary search will be used on them.
  bookingsData.forEach(bookings => bookings.sort(
    // We assume that if booking A starts before any booking B, A also ends
    // before B start.
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  ))

  return bookingsData
})

/**
 * Returns boolean indicating whether the range intersects any of
 * the room bookings.
 *
 * @param a Start of input range.
 * @param b End of input range.
 * @param roomId ID of the room, which bookings should be checked.
 */
function intersectsSomeBooking(
  a: Date,
  b: Date,
  roomId: string,
): boolean {
  const aMs = a.getTime()
  const bMs = b.getTime()

  if (aMs >= bMs)
    throw new Error('invalid range limits')

  const bookings = bookingsDataByRoomId.value.get(roomId)
  if (!bookings || bookings.length === 0)
    return false

  let l = 0
  let r = bookings.length - 1
  while (l <= r) {
    const m = Math.floor((l + r) / 2)
    const mBooking = bookings[m]
    if (mBooking.endsAt.getTime() <= aMs)
      l = m + 1
    else if (mBooking.startsAt.getTime() >= bMs)
      r = m - 1
    else
      return true
  }
  return false
}

const scrollerEl = ref<HTMLElement | null>(null)
const wrapperEl = ref<HTMLElement | null>(null)
const overlayEl = ref<HTMLElement | null>(null)

interface PendingBooking {
  roomIdx: number
  room: Room
  pressedAt?: Date
  hoveredAt: Date
}

function pendingBookingSafeRange(booking: PendingBooking): null | [Date, Date] {
  const { pressedAt, hoveredAt, room } = booking

  let [l, r] = (() => {
    if (pressedAt) {
      return overlappingDates(
        ...dateBoundsMinutes(pressedAt, BOOKING_DURATION_STEP, MIN_BOOKING_DURATION_MINUTES),
        ...dateBoundsMinutes(hoveredAt, BOOKING_DURATION_STEP, BOOKING_DURATION_STEP),
      )
    }
    return dateBoundsMinutes(hoveredAt, BOOKING_DURATION_STEP, MIN_BOOKING_DURATION_MINUTES)
  })()

  if (msBetween(now, r) < 0)
    return null // booking is in the past

  const [, safeL] = dateBoundsMinutes(now.value, 5, 5)
  safeL.setMinutes(safeL.getMinutes() + 5)

  if (msBetween(safeL, l) < 0) { // Booking start is too close to `now`.
    if (msBetween(safeL, r) < MIN_BOOKING_DURATION_MINUTES * T.Min)
      // Booking end is also too close to `now`.
      return null

    l = safeL
  }

  if (intersectsSomeBooking(l, r, room.id))
    return null

  return [l, r]
}

const pendingBooking = ref<PendingBooking | null>(null)
const pendingBookingData = computed(() => {
  if (!pendingBooking.value)
    return null

  const safeRange = pendingBookingSafeRange(pendingBooking.value)
  if (!safeRange)
    return null

  const [l, r] = safeRange
  const duration = msBetween(l, r)

  return {
    x: msToPx(msBetween(timelineStart, l)),
    y: pendingBooking.value.roomIdx * ROW_HEIGHT,
    duration,
  }
})

function eventWithinOverlay(event: MouseEvent) {
  const rect = overlayEl.value?.getBoundingClientRect()
  if (!rect)
    return false

  const { x, y, width: w, height: h } = rect
  const { clientX: x0, clientY: y0 } = event

  return (
    (x0 >= x && x0 <= (x + w))
    && (y0 >= y && y0 <= (y + h))
  )
}

function slotByClientCoordinates(x: number, y: number) {
  const rect = wrapperEl.value?.getBoundingClientRect()

  if (!rect)
    return null

  const { x: cornerX, y: cornerY } = rect
  x -= (cornerX + SIDEBAR_WIDTH)
  y -= (cornerY + HEADER_HEIGHT)

  const roomIdx = Math.floor(y / ROW_HEIGHT)
  const room = actualRooms.value[roomIdx]
  if (!room)
    return null

  const date = new Date(timelineStart.value.getTime() + (x / PIXELS_PER_MINUTE * T.Min))

  return { room, roomIdx, date }
}

useEventListener(wrapperEl, 'mousemove', (event) => {
  if (!eventWithinOverlay(event)) {
    pendingBooking.value = null
    return
  }

  const slot = slotByClientCoordinates(event.clientX, event.clientY)
  if (!slot) {
    pendingBooking.value = null
    return
  }

  if (pendingBooking.value?.pressedAt) {
    pendingBooking.value.hoveredAt = slot.date
  }
  else {
    pendingBooking.value = {
      roomIdx: slot.roomIdx,
      room: slot.room,
      hoveredAt: slot.date,
    }
  }
})
useEventListener(wrapperEl, 'mousedown', (event) => {
  if (!eventWithinOverlay(event)) {
    pendingBooking.value = null
    return
  }

  const slot = slotByClientCoordinates(event.clientX, event.clientY)
  if (!slot) {
    pendingBooking.value = null
    return
  }

  event.preventDefault()
  event.stopImmediatePropagation()

  pendingBooking.value = {
    roomIdx: slot.roomIdx,
    room: slot.room,
    hoveredAt: slot.date,
    pressedAt: slot.date,
  }
})
useEventListener(wrapperEl, 'mouseup', (event) => {
  if (!pendingBooking.value?.pressedAt) {
    pendingBooking.value = null
    return
  }

  if (!eventWithinOverlay(event)) {
    pendingBooking.value = null
    return
  }

  const safeRange = pendingBookingSafeRange(pendingBooking.value)
  if (!safeRange) {
    pendingBooking.value = null
    return
  }

  window.open(getBookingUrl({
    myUniRoomId: pendingBooking.value.room.my_uni_id,
    // eslint-disable-next-line no-alert
    title: prompt('Title of the booking')!,
    start: safeRange[0],
    end: safeRange[1],
  }))

  // TODO: open booking form
  pendingBooking.value = null
})
useEventListener(wrapperEl, 'mouseleave', () => {
  pendingBooking.value = null
})
</script>

<template>
  <div class="h-full w-full flex flex-col items-center justify-center gap-2">
    <div class="w-1200px">
      <div
        :class="$style.timeline"
        :style="pendingBookingData ? { cursor: 'crosshair' } : undefined"
      >
        <div :class="$style['timeline-corner']">
          <h2>Timeline</h2>
        </div>
        <div ref="scrollerEl" :class="$style['timeline-scroller']">
          <div ref="wrapperEl" :class="$style['timeline-wrapper']">
            <span
              :class="$style['timeline-now']"
              :style="{ '--now-x': nowRulerX }"
            />
            <div
              v-if="pendingBookingData"
              :class="$style['timeline-booking-new']"
              :style="{
                '--width': px(msToPx(pendingBookingData.duration)),
                '--left': px(pendingBookingData.x),
                '--top': px(pendingBookingData.y),
              }"
            >
              <div>
                <span>{{ durationFormatted(pendingBookingData.duration) }}</span>
              </div>
            </div>
            <div :class="$style['timeline-header']">
              <div
                v-for="day in timelineDates"
                :key="day.toString()"
                :class="$style['timeline-header-item']"
                :style="{ width: `${PIXELS_PER_MINUTE * 60 * 24}px` }"
              >
                <span :class="$style['timeline-header-item-day']">
                  {{ dayTitle(day) }}
                </span>
                <div :class="$style['timeline-header-item-hours']">
                  <span v-for="h in HOURS_TIMES" :key="h">
                    <span>{{ h }}</span>
                  </span>
                </div>
              </div>
            </div>
            <div :class="$style['timeline-body']">
              <div v-for="room in actualRooms" :key="room.id" :class="$style['timeline-row']">
                <div :class="$style['timeline-row-header']">
                  {{ room.title }}
                </div>
                <div
                  v-for="booking in bookingsDataByRoomId.get(room.id)"
                  :key="booking.id"
                  :class="$style['timeline-booking']"
                  :style="{ '--left': booking.offsetX, '--width': booking.length }"
                >
                  <div>
                    <span>
                      {{ booking.title }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div ref="overlayEl" :class="$style['timeline-overlay']" />
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
@mixin booking {
  padding: 6px 2px;
  user-select: none;
  white-space: nowrap;

  & > div {
    width: 100%;
    height: 100%;
    padding: 0 6px 0 12px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 4px rgb(0 0 0 / 0.25);

    @apply rounded-md;
  }
}

.timeline {
  --sidebar-width: v-bind('SIDEBAR_WIDTH_PX');
  --header-height: v-bind('HEADER_HEIGHT_PX');
  --row-height: v-bind('ROW_HEIGHT_PX');
  --ppm: v-bind('PIXELS_PER_MINUTE');
  --rulers-bg: v-bind('RULERS_BG');

  position: relative;
  overflow: hidden;
  background: colors.$gray-900;
  border: 1px solid colors.$gray-800;

  @apply rounded-md;

  &-corner {
    position: absolute;
    top: 0;
    z-index: 3;
    width: var(--sidebar-width);
    height: var(--header-height);
    display: flex;
    align-items: center;
    background: colors.$gray-950;
    color: colors.$gray-200;

    border-color: colors.$gray-800;
    border-style: solid;
    border-bottom-width: 1px;
    border-right-width: 1px;

    @apply px-2 text-lg;
  }

  &-overlay {
    position: absolute;
    left: var(--sidebar-width);
    top: var(--header-height);
    right: 0;
    bottom: 0;
    pointer-events: none;
    box-shadow: inset 0 2px 6px 2px rgb(0 0 0 / 0.15);
  }

  &-scroller {
    position: relative;
    overflow: auto;
    overscroll-behavior: contain;
    max-height: 600px;
    scrollbar-width: none;
  }

  &-wrapper {
    display: flex;
    flex-direction: column;
    width: fit-content;
    position: relative;

    background-image: var(--rulers-bg);
    background-position-x: var(--sidebar-width);
    background-repeat: repeat;
  }

  /* Ruler that shows current time. */
  &-now {
    z-index: 1;
    position: absolute;
    height: 100%;
    width: 1px;
    background: colors.$red-800;
    left: calc(var(--sidebar-width) + var(--now-x));
    top: 0;
  }

  &-header {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    width: fit-content;
    height: var(--header-height);
    margin-left: var(--sidebar-width);
    border-bottom: 1px solid colors.$gray-800;

    background: colors.$gray-950;
    color: colors.$gray-500;

    &-item {
      display: flex;
      flex-direction: column;
      justify-content: center;

      &-day {
        align-self: flex-start;
        position: sticky;
        left: var(--sidebar-width);
      }

      &-hours {
        display: flex;
        align-items: center;

        & > span {
          width: calc(var(--ppm) * 60px);
          color: colors.$gray-700;

          @apply text-sm;

          & > span {
            display: inline-block;
            transform: translateX(-50%);
          }
        }
      }
    }
  }

  &-body {
    display: flex;
    flex-direction: column;
  }

  &-row {
    height: var(--row-height);
    display: flex;
    align-items: stretch;

    &-header {
      position: sticky;
      left: 0;
      z-index: 1;
      flex: 0 0 var(--sidebar-width);
      display: flex;
      align-items: center;
      padding: 0 12px;
      background: colors.$gray-950;
      color: colors.$gray-500;

      border-color: colors.$gray-800;
      border-style: solid;
      border-right-width: 1px;
      border-bottom-width: 1px;
    }
  }

  /* Item that is going to be created. */
  &-booking-new {
    @include booking;

    z-index: 1;
    position: absolute;
    left: calc(var(--sidebar-width) + var(--left));
    top: calc(var(--header-height) + var(--top));
    width: var(--width);
    height: var(--row-height);

    & > div {
      padding: 0;
      justify-content: center;
      border: 1px solid colors.$purple-700;
      background: colors.$purple-900;
      color: colors.$purple-500;
    }
  }

  &-booking {
    @include booking;

    position: relative;
    left: var(--left);
    width: var(--width);

    & > div {
      background: colors.$gray-950;
      color: colors.$gray-200;
      border: 1px solid colors.$gray-800;

      & > span {
        position: sticky;
        left: var(--sidebar-width);
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>

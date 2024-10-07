<script setup lang="ts">
import type { MaybeRef } from 'vue'
import type { components, paths } from '../api/room-booking'
import { useEventListener, useNow } from '@vueuse/core'
import createClient from 'openapi-fetch'
import { computed, onMounted, ref, shallowRef, toRaw, unref } from 'vue'

const props = defineProps<{
  onBooking: (data: {
    from: Date
    to: Date
    room: Room
  }) => void
}>()

const T = {
  Ms: 1,
  Sec: 1000,
  Min: 1000 * 60,
  Hour: 1000 * 60 * 60,
  Day: 1000 * 60 * 60 * 24,
}

onMounted(() => {
  scrollToNow({
    behavior: 'instant',
    position: 'left',
    offsetMs: -30 * T.Min,
  })
})

const PIXELS_PER_MINUTE = 100 / 30
const MIN_BOOKING_DURATION_MINUTES = 15
const BOOKING_DURATION_STEP = 5

const SIDEBAR_WIDTH = 200
const HEADER_HEIGHT = 60
const ROW_HEIGHT = 50

const msToPx = (ms: number) => (ms / T.Min) * PIXELS_PER_MINUTE
const px = (n: number) => `${n}px`

type Room = components['schemas']['Room']

interface Booking {
  id: string
  roomId: string
  title: string
  startsAt: Date
  endsAt: Date
}

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

const startDate = new Date()
startDate.setHours(0, 0, 0, 0)
const endDate = new Date(startDate.getTime() + 7 * T.Day)

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
client.GET('/bookings/', { params: { query: { start: startDate.toISOString(), end: endDate.toISOString() } } })
  .then(({ data, error }) => {
    if (error) {
      console.error(error)
      return
    }

    actualBookings.value = data
      .map(({ title, room_id, start, end }) => ({
        id: `${room_id}_${start}_${end}`,
        title,
        roomId: room_id,
        startsAt: new Date(start),
        endsAt: new Date(end),
      }))
  })

const actualBookingsByRoomSorted = computed(() => {
  const map = new Map<Room['id'], Booking[]>()

  actualBookings.value.forEach((booking) => {
    const bookings = map.get(booking.roomId)
    if (bookings)
      bookings.push(booking)
    else
      map.set(booking.roomId, [booking])
  })

  // Need to sort arrays, because later the binary search will be used on them.
  map.forEach(bookings => bookings.sort(
    // We assume that if booking A starts before any booking B, A also ends
    // before B start.
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  ))

  return map
})

const HOURS_TIMES = Array
  .from({ length: 24 })
  .fill(null)
  .map((_, h) => `${h.toString().padStart(2, '0')}:00`)

const timelineStart = shallowRef(startDate)
const timelineEnd = shallowRef(endDate)

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
  const sortedBookingsByRoom = actualBookingsByRoomSorted.value

  const roomLengths = new Map<Room['id'], number>()
  return new Map<Room['id'], BookingData[]>(
    Array
      .from(sortedBookingsByRoom.entries())
      .map((([roomId, roomBookings]) => [
        roomId,
        roomBookings.map(({ id, title, startsAt, endsAt }) => {
          // Need to do this sort of calculation due to how the bookings
          // are rendered on the timeline: they are rendered one-by-one
          // in a flex container, so the actual position of each booking
          // depends on previous bookings.

          const roomLength = roomLengths.get(roomId) ?? 0
          const length = msToPx(msBetween(startsAt, endsAt))
          roomLengths.set(roomId, roomLength + length)
          return {
            id,
            title,
            length: px(length),
            offsetX: px(msToPx(msBetween(start, startsAt)) - roomLength),
            startsAt,
            endsAt,
          }
        }),
      ])),
  )
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

  props.onBooking({
    from: safeRange[0],
    to: safeRange[1],
    room: toRaw(pendingBooking.value.room),
  })

  pendingBooking.value = null
})
useEventListener(wrapperEl, 'mouseleave', () => {
  pendingBooking.value = null
})

interface ScrollToOptions {
  /** Date to scroll to. */
  to: Date
  /** Behavior of scroll. */
  behavior?: 'smooth' | 'instant'
  /** Position where the target date should be aligned. */
  position?: 'left' | 'center' | 'right'
  /** Offset to shift the target position by. */
  offsetMs?: number
}

function scrollTo(options: ScrollToOptions) {
  const el = scrollerEl.value

  if (!el)
    return

  const {
    to,
    behavior = 'smooth',
    position = 'center',
    offsetMs = 0,
  } = options

  const { width } = el.getBoundingClientRect()
  const toLeftPx = msToPx(msBetween(timelineStart, to))

  let scrollLeftPx
  switch (position) {
    case 'left':
      scrollLeftPx = toLeftPx
      break
    case 'center':
      scrollLeftPx = toLeftPx - ((width - SIDEBAR_WIDTH) / 2)
      break
    case 'right':
      scrollLeftPx = toLeftPx - (width - SIDEBAR_WIDTH) + 1
      break
  }

  el.scrollTo({
    behavior,
    left: scrollLeftPx + msToPx(offsetMs),
  })
}

function scrollToNow(options?: Omit<ScrollToOptions, 'to'>) {
  scrollTo({
    ...options,
    to: now.value,
  })
}
</script>

<template>
  <div
    :class="$style.timeline"
    :style="{
      '--sidebar-width': px(SIDEBAR_WIDTH),
      '--header-height': px(HEADER_HEIGHT),
      '--row-height': px(ROW_HEIGHT),
      '--ppm': PIXELS_PER_MINUTE,
      '--now-x': nowRulerX,
      'cursor': pendingBookingData ? 'crosshair' : undefined,
    }"
  >
    <div :class="$style.corner">
      <h2>Timeline</h2>
    </div>
    <div ref="scrollerEl" :class="$style.scroller">
      <div ref="wrapperEl" :class="$style.wrapper">
        <span :class="$style['now-ruler']" />
        <div :class="$style['now-timebox-wrapper']">
          <span :class="$style['now-timebox']" @click="scrollToNow({ position: 'center' })">
            {{ `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}` }}
          </span>
        </div>
        <svg :class="$style['rulers-svg']" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="Rulers" x="0" y="0" :width="PIXELS_PER_MINUTE * 60" height="100%" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" height="100%" width="1" />
              <rect :x="PIXELS_PER_MINUTE * 15" y="0" height="100%" width="1" opacity="0.4" />
              <rect :x="PIXELS_PER_MINUTE * 30" y="0" height="100%" width="1" opacity="0.7" />
              <rect :x="PIXELS_PER_MINUTE * 45" y="0" height="100%" width="1" opacity="0.4" />
            </pattern>
          </defs>
          <rect fill="url(#Rulers)" width="100%" height="100%" />
        </svg>
        <div
          v-if="pendingBookingData"
          :class="$style['new-booking']"
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
        <div :class="$style.header">
          <div
            v-for="day in timelineDates"
            :key="day.toString()"
            :class="$style['header-item']"
          >
            <span :class="$style['header-item-day']">
              {{ dayTitle(day) }}
            </span>
            <div :class="$style['header-item-hours']">
              <span v-for="h in HOURS_TIMES" :key="h">
                <span>{{ h }}</span>
              </span>
            </div>
          </div>
        </div>
        <div :class="$style.body">
          <div v-for="room in actualRooms" :key="room.id" :class="$style.row">
            <div :class="$style['row-header']">
              {{ room.title }}
            </div>
            <div
              v-for="booking in bookingsDataByRoomId.get(room.id)"
              :key="booking.id"
              :class="$style.booking"
              :style="{
                '--left': booking.offsetX,
                '--width': booking.length,
              }"
            >
              <div :title="booking.title">
                <span>
                  {{ booking.title }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div ref="overlayEl" :class="$style.overlay" />
  </div>
</template>

<style module lang="scss">
/* TODO: extract text mixins to _typography.scss */
/* TODO: systemize spacing (padding, margin, etc.) and use variables instead */

$timebox-width: 50px;
$timebox-height: 20px;

@mixin text-sm {
  font-size: 0.875rem;
  line-height: 1.0625rem;
}
@mixin text-md {
  font-size: 1rem;
  line-height: 1.3125rem;
}

@mixin booking {
  padding: 6px 2px;
  user-select: none;
  white-space: nowrap;

  & > div {
    @include effects.shadow-1;

    width: 100%;
    height: 100%;
    padding: 0 6px 0 12px;
    display: flex;
    align-items: center;
    border-radius: borders.$radius-sm;
  }
}

@mixin timebox {
  @include text-sm;
  width: $timebox-width;
  height: $timebox-height;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--c-text-muted-2);
  user-select: none;
}

.timeline {
  --c-bg-items: #{colors.$gray-50};
  --c-bg-sheet: #{colors.$gray-100};
  --c-borders: #{colors.$gray-200};
  --c-text: #{colors.$gray-900};
  --c-text-muted: #{colors.$gray-500};
  --c-text-muted-2: #{colors.$gray-300};
  --c-textbox-bg-red: #{colors.$red-400};
  --c-textbox-text-red: #{colors.$red-900};
  --c-textbox-borders-red: #{colors.$red-600};
  --c-textbox-bg-purple: #{colors.$purple-400};
  --c-textbox-text-purple: #{colors.$purple-900};
  --c-textbox-borders-purple: #{colors.$purple-600};
  --c-ruler-now: #{colors.$red-600};
}

:global(.dark) {
  .timeline {
    --c-bg-items: #{colors.$gray-950};
    --c-bg-sheet: #{colors.$gray-900};
    --c-borders: #{colors.$gray-800};
    --c-text: #{colors.$gray-200};
    --c-text-muted: #{colors.$gray-500};
    --c-text-muted-2: #{colors.$gray-700};
    --c-textbox-bg-red: #{colors.$red-900};
    --c-textbox-text-red: #{colors.$red-500};
    --c-textbox-borders-red: #{colors.$red-700};
    --c-textbox-bg-purple: #{colors.$purple-900};
    --c-textbox-text-purple: #{colors.$purple-500};
    --c-textbox-borders-purple: #{colors.$purple-700};
    --c-ruler-now: #{colors.$red-800};
  }
}

.timeline {
  position: relative;
  overflow: hidden;
  background: var(--c-bg-sheet);
  border: 1px solid var(--c-borders);
  border-radius: borders.$radius-md;
  display: flex;
  max-height: 100%;
}

.corner {
  @include text-md;

  position: absolute;
  top: 0;
  z-index: 5;
  width: var(--sidebar-width);
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding-left: 12px;
  background: var(--c-bg-items);
  color: var(--c-text);

  border-color: var(--c-borders);
  border-style: solid;
  border-bottom-width: 1px;
  border-right-width: 1px;
}

.overlay {
  @include effects.shadow-inset-2;

  position: absolute;
  left: var(--sidebar-width);
  top: var(--header-height);
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.scroller {
  position: relative;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.wrapper {
  display: flex;
  flex-direction: column;
  width: fit-content;
  position: relative;

  background-image: var(--rulers-bg);
  background-position-x: var(--sidebar-width);
  background-repeat: repeat;
}

.header {
  @include text-md;

  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  width: fit-content;
  height: var(--header-height);
  margin-left: var(--sidebar-width);
  border-bottom: 1px solid var(--c-borders);

  background: var(--c-bg-items);
  color: var(--c-text-muted);

  &-item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    &-day {
      padding-left: 12px;
      padding-top: 6px;
      align-self: flex-start;
      position: sticky;
      left: var(--sidebar-width);
    }

    &-hours {
      display: flex;
      align-items: center;

      & > span {
        width: calc(var(--ppm) * 60px);

        & > span {
          @include timebox;
          transform: translateX(-50%);
        }
      }
    }
  }
}

.body {
  @include text-md;
  display: flex;
  flex-direction: column;
}

.now-ruler {
  z-index: 1;
  position: absolute;
  height: 100%;
  width: 1px;
  background: var(--c-ruler-now);
  left: calc(var(--sidebar-width) + var(--now-x));
  top: 0;
}

.row {
  height: var(--row-height);
  display: flex;
  align-items: stretch;

  &:not(:last-child) {
    .row-header {
      border-bottom-width: 1px;
    }
  }
}

.row-header {
  position: sticky;
  left: 0;
  z-index: 1;
  flex: 0 0 var(--sidebar-width);
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: var(--c-bg-items);
  color: var(--c-text-muted);

  border-color: var(--c-borders);
  border-style: solid;
  border-right-width: 1px;
}

.rulers-svg {
  display: block;
  position: absolute;
  top: 0;
  left: var(--sidebar-width);
  width: 100%;
  height: 100%;

  & pattern rect {
    fill: var(--c-borders);
  }
}

.booking {
  @include booking;

  position: relative;
  left: var(--left);
  width: var(--width);

  & > div {
    background: var(--c-bg-items);
    color: var(--c-text);

    :global(.dark) & {
      border: 1px solid var(--c-borders);
    }

    & > span {
      position: sticky;
      left: var(--sidebar-width);
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.new-booking {
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
    border: 1px solid var(--c-textbox-borders-purple);
    background: var(--c-textbox-bg-purple);
    color: var(--c-textbox-text-purple);
  }
}

.now-timebox-wrapper {
  position: sticky;
  top: 0;
  height: 0;
  z-index: 4;
  display: flex;
  align-items: flex-end;
  overflow: visible;

  &::before,
  &::after {
    content: '';
    display: block;
  }

  &::before {
    flex: 0 0 calc(var(--now-x) + var(--sidebar-width) - ($timebox-width / 2));
  }

  &::after {
    flex-grow: 1;
  }
}

.now-timebox {
  @include timebox;

  position: sticky;
  right: 0;
  left: var(--sidebar-width);
  transform: translateY(var(--header-height));
  background: var(--c-textbox-bg-red);
  color: var(--c-textbox-text-red);
  border: 1px solid var(--c-textbox-borders-red);
  border-radius: borders.$radius-xs;
  cursor: pointer;
}
</style>

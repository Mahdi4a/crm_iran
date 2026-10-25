// Jalali dates for the CRM frontend. Copied into apps/crm/frontend/src/crm_iran_jalali/ by build.sh and
// imported by the files vite.config.js rewrites. Values that go to the server stay Gregorian
// 'YYYY-MM-DD'; only the text a person reads or types and the calendar grid are Jalali.
// Everything falls back to the stock Gregorian behaviour when "Use Jalali Dates" is off.
import { ref } from 'vue'
import dayjs from 'dayjs/esm'

export function enabled() {
  return String(window.sysdefaults?.iran_jalali_dates ?? '1') === '1'
}

const G_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
const MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// Sunday first, like Dayjs#day()
const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
const WEEKDAY_LETTERS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] // Saturday first
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹'
const pad = (n, len = 2) => String(n).padStart(len, '0')

export function gregorianToJalali(gy, gm, gd) {
  let jy
  if (gy > 1600) {
    jy = 979
    gy -= 1600
  } else {
    jy = 0
    gy -= 621
  }
  const gy2 = gm > 2 ? gy + 1 : gy
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    G_DAYS[gm - 1]
  jy += 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  if (days < 186) return [jy, 1 + Math.floor(days / 31), 1 + (days % 31)]
  return [jy, 7 + Math.floor((days - 186) / 30), 1 + ((days - 186) % 30)]
}

export function jalaliToGregorian(jy, jm, jd) {
  jy += 1595
  let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd
  days += jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186
  let gy = 400 * Math.floor(days / 146097)
  days %= 146097
  if (days > 36524) {
    days -= 1
    gy += 100 * Math.floor(days / 36524)
    days %= 36524
    if (days >= 365) days += 1
  }
  gy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    gy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  let gd = days + 1
  const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0
  const md = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let gm = 1
  while (gm < 13 && gd > md[gm]) {
    gd -= md[gm]
    gm++
  }
  return [gy, gm, gd]
}

function daysInMonth(jy, jm) {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  const back = gregorianToJalali(...jalaliToGregorian(jy, 12, 30))
  return back[0] === jy && back[1] === 12 && back[2] === 30 ? 30 : 29
}

function parts(d) {
  return gregorianToJalali(d.year(), d.month() + 1, d.date())
}

function fromJalali(jy, jm, jd) {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd)
  return dayjs(`${pad(gy, 4)}-${pad(gm)}-${pad(gd)}`)
}

export function toPersianDigits(value) {
  return String(value).replace(/\d/g, (d) => PERSIAN[d])
}

function toLatinDigits(text) {
  return String(text).replace(/[۰-۹٠-٩]/g, (c) => {
    const code = c.charCodeAt(0)
    return code >= 0x06f0 ? code - 0x06f0 : code - 0x0660
  })
}

// The digits of a calendar cell or year: Persian while Jalali is on
export function digits(value) {
  return enabled() ? toPersianDigits(value) : String(value)
}

// ── Calendar grid helpers (used where the date picker builds its month grid) ──

export function monthNames() {
  return enabled() ? MONTHS : EN_MONTHS
}

export function weekdayLetters() {
  return enabled() ? WEEKDAY_LETTERS : ['S', 'M', 'T', 'W', 'T', 'F', 'S']
}

// First day of a (0-based) month of the calendar in use, as a Gregorian dayjs
export function monthStart(year, monthIndex) {
  if (!enabled()) return dayjs(`${year}-${monthIndex + 1}-01`)
  return fromJalali(year, monthIndex + 1, 1)
}

export function monthIndex(d) {
  return enabled() ? parts(d)[1] - 1 : d.month()
}

export function year(d) {
  return enabled() ? parts(d)[0] : d.year()
}

export function day(d) {
  return enabled() ? parts(d)[2] : d.date()
}

export function yearOf(iso) {
  return enabled() ? year(dayjs(iso)) : Number(String(iso).slice(0, 4))
}

// Saturday first for Jalali, Sunday first otherwise
export function weekdayIndex(d) {
  return enabled() ? (d.day() + 1) % 7 : d.day()
}

export function weekStart(d) {
  return enabled() ? d.subtract(weekdayIndex(d), 'day') : d.startOf('week')
}

export function nextMonthAnchor(currentYear, currentMonth) {
  if (!enabled()) {
    const m = dayjs().year(currentYear).month(currentMonth).add(1, 'month')
    return { year: () => m.year(), month: () => m.month() }
  }
  const index = currentYear * 12 + currentMonth + 1
  return { year: () => Math.floor(index / 12), month: () => index % 12 }
}

// Month and year navigation state shared by the three pickers
export function useCalendarView() {
  const view = ref('date')
  const today = dayjs()
  const currentYear = ref(year(today))
  const currentMonth = ref(monthIndex(today))

  function step(by) {
    const index = currentYear.value * 12 + currentMonth.value + by
    currentYear.value = Math.floor(index / 12)
    currentMonth.value = index % 12
  }

  return {
    view,
    currentYear,
    currentMonth,
    prev: () => step(-1),
    next: () => step(1),
    cycleView() {
      view.value = view.value === 'date' ? 'monthYear' : 'date'
    },
    selectMonth(i) {
      currentMonth.value = i
      view.value = 'date'
    },
    selectYear(y) {
      currentYear.value = y
    },
    focusOn(d) {
      currentYear.value = year(d)
      currentMonth.value = monthIndex(d)
    },
    resetView() {
      view.value = 'date'
    },
  }
}

// ── Text: what a person reads and types ──

const TOKENS = /\[([^\]]+)]|Do|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g

// Like Dayjs#format, with the date tokens in Jalali
export function format(d, fmt) {
  if (!enabled() || !fmt) return d.format(fmt)
  const [jy, jm, jd] = parts(d)
  return fmt.replace(TOKENS, (token, literal) => {
    switch (token) {
      case 'YYYY':
        return pad(jy, 4)
      case 'YY':
        return pad(jy % 100)
      case 'M':
        return String(jm)
      case 'MM':
        return pad(jm)
      case 'MMM':
      case 'MMMM':
        return MONTHS[jm - 1]
      case 'D':
      case 'Do':
        return String(jd)
      case 'DD':
        return pad(jd)
      case 'ddd':
      case 'dddd':
        return WEEKDAYS[d.day()]
      case 'dd':
        return WEEKDAYS[d.day()].slice(0, 2)
      default:
        return literal !== undefined ? literal : d.format(token)
    }
  })
}

// 'DD-MM-YYYY HH:mm' -> ['d', 'm', 'y'], the order of the date part
function dateOrder(fmt) {
  const found = (fmt || '').match(/Y{2,4}|M{1,2}|D{1,2}/g)
  const order = found ? found.map((t) => t[0].toLowerCase()) : []
  return order.length === 3 ? order : ['y', 'm', 'd']
}

// Text from a person, or an ISO value from the server -> Gregorian dayjs, or null.
// A year of 1700 or more is Gregorian, so values from the API and pasted Gregorian dates still parse.
function parseText(raw, fmt) {
  const match = toLatinDigits(raw).trim().match(/^(\d+)[^\d]+(\d+)[^\d]+(\d+)(.*)$/)
  // undefined: not a numeric date at all, the stock parser may know it. null: a date that does not exist.
  if (!match) return undefined
  const [, a, b, c, rest] = match
  const order = a.length === 4 ? ['y', 'm', 'd'] : dateOrder(fmt)
  const found = {}
  ;[a, b, c].forEach((value, i) => (found[order[i]] = parseInt(value, 10)))
  let { y, m, d } = found
  if ([a, b, c][order.indexOf('y')].length <= 2) y += 1400
  if (!(m >= 1 && m <= 12 && d >= 1)) return null

  let gy, gm, gd
  if (y >= 1700) {
    ;[gy, gm, gd] = [y, m, d]
    const check = dayjs(`${pad(gy, 4)}-${pad(gm)}-${pad(gd)}`)
    if (!check.isValid() || check.date() !== gd) return null
  } else {
    if (d > daysInMonth(y, m)) return null
    ;[gy, gm, gd] = jalaliToGregorian(y, m, d)
  }

  let hours = 0
  let minutes = 0
  let seconds = 0
  const time = rest.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([aApP])?/)
  if (time) {
    hours = parseInt(time[1], 10)
    minutes = parseInt(time[2], 10)
    seconds = parseInt(time[3] || '0', 10)
    const meridiem = (time[4] || '').toLowerCase()
    if (meridiem === 'p' && hours < 12) hours += 12
    if (meridiem === 'a' && hours === 12) hours = 0
  }
  const result = dayjs(
    `${pad(gy, 4)}-${pad(gm)}-${pad(gd)} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  )
  return result.isValid() ? result : null
}

// Coerce typed text or an incoming value to a Dayjs, respecting an optional explicit format
export function useDateCoercion(getFormat) {
  return function coerceToDayjs(val) {
    if (!val) return null
    const raw = String(val).trim()
    if (!raw) return null
    if (enabled()) {
      const parsed = parseText(raw, getFormat())
      if (parsed !== undefined) return parsed
    }
    const fmt = getFormat()
    if (fmt) {
      const strict = dayjs(raw, fmt, true)
      if (strict.isValid()) return strict
    }
    const loose = dayjs(raw)
    return loose.isValid() ? loose : null
  }
}

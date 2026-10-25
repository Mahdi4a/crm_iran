// Build config for the CRM frontend with Jalali dates. It wraps the CRM's own vite.config.js and adds one
// plugin that rewrites the date code of the CRM and of frappe-ui while they are bundled, so neither
// source tree is edited. Every rewrite is checked: if a CRM or frappe-ui upgrade moves one of the
// lines, the build stops and says which one, instead of shipping a half-Jalali calendar.
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const crmFrontend = process.env.CRM_FRONTEND || path.resolve(here, '../../crm/frontend')

const J = "import * as J from '@/crm_iran_jalali/jalali.js'"

// [search, replacement]; a string search must be found, a regexp must match
const rewrites = {
  'frappe-ui/src/components/DatePicker/utils.ts': [
    (code) => `${J}\n${code}`,
    [/export const months: string\[\] = \[[\s\S]*?\n\]/, 'export const months: string[] = J.monthNames()'],
    ['return dayjs(`${year}-${monthIndex + 1}-01`)', 'return J.monthStart(year, monthIndex)'],
    [
      "const start = monthStart(year, monthIndex).startOf('week')",
      'const start = J.weekStart(monthStart(year, monthIndex))',
    ],
    ['inMonth: d.month() === monthIndex,', 'inMonth: J.monthIndex(d) === monthIndex,'],
  ],
  'frappe-ui/src/components/DatePicker/composables.ts': [
    (code) => `${J}\n${code}`,
    (code) =>
      replaceRegion(
        code,
        'export function useCalendarView() {',
        '// Positioning resolution',
        'export const useCalendarView = J.useCalendarView\n\n',
      ),
    (code) =>
      replaceRegion(
        code,
        'export function useDateCoercion(',
        '// Build an `isDateUnavailable`',
        'export const useDateCoercion = J.useDateCoercion\n\n',
      ),
  ],
  'frappe-ui/src/components/DatePicker/CalendarPanel.vue': [
    ["import { months } from './utils'", `import { months } from './utils'\n${J}`],
    ['{{ months[currentMonth] }} {{ currentYear }}', '{{ months[currentMonth] }} {{ J.digits(currentYear) }}'],
    ['{{ cell.date.date() }}', '{{ J.digits(J.day(cell.date)) }}'],
    ['{{ y }}', '{{ J.digits(y) }}'],
    ["const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']", 'const WEEKDAYS = J.weekdayLetters()'],
    ['Number(props.min.slice(0, 4))', 'J.yearOf(props.min)'],
    ['Number(props.max.slice(0, 4))', 'J.yearOf(props.max)'],
    ["cell.date.subtract(cell.date.day(), 'day')", "cell.date.subtract(J.weekdayIndex(cell.date), 'day')"],
    ["cell.date.add(6 - cell.date.day(), 'day')", "cell.date.add(6 - J.weekdayIndex(cell.date), 'day')"],
  ],
  'frappe-ui/src/components/DatePicker/DateRangeCalendar.vue': [
    ["import CalendarPanel from './CalendarPanel.vue'", `import CalendarPanel from './CalendarPanel.vue'\n${J}`],
    [
      "dayjs().year(currentYear.value).month(currentMonth.value).add(1, 'month'),",
      'J.nextMonthAnchor(currentYear.value, currentMonth.value),',
    ],
    ['target.month() === currentMonth.value', 'J.monthIndex(target) === currentMonth.value'],
    ['target.year() === currentYear.value', 'J.year(target) === currentYear.value'],
    [
      'target.month() === rightMonth.value && target.year() === rightYear.value',
      'J.monthIndex(target) === rightMonth.value && J.year(target) === rightYear.value',
    ],
  ],
  'frappe-ui/src/components/DatePicker/DatePicker.vue': [
    ["import { dayjs, dayjsLocal } from '../../utils/dayjs'", `import { dayjs, dayjsLocal } from '../../utils/dayjs'\n${J}`],
    ['if (!d.isValid()) return dateStr\n  return d.format(format)', 'if (!d.isValid()) return dateStr\n  return J.format(d, format)'],
    [
      'props.format ? formatter(selected.value, props.format) : selected.value',
      "selected.value ? formatter(selected.value, props.format || 'YYYY-MM-DD') : ''",
    ],
    [
      'inputValue.value = props.format\n      ? formatter(selected.value, props.format)\n      : selected.value',
      "inputValue.value = formatter(selected.value, props.format || 'YYYY-MM-DD')",
    ],
  ],
  'frappe-ui/src/components/DatePicker/DateTimePicker.vue': [
    [
      "import { dayjs, dayjsLocal, dayjsSystem } from '../../utils/dayjs'",
      `import { dayjs, dayjsLocal, dayjsSystem } from '../../utils/dayjs'\n${J}`,
    ],
    [
      'if (props.format) return dayjs(combinedValue.value).format(props.format)\n  return combinedValue.value',
      "return J.format(dayjs(combinedValue.value), props.format || 'YYYY-MM-DD HH:mm:ss')",
    ],
  ],
  'frappe-ui/src/components/DatePicker/DateRangePicker.vue': [
    ["import { dayjs } from '../../utils/dayjs'", `import { dayjs } from '../../utils/dayjs'\n${J}`],
    ['return props.format ? d.format(props.format) : dateStr', "return J.format(d, props.format || 'YYYY-MM-DD')"],
  ],
  // The "Getting started" panel and help centre are plain English in Frappe's shared UI. CRM's translation
  // plugin puts __ on the app and on window, so wrapping the text is enough.
  '/frappe/ui/src/components/Onboarding/OnboardingSteps.vue': [
    ['{{ "Welcome to " + title }}', '{{ __("Welcome to {0}", [title]) }}'],
    ['{{ `${stepsCompleted}/${totalSteps} steps completed` }}', '{{ __("{0}/{1} steps completed", [stepsCompleted, totalSteps]) }}'],
    [':label="`${completedPercentage}% completed`"', ':label="__(\'{0}% completed\', [completedPercentage])"'],
    [":label=\"'Reset all'\"", ':label="__(\'Reset all\')"'],
    [":label=\"'Skip all'\"", ':label="__(\'Skip all\')"'],
    [":label=\"'Skip'\"", ':label="__(\'Skip\')"'],
  ],
  '/frappe/ui/src/components/Onboarding/GettingStartedBanner.vue': [
    ['{{ "Getting started" }}', '{{ __("Getting started") }}'],
    ['{{ `${stepsCompleted}/${totalSteps} steps` }}', '{{ __("{0}/{1} steps", [stepsCompleted, totalSteps]) }}'],
    ['{{ "You are all set" }}', '{{ __("You are all set") }}'],
    ['{{ "All steps are completed successfully" }}', '{{ __("All steps are completed successfully") }}'],
    [":label=\"stepsCompleted == 0 ? 'Start now' : 'Continue'\"", ':label="stepsCompleted == 0 ? __(\'Start now\') : __(\'Continue\')"'],
  ],
  '/frappe/ui/src/components/Onboarding/HelpModal.vue': [
    ['"Getting started"', 'window.__("Getting started")'],
    ['return "Help center";', 'return window.__("Help center");'],
    ['label: "Reset onboarding steps",', 'label: window.__("Reset onboarding steps"),'],
    ['label: "Help centre",', 'label: window.__("Help centre"),'],
  ],
  '/frappe/ui/src/components/Onboarding/HelpCenter.vue': [
    [":placeholder=\"'Search articles...'\"", ':placeholder="__(\'Search articles...\')"'],
    ['<div>All articles</div>', '<div>{{ __("All articles") }}</div>'],
  ],
  // The label of the dashboard's date range
  'crm/frontend/src/utils/dashboard.ts': [
    ["import { dayjs } from 'frappe-ui'", `import { dayjs } from 'frappe-ui'\n${J}`],
    [
      'const dateObj = new Date(date)\n  return dateObj.toLocaleDateString(',
      "const dateObj = new Date(date)\n  if (J.enabled()) {\n    const d = dayjs(date)\n    return J.format(d, J.year(d) === J.year(dayjs()) ? 'D MMMM' : 'D MMMM YYYY')\n  }\n  return dateObj.toLocaleDateString(",
    ],
  ],
  // The CRM's own formatDate, which every list, card and timeline goes through
  'crm/frontend/src/utils/index.js': [
    ["import { h } from 'vue'", `import { h } from 'vue'\n${J}`],
    ['return dayjsLocal(date).format(format)', 'return J.format(dayjsLocal(date), format)'],
    ['return dayjs(date).format(format)', 'return J.format(dayjs(date), format)'],
  ],
}

function replaceRegion(code, from, until, replacement) {
  const start = code.indexOf(from)
  const end = code.indexOf(until, start)
  if (start === -1 || end === -1) throw new Error(`region not found: ${from} .. ${until}`)
  return code.slice(0, start) + replacement + code.slice(end)
}

function rewrite(file, code, steps) {
  for (const step of steps) {
    if (typeof step === 'function') {
      code = step(code)
      continue
    }
    const [search, replacement] = step
    const found = typeof search === 'string' ? code.includes(search) : search.test(code)
    if (!found) {
      throw new Error(
        `crm_iran: ${file}: could not find ${search}. Did CRM or frappe-ui change? Update frontend/vite.config.js.`,
      )
    }
    code = typeof search === 'string' ? code.split(search).join(replacement) : code.replace(search, replacement)
  }
  return code
}

function jalaliDates() {
  const applied = new Set()
  return {
    name: 'crm-iran-jalali-dates',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('?') || id.startsWith('\0')) return null
      const normal = id.split(path.sep).join('/')
      const key = Object.keys(rewrites).find((suffix) => normal.endsWith(suffix))
      if (!key) return null
      applied.add(key)
      return { code: rewrite(key, code, rewrites[key]), map: null }
    },
    buildEnd() {
      const missing = Object.keys(rewrites).filter((key) => !applied.has(key))
      if (missing.length) {
        throw new Error(`crm_iran: these files were never bundled, so they were not rewritten: ${missing.join(', ')}`)
      }
    },
  }
}

const base = (await import(pathToFileURL(path.join(crmFrontend, 'vite.config.js')).href)).default

export default async (env) => {
  const config = typeof base === 'function' ? await base(env) : base
  config.plugins = [jalaliDates(), ...(config.plugins || [])]
  return config
}

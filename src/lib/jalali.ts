/* ------------------------------------------------------------------
 * تبدیل تاریخ میلادی و هجری شمسی (الگوریتم استاندارد جلالی)
 * بر پایه الگوریتم شناخته‌شده jalaali-js (MIT)
 * ------------------------------------------------------------------ */

const div = (a: number, b: number) => ~~(a / b)
const mod = (a: number, b: number) => a - ~~(a / b) * b

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324,
  2394, 2456, 3178,
]

interface JalCal {
  leap: number
  gy: number
  march: number
}

function jalCal(jy: number): JalCal {
  const bl = BREAKS.length
  const gy = jy + 621
  let leapJ = -14
  let jp = BREAKS[0]
  let jump = 0
  let leap = 0
  let n: number
  let i: number

  if (jy < jp || jy >= BREAKS[bl - 1]) throw new Error('سال شمسی نامعتبر است: ' + jy)

  // leapJ: شمار روزهای کبیسه پیش از آغاز سال jy نسبت به مبدأ
  for (i = 1; i < bl; i += 1) {
    const jm = BREAKS[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  n = jy - jp
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1

  // leapG: شمار روزهای کبیسه میلادی
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  // march: روز مارس (میلادی) که نوروز در آن رخ می‌دهد (۲۱ یا ۲۲ مارس)
  const march = 20 + leapJ - leapG

  // آیا سال جلالی جاری کبیسه است؟ (۰ خیر، ۱ بله)
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
  leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) leap = 4

  return { leap, gy, march }
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408
  d = d - div(div(gy + div(gm - 8, 6) + 100100, 100) * 3, 4) + 752
  return d
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

export interface JalaliDate {
  jy: number
  jm: number
  jd: number
}

export function gregorianToJalali(date: Date): JalaliDate {
  const gy = date.getFullYear()
  const gm = date.getMonth() + 1
  const gd = date.getDate()
  const jdn = g2d(gy, gm, gd)
  let jy = d2g(jdn).gy - 621
  let r = jalCal(jy)
  const jdn1f = g2d(r.gy, 3, r.march)
  let k = jdn - jdn1f
  let jm: number
  let jd: number
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31)
      jd = mod(k, 31) + 1
      return { jy, jm, jd }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }
  jm = 7 + div(k, 30)
  jd = mod(k, 30) + 1
  return { jy, jm, jd }
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const r = jalCal(jy)
  const jdn = g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
  const g = d2g(jdn)
  return new Date(g.gy, g.gm - 1, g.gd)
}

export const JALALI_MONTHS = [
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

export const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  // اسفند ۳۰ روزه (کبیسه) است اگر فاصله نوروز این سال تا نوروز سال بعد ۳۶۶ روز باشد
  return jalCal(jy + 1).march - jalCal(jy).march === 1 ? 30 : 29
}

/** تبدیل ارقام لاتین به فارسی */
const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
export function toFa(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

export function toEn(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

/** «جمعه ۲۳ آبان ۱۴۰۴» */
export function formatJalali(
  date: Date | number | string,
  opts: { weekday?: boolean; year?: boolean; short?: boolean } = {},
): string {
  const d = date instanceof Date ? date : new Date(date)
  const { jy, jm, jd } = gregorianToJalali(d)
  const { weekday = true, year = true, short = false } = opts
  const parts: string[] = []
  if (weekday) parts.push(WEEKDAYS[d.getDay()])
  parts.push(toFa(jd))
  parts.push(short ? JALALI_MONTHS[jm - 1].slice(0, 4) : JALALI_MONTHS[jm - 1])
  if (year) parts.push(toFa(jy))
  return parts.join(' ')
}

export function formatJalaliNumeric(date: Date | number | string): string {
  const d = date instanceof Date ? date : new Date(date)
  const { jy, jm, jd } = gregorianToJalali(d)
  return toFa(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`)
}

export function formatTime(date: Date | number | string): string {
  const d = date instanceof Date ? date : new Date(date)
  return toFa(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
}

export function jalaliMonthNames(): string[] {
  return JALALI_MONTHS
}

/** فاصله زمانی خوانا: «۲ روز پیش»، «۳ ساعت دیگر» */
export function humanizeDistance(target: number, now = Date.now()): string {
  const diff = target - now
  const abs = Math.abs(diff)
  const future = diff > 0
  const min = Math.round(abs / 60000)
  const hr = Math.round(abs / 3600000)
  const day = Math.round(abs / 86400000)

  let value: string
  if (min < 1) return 'همین حالا'
  else if (min < 60) value = `${toFa(min)} دقیقه`
  else if (hr < 24) value = `${toFa(hr)} ساعت`
  else if (day < 30) value = `${toFa(day)} روز`
  else if (day < 365) value = `${toFa(Math.round(day / 30))} ماه`
  else value = `${toFa(Math.round(day / 365))} سال`

  return future ? `${value} دیگر` : `${value} پیش`
}

export function jalaliDayStart(date: Date): Date {
  const { jy, jm, jd } = gregorianToJalali(date)
  return jalaliToGregorian(jy, jm, jd)
}

/** نمایش تاریخ و ساعت کامل: «جمعه ۲۳ آبان • ساعت ۱۹:۳۰» */
export function formatEventDate(ts: number): string {
  return `${formatJalali(ts, { year: false })} • ساعت ${formatTime(ts)}`
}

export function toDateInputValue(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function toTimeInputValue(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

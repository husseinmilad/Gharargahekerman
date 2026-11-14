import { gregorianToJalali, jalaliToGregorian, formatJalali, toFa } from '../src/lib/jalali.ts'
const tests: [string, string][] = [
  ['2026-11-14', '1405/8/23'],
  ['2025-03-21', '1404/1/1'],
  ['2024-03-20', '1403/1/1'],
  ['2023-03-21', '1402/1/1'],
  ['2022-03-21', '1401/1/1'],
  ['2026-03-21', '1405/1/1'],
  ['2027-03-21', '1406/1/1'],
]
for (const [g, expected] of tests) {
  const [y, m, d] = g.split('-').map(Number)
  const j = gregorianToJalali(new Date(y, m - 1, d))
  const got = `${j.jy}/${j.jm}/${j.jd}`
  console.log((expected === got ? '✓' : '✗') + ' ' + g + ' → ' + got + ' (انتظار: ' + expected + ')')
}
// roundtrip
let bad = 0
for (let i = 0; i < 4000; i++) {
  const d = new Date(2020, 0, 1 + i * 2)
  const j = gregorianToJalali(d)
  const back = jalaliToGregorian(j.jy, j.jm, j.jd)
  if (back.getTime() !== new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) { bad++; if (bad < 4) console.log('roundtrip fail', d.toDateString(), j) }
}
console.log('roundtrip failures:', bad)
console.log(formatJalali('2026-11-14'), '|', formatJalali('2026-11-14', {weekday:false, year:false}))

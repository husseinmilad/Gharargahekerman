import { gregorianToJalali, jalaliToGregorian, jalaliMonthLength, formatJalali } from '../src/lib/jalali.ts'
let bad = 0
for (let jy = 1395; jy <= 1420; jy++) {
  for (let jm = 1; jm <= 12; jm++) {
    const len = jalaliMonthLength(jy, jm)
    const lastDay = jalaliToGregorian(jy, jm, len)
    const j = gregorianToJalali(lastDay)
    if (j.jy !== jy || j.jm !== jm || j.jd !== len) { if (bad++ < 5) console.log('✗', jy, jm, len, j) }
    const next = jalaliToGregorian(jy, jm, len + 1)
    const jn = gregorianToJalali(next)
    const expM = jm === 12 ? 1 : jm + 1
    const expY = jm === 12 ? jy + 1 : jy
    if (jn.jy !== expY || jn.jm !== expM || jn.jd !== 1) { if (bad++ < 8) console.log('✗ next', jy, jm, len, jn) }
  }
}
console.log('month-boundary failures:', bad)
console.log('اسفند ۱۴۰۳ (کبیسه):', jalaliMonthLength(1403, 12), '| اسفند ۱۴۰۴:', jalaliMonthLength(1404, 12))
console.log('نوروز ۱۴۰۵:', formatJalali(jalaliToGregorian(1405, 1, 1)))
console.log('یلدا ۱۴۰۵:', formatJalali(jalaliToGregorian(1405, 9, 30)))

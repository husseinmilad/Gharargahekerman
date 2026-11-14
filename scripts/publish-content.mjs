/**
 * انتشار محتوای عمومی برای همه کاربران
 * ---- استفاده ----
 * ۱) در پنل مدیریت، «پشتیبان» را دانلود کنید (فایل json).
 * ۲) آن را در مسیر content/app-state.json بریزید.
 * ۳) این اکسپورت را اجرا و تغییرات را به گیت‌هاب push کنید:
 *      npm run publish:content
 */
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const INPUT = process.argv[2] ?? 'content/admin-backup.json'
const OUTPUT = 'content/app-state.json'

if (!existsSync(INPUT)) {
  console.error(`✗ فایل پشتیبان یافت نشد: ${INPUT}`)
  console.error('  در پنل مدیریت → تنظیمات → «دانلود پشتیبان» را بزنید و فایل را در content/admin-backup.json قرار دهید.')
  process.exit(1)
}

const state = JSON.parse(await readFile(INPUT, 'utf8'))
if (!state.settings || !state.updatedAt) {
  console.error('✗ فایل پشتیبان معتبر نیست (settings/updatedAt ندارد)')
  process.exit(1)
}

const payload = {
  schemaVersion: state.schemaVersion ?? 3,
  updatedAt: state.updatedAt,
  settings: state.settings,
  news: (state.news ?? []).filter((n) => n.published),
  events: state.events ?? [],
  reports: (state.reports ?? []).filter((r) => r.published),
  cooperationTypes: state.cooperationTypes ?? [],
  donation: state.donation,
  contactChannels: state.contactChannels ?? [],
}

await writeFile(OUTPUT, JSON.stringify(payload, null, 2), 'utf8')
console.log(`✓ محتوای عمومی نوشته شد: ${OUTPUT}`)
console.log(`  اخبار: ${payload.news.length} | مراسم: ${payload.events.length} | گزارش: ${payload.reports.length}`)
console.log('  حالا تغییرات را commit و push کنید تا همه کاربران محتوای تازه بگیرند.')

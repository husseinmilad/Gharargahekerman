/** بررسی سلامت پروژه: فایل‌های ضروری و حجم build */
import { statSync, readdirSync } from 'node:fs'

const required = [
  'README.md',
  'docs/ADMIN-GUIDE.md',
  'content/app-state.json',
  'public/media/hero.jpg',
  'public/icons/icon-192.png',
  'public/icons/maskable-512.png',
  'public/icons/badge-72.png',
  'src/sw.ts',
  'android/app/build.gradle',
  'android/app/src/main/AndroidManifest.xml',
  '.github/workflows/deploy.yml',
  '.github/workflows/android.yml',
]
let fails = 0
for (const f of required) {
  try {
    statSync(f)
    console.log('✓', f)
  } catch {
    console.error('✗', f)
    fails++
  }
}
const mediaSize = readdirSync('public/media').reduce((s, f) => s + statSync(`public/media/${f}`).size, 0)
console.log(`\nحجم رسانه‌ها: ${(mediaSize / 1024 / 1024).toFixed(1)} مگابایت`)
const fm = readdirSync('android/app/src/main/res').filter((d) => d.startsWith('mipmap'))
console.log('پوشه‌های آیکون اندروید:', fm.length)
process.exit(fails ? 1 : 0)

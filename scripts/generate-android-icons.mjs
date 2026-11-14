/**
 * تولید آیکون‌های لانچر اندروید، اسپلش و آیکون اعلان از روی public/icon.svg
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'

const svg = readFileSync('public/icon.svg')
const RES = 'android/app/src/main/res'
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }

// آیکون قدیمی (legacy) 48dp
for (const [density, scale] of Object.entries(DENSITIES)) {
  const size = Math.round(48 * scale)
  await mkdir(`${RES}/mipmap-${density}`, { recursive: true })
  await sharp(svg, { density: 1200 }).resize(size, size).png().toFile(`${RES}/mipmap-${density}/ic_launcher.png`)
  // round: ماسک گرد
  const svgRounded = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><clipPath id="c"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></clipPath></defs><g clip-path="url(#c)"><image width="${size}" height="${size}" href="data:image/png;base64,${(await sharp(svg, { density: 1200 }).resize(size, size).png().toBuffer()).toString('base64')}"/></g></svg>`
  await sharp(Buffer.from(svgRounded)).png().toFile(`${RES}/mipmap-${density}/ic_launcher_round.png`)
  // foreground برای adaptive icon: 108dp با حاشیه امن
  const fgSize = Math.round(108 * scale)
  const inner = Math.round(fgSize * 0.62)
  const innerBuf = await sharp(svg, { density: 1200 }).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  await sharp({ create: { width: fgSize, height: fgSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: innerBuf, gravity: 'centre' }])
    .png()
    .toFile(`${RES}/mipmap-${density}/ic_launcher_foreground.png`)
  await mkdir(`${RES}/drawable-${density}`, { recursive: true })
  // آیکون اعلان (سفید تک‌رنگ)
  const notifSize = Math.round(24 * scale)
  await sharp(`public/icons/badge-72.png`).resize(notifSize, notifSize).png().toFile(`${RES}/drawable-${density}/ic_stat_icon_config_sample.png`)
  // splash
  const splashW = Math.round(320 * scale)
  const splashH = Math.round(480 * scale)
  const logo = await sharp(svg, { density: 1200 }).resize(Math.round(splashW * 0.34), Math.round(splashW * 0.34)).png().toBuffer()
  await mkdir(`${RES}/drawable-port-${density}`, { recursive: true })
  await mkdir(`${RES}/drawable-land-${density}`, { recursive: true })
  await sharp({ create: { width: splashW, height: splashH, channels: 4, background: { r: 4, g: 18, b: 13, alpha: 1 } } })
    .composite([{ input: logo, gravity: 'centre' }]).png().toFile(`${RES}/drawable-port-${density}/splash.png`)
  await sharp({ create: { width: splashH, height: splashW, channels: 4, background: { r: 4, g: 18, b: 13, alpha: 1 } } })
    .composite([{ input: logo, gravity: 'centre' }]).png().toFile(`${RES}/drawable-land-${density}/splash.png`)
}

// رنگ پس‌زمینه آیکون adaptive
await mkdir(`${RES}/values`, { recursive: true })
await writeFile(`${RES}/values/ic_launcher_background.xml`, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#04120D</color>
    <color name="splashBackground">#04120D</color>
</resources>
`)
await mkdir(`${RES}/mipmap-anydpi-v26`, { recursive: true })
await writeFile(`${RES}/mipmap-anydpi-v26/ic_launcher.xml`, `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`)
await writeFile(`${RES}/mipmap-anydpi-v26/ic_launcher_round.xml`, `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`)
console.log('✓ آیکون‌های اندروید ساخته شدند')

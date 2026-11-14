/**
 * تولید آیکون‌های PWA و اندروید از روی public/icon.svg
 * اجرا: npm run icons
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'

const SRC = 'public/icon.svg'
const OUT = 'public/icons'
const svg = readFileSync(SRC)

await mkdir(OUT, { recursive: true })

const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['maskable-192.png', 192, true],
  ['maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, true],
  ['badge-72.png', 72, true],
  ['favicon-32.png', 32, false],
  ['favicon-16.png', 16, false],
]

for (const [name, size, maskable] of targets) {
  const base = sharp(svg, { density: Math.max(72, Math.round((size / 512) * 1200)) }).resize(size, size, {
    fit: 'contain',
    background: { r: 4, g: 18, b: 13, alpha: 0 },
  })
  if (maskable) {
    // حاشیه امن برای آیکون‌های maskable (safe zone 80%)
    const inner = Math.round(size * 0.8)
    const icon = await sharp(svg, { density: 1200 }).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    await sharp({ create: { width: size, height: size, channels: 4, background: { r: 4, g: 18, b: 13, alpha: 1 } } })
      .composite([{ input: icon, gravity: 'centre' }])
      .png()
      .toFile(`${OUT}/${name}`)
  } else {
    await base.png().toFile(`${OUT}/${name}`)
  }
}

// splash های اندروید/آی‌اواس
const splashSizes = [1170, 1536, 2048]
for (const w of splashSizes) {
  const h = Math.round(w * 2)
  const icon = await sharp(svg, { density: 1200 }).resize(Math.round(w * 0.28), Math.round(w * 0.28), { fit: 'contain' }).png().toBuffer()
  await sharp({ create: { width: w, height: h, channels: 4, background: { r: 4, g: 18, b: 13, alpha: 1 } } })
    .composite([{ input: icon, gravity: 'centre' }])
    .png()
    .toFile(`${OUT}/splash-${w}.png`)
}

// آیکون پیش‌نمایش شبکه‌های اجتماعی
await sharp('public/media/hero.jpg')
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .composite([
    {
      input: Buffer.from(
        `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop stop-color="#04120D" stop-opacity=".15"/><stop offset="1" stop-color="#04120D" stop-opacity=".92"/>
          </linearGradient></defs>
          <rect width="1200" height="630" fill="url(#g)"/>
        </svg>`,
      ),
      top: 0,
      left: 0,
    },
  ])
  .jpeg({ quality: 86 })
  .toFile('public/og-image.jpg')

console.log('✓ آیکون‌ها و تصاویر اسپلش ساخته شدند')

import { Window } from 'happy-dom'
export {}
async function main() {
  const win = new Window({ url: 'http://www.test/' })
  Object.defineProperty(globalThis, 'localStorage', { value: win.localStorage, configurable: true })
  const { pullRemote, applyRemote, contentForPublish } = await import('../src/lib/remote.ts')
  const { createSeedState } = await import('../src/types.ts')

  // شبیه‌سازی فایل منتشرشده
  const published = createSeedState()
  published.news = published.news.slice(0, 2)
  published.news[0] = { ...published.news[0], title: 'خبر منتشرشده از گیت‌هاب' }
  published.updatedAt = new Date(Date.now() - 86400000).toISOString()
  const payload = contentForPublish(published)
  globalThis.fetch = (async () => new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } })) as any

  const local = createSeedState() // updatedAt = اکنون (جدیدتر)، ولی هرگز sync نشده
  const res = await pullRemote(local)
  console.log('first sync:', res)
  const merged = applyRemote(local, payload as any)
  console.log('applied news count:', merged.news.length, '| title:', merged.news[0].title)

  // بار دوم: محتوا قدیمی‌تر است ⇒ اعمال نشود
  const again = await pullRemote(merged)
  console.log('second sync (should be up-to-date):', again.applied, again.reason)
  process.exit(0)
}
main()

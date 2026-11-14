import { writeFile } from 'node:fs/promises'
import { createSeedState, SCHEMA_VERSION } from '../src/types.ts'

const state = createSeedState()
const payload = {
  schemaVersion: SCHEMA_VERSION,
  updatedAt: state.updatedAt,
  settings: state.settings,
  news: state.news.filter((n) => n.published),
  events: state.events,
  reports: state.reports.filter((r) => r.published),
  cooperationTypes: state.cooperationTypes,
  donation: state.donation,
  contactChannels: state.contactChannels,
}
await writeFile('content/app-state.json', JSON.stringify(payload, null, 2))
console.log(`✓ content/app-state.json ساخته شد — اخبار: ${payload.news.length}، مراسم: ${payload.events.length}، گزارش: ${payload.reports.length}`)

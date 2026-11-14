/* ------------------------------------------------------------------
 *  هواشناسی آنلاین (Open-Meteo) — بدون نیاز به کلید
 * ------------------------------------------------------------------ */

export interface WeatherInfo {
  temp: number
  feels: number
  code: number
  text: string
  icon: WeatherIcon
  wind: number
  humidity: number
  isDay: boolean
  city: string
  updatedAt: number
}

export type WeatherIcon =
  | 'sun'
  | 'moon'
  | 'sun-cloud'
  | 'moon-cloud'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'storm'

interface CodeMeta {
  text: string
  icon: WeatherIcon
}

const CODES: Record<number, CodeMeta> = {
  0: { text: 'آفتابی', icon: 'sun' },
  1: { text: 'اغلب آفتابی', icon: 'sun-cloud' },
  2: { text: 'نیمه ابری', icon: 'sun-cloud' },
  3: { text: 'ابری', icon: 'cloudy' },
  45: { text: 'مه‌آلود', icon: 'fog' },
  48: { text: 'مه یخ‌زده', icon: 'fog' },
  51: { text: 'نم‌نم باران', icon: 'drizzle' },
  53: { text: 'نم‌نم باران', icon: 'drizzle' },
  55: { text: 'باران سبک', icon: 'drizzle' },
  56: { text: 'باران یخ‌زده', icon: 'drizzle' },
  57: { text: 'باران یخ‌زده', icon: 'drizzle' },
  61: { text: 'بارانی', icon: 'rain' },
  63: { text: 'بارانی', icon: 'rain' },
  65: { text: 'باران شدید', icon: 'rain' },
  66: { text: 'باران یخ‌زده', icon: 'rain' },
  67: { text: 'باران یخ‌زده', icon: 'rain' },
  71: { text: 'برف سبک', icon: 'snow' },
  73: { text: 'برفی', icon: 'snow' },
  75: { text: 'برف شدید', icon: 'snow' },
  77: { text: 'دانه‌های برف', icon: 'snow' },
  80: { text: 'رگبار پراکنده', icon: 'rain' },
  81: { text: 'رگبار', icon: 'rain' },
  82: { text: 'رگبار شدید', icon: 'rain' },
  85: { text: 'رگبار برف', icon: 'snow' },
  86: { text: 'رگبار برف', icon: 'snow' },
  95: { text: 'رعد و برق', icon: 'storm' },
  96: { text: 'رعد و برق با تگرگ', icon: 'storm' },
  99: { text: 'رعد و برق شدید', icon: 'storm' },
}

function metaFor(code: number, isDay: boolean): CodeMeta {
  const base = CODES[code] ?? { text: 'نامشخص', icon: 'cloudy' as WeatherIcon }
  if (!isDay) {
    if (base.icon === 'sun') return { text: 'آسمان صاف', icon: 'moon' }
    if (base.icon === 'sun-cloud') return { text: 'نیمه ابری', icon: 'moon-cloud' }
  }
  if (base.icon === 'sun') return { text: base.text, icon: 'sun' }
  return base
}

export function weatherTextFor(code: number, isDay: boolean): string {
  return metaFor(code, isDay).text
}

const CACHE_KEY = 'gharargah-weather-cache-v1'
const CACHE_TTL = 20 * 60 * 1000

interface WeatherTarget {
  city: string
  latitude: number
  longitude: number
}

interface CachePayload {
  key: string
  data: WeatherInfo
}

function readCache(key: string, allowStale = false): WeatherInfo | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachePayload
    if (parsed.key !== key) return null
    if (!allowStale && Date.now() - parsed.data.updatedAt > CACHE_TTL) return null
    return parsed.data
  } catch {
    return null
  }
}

export async function fetchWeather(
  target: WeatherTarget,
  opts: { signal?: AbortSignal; allowStale?: boolean } = {},
): Promise<WeatherInfo> {
  const key = `${target.latitude.toFixed(2)},${target.longitude.toFixed(2)}`
  const cached = readCache(key, opts.allowStale)
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL) return cached

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${target.latitude}` +
    `&longitude=${target.longitude}` +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m' +
    '&timezone=Asia%2FTehran'

  const res = await fetch(url, { signal: opts.signal })
  if (!res.ok) throw new Error(`پاسخ نامعتبر سرویس هوا: ${res.status}`)
  const json = (await res.json()) as {
    current: {
      temperature_2m: number
      relative_humidity_2m: number
      apparent_temperature: number
      is_day: number
      weather_code: number
      wind_speed_10m: number
    }
  }
  const cur = json.current
  const isDay = cur.is_day === 1
  const meta = metaFor(cur.weather_code, isDay)
  const info: WeatherInfo = {
    temp: Math.round(cur.temperature_2m),
    feels: Math.round(cur.apparent_temperature),
    code: cur.weather_code,
    text: meta.text,
    icon: meta.icon,
    wind: Math.round(cur.wind_speed_10m),
    humidity: Math.round(cur.relative_humidity_2m),
    isDay,
    city: target.city,
    updatedAt: Date.now(),
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ key, data: info }))
  } catch {
    /* ignore */
  }
  return info
}

export function staleWeather(target: WeatherTarget): WeatherInfo | null {
  return readCache(`${target.latitude.toFixed(2)},${target.longitude.toFixed(2)}`, true)
}

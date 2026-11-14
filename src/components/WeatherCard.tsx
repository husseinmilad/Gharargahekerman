import { useEffect, useState } from 'react'
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  RefreshCw,
  MapPin,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fetchWeather, staleWeather } from '../lib/weather'
import type { WeatherIcon, WeatherInfo } from '../lib/weather'
import { toFa } from '../lib/jalali'
import { formatTime } from '../lib/jalali'
import { useStore } from '../lib/store'

const ICONS: Record<WeatherIcon, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  'sun-cloud': CloudSun,
  'moon-cloud': CloudMoon,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
}

export function WeatherCard({ compact = false }: { compact?: boolean }) {
  const { state } = useStore()
  const target = state.settings.weather
  const [data, setData] = useState<WeatherInfo | null>(() => staleWeather(target))
  const [loading, setLoading] = useState(!data)
  const [failed, setFailed] = useState(false)

  const load = () => {
    setLoading(true)
    setFailed(false)
    const ctrl = new AbortController()
    fetchWeather(target, { signal: ctrl.signal })
      .then((info) => setData(info))
      .catch(() => {
        setFailed(true)
        if (!data) setData(staleWeather(target))
      })
      .finally(() => setLoading(false))
    return ctrl
  }

  useEffect(() => {
    const ctrl = load()
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.latitude, target.longitude, target.city])

  useEffect(() => {
    const t = window.setInterval(() => load(), 20 * 60 * 1000)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.latitude, target.longitude])

  const Icon = data ? ICONS[data.icon] : CloudSun

  return (
    <div className="weather-card" aria-live="polite">
      <span className="weather-icon" style={{ width: compact ? 46 : 54, height: compact ? 46 : 54 }}>
        <Icon size={compact ? 24 : 28} strokeWidth={1.7} color="#f5d78e" />
      </span>
      <div className="grow">
        {data ? (
          <>
            <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
              <span className="weather-temp">
                {toFa(data.temp)}
                <sup>°</sup>
              </span>
              <span className="bold" style={{ fontSize: '0.92rem' }}>
                {data.text}
              </span>
            </div>
            <div className="weather-city">
              <MapPin size={11} />
              {target.label}
              <span className="dot-sep" />
              <span>به‌روزرسانی {formatTime(data.updatedAt)}</span>
            </div>
          </>
        ) : loading ? (
          <>
            <div className="skeleton" style={{ width: 96, height: 22, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: 130, height: 12 }} />
          </>
        ) : (
          <>
            <div className="bold" style={{ fontSize: '0.9rem' }}>
              هوای {target.city} در دسترس نیست
            </div>
            <div className="weather-city">{failed ? 'اتصال اینترنت را بررسی کنید' : 'در حال دریافت…'}</div>
          </>
        )}
      </div>
      <button
        className="icon-btn"
        style={{ width: 38, height: 38, flex: 'none' }}
        onClick={() => load()}
        aria-label="به‌روزرسانی هوا"
        disabled={loading}
      >
        <RefreshCw
          size={16}
          style={{ animation: loading ? 'spin 1s linear infinite' : undefined }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </button>
    </div>
  )
}

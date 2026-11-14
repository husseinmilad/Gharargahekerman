import { useEffect, useState } from 'react'
import { resolveAsset } from '../lib/store'

/** نمایش ساده یک رسانه با پشتیبانی از فایل‌های IndexedDB */
export function MediaView({ src, kind = 'image', alt }: { src: string; kind?: 'image' | 'audio' | 'video'; alt?: string }) {
  const [url, setUrl] = useState<string | undefined>()
  useEffect(() => {
    let alive = true
    resolveAsset(src).then((u) => alive && setUrl(u)).catch(() => undefined)
    return () => {
      alive = false
    }
  }, [src])
  if (!url) return <div className="skeleton" style={{ aspectRatio: '16/9' }} />
  if (kind === 'audio') return <audio src={url} controls style={{ width: '100%' }} />
  if (kind === 'video') return <video src={url} controls playsInline style={{ width: '100%' }} />
  return <img src={url} alt={alt ?? ''} />
}

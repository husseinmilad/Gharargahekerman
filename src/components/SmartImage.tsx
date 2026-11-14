import { useEffect, useState } from 'react'
import { resolveAsset } from '../lib/store'
import { ImageOff } from 'lucide-react'

interface SmartImageProps {
  src?: string
  alt: string
  className?: string
  imgClassName?: string
  fallbackIcon?: boolean
  eager?: boolean
}

/** تصویری که می‌تواند از IndexedDB (آپلود ادمین) یا مسیر داخلی/اینترنت باشد */
export function SmartImage({ src, alt, className, imgClassName, eager }: SmartImageProps) {
  const [resolved, setResolved] = useState<string | undefined>(undefined)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    setFailed(false)
    if (!src) {
      setResolved(undefined)
      return
    }
    resolveAsset(src)
      .then((url) => {
        if (alive) setResolved(url)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [src])

  if (!src || failed || (resolved === undefined && src.startsWith('idb:'))) {
    if (resolved === undefined && src && !failed) {
      return <span className={`skeleton ${className ?? ''}`} aria-label={alt} />
    }
    return (
      <span className={`${className ?? ''} img-fallback`} aria-label={alt} role="img">
        <ImageOff size={22} />
      </span>
    )
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={imgClassName}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

/** نسخه‌ای که مستقیم داخل والدِ دارای overflow کار می‌کند */
export function FillImage({ src, alt, eager }: { src?: string; alt: string; eager?: boolean }) {
  return <SmartImage src={src} alt={alt} imgClassName="" eager={eager} />
}

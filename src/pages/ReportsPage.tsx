import { useEffect, useMemo, useState } from 'react'
import {
  Images,
  Headphones,
  Video,
  Play,
  CalendarDays,
  ChevronLeft,
  Maximize2,
  X,
  ExternalLink,
  Download,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { useNavigate } from '../lib/router'
import { SmartImage } from '../components/SmartImage'
import { PageHeader } from '../components/Nav'
import { EmptyState } from '../components/EmptyState'
import { formatJalali, toFa } from '../lib/jalali'
import { resolveAsset } from '../lib/store'
import { MediaView } from '../components/MediaView'
import type { ReportItem } from '../types'

type Filter = 'all' | 'photo' | 'audio' | 'video'

export function ReportsPage() {
  const { state } = useStore()
  const { navigate } = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')

  const items = useMemo(
    () =>
      [...state.reports]
        .filter((r) => r.published)
        .filter((r) => (filter === 'all' ? true : r.type === filter))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [state.reports, filter],
  )

  const counts = useMemo(() => {
    const pub = state.reports.filter((r) => r.published)
    return {
      all: pub.length,
      photo: pub.filter((r) => r.type === 'photo').length,
      audio: pub.filter((r) => r.type === 'audio').length,
      video: pub.filter((r) => r.type === 'video').length,
    }
  }, [state.reports])

  return (
    <div className="page">
      <PageHeader
        title="گزارش‌های تصویری"
        subtitle="عکس، فایل صوتی و ویدیوی مراسم‌های گذشته"
        back="home"
      />

      <div className="row wrap" style={{ gap: 7 }}>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} icon={<Images size={13} />} label={`همه (${toFa(counts.all)})`} />
        <FilterChip active={filter === 'photo'} onClick={() => setFilter('photo')} icon={<Images size={13} />} label={`عکس (${toFa(counts.photo)})`} />
        <FilterChip active={filter === 'audio'} onClick={() => setFilter('audio')} icon={<Headphones size={13} />} label={`صوتی (${toFa(counts.audio)})`} />
        <FilterChip active={filter === 'video'} onClick={() => setFilter('video')} icon={<Video size={13} />} label={`ویدیو (${toFa(counts.video)})`} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Images size={26} />}
          title="گزارشی در این دسته نیست"
          description="پس از هر مراسم، تیم رسانه قرارگاه گزارش‌های عکسی، صوتی و ویدیویی را اینجا منتشر می‌کند."
        />
      ) : (
        <div className="col" style={{ gap: 14 }}>
          {items.map((report) => (
            <ReportCard key={report.id} report={report} onOpen={() => navigate(`reports/${report.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button className="chip chip-btn" aria-pressed={active} onClick={onClick}>
      {icon}
      {label}
    </button>
  )
}

function ReportCard({ report, onOpen }: { report: ReportItem; onOpen: () => void }) {
  return (
    <article className="glass" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        onClick={onOpen}
        style={{ display: 'block', width: '100%', textAlign: 'right', position: 'relative' }}
        aria-label={`مشاهده ${report.title}`}
      >
        <div style={{ position: 'relative', aspectRatio: '16/8.2', overflow: 'hidden' }}>
          {report.cover ? (
            <SmartImage src={report.cover} alt={report.title} />
          ) : (
            <div className="report-placeholder" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              {report.type === 'audio' ? <Headphones size={40} /> : report.type === 'video' ? <Video size={40} /> : <Images size={40} />}
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(4,18,13,.06) 40%, rgba(4,18,13,.88) 100%)',
            }}
          />
          <span className="report-type-badge" style={{ right: 'auto', left: 10 }}>
            {report.type === 'audio' ? <Headphones size={11} /> : report.type === 'video' ? <Video size={11} /> : <Images size={11} />}
            {report.type === 'audio' ? 'صوتی' : report.type === 'video' ? 'ویدیو' : 'عکس'}
          </span>
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(6,26,19,.55)',
                border: '1px solid rgba(255,255,255,.3)',
                backdropFilter: 'blur(12px)',
                color: '#eafff6',
                boxShadow: '0 10px 30px rgba(0,0,0,.34)',
              }}
            >
              {report.type === 'audio' ? <Headphones size={21} /> : report.type === 'video' ? <Play size={21} /> : <Maximize2 size={19} />}
            </span>
          </span>
        </div>
      </button>
      <div style={{ padding: '12px 14px 14px' }} className="col">
        <h3 style={{ fontSize: '.98rem', lineHeight: 1.65 }}>{report.title}</h3>
        <p className="small muted" style={{ lineHeight: 1.9 }}>
          {report.description.length > 120 ? `${report.description.slice(0, 120)}…` : report.description}
        </p>
        <div className="row-between">
          <span className="row tiny dim" style={{ gap: 5 }}>
            <CalendarDays size={12} />
            {report.eventDateText ?? formatJalali(report.date, { year: false })}
            <span className="dot-sep" />
            {report.media.length > 0 ? `${toFa(report.media.length)} رسانه` : 'رسانه پیوست'}
          </span>
          <button className="link-more" onClick={onOpen}>
            مشاهده گزارش <ChevronLeft size={13} />
          </button>
        </div>
      </div>
    </article>
  )
}

export function ReportDetailPage({ id }: { id: string }) {
  const { state } = useStore()
  const { navigate } = useNavigate()
  const report = state.reports.find((r) => r.id === id)
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (!report) {
    return (
      <div className="page">
        <PageHeader title="گزارش یافت نشد" back="reports" />
        <EmptyState
          title="این گزارش در دسترس نیست"
          action={<button className="btn btn-primary" onClick={() => navigate('reports')}>بازگشت به گزارش‌ها</button>}
        />
      </div>
    )
  }

  const images = report.media.filter((m) => m.kind === 'image')
  const audios = report.media.filter((m) => m.kind === 'audio')
  const videos = report.media.filter((m) => m.kind === 'video')
  const externals = report.media.filter((m) => m.kind === 'external')

  return (
    <div className="page">
      <PageHeader title="گزارش قرارگاه" back="reports" />

      <div className="detail-cover" style={{ marginTop: -18 }}>
        <SmartImage src={report.cover ?? images[0]?.url} alt={report.title} />
      </div>
      <div style={{ marginTop: -22, position: 'relative', zIndex: 2 }} className="col">
        <div className="row wrap" style={{ gap: 7 }}>
          <span className="badge badge-green">
            {report.type === 'audio' ? <Headphones size={10} /> : report.type === 'video' ? <Video size={10} /> : <Images size={10} />}
            {report.type === 'audio' ? 'گزارش صوتی' : report.type === 'video' ? 'گزارش ویدیویی' : 'گزارش تصویری'}
          </span>
          <span className="badge badge-gold">{report.eventDateText ?? formatJalali(report.date)}</span>
        </div>
        <h2 style={{ fontSize: '1.25rem', lineHeight: 1.7 }}>{report.title}</h2>
        <p className="prose">{report.description}</p>
      </div>

      {audios.length > 0 && (
        <div className="col" style={{ gap: 10 }}>
          {audios.map((asset) => (
            <AudioBlock key={asset.id} url={asset.url} caption={asset.caption} title={report.title} />
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="col" style={{ gap: 10 }}>
          {videos.map((asset) => (
            <VideoBlock key={asset.id} url={asset.url} caption={asset.caption} />
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="section">
          <h3 className="section-title">
            <span className="bar" />
            گالری تصاویر ({toFa(images.length)})
          </h3>
          <div className="gallery">
            {images.map((asset) => (
              <GalleryThumb key={asset.id} url={asset.url} caption={asset.caption} onOpen={setLightbox} />
            ))}
          </div>
        </div>
      )}

      {externals.length > 0 && (
        <div className="col" style={{ gap: 8 }}>
          {externals.map((asset) => (
            <a
              key={asset.id}
              className="glass card row-between"
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: 14 }}
            >
              <span className="row" style={{ gap: 9 }}>
                <ExternalLink size={17} />
                <span className="small bold">{asset.caption ?? 'مشاهده در منبع خارجی'}</span>
              </span>
              <ChevronLeft size={16} style={{ opacity: 0.5 }} />
            </a>
          ))}
        </div>
      )}

      {report.media.length === 0 && (
        <div className="warn-note">
          <Images size={16} />
          <span>رسانه‌های این گزارش هنوز بارگذاری نشده‌اند. خادمان در حال تکمیل آن هستند.</span>
        </div>
      )}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

function AudioBlock({ url, caption, title }: { url: string; caption?: string; title: string }) {
  const [playing, setPlaying] = useState(false)
  const [src, setSrc] = useState<string | undefined>(undefined)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    resolveAsset(url)
      .then((resolved) => {
        if (!alive) return
        if (resolved) setSrc(resolved)
        else setError(true)
      })
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [url])

  return (
    <div className="audio-player">
      <div className="row" style={{ gap: 11 }}>
        <span className="coop-icon" style={{ width: 44, height: 44, borderRadius: 14 }}>
          <Headphones size={19} />
        </span>
        <div className="grow">
          <div className="small bold">{title}</div>
          <div className="tiny dim">{caption ?? 'فایل صوتی مراسم'}</div>
        </div>
        {src && !src.startsWith('blob:') ? (
          <a className="icon-btn" href={src} download aria-label="دانلود فایل صوتی">
            <Download size={16} />
          </a>
        ) : null}
      </div>
      <div className={`audio-wave ${playing ? '' : 'paused'}`} aria-hidden="true">
        {Array.from({ length: 34 }).map((_, i) => (
          <span
            key={i}
            style={{
              height: `${28 + Math.sin(i * 1.35) * 30 + (i % 4) * 9}%`,
              animationDelay: `${(i % 9) * 0.12}s`,
            }}
          />
        ))}
      </div>
      {src ? (
        <audio
          src={src}
          controls
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          style={{ width: '100%', height: 40 }}
        />
      ) : (
        <div className="skeleton" style={{ height: 40, borderRadius: 12 }} />
      )}
      {error && <div className="tiny" style={{ color: '#ffc0c8' }}>فایل صوتی در دسترس نیست.</div>}
    </div>
  )
}

function VideoBlock({ url, caption }: { url: string; caption?: string }) {
  const [src, setSrc] = useState<string | undefined>(undefined)
  useEffect(() => {
    let alive = true
    resolveAsset(url)
      .then((r) => alive && setSrc(r))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [url])
  const isEmbed = src?.includes('youtube.com') || src?.includes('youtu.be') || src?.includes('aparat.com') || src?.includes('vimeo.com')
  return (
    <div className="col" style={{ gap: 6 }}>
      <div className="media-card">
        {!src ? (
          <div className="skeleton" style={{ aspectRatio: '16/9' }} />
        ) : isEmbed ? (
          <iframe src={src} title={caption ?? 'ویدیو'} allowFullScreen loading="lazy" />
        ) : (
          <video src={src} controls playsInline preload="metadata" poster={undefined}>
            <track kind="captions" />
          </video>
        )}
      </div>
      {caption && <span className="tiny dim">{caption}</span>}
    </div>
  )
}

function GalleryThumb({ url, caption, onOpen }: { url: string; caption?: string; onOpen: (src: string) => void }) {
  const [src, setSrc] = useState<string | undefined>(undefined)
  useEffect(() => {
    let alive = true
    resolveAsset(url)
      .then((r) => alive && setSrc(r))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [url])
  return (
    <button className="gallery-item" onClick={() => src && onOpen(src)} aria-label={caption ?? 'مشاهده تصویر'}>
      {src ? <img src={src} alt={caption ?? ''} loading="lazy" /> : <div className="skeleton" style={{ width: '100%', height: '100%' }} />}
    </button>
  )
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="نمایش تصویر"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(2,8,6,.94)',
        display: 'grid',
        placeItems: 'center',
        padding: 18,
        animation: 'fade-in 200ms ease both',
        backdropFilter: 'blur(8px)',
      }}
    >
      <button
        className="icon-btn"
        style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', left: 16 }}
        onClick={onClose}
        aria-label="بستن"
      >
        <X size={20} />
      </button>
      <img src={src} alt="" style={{ maxWidth: '100%', maxHeight: '82dvh', borderRadius: 16, objectFit: 'contain' }} />
    </div>
  )
}

export { MediaView }

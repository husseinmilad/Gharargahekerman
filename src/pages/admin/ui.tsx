import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ImagePlus,
  Trash2,
  Upload,
  Music4,
  Video,
  Link2,
  Loader2,
  Check,
} from 'lucide-react'
import { resolveAsset, saveImage, saveAsset } from '../../lib/store'
import type { MediaAsset, MediaKind } from '../../types'
import { uid } from '../../lib/id'
import { useToast } from '../../lib/toast'

export function AdminField({
  label,
  hint,
  children,
  required,
}: {
  label: string
  hint?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <div className="field">
      <label>
        {label} {required && <span style={{ color: '#ffc0c8' }}>*</span>}
      </label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="row-between" style={{ padding: '3px 0' }}>
      <span className="small">{label}</span>
      <button
        type="button"
        className="switch"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
      />
    </div>
  )
}

/** انتخاب تصویر با آپلود، فشرده‌سازی و پیش‌نمایش */
export function ImagePicker({
  value,
  onChange,
  aspect = '16 / 9',
  label = 'تصویر',
}: {
  value?: string
  onChange: (ref: string | undefined) => void
  aspect?: string
  label?: string
}) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    resolveAsset(value).then((u) => alive && setUrl(u)).catch(() => undefined)
    return () => {
      alive = false
    }
  }, [value])

  const pick = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('فقط فایل تصویر مجاز است')
      return
    }
    setBusy(true)
    try {
      const ref = await saveImage(file, 'cover')
      onChange(ref)
      toast.success('تصویر ذخیره شد')
    } catch {
      toast.error('ذخیره تصویر ناموفق بود')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="field">
      <span className="label">{label}</span>
      <div
        className="img-picker"
        style={{ aspectRatio: aspect }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label={label}
      >
        {url ? (
          <img src={url} alt="" />
        ) : busy ? (
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <div className="col center" style={{ alignItems: 'center', gap: 6 }}>
            <ImagePlus size={26} />
            <span className="tiny">برای انتخاب تصویر ضربه بزنید</span>
          </div>
        )}
        {url && (
          <div className="overlay" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => inputRef.current?.click()} aria-label="تغییر تصویر">
              <Upload size={15} />
            </button>
            <button
              type="button"
              className="icon-btn"
              style={{ width: 36, height: 36 }}
              onClick={() => onChange(undefined)}
              aria-label="حذف تصویر"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <span className="hint">تصویر به‌طور خودکار بهینه می‌شود (حداکثر ۱۸۰۰ پیکسل).</span>
    </div>
  )
}

/** بارگذار چندرسانه‌ای: عکس، صدا، ویدیو یا لینک خارجی */
export function MediaUploader({
  media,
  onChange,
  allow = ['image', 'audio', 'video'],
}: {
  media: MediaAsset[]
  onChange: (list: MediaAsset[]) => void
  allow?: MediaKind[]
}) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [uploadKind, setUploadKind] = useState<'image' | 'audio' | 'video'>(
    allow.includes('audio') ? 'audio' : 'image',
  )
  const [externalUrl, setExternalUrl] = useState('')
  const [externalCaption, setExternalCaption] = useState('')
  const [showExternal, setShowExternal] = useState(false)

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    const added: MediaAsset[] = []
    try {
      for (const file of Array.from(files).slice(0, 12)) {
        const isImage = file.type.startsWith('image/')
        const kind: MediaKind = isImage ? 'image' : uploadKind === 'audio' ? 'audio' : 'video'
        if (kind === 'audio' && file.size > 45 * 1024 * 1024) {
          toast.error(`فایل ${file.name} بیش از ۴۵ مگابایت است`)
          continue
        }
        let ref: string
        if (isImage) {
          ref = await saveImage(file, 'media')
        } else {
          ref = await saveAsset(file, kind)
        }
        added.push({ id: uid('m'), kind, url: ref })
      }
      if (added.length) {
        onChange([...media, ...added])
        toast.success(`${added.length} فایل افزوده شد`)
      }
    } catch {
      toast.error('بارگذاری فایل ناموفق بود')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="col" style={{ gap: 10 }}>
      <div className="row wrap" style={{ gap: 7 }}>
        {allow.includes('image') && (
          <button type="button" className="chip chip-btn" aria-pressed={uploadKind === 'image'} onClick={() => setUploadKind('image')}>
            <ImagePlus size={13} /> عکس
          </button>
        )}
        {allow.includes('audio') && (
          <button type="button" className="chip chip-btn" aria-pressed={uploadKind === 'audio'} onClick={() => setUploadKind('audio')}>
            <Music4 size={13} /> صدا
          </button>
        )}
        {allow.includes('video') && (
          <button type="button" className="chip chip-btn" aria-pressed={uploadKind === 'video'} onClick={() => setUploadKind('video')}>
            <Video size={13} /> ویدیو
          </button>
        )}
      </div>

      <div className="row" style={{ gap: 8 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm grow"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={15} />}
          {busy ? 'در حال بارگذاری…' : uploadKind === 'image' ? 'افزودن عکس' : uploadKind === 'audio' ? 'افزودن فایل صوتی' : 'افزودن ویدیو'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowExternal((v) => !v)}>
          <Link2 size={15} />
          لینک
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        hidden
        multiple={uploadKind === 'image'}
        accept={uploadKind === 'image' ? 'image/*' : uploadKind === 'audio' ? 'audio/*' : 'video/*'}
        onChange={(e) => {
          void upload(e.target.files)
          e.target.value = ''
        }}
      />

      {showExternal && (
        <div className="form-section" style={{ padding: 12, gap: 8 }}>
          <input
            className="input"
            dir="ltr"
            placeholder="https://youtube.com/watch?v=... یا آدرس فایل"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
          />
          <input
            className="input"
            placeholder="عنوان (اختیاری)"
            value={externalCaption}
            onChange={(e) => setExternalCaption(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              const url = externalUrl.trim()
              if (!/^https?:\/\//.test(url)) {
                toast.error('آدرس باید با http یا https شروع شود')
                return
              }
              const isYt = /youtu\.?be|youtube\.com/.test(url)
              const isAparat = /aparat\.com/.test(url)
              let kind: MediaKind = 'external'
              let finalUrl = url
              if (isYt) {
                const idMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/)
                if (idMatch) finalUrl = `https://www.youtube.com/embed/${idMatch[1]}`
                kind = 'video'
              } else if (isAparat) {
                const idMatch = url.match(/v\/([\w-]+)/)
                if (idMatch) finalUrl = `https://www.aparat.com/video/video/embed/videohash/${idMatch[1]}/vt/frame`
                kind = 'video'
              }
              onChange([...media, { id: uid('m'), kind, url: finalUrl, caption: externalCaption.trim() || undefined }])
              setExternalUrl('')
              setExternalCaption('')
              setShowExternal(false)
              toast.success('لینک افزوده شد')
            }}
          >
            <Check size={14} /> افزودن لینک
          </button>
        </div>
      )}

      {media.length > 0 && (
        <div className="col" style={{ gap: 7 }}>
          {media.map((m) => (
            <div key={m.id} className="admin-row" style={{ padding: 8 }}>
              <span className="admin-row-thumb" style={{ width: 44, height: 44 }}>
                <MediaThumb asset={m} />
              </span>
              <div className="admin-row-main">
                <div className="admin-row-title" style={{ fontSize: '.78rem' }}>
                  {m.caption || kindLabel(m.kind)}
                </div>
                <div className="admin-row-sub">{m.url.startsWith('idb:') ? 'فایل داخلی (آفلاین)' : 'لینک خارجی'}</div>
              </div>
              <button
                type="button"
                className="mini-btn danger"
                onClick={() => onChange(media.filter((x) => x.id !== m.id))}
                aria-label="حذف"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MediaThumb({ asset }: { asset: MediaAsset }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    resolveAsset(asset.url).then(setUrl).catch(() => undefined)
  }, [asset.url])
  if (asset.kind === 'image' && url) return <img src={url} alt="" />
  if (asset.kind === 'audio') return <Music4 size={17} />
  if (asset.kind === 'video') return <Video size={17} />
  return <Link2 size={16} />
}

function kindLabel(kind: MediaKind) {
  return kind === 'image' ? 'تصویر' : kind === 'audio' ? 'فایل صوتی' : kind === 'video' ? 'ویدیو' : 'لینک خارجی'
}

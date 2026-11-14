import type { SVGProps } from 'react'

/** نشان قرارگاه: گنبد و محراب، ستاره، شاخه‌های زیتون — سبز و طلایی */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="lg-em" x1="10" y1="4" x2="54" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6EE7B7" />
          <stop offset="0.55" stopColor="#2FBF8F" />
          <stop offset="1" stopColor="#0F8F68" />
        </linearGradient>
        <linearGradient id="lg-gold" x1="18" y1="16" x2="46" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7E3AE" />
          <stop offset="1" stopColor="#D6A84F" />
        </linearGradient>
      </defs>
      <path
        d="M32 3.5c9.2 3.3 17.4 4.6 25 4v24.2c0 12.3-9.3 21.6-25 29.3C16.3 53.3 7 44 7 31.7V7.5c7.6.6 15.8-.7 25-4Z"
        fill="url(#lg-em)"
        fillOpacity="0.16"
        stroke="url(#lg-em)"
        strokeWidth="2"
      />
      <path
        d="M32 13.5c-6.4 3.1-11.6 4.3-16.5 4.2v13.8c0 7.9 5.8 13.6 16.5 18.9 10.7-5.3 16.5-11 16.5-18.9V17.7c-4.9.1-10.1-1.1-16.5-4.2Z"
        fill="url(#lg-em)"
        fillOpacity="0.32"
        stroke="url(#lg-gold)"
        strokeWidth="1.4"
      />
      <path
        d="M32 21.5c2.6 2 5 3 8 3.4v4.4c0 1.6-.3 3-1 4.4l-7 8.9-7-8.9c-.7-1.4-1-2.8-1-4.4v-4.4c3-.4 5.4-1.4 8-3.4Z"
        fill="url(#lg-gold)"
        fillOpacity="0.9"
      />
      <circle cx="32" cy="30.5" r="2.6" fill="#062019" fillOpacity="0.55" />
      <path
        d="M32 8.2l1.7 3.1 3.4.6-2.4 2.5.5 3.5-3.2-1.6-3.2 1.6.5-3.5-2.4-2.5 3.4-.6L32 8.2Z"
        fill="#F7E3AE"
      />
      <path
        d="M13.5 44c2.6.6 4.6 2.2 5.8 4.6M50.5 44c-2.6.6-4.6 2.2-5.8 4.6"
        stroke="url(#lg-gold)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  )
}

export function LogoBadge({ size = 46 }: { size?: number }) {
  return (
    <span className="brand-logo" style={{ width: size, height: size }}>
      <LogoMark />
    </span>
  )
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    el.style.right = '-9999px'
    document.body.appendChild(el)
    el.select()
    el.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export function shareLinks(title: string, text: string) {
  const url = window.location.href
  const encoded = encodeURIComponent(`${title}\n${text}\n${url}`)
  return {
    whatsapp: `https://wa.me/?text=${encoded}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title}\n${text}`)}`,
    eitaa: `https://eitaa.com/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    sms: `sms:?&body=${encoded}`,
    canNative: typeof navigator !== 'undefined' && 'share' in navigator,
  }
}

export async function nativeShare(title: string, text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({ title, text, url: window.location.href })
      return true
    } catch {
      return false
    }
  }
  return false
}

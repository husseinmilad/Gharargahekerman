import { toFa } from './jalali'

export { toFa }

export function formatNumber(n: number): string {
  return toFa(new Intl.NumberFormat('en-US').format(Math.round(n)))
}

export function formatToman(n: number): string {
  return `${formatNumber(n)} تومان`
}

export function formatRial(n: number): string {
  return `${formatNumber(n * 10)} ریال`
}

/** ۵۰۰ هزار، ۱ میلیون ... برای دکمه‌های مبلغ */
export function compactToman(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `${formatNumber(m % 1 === 0 ? m : Number(m.toFixed(1)))} میلیون`
  }
  if (n >= 1000) {
    const k = n / 1000
    return `${formatNumber(k % 1 === 0 ? k : Number(k.toFixed(1)))} هزار`
  }
  return formatNumber(n)
}

export function maskCard(card: string): string {
  const digits = card.replace(/\D/g, '')
  if (digits.length < 16) return card
  return toFa(`${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`)
}

export function normalizeCard(card: string): string {
  return card.replace(/\D/g, '').replace(/(.{4})/g, '$1-').replace(/-$/, '')
}

export function normalizeSheba(sheba: string): string {
  const clean = sheba.replace(/\s/g, '').toUpperCase()
  return clean.startsWith('IR') ? clean : `IR${clean.replace(/^IR/i, '')}`
}

export function groupSheba(sheba: string): string {
  return sheba.replace(/(.{4})/g, '$1 ').trim()
}

export function truncate(text: string, len: number): string {
  if (text.length <= len) return text
  return `${text.slice(0, len).trim()}…`
}

export function pluralizeFa(count: number, word: string): string {
  return `${toFa(count)} ${word}`
}

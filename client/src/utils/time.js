// SQLite stores dates as "YYYY-MM-DD HH:MM:SS", in UTC and without a timezone
export const parseDbDate = (s) => new Date(s.replace(' ', 'T') + 'Z')

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'always' })

// "just now", "5 minutes ago", "3 hours ago", "2 days ago", then a plain date
export function timeAgo(s, now = Date.now()) {
  const date = parseDbDate(s)
  const seconds = Math.round((now - date.getTime()) / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return relative.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return relative.format(-hours, 'hour')
  const days = Math.round(hours / 24)
  if (days < 7) return relative.format(-days, 'day')
  return date.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Exact date, shown as a tooltip
export const fullDate = (s) =>
  parseDbDate(s).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })

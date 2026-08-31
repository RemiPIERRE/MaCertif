const DAY_MS = 24 * 60 * 60 * 1000

export function formatCountdown(dateStr: string): string {
  if (!dateStr) return ''
  const target = new Date(dateStr)
  if (Number.isNaN(target.getTime())) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((target.getTime() - today.getTime()) / DAY_MS)

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays < 0) {
    const days = Math.abs(diffDays)
    return days === 1 ? 'Il y a 1 jour' : `Il y a ${days} jours`
  }
  if (diffDays < 14) {
    return diffDays === 1 ? 'Dans 1 jour' : `Dans ${diffDays} jours`
  }
  const weeks = Math.round(diffDays / 7)
  return `Dans ${weeks} semaines`
}

export function isPast(dateStr: string): boolean {
  if (!dateStr) return false
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return target.getTime() < today.getTime()
}

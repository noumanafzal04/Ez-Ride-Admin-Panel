const pad = (n) => String(n).padStart(2, '0')
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Compute { from, to } (YYYY-MM-DD) for a named preset.
export const rangeFromPreset = (key) => {
  const to = new Date()
  const from = new Date()
  switch (key) {
    case 'today': break
    case '7d': from.setDate(to.getDate() - 6); break
    case '30d': from.setDate(to.getDate() - 29); break
    case 'month': from.setDate(1); break          // month-to-date
    case 'year': from.setMonth(0, 1); break        // year-to-date
    default: from.setDate(to.getDate() - 29)
  }
  return { from: ymd(from), to: ymd(to) }
}

// Re-export useCurrency from the context (shared global state)
export { useCurrency, TO_DZD, type Currency, CURRENCY_SYMBOLS } from '../context/CurrencyContext'

export function saveUnitPrice(productId: number, price: string) {
  if (price && !isNaN(parseFloat(price)) && parseFloat(price) > 0) {
    localStorage.setItem(`unitprice_${productId}`, price)
  } else {
    localStorage.removeItem(`unitprice_${productId}`)
  }
}

export function calcEOQ(avgDailySales: number, leadTimeDays: number, safetyStock: number): number {
  if (avgDailySales <= 0) return Math.max(safetyStock * 2, 10)
  const base = Math.ceil(avgDailySales * leadTimeDays * 2)
  return Math.max(safetyStock, base)
}

type HolidayKey =
  | 'sim_ramadan_tag' | 'sim_aid_fitr_tag' | 'sim_aid_adha_tag'
  | 'sim_independence_tag' | 'sim_revolution_tag' | 'sim_labor_tag'
  | 'sim_new_year_tag' | 'sim_sovereignty_tag'

export function getAlgerianHolidays(horizonDays: number): HolidayKey[] {
  const now = new Date()
  const end = new Date(now.getTime() + horizonDays * 86400000)
  const found: HolidayKey[] = []

  function overlaps(start: Date, finish: Date): boolean {
    return start <= end && finish >= now
  }

  const fixed: { month: number; day: number; key: HolidayKey }[] = [
    { month: 1, day: 1, key: 'sim_new_year_tag' },
    { month: 5, day: 1, key: 'sim_labor_tag' },
    { month: 6, day: 19, key: 'sim_sovereignty_tag' },
    { month: 7, day: 5, key: 'sim_independence_tag' },
    { month: 11, day: 1, key: 'sim_revolution_tag' },
  ]
  for (const h of fixed) {
    for (const yr of [now.getFullYear(), now.getFullYear() + 1]) {
      const d = new Date(yr, h.month - 1, h.day)
      if (overlaps(d, d) && !found.includes(h.key)) found.push(h.key)
    }
  }

  const islamic: { start: Date; end: Date; key: HolidayKey }[] = [
    { start: new Date(2025, 2, 1),  end: new Date(2025, 2, 29), key: 'sim_ramadan_tag' },
    { start: new Date(2025, 2, 30), end: new Date(2025, 3, 1),  key: 'sim_aid_fitr_tag' },
    { start: new Date(2025, 5, 7),  end: new Date(2025, 5, 9),  key: 'sim_aid_adha_tag' },
    { start: new Date(2026, 1, 18), end: new Date(2026, 2, 18), key: 'sim_ramadan_tag' },
    { start: new Date(2026, 2, 19), end: new Date(2026, 2, 21), key: 'sim_aid_fitr_tag' },
    { start: new Date(2026, 4, 27), end: new Date(2026, 4, 29), key: 'sim_aid_adha_tag' },
    { start: new Date(2027, 2, 8),  end: new Date(2027, 3, 5),  key: 'sim_ramadan_tag' },
    { start: new Date(2027, 3, 6),  end: new Date(2027, 3, 8),  key: 'sim_aid_fitr_tag' },
  ]
  for (const p of islamic) {
    if (overlaps(p.start, p.end) && !found.includes(p.key)) found.push(p.key)
  }

  return found
}

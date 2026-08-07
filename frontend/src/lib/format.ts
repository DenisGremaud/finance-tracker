const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
})

const currencyCompact = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
})

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export const MONTHS_LONG = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

export const MONTHS_SHORT = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
]

export function formatCurrency(value: string | number): string {
  return currency.format(Number(value))
}

/** Compact form ("1,2 k€") for axis labels where space is tight. */
export function formatCurrencyCompact(value: string | number): string {
  return currencyCompact.format(Number(value))
}

/** Takes an ISO date ("2026-08-05") and renders "05 août 2026". */
export function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number)
  return dateShort.format(new Date(year, month - 1, day))
}

export function monthLabel(month: number, short = true): string {
  return (short ? MONTHS_SHORT : MONTHS_LONG)[month - 1] ?? String(month)
}

/** Today as "YYYY-MM-DD" in local time (not UTC, which can be a day off). */
export function todayISO(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

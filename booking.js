const BRAND_NAME = 'Atuparking'
const MONTHLY_RATE_CENTS = 6000
const DAILY_RATE_CENTS = 200
const AVAILABILITY_WINDOW_DAYS = 90

function formatCurrency(amountCents) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountCents / 100)
}

function createUtcDate(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0))
}

function normalizeIsoDate(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())

  if (!match) {
    return ''
  }

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const date = createUtcDate(year, monthIndex, day)

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    return ''
  }

  return `${match[1]}-${match[2]}-${match[3]}`
}

function parseIsoDate(value) {
  const normalized = normalizeIsoDate(value)

  if (!normalized) {
    return null
  }

  const [year, month, day] = normalized.split('-').map(Number)
  return createUtcDate(year, month - 1, day)
}

function normalizeDateList(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return Array.from(
    new Set(
      values
        .map((value) => normalizeIsoDate(value))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right))
}

function addDays(date, amount) {
  const copy = new Date(date.getTime())
  copy.setUTCDate(copy.getUTCDate() + amount)
  return copy
}

function formatCalendarEntry(date, unavailableSet) {
  const iso = date.toISOString().slice(0, 10)

  return {
    iso,
    label: date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      timeZone: 'UTC',
    }),
    weekday: date.toLocaleDateString('es-ES', {
      weekday: 'short',
      timeZone: 'UTC',
    }),
    available: !unavailableSet.has(iso),
  }
}

function buildAvailabilityCalendar(unavailableDates = [], days = AVAILABILITY_WINDOW_DAYS, fromDate = new Date()) {
  const unavailableSet = new Set(normalizeDateList(unavailableDates))
  const today = createUtcDate(
    fromDate.getUTCFullYear(),
    fromDate.getUTCMonth(),
    fromDate.getUTCDate(),
  )

  return Array.from({ length: days }, (_, index) => formatCalendarEntry(addDays(today, index + 1), unavailableSet))
}

function buildAvailabilityPayload(unavailableDates = [], days = AVAILABILITY_WINDOW_DAYS, fromDate = new Date()) {
  const calendar = buildAvailabilityCalendar(unavailableDates, days, fromDate)

  return {
    calendar,
    availableDates: calendar.filter((entry) => entry.available),
    unavailableDates: normalizeDateList(unavailableDates),
  }
}

function calculateFirstMonthCharge(startDateIso) {
  const startDate = parseIsoDate(startDateIso)

  if (!startDate) {
    return null
  }

  const year = startDate.getUTCFullYear()
  const monthIndex = startDate.getUTCMonth()
  const day = startDate.getUTCDate()
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0, 12, 0, 0)).getUTCDate()
  const daysRemaining = daysInMonth - day + 1
  const amountCents = daysRemaining * DAILY_RATE_CENTS
  const nextBillingDate = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0))

  return {
    startDateIso: startDate.toISOString().slice(0, 10),
    daysInMonth,
    daysRemaining,
    amountCents,
    amountLabel: formatCurrency(amountCents),
    dailyRateCents: DAILY_RATE_CENTS,
    dailyRateLabel: formatCurrency(DAILY_RATE_CENTS),
    monthlyRateCents: MONTHLY_RATE_CENTS,
    monthlyRateLabel: formatCurrency(MONTHLY_RATE_CENTS),
    nextBillingDateIso: nextBillingDate.toISOString().slice(0, 10),
    nextBillingDateLabel: nextBillingDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    nextBillingAnchorUnix: Math.floor(nextBillingDate.getTime() / 1000),
  }
}

export {
  AVAILABILITY_WINDOW_DAYS,
  BRAND_NAME,
  DAILY_RATE_CENTS,
  MONTHLY_RATE_CENTS,
  buildAvailabilityCalendar,
  buildAvailabilityPayload,
  calculateFirstMonthCharge,
  formatCurrency,
  normalizeDateList,
  normalizeIsoDate,
  parseIsoDate,
}
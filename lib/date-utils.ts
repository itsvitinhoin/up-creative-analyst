export type PeriodPreset =
  | "today"
  | "yesterday"
  | "last7d"
  | "last14d"
  | "last30d"
  | "thisMonth"
  | "lastMonth"
  | "custom"

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  last7d: "Últimos 7 dias",
  last14d: "Últimos 14 dias",
  last30d: "Últimos 30 dias",
  thisMonth: "Este mês",
  lastMonth: "Mês passado",
  custom: "Personalizado",
}

export function presetToRange(
  preset: PeriodPreset,
  customFrom?: Date,
  customTo?: Date
): { from: Date; to: Date } {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  switch (preset) {
    case "today":
      return { from: todayStart, to: todayEnd }

    case "yesterday": {
      const from = new Date(todayStart)
      from.setDate(from.getDate() - 1)
      const to = new Date(from)
      to.setHours(23, 59, 59, 999)
      return { from, to }
    }

    case "last7d": {
      const from = new Date(todayStart)
      from.setDate(from.getDate() - 7)
      return { from, to: todayEnd }
    }

    case "last14d": {
      const from = new Date(todayStart)
      from.setDate(from.getDate() - 14)
      return { from, to: todayEnd }
    }

    case "last30d": {
      const from = new Date(todayStart)
      from.setDate(from.getDate() - 30)
      return { from, to: todayEnd }
    }

    case "thisMonth": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from, to: todayEnd }
    }

    case "lastMonth": {
      const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      const from = new Date(year, month, 1)
      const to = new Date(year, month + 1, 0, 23, 59, 59, 999)
      return { from, to }
    }

    case "custom":
      return {
        from: customFrom ?? todayStart,
        to: customTo ?? todayEnd,
      }
  }
}

/** Parse date_from/date_to from URL search params. Falls back to last 30 days. */
export function parseDateRange(searchParams: URLSearchParams): { from: Date; to: Date } {
  const preset = (searchParams.get("period") ?? "last30d") as PeriodPreset
  if (preset === "custom") {
    const from = searchParams.get("date_from")
    const to = searchParams.get("date_to")
    return presetToRange("custom", from ? new Date(from) : undefined, to ? new Date(to) : undefined)
  }
  return presetToRange(preset)
}

"use client"

import { ChevronDown } from "lucide-react"
import { PERIOD_LABELS, type PeriodPreset } from "@/lib/date-utils"

const PRESETS: PeriodPreset[] = [
  "today",
  "yesterday",
  "last7d",
  "last14d",
  "last30d",
  "thisMonth",
  "lastMonth",
]

interface PeriodFilterProps {
  value: PeriodPreset
  onChange: (preset: PeriodPreset) => void
  className?: string
}

export function PeriodFilter({ value, onChange, className }: PeriodFilterProps) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PeriodPreset)}
        className="h-9 appearance-none rounded-md border border-border bg-card pl-3 pr-8 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {PRESETS.map((preset) => (
          <option key={preset} value={preset}>
            {PERIOD_LABELS[preset]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

"use client"

import { Grid3X3, List, ChevronDown, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreativeStatus, CreativeType } from "@/lib/types"

interface FilterBarProps {
  viewMode: "grid" | "table"
  onViewModeChange: (mode: "grid" | "table") => void
  statusFilter: CreativeStatus | "all"
  onStatusFilterChange: (status: CreativeStatus | "all") => void
  typeFilter: CreativeType | "all"
  onTypeFilterChange: (type: CreativeType | "all") => void
  sortBy: string
  onSortByChange: (sort: string) => void
  sortOrder: "asc" | "desc"
  onSortOrderChange: (order: "asc" | "desc") => void
}

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "paused", label: "Pausados" },
  { value: "mixed", label: "Misto" },
]

const typeOptions = [
  { value: "all", label: "Todos" },
  { value: "image", label: "Imagem" },
  { value: "video", label: "Vídeo" },
]

const sortOptions = [
  { value: "spend", label: "Investimento" },
  { value: "ctr", label: "CTR" },
  { value: "cpc", label: "CPC" },
  { value: "cpm", label: "CPM" },
  { value: "purchases", label: "Compras" },
  { value: "cpa", label: "CPA" },
  { value: "roas", label: "ROAS" },
]

export function FilterBar({
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
      <div className="flex items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="flex rounded-md border border-border bg-card p-0.5">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() =>
                onStatusFilterChange(option.value as CreativeStatus | "all")
              }
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === option.value
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) =>
              onTypeFilterChange(e.target.value as CreativeType | "all")
            }
            className="h-8 appearance-none rounded-md border border-border bg-card pl-3 pr-8 text-xs font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ordenar por:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="h-8 appearance-none rounded-md border border-border bg-card pl-3 pr-8 text-xs font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>
          <button
            onClick={() =>
              onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")
            }
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-md border border-border bg-card p-0.5">
          <button
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded transition-colors",
              viewMode === "grid"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange("table")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded transition-colors",
              viewMode === "table"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

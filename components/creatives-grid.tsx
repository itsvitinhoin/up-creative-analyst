"use client"

import { CreativeCard } from "./creative-card"
import type { Creative } from "@/lib/types"

interface CreativesGridProps {
  creatives: Creative[]
  onCreativeClick: (creative: Creative) => void
}

export function CreativesGrid({
  creatives,
  onCreativeClick,
}: CreativesGridProps) {
  if (creatives.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          Nenhum criativo encontrado
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {creatives.map((creative) => (
        <CreativeCard
          key={creative.id}
          creative={creative}
          onClick={() => onCreativeClick(creative)}
        />
      ))}
    </div>
  )
}

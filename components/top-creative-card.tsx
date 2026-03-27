"use client"

import { PlayCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface TopCreativeCardProps {
  rank: number
  name: string
  clientName: string
  thumbnail: string
  type: "image" | "video"
  roas: number
  spend: number
  purchases: number
  improvement: number
}

export function TopCreativeCard({
  rank,
  name,
  clientName,
  thumbnail,
  type,
  roas,
  spend,
  purchases,
  improvement,
}: TopCreativeCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:border-muted-foreground/30">
      {/* Thumbnail */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={thumbnail}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Rank Badge */}
        <div className="absolute left-3 top-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
              rank === 1
                ? "bg-amber-500 text-amber-950"
                : rank === 2
                ? "bg-zinc-300 text-zinc-800"
                : rank === 3
                ? "bg-amber-700 text-amber-100"
                : "bg-accent text-foreground"
            )}
          >
            {rank}
          </div>
        </div>

        {/* Type Badge */}
        {type === "video" && (
          <div className="absolute right-3 top-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
              <PlayCircle className="h-4 w-4 text-white" />
            </div>
          </div>
        )}

        {/* Improvement Badge */}
        <div className="absolute bottom-3 right-3">
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <TrendingUp className="h-3 w-3" />
            +{improvement}%
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground">{clientName}</p>
        <h3 className="mt-0.5 truncate font-medium text-foreground">{name}</h3>

        {/* Metrics */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <p className="text-xs text-muted-foreground">ROAS</p>
            <p className="text-sm font-medium text-foreground">{roas.toFixed(2)}x</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Invest.</p>
            <p className="text-sm font-medium text-foreground">{formatCurrency(spend)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Compras</p>
            <p className="text-sm font-medium text-foreground">{purchases}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

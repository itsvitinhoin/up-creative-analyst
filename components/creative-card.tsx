"use client"

import { Play, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Creative } from "@/lib/types"

interface CreativeCardProps {
  creative: Creative
  onClick: () => void
}

function StatusBadge({ status }: { status: Creative["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        status === "active" && "bg-emerald-500/10 text-emerald-400",
        status === "paused" && "bg-amber-500/10 text-amber-400",
        status === "mixed" && "bg-blue-500/10 text-blue-400"
      )}
    >
      {status === "active" && "Ativo"}
      {status === "paused" && "Pausado"}
      {status === "mixed" && "Misto"}
    </span>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function CreativeCard({ creative, onClick }: CreativeCardProps) {
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:border-muted-foreground/30 hover:shadow-lg hover:shadow-background/50"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={creative.thumbnail}
          alt={creative.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Type Badge */}
        <div className="absolute left-2 top-2">
          <span className="inline-flex items-center gap-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground backdrop-blur-sm">
            {creative.type === "video" ? (
              <>
                <Play className="h-2.5 w-2.5" />
                Vídeo
              </>
            ) : (
              <>
                <ImageIcon className="h-2.5 w-2.5" />
                Imagem
              </>
            )}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute right-2 top-2">
          <StatusBadge status={creative.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="mb-3 truncate text-sm font-medium text-foreground">
          {creative.name}
        </h3>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Invest.
            </p>
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(creative.spend)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              ROAS
            </p>
            <p className="text-sm font-medium text-foreground">
              {creative.roas.toFixed(2)}x
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Compras
            </p>
            <p className="text-sm font-medium text-foreground">
              {creative.purchases}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

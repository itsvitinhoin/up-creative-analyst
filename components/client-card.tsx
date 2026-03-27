"use client"

import { TrendingUp, TrendingDown, Image, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Client } from "@/lib/types"

interface ClientCardProps {
  client: Client
  onClick?: () => void
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value)
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-lg border border-border bg-card p-6 transition-all duration-200",
        "hover:border-muted-foreground/30 hover:bg-accent/50",
        onClick && "cursor-pointer"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">{client.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-1.5 w-1.5 rounded-full",
                client.status === "active" ? "bg-emerald-500" : "bg-muted-foreground"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {client.status === "active" ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Image className="h-3 w-3" />
          <span>{client.activeCreatives}</span>
          <span className="mx-1 text-border">/</span>
          <span>{client.creativesCount}</span>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Investimento</p>
          <p className="mt-1 text-xl font-medium text-foreground">
            {formatCurrency(client.spend)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">ROAS</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xl font-medium text-foreground">{client.roas.toFixed(2)}x</p>
            {client.roas >= 4 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : client.roas < 3 ? (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            ) : null}
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Compras</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {formatNumber(client.purchases)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">CPA</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {formatCurrency(client.cpa)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">CTR</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {client.ctr.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Top Performer */}
      {client.topPerformer && (
        <div className="mt-4 rounded-md bg-accent/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Top criativo</p>
          <p className="mt-0.5 truncate text-sm text-foreground">{client.topPerformer}</p>
        </div>
      )}
    </div>
  )
}

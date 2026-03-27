"use client"

import { AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, Image, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Insight } from "@/lib/types"

interface InsightCardProps {
  insight: Insight
}

export function InsightCard({ insight }: InsightCardProps) {
  const getTypeStyles = () => {
    switch (insight.type) {
      case "warning":
        return {
          icon: AlertTriangle,
          bgColor: "bg-amber-500/10",
          iconColor: "text-amber-500",
          borderColor: "border-amber-500/20",
        }
      case "success":
        return {
          icon: CheckCircle,
          bgColor: "bg-emerald-500/10",
          iconColor: "text-emerald-500",
          borderColor: "border-emerald-500/20",
        }
      case "info":
      default:
        return {
          icon: Info,
          bgColor: "bg-blue-500/10",
          iconColor: "text-blue-500",
          borderColor: "border-blue-500/20",
        }
    }
  }

  const getCategoryLabel = () => {
    switch (insight.category) {
      case "performance":
        return "Performance"
      case "budget":
        return "Orçamento"
      case "creative":
        return "Criativo"
      case "audience":
        return "Audiência"
      default:
        return insight.category
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })
  }

  const { icon: TypeIcon, bgColor, iconColor, borderColor } = getTypeStyles()

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-all duration-200 hover:bg-accent/30",
        borderColor
      )}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
            bgColor
          )}
        >
          <TypeIcon className={cn("h-5 w-5", iconColor)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {getCategoryLabel()}
                </span>
                <span className="text-xs text-muted-foreground/50">•</span>
                <span className="text-xs text-muted-foreground">{insight.clientName}</span>
              </div>
              <h3 className="mt-1 font-medium text-foreground">{insight.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
            </div>

            {/* Metric Badge */}
            {insight.value !== undefined && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-medium text-foreground">
                    {insight.metric === "ROAS"
                      ? `${insight.value.toFixed(2)}x`
                      : insight.metric === "CTR" || insight.metric === "Budget"
                      ? `${insight.value}%`
                      : insight.metric === "CPA"
                      ? `R$ ${insight.value.toFixed(2)}`
                      : insight.value}
                  </span>
                  {insight.comparison !== undefined && insight.comparison !== 0 && (
                    insight.comparison > 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    )
                  )}
                </div>
                {insight.comparison !== undefined && insight.comparison !== 0 && (
                  <span
                    className={cn(
                      "text-xs",
                      insight.comparison > 0 ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    {insight.comparison > 0 ? "+" : ""}
                    {insight.comparison}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Creative Preview */}
          {insight.creativeThumbnail && (
            <div className="mt-3 flex items-center gap-3 rounded-md bg-accent/50 p-2">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
                <img
                  src={insight.creativeThumbnail}
                  alt={insight.creativeName || "Creative"}
                  className="h-full w-full object-cover"
                />
                {insight.creativeType === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <PlayCircle className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {insight.creativeName}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {insight.creativeType === "video" ? (
                    <PlayCircle className="h-3 w-3" />
                  ) : (
                    <Image className="h-3 w-3" />
                  )}
                  <span>{insight.creativeType === "video" ? "Vídeo" : "Imagem"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{formatDate(insight.date)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

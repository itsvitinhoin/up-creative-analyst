"use client"

import { Play, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Creative } from "@/lib/types"

interface CreativeTableProps {
  creatives: Creative[]
  onCreativeClick: (creative: Creative) => void
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

export function CreativeTable({
  creatives,
  onCreativeClick,
}: CreativeTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-card">
            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Criativo
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Invest.
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              CTR
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              CPC
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Compras
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              CPA
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              ROAS
            </th>
          </tr>
        </thead>
        <tbody>
          {creatives.map((creative) => (
            <tr
              key={creative.id}
              onClick={() => onCreativeClick(creative)}
              className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent/50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                    <img
                      src={creative.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {creative.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {creative.type === "video" ? (
                    <>
                      <Play className="h-3 w-3" />
                      Vídeo
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-3 w-3" />
                      Imagem
                    </>
                  )}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={creative.status} />
              </td>
              <td className="px-4 py-3 text-right text-sm text-foreground">
                {formatCurrency(creative.spend)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-foreground">
                {creative.ctr.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-right text-sm text-foreground">
                {formatCurrency(creative.cpc)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-foreground">
                {creative.purchases}
              </td>
              <td className="px-4 py-3 text-right text-sm text-foreground">
                {formatCurrency(creative.cpa)}
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                {creative.roas.toFixed(2)}x
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

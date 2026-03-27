"use client"

import { X, Play, ImageIcon, Calendar, Layers, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Creative } from "@/lib/types"

interface CreativeModalProps {
  creative: Creative | null
  onClose: () => void
}

function StatusBadge({ status }: { status: Creative["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 text-xs font-medium uppercase tracking-wide",
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function CreativeModal({ creative, onClose }: CreativeModalProps) {
  if (!creative) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Left - Preview */}
        <div className="relative flex w-1/2 items-center justify-center bg-muted/50 p-8">
          <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-lg shadow-lg">
            <img
              src={creative.thumbnail}
              alt={creative.name}
              className="h-full w-full object-cover"
            />
            {creative.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground/90">
                  <Play className="h-6 w-6 text-background" fill="currentColor" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right - Details */}
        <div className="flex w-1/2 flex-col overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
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
                <StatusBadge status={creative.status} />
              </div>
              <h2 className="text-xl font-medium text-foreground">
                {creative.name}
              </h2>
            </div>

            {/* Metrics Grid */}
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Métricas
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-background/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Investimento
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    {formatCurrency(creative.spend)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Impressões
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    {formatNumber(creative.impressions)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    CTR
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    {creative.ctr.toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    CPC
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    {formatCurrency(creative.cpc)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Compras
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    {creative.purchases}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    CPA
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    {formatCurrency(creative.cpa)}
                  </p>
                </div>
                <div className="col-span-2 rounded-lg border border-border bg-accent/30 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    ROAS
                  </p>
                  <p className="text-2xl font-medium text-foreground">
                    {creative.roas.toFixed(2)}x
                  </p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Informações
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Primeira vez:</span>
                  <span className="text-foreground">
                    {formatDate(creative.firstSeen)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Última vez:</span>
                  <span className="text-foreground">
                    {formatDate(creative.lastSeen)}
                  </span>
                </div>
              </div>
            </div>

            {/* Campaigns */}
            <div className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Campanhas vinculadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {creative.campaigns.map((campaign) => (
                  <span
                    key={campaign}
                    className="rounded-md border border-border bg-background/50 px-2 py-1 text-xs text-foreground"
                  >
                    {campaign}
                  </span>
                ))}
              </div>
            </div>

            {/* Ads */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                Anúncios vinculados
              </h3>
              <div className="flex flex-wrap gap-2">
                {creative.ads.map((ad) => (
                  <span
                    key={ad}
                    className="rounded-md border border-border bg-background/50 px-2 py-1 text-xs text-foreground"
                  >
                    {ad}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

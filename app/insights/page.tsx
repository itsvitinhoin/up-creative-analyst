"use client"

import { useState, useMemo, useEffect } from "react"
import { AlertTriangle, CheckCircle, Info, Image, PlayCircle } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { InsightCard } from "@/components/insight-card"
import { TopCreativeCard } from "@/components/top-creative-card"
import { cn } from "@/lib/utils"
import type { Insight } from "@/lib/types"
import type { InsightsResponse, TopCreativeItem } from "@/app/api/insights/route"

type InsightFilter = "all" | "warning" | "success" | "info"
type CreativeTypeFilter = "all" | "image" | "video"

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [topCreatives, setTopCreatives] = useState<TopCreativeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [insightFilter, setInsightFilter] = useState<InsightFilter>("all")
  const [creativeTypeFilter, setCreativeTypeFilter] = useState<CreativeTypeFilter>("all")

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((data: InsightsResponse) => {
        setInsights(data.insights ?? [])
        setTopCreatives(data.topCreatives ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredInsights = useMemo(() => {
    if (insightFilter === "all") return insights
    return insights.filter((insight) => insight.type === insightFilter)
  }, [insightFilter, insights])

  const filteredTopCreatives = useMemo(() => {
    if (creativeTypeFilter === "all") return topCreatives
    return topCreatives.filter((creative) => creative.type === creativeTypeFilter)
  }, [creativeTypeFilter, topCreatives])

  const insightCounts = useMemo(() => {
    return {
      all: insights.length,
      warning: insights.filter((i) => i.type === "warning").length,
      success: insights.filter((i) => i.type === "success").length,
      info: insights.filter((i) => i.type === "info").length,
    }
  }, [insights])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-6">
            <div>
              <h1 className="text-lg font-medium text-foreground">Insights</h1>
              <p className="text-sm text-muted-foreground">
                Alertas e melhores criativos de todos os clientes
              </p>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Top Creatives Section */}
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-foreground">Melhores Criativos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Top performers de todos os clientes baseado em ROAS
                </p>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCreativeTypeFilter("all")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    creativeTypeFilter === "all"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  Todos
                </button>
                <button
                  onClick={() => setCreativeTypeFilter("image")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    creativeTypeFilter === "image"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Image className="h-3.5 w-3.5" />
                  Imagens
                </button>
                <button
                  onClick={() => setCreativeTypeFilter("video")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    creativeTypeFilter === "video"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Vídeos
                </button>
              </div>
            </div>

            {/* Top Creatives Grid */}
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-6 gap-4">
                  {filteredTopCreatives.map((creative, index) => (
                    <TopCreativeCard
                      key={creative.id}
                      rank={index + 1}
                      name={creative.name}
                      clientName={creative.clientName}
                      thumbnail={creative.thumbnail}
                      type={creative.type}
                      roas={creative.roas}
                      spend={creative.spend}
                      purchases={creative.purchases}
                      improvement={creative.improvement}
                    />
                  ))}
                </div>

                {filteredTopCreatives.length === 0 && (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
                    <p className="text-muted-foreground">Nenhum criativo encontrado</p>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Insights Section */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-foreground">Alertas e Insights</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Acompanhe as principais ocorrências das suas contas
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInsightFilter("all")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    insightFilter === "all"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  Todos
                  <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                    {insightCounts.all}
                  </span>
                </button>
                <button
                  onClick={() => setInsightFilter("warning")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    insightFilter === "warning"
                      ? "bg-amber-500/10 text-amber-500"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Alertas
                  <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                    {insightCounts.warning}
                  </span>
                </button>
                <button
                  onClick={() => setInsightFilter("success")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    insightFilter === "success"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Sucessos
                  <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                    {insightCounts.success}
                  </span>
                </button>
                <button
                  onClick={() => setInsightFilter("info")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    insightFilter === "info"
                      ? "bg-blue-500/10 text-blue-500"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Info className="h-3.5 w-3.5" />
                  Info
                  <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                    {insightCounts.info}
                  </span>
                </button>
              </div>
            </div>

            {/* Insights List */}
            <div className="flex flex-col gap-3">
              {filteredInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>

            {!loading && filteredInsights.length === 0 && (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground">Nenhum insight encontrado</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

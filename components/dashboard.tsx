"use client"

import { useMemo } from "react"
import Link from "next/link"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Image, 
  DollarSign, 
  ShoppingBag, 
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { Sidebar } from "./sidebar"
import { ClientCard } from "./client-card"
import { InsightCard } from "./insight-card"
import { TopCreativeCard } from "./top-creative-card"
import { clients, insights, topCreatives } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function Dashboard() {
  // Calculate totals
  const totals = useMemo(() => {
    return clients.reduce(
      (acc, client) => ({
        spend: acc.spend + client.spend,
        purchases: acc.purchases + client.purchases,
        impressions: acc.impressions + client.impressions,
        clicks: acc.clicks + client.clicks,
        creativesCount: acc.creativesCount + client.creativesCount,
        activeCreatives: acc.activeCreatives + client.activeCreatives,
      }),
      { spend: 0, purchases: 0, impressions: 0, clicks: 0, creativesCount: 0, activeCreatives: 0 }
    )
  }, [])

  const avgRoas = useMemo(() => {
    const totalRoas = clients.reduce((acc, client) => acc + client.roas, 0)
    return totalRoas / clients.length
  }, [])

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

  const recentInsights = insights.slice(0, 3)
  const topThreeCreatives = topCreatives.slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-6">
            <div>
              <h1 className="text-lg font-medium text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Visão geral de todos os clientes
              </p>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Summary Stats */}
          <div className="mb-8 grid grid-cols-5 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Users className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                  <p className="text-2xl font-medium text-foreground">
                    {clients.filter((c) => c.status === "active").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <DollarSign className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Investimento</p>
                  <p className="text-2xl font-medium text-foreground">
                    {formatCurrency(totals.spend)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <ShoppingBag className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Compras</p>
                  <p className="text-2xl font-medium text-foreground">
                    {formatNumber(totals.purchases)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <TrendingUp className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROAS Médio</p>
                  <p className="text-2xl font-medium text-foreground">
                    {avgRoas.toFixed(2)}x
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Image className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criativos Ativos</p>
                  <p className="text-2xl font-medium text-foreground">
                    {totals.activeCreatives}
                    <span className="ml-1 text-sm text-muted-foreground">
                      / {totals.creativesCount}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Clients */}
            <div className="col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-foreground">Clientes</h2>
                <Link
                  href="/clientes"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  Ver todos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {clients.slice(0, 4).map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>
            </div>

            {/* Right Column - Insights */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-foreground">Insights Recentes</h2>
                <Link
                  href="/insights"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  Ver todos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {recentInsights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
          </div>

          {/* Top Creatives Section */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">Top Criativos</h2>
              <Link
                href="/insights"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Ver ranking completo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {topThreeCreatives.map((creative, index) => (
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
          </div>
        </main>
      </div>
    </div>
  )
}

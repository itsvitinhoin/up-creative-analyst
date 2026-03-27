"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { ClientCard } from "@/components/client-card"
import type { Client } from "@/lib/types"

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data: Client[]) => setClients(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients
    return clients.filter((client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, clients])

  const totals = useMemo(() => {
    return clients.reduce(
      (acc, client) => ({
        spend: acc.spend + client.spend,
        purchases: acc.purchases + client.purchases,
        impressions: acc.impressions + client.impressions,
        clicks: acc.clicks + client.clicks,
      }),
      { spend: 0, purchases: 0, impressions: 0, clicks: 0 }
    )
  }, [clients])

  const avgRoas = useMemo(() => {
    if (clients.length === 0) return 0
    const totalRoas = clients.reduce((acc, client) => acc + client.roas, 0)
    return totalRoas / clients.length
  }, [clients])

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
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-lg font-medium text-foreground">Clientes</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie seus clientes e visualize KPIs
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-4 gap-4">
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
                  <p className="text-sm text-muted-foreground">Investimento Total</p>
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
                  <p className="text-sm text-muted-foreground">Compras Totais</p>
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
          </div>

          {/* Section Title */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              {loading
                ? "Carregando..."
                : `${filteredClients.length} cliente${filteredClients.length !== 1 ? "s" : ""}`}
            </h2>
          </div>

          {/* Clients Grid */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {filteredClients.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>

              {filteredClients.length === 0 && (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

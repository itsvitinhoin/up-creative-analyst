"use client"

import { useState, useMemo, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { FilterBar } from "@/components/filter-bar"
import { CreativesGrid } from "@/components/creatives-grid"
import { CreativeTable } from "@/components/creative-table"
import { CreativeModal } from "@/components/creative-modal"
import { type PeriodPreset } from "@/lib/date-utils"
import type { Client, AdAccount, Creative, CreativeStatus, CreativeType } from "@/lib/types"

export default function CriativosPage() {
  // Data state
  const [clients, setClients] = useState<Client[]>([])
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [loadingCreatives, setLoadingCreatives] = useState(false)

  // Selection state — null means "all"
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedAdAccount, setSelectedAdAccount] = useState<AdAccount | null>(null)

  // Period state
  const [period, setPeriod] = useState<PeriodPreset>("last30d")

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // Filter state
  const [statusFilter, setStatusFilter] = useState<CreativeStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<CreativeType | "all">("all")

  // Sort state
  const [sortBy, setSortBy] = useState("spend")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Modal state
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null)

  // Load clients on mount
  useEffect(() => {
    fetch("/api/clients?all=true")
      .then((r) => r.json())
      .then((data: Client[]) => setClients(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [])

  // Load all ad accounts when clients load (to populate account selector)
  useEffect(() => {
    if (clients.length === 0) return
    Promise.all(
      clients.map((c) =>
        fetch(`/api/clients/${c.id}/ad-accounts`)
          .then((r) => r.json())
          .then((data: AdAccount[]) => data)
          .catch(() => [] as AdAccount[])
      )
    ).then((results) => {
      setAdAccounts(results.flat())
    })
  }, [clients])

  // Reset account selection when client changes
  const handleClientChange = (client: Client | null) => {
    setSelectedClient(client)
    setSelectedAdAccount(null)
  }

  // Load creatives when selection, period, or filters change
  useEffect(() => {
    setLoadingCreatives(true)

    const params = new URLSearchParams({
      period,
      sort_by: sortBy,
      order: sortOrder,
      ...(selectedClient ? { client_id: selectedClient.id } : {}),
      ...(selectedAdAccount ? { account_id: selectedAdAccount.id } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
    })

    fetch(`/api/creatives?${params}`)
      .then((r) => r.json())
      .then((data: Creative[]) => setCreatives(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingCreatives(false))
  }, [selectedClient, selectedAdAccount, period, statusFilter, typeFilter, sortBy, sortOrder])

  const filteredCreatives = useMemo(() => creatives, [creatives])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="pl-64">
        <TopBar
          clients={clients}
          adAccounts={adAccounts}
          selectedClient={selectedClient}
          selectedAdAccount={selectedAdAccount}
          onClientChange={handleClientChange}
          onAdAccountChange={setSelectedAdAccount}
          period={period}
          onPeriodChange={setPeriod}
        />

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              Criativos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Analise a performance dos seus criativos de Meta Ads
            </p>
          </div>

          <FilterBar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />

          <div className="mt-6">
            {loadingCreatives ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">Carregando criativos...</p>
              </div>
            ) : viewMode === "grid" ? (
              <CreativesGrid
                creatives={filteredCreatives}
                onCreativeClick={setSelectedCreative}
              />
            ) : (
              <CreativeTable
                creatives={filteredCreatives}
                onCreativeClick={setSelectedCreative}
              />
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {filteredCreatives.length} criativo{filteredCreatives.length !== 1 && "s"} encontrado{filteredCreatives.length !== 1 && "s"}
            </p>
          </div>
        </main>
      </div>

      <CreativeModal
        creative={selectedCreative}
        onClose={() => setSelectedCreative(null)}
      />
    </div>
  )
}

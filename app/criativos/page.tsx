"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
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

  // Pagination
  const PAGE_SIZE = 24
  const [page, setPage] = useState(1)

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
          .then((data: AdAccount[]) => Array.isArray(data) ? data : [])
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
    setPage(1)
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
      .then((data: Creative[]) => { setCreatives(Array.isArray(data) ? data : []); setPage(1) })
      .catch(console.error)
      .finally(() => setLoadingCreatives(false))
  }, [selectedClient, selectedAdAccount, period, statusFilter, typeFilter, sortBy, sortOrder])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(creatives.length / PAGE_SIZE)), [creatives.length])
  const pagedCreatives = useMemo(
    () => creatives.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [creatives, page]
  )

  const goToPage = useCallback((p: number) => setPage(Math.min(Math.max(1, p), totalPages)), [totalPages])

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
                creatives={pagedCreatives}
                onCreativeClick={setSelectedCreative}
              />
            ) : (
              <CreativeTable
                creatives={pagedCreatives}
                onCreativeClick={setSelectedCreative}
              />
            )}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {creatives.length} criativo{creatives.length !== 1 && "s"} —{" "}
              página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…")
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p as number)}
                      className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2 text-sm transition-colors ${
                        page === p
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
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

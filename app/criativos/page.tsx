"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { FilterBar } from "@/components/filter-bar"
import { CreativesGrid } from "@/components/creatives-grid"
import { CreativeTable } from "@/components/creative-table"
import { CreativeModal } from "@/components/creative-modal"
import { clients, adAccounts, creatives } from "@/lib/mock-data"
import type { Client, AdAccount, Creative, CreativeStatus, CreativeType } from "@/lib/types"

export default function CriativosPage() {
  // Selection state
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0])
  const [selectedAdAccount, setSelectedAdAccount] = useState<AdAccount | null>(adAccounts[0])

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

  // Handle client change
  const handleClientChange = (client: Client) => {
    setSelectedClient(client)
    const firstAccount = adAccounts.find((a) => a.clientId === client.id)
    setSelectedAdAccount(firstAccount || null)
  }

  // Filtered and sorted creatives
  const filteredCreatives = useMemo(() => {
    let filtered = [...creatives]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((c) => c.type === typeFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Creative] as number
      const bValue = b[sortBy as keyof Creative] as number
      return sortOrder === "desc" ? bValue - aValue : aValue - bValue
    })

    return filtered
  }, [statusFilter, typeFilter, sortBy, sortOrder])

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Bar */}
        <TopBar
          selectedClient={selectedClient}
          selectedAdAccount={selectedAdAccount}
          onClientChange={handleClientChange}
          onAdAccountChange={setSelectedAdAccount}
        />

        {/* Main Area */}
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              Criativos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Analise a performance dos seus criativos de Meta Ads
            </p>
          </div>

          {/* Filter Bar */}
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

          {/* Content */}
          <div className="mt-6">
            {viewMode === "grid" ? (
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

          {/* Stats Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {filteredCreatives.length} criativo{filteredCreatives.length !== 1 && "s"} encontrado{filteredCreatives.length !== 1 && "s"}
            </p>
          </div>
        </main>
      </div>

      {/* Modal */}
      <CreativeModal
        creative={selectedCreative}
        onClose={() => setSelectedCreative(null)}
      />
    </div>
  )
}

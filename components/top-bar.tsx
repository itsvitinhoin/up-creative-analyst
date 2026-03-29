"use client"

import { ChevronDown } from "lucide-react"
import { PeriodFilter } from "@/components/period-filter"
import { type PeriodPreset } from "@/lib/date-utils"
import type { Client, AdAccount } from "@/lib/types"

interface TopBarProps {
  clients: Client[]
  adAccounts: AdAccount[]
  selectedClient: Client | null
  selectedAdAccount: AdAccount | null
  onClientChange: (client: Client | null) => void
  onAdAccountChange: (account: AdAccount | null) => void
  period: PeriodPreset
  onPeriodChange: (period: PeriodPreset) => void
}

export function TopBar({
  clients,
  adAccounts,
  selectedClient,
  selectedAdAccount,
  onClientChange,
  onAdAccountChange,
  period,
  onPeriodChange,
}: TopBarProps) {
  const filteredAdAccounts = selectedClient
    ? adAccounts.filter((account) => account.clientId === selectedClient.id)
    : adAccounts

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        {/* Client Selector */}
        <div className="relative">
          <select
            value={selectedClient?.id || ""}
            onChange={(e) => {
              const val = e.target.value
              if (val === "") {
                onClientChange(null)
              } else {
                const client = clients.find((c) => c.id === val)
                if (client) onClientChange(client)
              }
            }}
            className="h-9 appearance-none rounded-md border border-border bg-card pl-3 pr-8 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos os Clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Ad Account Selector */}
        <div className="relative">
          <select
            value={selectedAdAccount?.id || ""}
            onChange={(e) => {
              const val = e.target.value
              if (val === "") {
                onAdAccountChange(null)
              } else {
                const account = filteredAdAccounts.find((a) => a.id === val)
                if (account) onAdAccountChange(account)
              }
            }}
            className="h-9 appearance-none rounded-md border border-border bg-card pl-3 pr-8 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todas as Contas</option>
            {filteredAdAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Period Filter */}
        <PeriodFilter value={period} onChange={onPeriodChange} />
      </div>

      {/* User Avatar */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-accent">
          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-foreground">
            UP
          </div>
        </div>
      </div>
    </header>
  )
}

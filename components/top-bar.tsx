"use client"

import { ChevronDown, Calendar } from "lucide-react"
import { clients, adAccounts } from "@/lib/mock-data"
import type { Client, AdAccount } from "@/lib/types"

interface TopBarProps {
  selectedClient: Client | null
  selectedAdAccount: AdAccount | null
  onClientChange: (client: Client) => void
  onAdAccountChange: (account: AdAccount) => void
}

export function TopBar({
  selectedClient,
  selectedAdAccount,
  onClientChange,
  onAdAccountChange,
}: TopBarProps) {
  const filteredAdAccounts = adAccounts.filter(
    (account) => account.clientId === selectedClient?.id
  )

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        {/* Client Selector */}
        <div className="relative">
          <select
            value={selectedClient?.id || ""}
            onChange={(e) => {
              const client = clients.find((c) => c.id === e.target.value)
              if (client) onClientChange(client)
            }}
            className="h-9 appearance-none rounded-md border border-border bg-card pl-3 pr-8 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="" disabled>
              Selecionar cliente
            </option>
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
              const account = adAccounts.find((a) => a.id === e.target.value)
              if (account) onAdAccountChange(account)
            }}
            disabled={!selectedClient}
            className="h-9 appearance-none rounded-md border border-border bg-card pl-3 pr-8 text-sm font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              Selecionar conta
            </option>
            {filteredAdAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Date Range */}
        <button className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Últimos 30 dias</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
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

"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, RefreshCw, ToggleLeft, ToggleRight, Loader2, Radar, Zap } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"
import type { ManagedAdAccount } from "@/app/api/meta/ad-accounts/route"

interface DiscoverBanner {
  total: number
  newAccounts: number
}

interface SyncBanner {
  synced: number
  total: number
  errors: string[]
}

export default function GerenciarPage() {
  const [accounts, setAccounts] = useState<ManagedAdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [syncing, setSyncing] = useState<string | null>(null) // account id being synced
  const [discovering, setDiscovering] = useState(false)
  const [discoverResult, setDiscoverResult] = useState<DiscoverBanner | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)
  const [syncAllResult, setSyncAllResult] = useState<SyncBanner | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch("/api/meta/ad-accounts")
      .then((r) => r.json())
      .then((data: ManagedAdAccount[]) => setAccounts(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return accounts
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.clientName.toLowerCase().includes(q)
    )
  }, [search, accounts])

  const selectedCount = accounts.filter((a) => a.isSelected).length

  async function toggleSelected(account: ManagedAdAccount) {
    setUpdating(account.id)
    try {
      const res = await fetch(`/api/ad-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSelected: !account.isSelected }),
      })
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === account.id
              ? { ...a, isSelected: !account.isSelected, excludedAt: !account.isSelected ? null : new Date().toISOString() }
              : a
          )
        )
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  async function toggleSync(account: ManagedAdAccount) {
    setUpdating(account.id)
    try {
      const res = await fetch(`/api/ad-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncEnabled: !account.syncEnabled }),
      })
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === account.id ? { ...a, syncEnabled: !account.syncEnabled } : a
          )
        )
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  async function syncAccount(account: ManagedAdAccount) {
    setSyncing(account.id)
    try {
      await fetch(`/api/ad-accounts/${account.id}/sync`, { method: "POST" })
      load()
    } catch (err) {
      console.error(err)
    } finally {
      setSyncing(null)
    }
  }

  async function discoverAll() {
    setDiscovering(true)
    setDiscoverResult(null)
    try {
      const res = await fetch("/api/meta/discover-accounts", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setDiscoverResult({ total: data.total, newAccounts: data.newAccounts })
        load()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDiscovering(false)
    }
  }

  async function syncAllActive() {
    setSyncingAll(true)
    setSyncAllResult(null)
    try {
      const res = await fetch("/api/ad-accounts/sync-selected", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setSyncAllResult({ synced: data.synced, total: data.total, errors: data.errors ?? [] })
        load()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSyncingAll(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-lg font-medium text-foreground">Gerenciar Contas</h1>
              <p className="text-sm text-muted-foreground">
                {selectedCount} de {accounts.length} contas ativas no dashboard
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar conta..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-56 rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <button
                onClick={syncAllActive}
                disabled={syncingAll || selectedCount === 0}
                className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                title={selectedCount === 0 ? "Nenhuma conta ativa para sincronizar" : `Sincronizar ${selectedCount} conta${selectedCount !== 1 ? "s" : ""} ativa${selectedCount !== 1 ? "s" : ""}`}
              >
                {syncingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Sincronizar Ativas
              </button>
              <button
                onClick={discoverAll}
                disabled={discovering}
                className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                {discovering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Radar className="h-4 w-4" />
                )}
                Descobrir Contas
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Sync all result banner */}
          {syncAllResult && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-sm text-foreground">
                <span className="font-medium">{syncAllResult.synced}/{syncAllResult.total} contas</span> sincronizadas com sucesso.{" "}
                {syncAllResult.errors.length > 0 ? (
                  <span className="text-amber-500 font-medium">{syncAllResult.errors.length} erro{syncAllResult.errors.length !== 1 ? "s" : ""}.</span>
                ) : (
                  <span className="text-emerald-500 font-medium">Tudo atualizado.</span>
                )}
              </p>
              <button
                onClick={() => setSyncAllResult(null)}
                className="ml-4 text-xs text-muted-foreground hover:text-foreground"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Discovery result banner */}
          {discoverResult && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-sm text-foreground">
                <span className="font-medium">{discoverResult.total} contas</span> encontradas no token Meta.{" "}
                {discoverResult.newAccounts > 0 ? (
                  <span className="text-emerald-500 font-medium">{discoverResult.newAccounts} nova{discoverResult.newAccounts !== 1 ? "s" : ""} adicionada{discoverResult.newAccounts !== 1 ? "s" : ""}.</span>
                ) : (
                  <span className="text-muted-foreground">Nenhuma conta nova.</span>
                )}{" "}
                Ative as contas que deseja incluir no dashboard.
              </p>
              <button
                onClick={() => setDiscoverResult(null)}
                className="ml-4 text-xs text-muted-foreground hover:text-foreground"
              >
                Fechar
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">Carregando contas...</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_1fr_100px_100px_110px_100px] gap-4 border-b border-border px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground">Conta</span>
                <span className="text-xs font-medium text-muted-foreground">Cliente</span>
                <span className="text-xs font-medium text-muted-foreground">Criativos</span>
                <span className="text-xs font-medium text-muted-foreground">Última métrica</span>
                <span className="text-xs font-medium text-muted-foreground text-center">No dashboard</span>
                <span className="text-xs font-medium text-muted-foreground text-center">Ações</span>
              </div>

              {filtered.map((account) => (
                <div
                  key={account.id}
                  className={cn(
                    "grid grid-cols-[1fr_1fr_100px_100px_110px_100px] gap-4 border-b border-border px-4 py-3 last:border-0 transition-colors",
                    !account.isSelected && "opacity-60"
                  )}
                >
                  {/* Account name */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{account.metaAccountId}</p>
                  </div>

                  {/* Client name */}
                  <div className="flex items-center">
                    <span className="truncate text-sm text-muted-foreground">{account.clientName}</span>
                  </div>

                  {/* Creatives count */}
                  <div className="flex items-center">
                    <span className="text-sm text-foreground">{account.creativesCount}</span>
                  </div>

                  {/* Last metric date */}
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground">
                      {account.lastMetricDate ?? "—"}
                    </span>
                  </div>

                  {/* isSelected toggle */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => toggleSelected(account)}
                      disabled={updating === account.id}
                      className="flex items-center gap-1.5 text-sm transition-colors"
                      title={account.isSelected ? "Remover do dashboard" : "Adicionar ao dashboard"}
                    >
                      {updating === account.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : account.isSelected ? (
                        <ToggleRight className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className={cn("text-xs", account.isSelected ? "text-emerald-500" : "text-muted-foreground")}>
                        {account.isSelected ? "Ativo" : "Inativo"}
                      </span>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => syncAccount(account)}
                      disabled={syncing === account.id}
                      title="Sincronizar esta conta"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                    >
                      {syncing === account.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="flex h-48 items-center justify-center">
                  <p className="text-muted-foreground">Nenhuma conta encontrada</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

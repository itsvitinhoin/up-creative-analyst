import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export interface ManagedAdAccount {
  id: string
  metaAccountId: string
  name: string
  clientId: string
  clientName: string
  clientSlug: string
  currency: string
  accountStatus: number
  isSelected: boolean
  syncEnabled: boolean
  excludedAt: string | null
  creativesCount: number
  lastMetricDate: string | null
  createdAt: string
  updatedAt: string
}

export async function GET(_req: NextRequest) {
  try {
    const accounts = await db.adAccount.findMany({
      orderBy: [{ isSelected: "desc" }, { name: "asc" }],
      include: {
        client: { select: { id: true, name: true, slug: true } },
        _count: { select: { creativeAssets: true } },
      },
    })

    // Fetch last metric date per account
    const lastMetrics = await db.creativeDailyMetric.groupBy({
      by: ["adAccountId"],
      _max: { date: true },
    })
    const lastMetricMap = new Map(
      lastMetrics.map((r) => [r.adAccountId, r._max.date])
    )

    const result: ManagedAdAccount[] = accounts.map((a) => ({
      id: a.id,
      metaAccountId: a.metaAccountId,
      name: a.name,
      clientId: a.clientId,
      clientName: a.client.name,
      clientSlug: a.client.slug,
      currency: a.currency,
      accountStatus: a.accountStatus,
      isSelected: a.isSelected,
      syncEnabled: a.syncEnabled,
      excludedAt: a.excludedAt?.toISOString() ?? null,
      creativesCount: a._count.creativeAssets,
      lastMetricDate: lastMetricMap.get(a.id)?.toISOString().slice(0, 10) ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error("[api/meta/ad-accounts]", err)
    return NextResponse.json({ error: "Failed to load accounts" }, { status: 500 })
  }
}

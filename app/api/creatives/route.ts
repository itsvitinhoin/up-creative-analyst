import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { creatives as mockCreatives } from "@/lib/mock-data"
import { deriveCreativeStatus } from "@/lib/creative-normalizer"
import { parseDateRange } from "@/lib/date-utils"
import type { Creative, CreativeStatus, CreativeType } from "@/lib/types"

export async function GET(req: NextRequest) {
  if (process.env.DEV_FALLBACK_MOCKS === "true") {
    return NextResponse.json(mockCreatives)
  }

  try {
    const sp = req.nextUrl.searchParams
    const clientId = sp.get("client_id")
    const accountId = sp.get("account_id")
    const statusFilter = sp.get("status")
    const typeFilter = sp.get("type")
    const sortBy = sp.get("sort_by") ?? "spend"
    const order = (sp.get("order") ?? "desc") as "asc" | "desc"
    const range = parseDateRange(sp)

    // Resolve which account IDs to query
    let accountIds: string[]

    if (accountId) {
      // Specific account
      accountIds = [accountId]
    } else if (clientId) {
      // All selected accounts for a client
      const accounts = await db.adAccount.findMany({
        where: { clientId, isSelected: true },
        select: { id: true },
      })
      accountIds = accounts.map((a) => a.id)
    } else {
      // All selected accounts across the system
      const accounts = await db.adAccount.findMany({
        where: { isSelected: true },
        select: { id: true },
      })
      accountIds = accounts.map((a) => a.id)
    }

    if (accountIds.length === 0) {
      return NextResponse.json([])
    }

    // Aggregate metrics per creative across resolved accounts
    const metricsRows = await db.creativeDailyMetric.groupBy({
      by: ["creativeAssetId"],
      where: {
        adAccountId: { in: accountIds },
        date: { gte: range.from, lte: range.to },
      },
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        purchases: true,
        purchaseValue: true,
      },
    })

    const metricsMap = new Map(
      metricsRows.map((r) => {
        const spend = r._sum.spend ?? 0
        const impressions = r._sum.impressions ?? 0
        const clicks = r._sum.clicks ?? 0
        const purchases = r._sum.purchases ?? 0
        const purchaseValue = r._sum.purchaseValue ?? 0
        return [
          r.creativeAssetId,
          {
            spend,
            impressions,
            clicks,
            purchases,
            purchaseValue,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
            cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
            cpa: purchases > 0 ? spend / purchases : 0,
            roas: spend > 0 ? purchaseValue / spend : 0,
          },
        ]
      })
    )

    // Fetch creative assets
    const assets = await db.creativeAsset.findMany({
      where: {
        adAccountId: { in: accountIds },
        ...(typeFilter && typeFilter !== "all" ? { assetType: typeFilter } : {}),
      },
      include: {
        adAccount: { select: { client: { select: { name: true } } } },
        adCreativeLinks: {
          include: {
            ad: {
              select: {
                effectiveStatus: true,
                name: true,
                adSet: { select: { campaign: { select: { name: true } } } },
              },
            },
          },
        },
      },
    })

    let creatives: (Creative & { clientName: string })[] = assets.map((asset) => {
      const adStatuses = asset.adCreativeLinks.map((l) => l.ad.effectiveStatus)
      const status = deriveCreativeStatus(adStatuses) as CreativeStatus
      const campaigns = Array.from(
        new Set(asset.adCreativeLinks.map((l) => l.ad.adSet.campaign.name).filter(Boolean))
      )
      const ads = asset.adCreativeLinks.map((l) => l.ad.name)
      const metrics = metricsMap.get(asset.id) ?? {
        spend: 0, impressions: 0, clicks: 0, purchases: 0, purchaseValue: 0,
        ctr: 0, cpc: 0, cpm: 0, cpa: 0, roas: 0,
      }
      const name = asset.title ?? asset.body?.slice(0, 60) ?? `Creative ${asset.metaCreativeId}`

      return {
        id: asset.id,
        name,
        thumbnail: asset.thumbnailUrl ?? asset.sourceUrl ?? "",
        type: asset.assetType as CreativeType,
        status,
        clientName: asset.adAccount.client.name,
        spend: metrics.spend,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        ctr: metrics.ctr,
        cpc: metrics.cpc,
        cpm: metrics.cpm,
        purchases: metrics.purchases,
        cpa: metrics.cpa,
        roas: metrics.roas,
        firstSeen: asset.firstSeenAt.toISOString().slice(0, 10),
        lastSeen: asset.lastSeenAt.toISOString().slice(0, 10),
        campaigns,
        ads,
      }
    })

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      creatives = creatives.filter((c) => c.status === statusFilter)
    }

    // Sort
    const validSortKeys = ["spend", "impressions", "clicks", "ctr", "cpc", "cpm", "purchases", "cpa", "roas"]
    const sortKey = (validSortKeys.includes(sortBy) ? sortBy : "spend") as keyof Creative
    creatives.sort((a, b) => {
      const av = (a[sortKey] as number) ?? 0
      const bv = (b[sortKey] as number) ?? 0
      return order === "desc" ? bv - av : av - bv
    })

    return NextResponse.json(creatives)
  } catch (err) {
    console.error("[api/creatives]", err)
    return NextResponse.json({ error: "Failed to load creatives" }, { status: 500 })
  }
}

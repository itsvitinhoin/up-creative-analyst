import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { creatives as mockCreatives } from "@/lib/mock-data"
import { deriveCreativeStatus } from "@/lib/creative-normalizer"
import type { Creative, CreativeStatus, CreativeType } from "@/lib/types"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.DEV_FALLBACK_MOCKS === "true") {
    return NextResponse.json(mockCreatives)
  }

  try {
    const { id: adAccountId } = await params
    const sp = req.nextUrl.searchParams

    const dateFrom = sp.get("date_from") ? new Date(sp.get("date_from")!) : undefined
    const dateTo = sp.get("date_to") ? new Date(sp.get("date_to")!) : undefined
    const statusFilter = sp.get("status") // "active" | "paused" | "mixed" | null
    const typeFilter = sp.get("type") // "image" | "video" | null
    const sortBy = sp.get("sort_by") ?? "spend"
    const order = (sp.get("order") ?? "desc") as "asc" | "desc"

    // Verify the account exists
    const account = await db.adAccount.findUnique({ where: { id: adAccountId }, select: { id: true } })
    if (!account) {
      return NextResponse.json({ error: "Ad account not found" }, { status: 404 })
    }

    // Aggregate metrics per creative
    const metricsRows = await db.creativeDailyMetric.groupBy({
      by: ["creativeAssetId"],
      where: {
        adAccountId,
        ...(dateFrom || dateTo
          ? {
              date: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
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

    // Fetch creative assets with their linked ad statuses
    const assets = await db.creativeAsset.findMany({
      where: {
        adAccountId,
        ...(typeFilter ? { assetType: typeFilter } : {}),
      },
      include: {
        adCreativeLinks: {
          include: {
            ad: {
              select: {
                effectiveStatus: true,
                adSet: {
                  select: {
                    campaign: {
                      select: { name: true },
                    },
                  },
                },
                name: true,
              },
            },
          },
        },
      },
    })

    let creatives: Creative[] = assets.map((asset) => {
      const adStatuses = asset.adCreativeLinks.map((l) => l.ad.effectiveStatus)
      const status = deriveCreativeStatus(adStatuses) as CreativeStatus

      const campaigns = Array.from(
        new Set(
          asset.adCreativeLinks
            .map((l) => l.ad.adSet.campaign.name)
            .filter(Boolean)
        )
      )
      const ads = asset.adCreativeLinks.map((l) => l.ad.name)

      const metrics = metricsMap.get(asset.id) ?? {
        spend: 0,
        impressions: 0,
        clicks: 0,
        purchases: 0,
        purchaseValue: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        cpa: 0,
        roas: 0,
      }

      const name =
        asset.title ??
        asset.body?.slice(0, 60) ??
        `Creative ${asset.metaCreativeId}`

      return {
        id: asset.id,
        name,
        thumbnail: asset.thumbnailUrl ?? asset.sourceUrl ?? "",
        type: asset.assetType as CreativeType,
        status,
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

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      creatives = creatives.filter((c) => c.status === statusFilter)
    }

    // Sort
    const validSortKeys: (keyof Creative)[] = [
      "spend", "impressions", "clicks", "ctr", "cpc", "cpm", "purchases", "cpa", "roas",
    ]
    const sortKey = (validSortKeys.includes(sortBy as keyof Creative) ? sortBy : "spend") as keyof Creative
    creatives.sort((a, b) => {
      const av = (a[sortKey] as number) ?? 0
      const bv = (b[sortKey] as number) ?? 0
      return order === "desc" ? bv - av : av - bv
    })

    return NextResponse.json(creatives)
  } catch (err) {
    console.error("[api/ad-accounts/[id]/creatives]", err)
    return NextResponse.json({ error: "Failed to load creatives" }, { status: 500 })
  }
}

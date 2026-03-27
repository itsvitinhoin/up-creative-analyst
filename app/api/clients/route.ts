import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clients as mockClients } from "@/lib/mock-data"
import { parseDateRange } from "@/lib/date-utils"

export async function GET(req: NextRequest) {
  if (process.env.DEV_FALLBACK_MOCKS === "true") {
    return NextResponse.json(mockClients)
  }

  try {
    const range = parseDateRange(req.nextUrl.searchParams)
    const onlyVisible = req.nextUrl.searchParams.get("all") !== "true"

    const clients = await db.client.findMany({
      where: onlyVisible ? { isVisible: true } : undefined,
      orderBy: { name: "asc" },
      include: {
        adAccounts: {
          where: { isSelected: true },
          include: {
            creativeAssets: {
              select: {
                id: true,
                adCreativeLinks: {
                  select: { ad: { select: { effectiveStatus: true } } },
                },
              },
            },
            creativeDailyMetrics: {
              where: {
                date: { gte: range.from, lte: range.to },
              },
              select: {
                spend: true,
                impressions: true,
                clicks: true,
                purchases: true,
                purchaseValue: true,
                creativeAssetId: true,
              },
            },
          },
        },
      },
    })

    const result = clients.map((client) => {
      let spend = 0
      let impressions = 0
      let clicks = 0
      let purchases = 0
      let purchaseValue = 0
      const creativeStatusMap = new Map<string, Set<string>>()

      for (const account of client.adAccounts) {
        for (const metric of account.creativeDailyMetrics) {
          spend += metric.spend
          impressions += metric.impressions
          clicks += metric.clicks
          purchases += metric.purchases
          purchaseValue += metric.purchaseValue
        }
        for (const creative of account.creativeAssets) {
          if (!creativeStatusMap.has(creative.id)) {
            creativeStatusMap.set(creative.id, new Set())
          }
          for (const link of creative.adCreativeLinks) {
            creativeStatusMap.get(creative.id)!.add(link.ad.effectiveStatus)
          }
        }
      }

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
      const cpc = clicks > 0 ? spend / clicks : 0
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0
      const cpa = purchases > 0 ? spend / purchases : 0
      const roas = spend > 0 ? purchaseValue / spend : 0
      const creativesCount = creativeStatusMap.size
      let activeCreatives = 0
      for (const statuses of Array.from(creativeStatusMap.values())) {
        if (statuses.has("ACTIVE")) activeCreatives++
      }

      return {
        id: client.id,
        name: client.name,
        status: client.status as "active" | "inactive",
        isVisible: client.isVisible,
        isActive: client.isActive,
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        cpm,
        purchases,
        cpa,
        roas,
        creativesCount,
        activeCreatives,
        topPerformer: undefined as string | undefined,
      }
    })

    // Resolve top performer per client
    for (const client of result) {
      const dbClient = clients.find((c) => c.id === client.id)!
      const accountIds = dbClient.adAccounts.map((a) => a.id)
      if (accountIds.length === 0) continue

      const topMetric = await db.creativeDailyMetric.groupBy({
        by: ["creativeAssetId"],
        where: {
          adAccountId: { in: accountIds },
          date: { gte: range.from, lte: range.to },
        },
        _sum: { purchaseValue: true, spend: true },
        orderBy: { _sum: { purchaseValue: "desc" } },
        take: 1,
      })

      if (topMetric[0]) {
        const creative = await db.creativeAsset.findUnique({
          where: { id: topMetric[0].creativeAssetId },
          select: { title: true, body: true, metaCreativeId: true },
        })
        client.topPerformer =
          creative?.title ??
          creative?.body?.slice(0, 40) ??
          `Creative ${creative?.metaCreativeId}`
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("[api/clients]", err)
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 })
  }
}

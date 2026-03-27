import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { insights as mockInsights, topCreatives as mockTopCreatives } from "@/lib/mock-data"
import type { Insight } from "@/lib/types"

export interface TopCreativeItem {
  id: string
  name: string
  clientName: string
  thumbnail: string
  type: "image" | "video"
  roas: number
  spend: number
  purchases: number
  improvement: number
}

export interface InsightsResponse {
  insights: Insight[]
  topCreatives: TopCreativeItem[]
}

export async function GET(_req: NextRequest): Promise<NextResponse<InsightsResponse>> {
  if (process.env.DEV_FALLBACK_MOCKS === "true") {
    return NextResponse.json({ insights: mockInsights, topCreatives: mockTopCreatives })
  }

  try {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    // Get all clients with their account ids
    const clients = await db.client.findMany({
      include: { adAccounts: { select: { id: true } } },
    })

    // Aggregate metrics per creative across all accounts
    const allAccountIds = clients.flatMap((c) => c.adAccounts.map((a) => a.id))

    const metricsRows = await db.creativeDailyMetric.groupBy({
      by: ["creativeAssetId", "adAccountId"],
      where: {
        adAccountId: { in: allAccountIds },
        date: { gte: thirtyDaysAgo },
      },
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        purchases: true,
        purchaseValue: true,
      },
    })

    // Build creative metrics map
    const creativeMetrics = new Map<
      string,
      { spend: number; impressions: number; clicks: number; purchases: number; purchaseValue: number; adAccountId: string }
    >()

    for (const row of metricsRows) {
      const existing = creativeMetrics.get(row.creativeAssetId)
      const spend = row._sum.spend ?? 0
      const impressions = row._sum.impressions ?? 0
      const clicks = row._sum.clicks ?? 0
      const purchases = row._sum.purchases ?? 0
      const purchaseValue = row._sum.purchaseValue ?? 0

      if (existing) {
        existing.spend += spend
        existing.impressions += impressions
        existing.clicks += clicks
        existing.purchases += purchases
        existing.purchaseValue += purchaseValue
      } else {
        creativeMetrics.set(row.creativeAssetId, {
          spend,
          impressions,
          clicks,
          purchases,
          purchaseValue,
          adAccountId: row.adAccountId,
        })
      }
    }

    // Build adAccountId → client map
    const accountToClient = new Map<string, { id: string; name: string }>()
    for (const client of clients) {
      for (const acc of client.adAccounts) {
        accountToClient.set(acc.id, { id: client.id, name: client.name })
      }
    }

    // Fetch creative assets for the ones with metrics
    const creativeIds = Array.from(creativeMetrics.keys())
    const assets = await db.creativeAsset.findMany({
      where: { id: { in: creativeIds } },
      select: { id: true, title: true, body: true, assetType: true, thumbnailUrl: true, sourceUrl: true, metaCreativeId: true, adAccountId: true },
    })

    const assetMap = new Map(assets.map((a) => [a.id, a]))

    // Compute per-creative ROAS and derive account average
    const perAccountTotals = new Map<string, { spend: number; purchaseValue: number }>()
    for (const [, m] of Array.from(creativeMetrics)) {
      const existing = perAccountTotals.get(m.adAccountId) ?? { spend: 0, purchaseValue: 0 }
      existing.spend += m.spend
      existing.purchaseValue += m.purchaseValue
      perAccountTotals.set(m.adAccountId, existing)
    }

    const accountAvgRoas = new Map<string, number>()
    for (const [accId, totals] of Array.from(perAccountTotals)) {
      accountAvgRoas.set(accId, totals.spend > 0 ? totals.purchaseValue / totals.spend : 0)
    }

    // Build enriched creative list with ROAS
    type EnrichedCreative = {
      id: string
      assetType: string
      name: string
      thumbnailUrl: string
      clientId: string
      clientName: string
      adAccountId: string
      spend: number
      purchases: number
      purchaseValue: number
      impressions: number
      clicks: number
      roas: number
      avgRoas: number
    }

    const enriched: EnrichedCreative[] = []

    for (const [creativeId, metrics] of Array.from(creativeMetrics)) {
      const asset = assetMap.get(creativeId)
      if (!asset) continue
      const client = accountToClient.get(metrics.adAccountId)
      if (!client) continue

      const roas = metrics.spend > 0 ? metrics.purchaseValue / metrics.spend : 0
      const avgRoas = accountAvgRoas.get(metrics.adAccountId) ?? 0

      enriched.push({
        id: creativeId,
        assetType: asset.assetType,
        name: asset.title ?? asset.body?.slice(0, 60) ?? `Creative ${asset.metaCreativeId}`,
        thumbnailUrl: asset.thumbnailUrl ?? asset.sourceUrl ?? "",
        clientId: client.id,
        clientName: client.name,
        adAccountId: metrics.adAccountId,
        spend: metrics.spend,
        purchases: metrics.purchases,
        purchaseValue: metrics.purchaseValue,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        roas,
        avgRoas,
      })
    }

    // ─── Generate rule-based insights ────────────────────────────────────────

    const insights: Insight[] = []
    const now = today.toISOString().slice(0, 10)

    // Sort by ROAS descending
    const byRoas = [...enriched].sort((a, b) => b.roas - a.roas)

    // 1. Top performer by ROAS
    const topByRoas = byRoas[0]
    if (topByRoas && topByRoas.roas > 0) {
      const improvement =
        topByRoas.avgRoas > 0
          ? Math.round(((topByRoas.roas - topByRoas.avgRoas) / topByRoas.avgRoas) * 100)
          : 0
      insights.push({
        id: `insight-top-roas-${topByRoas.id}`,
        type: "success",
        category: "performance",
        title: "Top performer da semana",
        description: `Este criativo superou a média de ROAS em ${improvement}% comparado aos demais da conta.`,
        clientName: topByRoas.clientName,
        creativeName: topByRoas.name,
        creativeThumbnail: topByRoas.thumbnailUrl,
        creativeType: topByRoas.assetType as "image" | "video",
        metric: "ROAS",
        value: Math.round(topByRoas.roas * 100) / 100,
        comparison: improvement,
        date: now,
      })
    }

    // 2. Low ROAS warning (spend > threshold and roas < 1.0)
    const lowRoas = enriched
      .filter((c) => c.roas < 1.0 && c.spend > 500)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 3)

    for (const c of lowRoas) {
      insights.push({
        id: `insight-low-roas-${c.id}`,
        type: "warning",
        category: "performance",
        title: "Criativo com baixa performance",
        description: `Este criativo está com ROAS ${c.roas.toFixed(2)}x abaixo de 1.0. Considere pausar ou revisar.`,
        clientName: c.clientName,
        creativeName: c.name,
        creativeThumbnail: c.thumbnailUrl,
        creativeType: c.assetType as "image" | "video",
        metric: "ROAS",
        value: Math.round(c.roas * 100) / 100,
        comparison: c.avgRoas > 0 ? Math.round(((c.roas - c.avgRoas) / c.avgRoas) * 100) : 0,
        date: now,
      })
    }

    // 3. Top video by CTR
    const avgCtr = enriched.length > 0
      ? enriched.reduce((s, c) => s + (c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0), 0) / enriched.length
      : 0

    const topVideo = enriched
      .filter((c) => c.assetType === "video" && c.impressions > 1000)
      .map((c) => ({ ...c, ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0 }))
      .sort((a, b) => b.ctr - a.ctr)[0]

    if (topVideo && avgCtr > 0 && topVideo.ctr > avgCtr * 1.5) {
      const multiplier = Math.round((topVideo.ctr / avgCtr) * 10) / 10
      insights.push({
        id: `insight-top-video-ctr-${topVideo.id}`,
        type: "success",
        category: "creative",
        title: "Vídeo com alto engajamento",
        description: `Este vídeo tem CTR ${multiplier}x maior que a média de criativos da conta.`,
        clientName: topVideo.clientName,
        creativeName: topVideo.name,
        creativeThumbnail: topVideo.thumbnailUrl,
        creativeType: "video",
        metric: "CTR",
        value: Math.round(topVideo.ctr * 100) / 100,
        comparison: Math.round((multiplier - 1) * 100),
        date: now,
      })
    }

    // 4. Best performer by purchases
    const topByPurchases = [...enriched].sort((a, b) => b.purchases - a.purchases)[0]
    if (topByPurchases && topByPurchases.purchases > 0) {
      insights.push({
        id: `insight-top-purchases-${topByPurchases.id}`,
        type: "success",
        category: "performance",
        title: "Melhor criativo em compras",
        description: `Este criativo gerou ${topByPurchases.purchases} compras nos últimos 30 dias, liderando entre todos os criativos.`,
        clientName: topByPurchases.clientName,
        creativeName: topByPurchases.name,
        creativeThumbnail: topByPurchases.thumbnailUrl,
        creativeType: topByPurchases.assetType as "image" | "video",
        metric: "Purchases",
        value: topByPurchases.purchases,
        comparison: undefined,
        date: now,
      })
    }

    // 5. High spend / low return
    const highSpendLowReturn = enriched
      .filter((c) => c.spend > 1000 && c.roas < (c.avgRoas ?? 0) * 0.5 && c.avgRoas > 0)
      .sort((a, b) => b.spend - a.spend)[0]

    if (highSpendLowReturn) {
      insights.push({
        id: `insight-high-spend-low-return-${highSpendLowReturn.id}`,
        type: "warning",
        category: "budget",
        title: "Alto gasto com baixo retorno",
        description: `Este criativo consumiu R$${highSpendLowReturn.spend.toFixed(0)} com ROAS abaixo de 50% da média da conta.`,
        clientName: highSpendLowReturn.clientName,
        creativeName: highSpendLowReturn.name,
        creativeThumbnail: highSpendLowReturn.thumbnailUrl,
        creativeType: highSpendLowReturn.assetType as "image" | "video",
        metric: "Spend",
        value: Math.round(highSpendLowReturn.spend),
        comparison: Math.round(((highSpendLowReturn.roas - highSpendLowReturn.avgRoas) / highSpendLowReturn.avgRoas) * 100),
        date: now,
      })
    }

    // ─── Top creatives (for insights page) ───────────────────────────────────

    const topCreatives: TopCreativeItem[] = byRoas.slice(0, 6).map((c) => {
      const improvement =
        c.avgRoas > 0
          ? Math.round(((c.roas - c.avgRoas) / c.avgRoas) * 100)
          : 0
      return {
        id: c.id,
        name: c.name,
        clientName: c.clientName,
        thumbnail: c.thumbnailUrl,
        type: c.assetType as "image" | "video",
        roas: Math.round(c.roas * 100) / 100,
        spend: Math.round(c.spend),
        purchases: c.purchases,
        improvement,
      }
    })

    return NextResponse.json({ insights, topCreatives })
  } catch (err) {
    console.error("[api/insights]", err)
    // Return empty on error to not crash the frontend
    return NextResponse.json({ insights: [], topCreatives: [] })
  }
}

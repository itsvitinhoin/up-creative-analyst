import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { creatives as mockCreatives } from "@/lib/mock-data"
import { deriveCreativeStatus } from "@/lib/creative-normalizer"
import type { Creative, CreativeStatus, CreativeType } from "@/lib/types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (process.env.DEV_FALLBACK_MOCKS === "true") {
    const found = mockCreatives.find((c) => c.id === id)
    if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(found)
  }

  try {
    const asset = await db.creativeAsset.findUnique({
      where: { id },
      include: {
        adAccount: { include: { client: true } },
        adCreativeLinks: {
          include: {
            ad: {
              select: {
                id: true,
                name: true,
                effectiveStatus: true,
                adSet: {
                  select: {
                    name: true,
                    campaign: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        dailyMetrics: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    })

    if (!asset) {
      return NextResponse.json({ error: "Creative not found" }, { status: 404 })
    }

    const adStatuses = asset.adCreativeLinks.map((l) => l.ad.effectiveStatus)
    const status = deriveCreativeStatus(adStatuses) as CreativeStatus

    const campaigns = Array.from(
      new Set(asset.adCreativeLinks.map((l) => l.ad.adSet.campaign.name))
    )
    const ads = asset.adCreativeLinks.map((l) => l.ad.name)

    // Aggregate all daily metrics
    let spend = 0
    let impressions = 0
    let clicks = 0
    let purchases = 0
    let purchaseValue = 0

    for (const m of asset.dailyMetrics) {
      spend += m.spend
      impressions += m.impressions
      clicks += m.clicks
      purchases += m.purchases
      purchaseValue += m.purchaseValue
    }

    const name =
      asset.title ??
      asset.body?.slice(0, 60) ??
      `Creative ${asset.metaCreativeId}`

    const creative: Creative = {
      id: asset.id,
      name,
      thumbnail: asset.thumbnailUrl ?? asset.sourceUrl ?? "",
      type: asset.assetType as CreativeType,
      status,
      clientName: asset.adAccount.client.name,
      metaCreativeId: asset.metaCreativeId,
      spend,
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      purchases,
      cpa: purchases > 0 ? spend / purchases : 0,
      roas: spend > 0 ? purchaseValue / spend : 0,
      firstSeen: asset.firstSeenAt.toISOString().slice(0, 10),
      lastSeen: asset.lastSeenAt.toISOString().slice(0, 10),
      campaigns,
      ads,
    }

    return NextResponse.json(creative)
  } catch (err) {
    console.error("[api/creatives/[id]]", err)
    return NextResponse.json({ error: "Failed to load creative" }, { status: 500 })
  }
}

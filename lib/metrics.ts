import { db } from "./db"

export interface DateRange {
  from?: Date
  to?: Date
}

export interface AggregatedCreativeMetrics {
  creativeAssetId: string
  spend: number
  impressions: number
  clicks: number
  purchases: number
  purchaseValue: number
  ctr: number
  cpc: number
  cpm: number
  cpa: number
  roas: number
}

/**
 * Aggregates daily metrics for a creative asset over a date range.
 */
export async function aggregateCreativeMetrics(
  creativeAssetId: string,
  range?: DateRange
): Promise<AggregatedCreativeMetrics> {
  const where = {
    creativeAssetId,
    ...(range?.from || range?.to
      ? {
          date: {
            ...(range.from ? { gte: range.from } : {}),
            ...(range.to ? { lte: range.to } : {}),
          },
        }
      : {}),
  }

  const agg = await db.creativeDailyMetric.aggregate({
    where,
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      purchaseValue: true,
    },
  })

  const spend = agg._sum.spend ?? 0
  const impressions = agg._sum.impressions ?? 0
  const clicks = agg._sum.clicks ?? 0
  const purchases = agg._sum.purchases ?? 0
  const purchaseValue = agg._sum.purchaseValue ?? 0

  return {
    creativeAssetId,
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
  }
}

/**
 * Aggregates metrics for all creatives in an ad account.
 * Returns a map of creativeAssetId → metrics.
 */
export async function aggregateAccountCreativeMetrics(
  adAccountId: string,
  range?: DateRange
): Promise<Map<string, AggregatedCreativeMetrics>> {
  const where = {
    adAccountId,
    ...(range?.from || range?.to
      ? {
          date: {
            ...(range.from ? { gte: range.from } : {}),
            ...(range.to ? { lte: range.to } : {}),
          },
        }
      : {}),
  }

  const rows = await db.creativeDailyMetric.groupBy({
    by: ["creativeAssetId"],
    where,
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      purchaseValue: true,
    },
  })

  const result = new Map<string, AggregatedCreativeMetrics>()

  for (const row of rows) {
    const spend = row._sum.spend ?? 0
    const impressions = row._sum.impressions ?? 0
    const clicks = row._sum.clicks ?? 0
    const purchases = row._sum.purchases ?? 0
    const purchaseValue = row._sum.purchaseValue ?? 0

    result.set(row.creativeAssetId, {
      creativeAssetId: row.creativeAssetId,
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
    })
  }

  return result
}

/**
 * Aggregates metrics for all creatives across all accounts of a client.
 */
export async function aggregateClientMetrics(
  clientId: string,
  range?: DateRange
): Promise<{
  spend: number
  impressions: number
  clicks: number
  purchases: number
  purchaseValue: number
  ctr: number
  cpc: number
  cpm: number
  cpa: number
  roas: number
}> {
  const accounts = await db.adAccount.findMany({ where: { clientId }, select: { id: true } })
  const accountIds = accounts.map((a) => a.id)

  if (accountIds.length === 0) {
    return { spend: 0, impressions: 0, clicks: 0, purchases: 0, purchaseValue: 0, ctr: 0, cpc: 0, cpm: 0, cpa: 0, roas: 0 }
  }

  const where = {
    adAccountId: { in: accountIds },
    ...(range?.from || range?.to
      ? {
          date: {
            ...(range.from ? { gte: range.from } : {}),
            ...(range.to ? { lte: range.to } : {}),
          },
        }
      : {}),
  }

  const agg = await db.creativeDailyMetric.aggregate({
    where,
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      purchaseValue: true,
    },
  })

  const spend = agg._sum.spend ?? 0
  const impressions = agg._sum.impressions ?? 0
  const clicks = agg._sum.clicks ?? 0
  const purchases = agg._sum.purchases ?? 0
  const purchaseValue = agg._sum.purchaseValue ?? 0

  return {
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
  }
}

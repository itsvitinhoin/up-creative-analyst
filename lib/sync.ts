import { db } from "./db"
import {
  fetchAdAccounts,
  fetchCampaigns,
  fetchAdSets,
  fetchAds,
  fetchAdInsights,
  extractPurchases,
  extractPurchaseValue,
  type MetaAdAccount,
} from "./meta-api"
import { accountNameToClientName, nameToSlug } from "./client-mapping"
import { extractCreativesFromAds } from "./creative-normalizer"

export interface AccountSyncResult {
  campaigns: number
  adSets: number
  ads: number
  creatives: number
  metrics: number
  error?: string
}

export interface SyncResult {
  success: boolean
  accounts: number
  campaigns: number
  adSets: number
  ads: number
  creatives: number
  metrics: number
  errors: string[]
  durationMs: number
}

/**
 * Syncs a single Meta ad account into the DB.
 * Creates client + account if they don't exist yet (new accounts get isSelected=false).
 * Respects syncEnabled flag — if the account has syncEnabled=false, skips data sync
 * but still upserts the account record so it shows up in management.
 */
export async function syncOneAccount(
  metaAccount: MetaAdAccount
): Promise<AccountSyncResult> {
  const metaAccountId = metaAccount.id
  const clientName = accountNameToClientName(metaAccount.name)
  const clientSlug = nameToSlug(clientName)

  // Upsert client (preserve existing settings)
  const client = await db.client.upsert({
    where: { slug: clientSlug },
    create: { name: clientName, slug: clientSlug, status: "active" },
    update: { name: clientName },
  })

  // Check if account is new
  const existing = await db.adAccount.findUnique({
    where: { metaAccountId },
    select: { id: true, syncEnabled: true },
  })

  // New accounts start with isSelected=false so the user explicitly activates them
  const dbAccount = await db.adAccount.upsert({
    where: { metaAccountId },
    create: {
      clientId: client.id,
      metaAccountId,
      name: metaAccount.name,
      currency: metaAccount.currency ?? "BRL",
      timezone: metaAccount.timezone_name ?? "America/Sao_Paulo",
      accountStatus: metaAccount.account_status ?? 1,
      isSelected: false, // user must opt-in
      syncEnabled: true,
    },
    update: {
      name: metaAccount.name,
      accountStatus: metaAccount.account_status ?? 1,
      updatedAt: new Date(),
    },
  })

  // Skip data sync for disabled accounts (still registered them above)
  const syncEnabled = existing?.syncEnabled ?? true
  if (!syncEnabled) {
    return { campaigns: 0, adSets: 0, ads: 0, creatives: 0, metrics: 0 }
  }

  // --- Campaigns ---
  const campaigns = await fetchCampaigns(metaAccountId)
  const campaignIdMap = new Map<string, string>()
  for (const campaign of campaigns) {
    const dbCampaign = await db.campaign.upsert({
      where: { metaCampaignId: campaign.id },
      create: {
        adAccountId: dbAccount.id,
        metaCampaignId: campaign.id,
        name: campaign.name,
        objective: campaign.objective ?? null,
        status: campaign.status,
      },
      update: { name: campaign.name, status: campaign.status, updatedAt: new Date() },
    })
    campaignIdMap.set(campaign.id, dbCampaign.id)
  }

  // --- Ad Sets ---
  const adSets = await fetchAdSets(metaAccountId)
  const adSetIdMap = new Map<string, string>()
  for (const adSet of adSets) {
    const campaignDbId = campaignIdMap.get(adSet.campaign_id)
    if (!campaignDbId) continue
    const dbAdSet = await db.adSet.upsert({
      where: { metaAdSetId: adSet.id },
      create: {
        campaignId: campaignDbId,
        metaAdSetId: adSet.id,
        name: adSet.name,
        status: adSet.status,
      },
      update: { name: adSet.name, status: adSet.status, updatedAt: new Date() },
    })
    adSetIdMap.set(adSet.id, dbAdSet.id)
  }

  // --- Ads + Creatives ---
  const ads = await fetchAds(metaAccountId)
  const { creatives, adMappings } = extractCreativesFromAds(ads)

  const creativeIdMap = new Map<string, string>()
  for (const [metaCreativeId, creative] of Array.from(creatives)) {
    const dbCreative = await db.creativeAsset.upsert({
      where: { metaCreativeId },
      create: {
        adAccountId: dbAccount.id,
        metaCreativeId,
        assetType: creative.assetType,
        assetHash: creative.assetHash,
        sourceUrl: creative.sourceUrl,
        thumbnailUrl: creative.thumbnailUrl,
        title: creative.title,
        body: creative.body,
        headline: creative.headline,
        ctaType: creative.ctaType,
        destinationUrl: creative.destinationUrl,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
      update: {
        thumbnailUrl: creative.thumbnailUrl,
        title: creative.title,
        body: creative.body,
        headline: creative.headline,
        ctaType: creative.ctaType,
        destinationUrl: creative.destinationUrl,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      },
    })
    creativeIdMap.set(metaCreativeId, dbCreative.id)
  }

  const adIdMap = new Map<string, string>()
  for (const ad of ads) {
    const adSetDbId = adSetIdMap.get(ad.adset_id)
    if (!adSetDbId) continue
    const dbAd = await db.ad.upsert({
      where: { metaAdId: ad.id },
      create: {
        adSetId: adSetDbId,
        metaAdId: ad.id,
        metaCreativeId: ad.creative?.id ?? null,
        name: ad.name,
        effectiveStatus: ad.effective_status,
        configuredStatus: ad.configured_status,
      },
      update: {
        effectiveStatus: ad.effective_status,
        configuredStatus: ad.configured_status,
        updatedAt: new Date(),
      },
    })
    adIdMap.set(ad.id, dbAd.id)
  }

  for (const mapping of adMappings) {
    const adDbId = adIdMap.get(mapping.metaAdId)
    const creativeDbId = creativeIdMap.get(mapping.metaCreativeId)
    if (!adDbId || !creativeDbId) continue
    await db.adCreativeLink.upsert({
      where: { adId_creativeAssetId: { adId: adDbId, creativeAssetId: creativeDbId } },
      create: { adId: adDbId, creativeAssetId: creativeDbId },
      update: {},
    })
  }

  // --- Metrics ---
  const insightRows = await fetchAdInsights(metaAccountId, "last_30d")
  const adToCreative = new Map<string, string>()
  for (const mapping of adMappings) {
    adToCreative.set(mapping.metaAdId, mapping.metaCreativeId)
  }

  let totalMetrics = 0
  for (const row of insightRows) {
    const metaCreativeId = adToCreative.get(row.ad_id)
    if (!metaCreativeId) continue
    const creativeDbId = creativeIdMap.get(metaCreativeId)
    if (!creativeDbId) continue

    const date = new Date(row.date_start)
    const spend = parseFloat(row.spend || "0")
    const impressions = parseInt(row.impressions || "0", 10)
    const clicks = parseInt(row.clicks || "0", 10)
    const purchases = Math.round(extractPurchases(row.actions))
    const purchaseValue = extractPurchaseValue(row.action_values)
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const cpc = clicks > 0 ? spend / clicks : 0
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0
    const cpa = purchases > 0 ? spend / purchases : 0
    const roas = spend > 0 ? purchaseValue / spend : 0

    try {
      await db.creativeDailyMetric.upsert({
        where: { creativeAssetId_date: { creativeAssetId: creativeDbId, date } },
        create: {
          creativeAssetId: creativeDbId,
          adAccountId: dbAccount.id,
          date,
          spend,
          impressions,
          clicks,
          ctr,
          cpc,
          cpm,
          purchases,
          purchaseValue,
          cpa,
          roas,
        },
        update: { spend, impressions, clicks, ctr, cpc, cpm, purchases, purchaseValue, cpa, roas, updatedAt: new Date() },
      })
      totalMetrics++
    } catch {
      // skip duplicate date conflicts
    }
  }

  console.log(
    `[sync] ${metaAccount.name}: ${campaigns.length} campaigns, ${adSets.length} adsets, ${ads.length} ads, ${creatives.size} creatives, ${insightRows.length} rows`
  )

  return {
    campaigns: campaigns.length,
    adSets: adSets.length,
    ads: ads.length,
    creatives: creatives.size,
    metrics: totalMetrics,
  }
}

/**
 * Syncs a single account by its DB id (used by per-account sync route).
 */
export async function syncAccountById(dbAccountId: string): Promise<AccountSyncResult> {
  const dbAccount = await db.adAccount.findUnique({
    where: { id: dbAccountId },
    select: { metaAccountId: true, name: true },
  })
  if (!dbAccount) throw new Error("Ad account not found")

  // Re-use syncOneAccount with a minimal MetaAdAccount shape
  return syncOneAccount({
    id: dbAccount.metaAccountId,
    name: dbAccount.name,
    currency: "BRL",
    timezone_name: "America/Sao_Paulo",
    account_status: 1,
  })
}

/**
 * Full sync from Meta: discovers all accounts and syncs each one.
 */
export async function syncFromMeta(): Promise<SyncResult> {
  const start = Date.now()
  const errors: string[] = []
  let totalCampaigns = 0
  let totalAdSets = 0
  let totalAds = 0
  let totalCreatives = 0
  let totalMetrics = 0

  const adAccounts = await fetchAdAccounts()
  console.log(`[sync] Found ${adAccounts.length} ad accounts`)

  for (const account of adAccounts) {
    try {
      const result = await syncOneAccount(account)
      totalCampaigns += result.campaigns
      totalAdSets += result.adSets
      totalAds += result.ads
      totalCreatives += result.creatives
      totalMetrics += result.metrics
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[sync] Error on ${account.name}: ${msg}`)
      errors.push(`${account.name}: ${msg}`)
    }
  }

  return {
    success: errors.length === 0,
    accounts: adAccounts.length,
    campaigns: totalCampaigns,
    adSets: totalAdSets,
    ads: totalAds,
    creatives: totalCreatives,
    metrics: totalMetrics,
    errors,
    durationMs: Date.now() - start,
  }
}

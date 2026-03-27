import { db } from "./db"
import {
  fetchAdAccounts,
  fetchCampaigns,
  fetchAdSets,
  fetchAds,
  fetchAdInsights,
  extractPurchases,
  extractPurchaseValue,
} from "./meta-api"
import { accountNameToClientName, nameToSlug } from "./client-mapping"
import { extractCreativesFromAds } from "./creative-normalizer"

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
 * Full sync: fetch all data from Meta and persist to DB.
 * Safe to run repeatedly — uses upsert to avoid duplicates.
 */
export async function syncFromMeta(): Promise<SyncResult> {
  const start = Date.now()
  const errors: string[] = []
  let totalCampaigns = 0
  let totalAdSets = 0
  let totalAds = 0
  let totalCreatives = 0
  let totalMetrics = 0

  // 1. Fetch all ad accounts
  const adAccounts = await fetchAdAccounts()
  console.log(`[sync] Found ${adAccounts.length} ad accounts`)

  for (const account of adAccounts) {
    try {
      // Normalize the account ID (Meta returns "act_123", we strip the prefix)
      const metaAccountId = account.id // keep as "act_123"

      // 2. Derive client from account name
      const clientName = accountNameToClientName(account.name)
      const clientSlug = nameToSlug(clientName)

      // 3. Upsert client
      const client = await db.client.upsert({
        where: { slug: clientSlug },
        create: { name: clientName, slug: clientSlug, status: "active" },
        update: { name: clientName, status: "active" },
      })

      // 4. Upsert ad account
      const dbAccount = await db.adAccount.upsert({
        where: { metaAccountId },
        create: {
          clientId: client.id,
          metaAccountId,
          name: account.name,
          currency: account.currency ?? "BRL",
          timezone: account.timezone_name ?? "America/Sao_Paulo",
          accountStatus: account.account_status ?? 1,
        },
        update: {
          name: account.name,
          accountStatus: account.account_status ?? 1,
          updatedAt: new Date(),
        },
      })

      // 5. Fetch and upsert campaigns
      const campaigns = await fetchCampaigns(metaAccountId)
      totalCampaigns += campaigns.length
      const campaignIdMap = new Map<string, string>() // metaCampaignId → db id

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
          update: {
            name: campaign.name,
            status: campaign.status,
            updatedAt: new Date(),
          },
        })
        campaignIdMap.set(campaign.id, dbCampaign.id)
      }

      // 6. Fetch and upsert ad sets
      const adSets = await fetchAdSets(metaAccountId)
      totalAdSets += adSets.length
      const adSetIdMap = new Map<string, string>() // metaAdSetId → db id

      for (const adSet of adSets) {
        const campaignDbId = campaignIdMap.get(adSet.campaign_id)
        if (!campaignDbId) continue // skip if campaign not found
        const dbAdSet = await db.adSet.upsert({
          where: { metaAdSetId: adSet.id },
          create: {
            campaignId: campaignDbId,
            metaAdSetId: adSet.id,
            name: adSet.name,
            status: adSet.status,
          },
          update: {
            name: adSet.name,
            status: adSet.status,
            updatedAt: new Date(),
          },
        })
        adSetIdMap.set(adSet.id, dbAdSet.id)
      }

      // 7. Fetch ads with creatives
      const ads = await fetchAds(metaAccountId)
      totalAds += ads.length

      // 8. Normalize and upsert creative assets
      const { creatives, adMappings } = extractCreativesFromAds(ads)
      totalCreatives += creatives.size

      // Map metaCreativeId → db creative asset id
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

      // 9. Upsert ads and link to creatives
      const adIdMap = new Map<string, string>() // metaAdId → db id

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

      // 10. Create AdCreativeLink bridges
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

      // 11. Fetch and persist daily insights per ad
      const insightRows = await fetchAdInsights(metaAccountId, "last_30d")

      // Build ad → creative mapping for insights
      const adToCreative = new Map<string, string>() // metaAdId → metaCreativeId
      for (const mapping of adMappings) {
        adToCreative.set(mapping.metaAdId, mapping.metaCreativeId)
      }

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
            where: {
              creativeAssetId_date: {
                creativeAssetId: creativeDbId,
                date,
              },
            },
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
            update: {
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
              updatedAt: new Date(),
            },
          })
          totalMetrics++
        } catch {
          // Skip individual metric errors (usually duplicate date on same creative)
        }
      }

      console.log(
        `[sync] Account ${account.name}: ${campaigns.length} campaigns, ${adSets.length} adsets, ${ads.length} ads, ${creatives.size} creatives, ${insightRows.length} insight rows`
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[sync] Error processing account ${account.name}: ${msg}`)
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

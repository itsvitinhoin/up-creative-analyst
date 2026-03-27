import type { MetaCreativeData, MetaAd } from "./meta-api"
import { isVideo, extractThumbnail, extractDestinationUrl, extractCtaType } from "./meta-api"

export interface NormalizedCreative {
  metaCreativeId: string
  assetType: "image" | "video"
  assetHash: string | null
  sourceUrl: string | null
  thumbnailUrl: string | null
  title: string | null
  body: string | null
  headline: string | null
  ctaType: string | null
  destinationUrl: string | null
}

export interface AdCreativeMapping {
  metaAdId: string
  metaCreativeId: string
  effectiveStatus: string
  configuredStatus: string
}

/**
 * Normalizes a Meta creative into a stable, deduplicated creative asset.
 */
export function normalizeCreative(creative: MetaCreativeData): NormalizedCreative {
  const assetType = isVideo(creative) ? "video" : "image"
  const thumbnail = extractThumbnail(creative)
  const destination = extractDestinationUrl(creative)
  const cta = extractCtaType(creative)

  const assetHash =
    creative.asset_feed_spec?.images?.[0]?.hash ??
    creative.object_story_spec?.link_data?.image_hash ??
    null

  return {
    metaCreativeId: creative.id,
    assetType,
    assetHash,
    sourceUrl: thumbnail, // best available source URL
    thumbnailUrl: thumbnail,
    title: creative.title ?? null,
    body: creative.body ?? null,
    headline:
      creative.object_story_spec?.link_data?.caption ??
      creative.object_story_spec?.link_data?.description ??
      null,
    ctaType: cta,
    destinationUrl: destination,
  }
}

/**
 * Extracts unique creatives from a list of ads.
 * Returns deduplicated creative assets and a mapping of ad → creative.
 */
export function extractCreativesFromAds(ads: MetaAd[]): {
  creatives: Map<string, NormalizedCreative>
  adMappings: AdCreativeMapping[]
} {
  const creatives = new Map<string, NormalizedCreative>()
  const adMappings: AdCreativeMapping[] = []

  for (const ad of ads) {
    if (!ad.creative) continue
    const normalized = normalizeCreative(ad.creative)
    // Deduplicate by metaCreativeId
    if (!creatives.has(normalized.metaCreativeId)) {
      creatives.set(normalized.metaCreativeId, normalized)
    }
    adMappings.push({
      metaAdId: ad.id,
      metaCreativeId: ad.creative.id,
      effectiveStatus: ad.effective_status,
      configuredStatus: ad.configured_status,
    })
  }

  return { creatives, adMappings }
}

/**
 * Derives creative status from the statuses of all ads linked to it.
 * active  = all linked ads are active
 * paused  = all linked ads are paused/inactive
 * mixed   = mix of active and inactive ads
 */
export function deriveCreativeStatus(
  adStatuses: string[]
): "active" | "paused" | "mixed" {
  const ACTIVE_STATUSES = ["ACTIVE", "CAMPAIGN_PAUSED", "ADSET_PAUSED"]
  // Meta uses ACTIVE for truly running, others for paused-by-parent
  const activeStatuses = new Set(["ACTIVE"])
  const pausedStatuses = new Set(["PAUSED", "DISAPPROVED", "DELETED", "ARCHIVED"])

  const hasActive = adStatuses.some((s) => activeStatuses.has(s))
  const hasPaused = adStatuses.some((s) => pausedStatuses.has(s) || !activeStatuses.has(s))

  if (hasActive && hasPaused) return "mixed"
  if (hasActive) return "active"
  return "paused"
}

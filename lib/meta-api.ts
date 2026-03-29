const BASE_URL = `https://graph.facebook.com/${process.env.META_API_VERSION ?? "v23.0"}`
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN ?? ""

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MetaAdAccount {
  id: string // "act_12345"
  name: string
  currency: string
  timezone_name: string
  account_status: number
}

export interface MetaCampaign {
  id: string
  name: string
  objective: string
  status: string
}

export interface MetaAdSet {
  id: string
  name: string
  status: string
  campaign_id: string
}

export interface MetaCreativeData {
  id: string
  name?: string
  body?: string
  title?: string
  image_url?: string
  thumbnail_url?: string
  video_id?: string
  object_story_spec?: {
    link_data?: {
      image_hash?: string
      call_to_action?: { type?: string }
      link?: string
      caption?: string
      description?: string
      message?: string
    }
    video_data?: {
      video_id?: string
      image_url?: string
      image_hash?: string
      call_to_action?: { type?: string }
    }
  }
  asset_feed_spec?: {
    images?: Array<{ hash?: string; url?: string }>
    videos?: Array<{ video_id?: string; thumbnail_url?: string }>
  }
}

export interface MetaAd {
  id: string
  name: string
  effective_status: string
  configured_status: string
  adset_id: string
  creative?: MetaCreativeData
}

export interface MetaInsightRow {
  ad_id: string
  date_start: string
  date_stop: string
  spend: string
  impressions: string
  clicks: string
  ctr: string
  cpc: string
  cpm: string
  actions?: Array<{ action_type: string; value: string }>
  action_values?: Array<{ action_type: string; value: string }>
}

// ─── Pagination helper ────────────────────────────────────────────────────────

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const results: T[] = []
  let nextUrl: string | null = url

  while (nextUrl) {
    const sep = nextUrl.includes("?") ? "&" : "?"
    const fullUrl = nextUrl.includes("access_token=")
      ? nextUrl
      : `${nextUrl}${sep}access_token=${ACCESS_TOKEN}`

    const res = await fetch(fullUrl)
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Meta API error ${res.status}: ${err}`)
    }

    const json = (await res.json()) as {
      data: T[]
      paging?: { next?: string }
    }

    results.push(...json.data)
    nextUrl = json.paging?.next ?? null
  }

  return results
}

async function fetchOne<T>(path: string, fields: string): Promise<T> {
  const url = `${BASE_URL}${path}?fields=${encodeURIComponent(fields)}&access_token=${ACCESS_TOKEN}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meta API error ${res.status}: ${err}`)
  }
  return res.json() as Promise<T>
}

// ─── Public API functions ─────────────────────────────────────────────────────

export async function fetchAdAccounts(): Promise<MetaAdAccount[]> {
  const url = `${BASE_URL}/me/adaccounts?fields=id,name,currency,timezone_name,account_status&limit=100&access_token=${ACCESS_TOKEN}`
  return fetchAllPages<MetaAdAccount>(url)
}

export async function fetchCampaigns(metaAccountId: string): Promise<MetaCampaign[]> {
  const accountId = metaAccountId.startsWith("act_") ? metaAccountId : `act_${metaAccountId}`
  const url = `${BASE_URL}/${accountId}/campaigns?fields=id,name,objective,status&limit=100&access_token=${ACCESS_TOKEN}`
  return fetchAllPages<MetaCampaign>(url)
}

export async function fetchAdSets(metaAccountId: string): Promise<MetaAdSet[]> {
  const accountId = metaAccountId.startsWith("act_") ? metaAccountId : `act_${metaAccountId}`
  const url = `${BASE_URL}/${accountId}/adsets?fields=id,name,status,campaign_id&limit=100&access_token=${ACCESS_TOKEN}`
  return fetchAllPages<MetaAdSet>(url)
}

export async function fetchAds(metaAccountId: string): Promise<MetaAd[]> {
  const accountId = metaAccountId.startsWith("act_") ? metaAccountId : `act_${metaAccountId}`
  // Use a smaller field set to avoid Meta API 500 errors on large accounts
  const creativeFields = "id,name,body,title,image_url,thumbnail_url,video_id,object_story_spec{link_data{image_hash,call_to_action,link},video_data{video_id,image_url,image_hash,call_to_action}}"
  const fields = `id,name,effective_status,configured_status,adset_id,creative{${creativeFields}}`
  const url = `${BASE_URL}/${accountId}/ads?fields=${encodeURIComponent(fields)}&limit=50&access_token=${ACCESS_TOKEN}`
  return fetchAllPages<MetaAd>(url)
}

export async function fetchAdInsights(
  metaAccountId: string,
  datePreset = "last_30d"
): Promise<MetaInsightRow[]> {
  const accountId = metaAccountId.startsWith("act_") ? metaAccountId : `act_${metaAccountId}`
  const fields = "ad_id,date_start,date_stop,spend,impressions,clicks,ctr,cpc,cpm,actions,action_values"
  const url = `${BASE_URL}/${accountId}/insights?fields=${encodeURIComponent(fields)}&level=ad&time_increment=1&date_preset=${datePreset}&limit=500&access_token=${ACCESS_TOKEN}`
  return fetchAllPages<MetaInsightRow>(url)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function extractPurchases(
  actions?: Array<{ action_type: string; value: string }>
): number {
  if (!actions) return 0
  const purchaseActions = actions.filter(
    (a) =>
      a.action_type === "purchase" ||
      a.action_type === "omni_purchase" ||
      a.action_type === "offsite_conversion.fb_pixel_purchase"
  )
  return purchaseActions.reduce((sum, a) => sum + parseFloat(a.value || "0"), 0)
}

export function extractPurchaseValue(
  actionValues?: Array<{ action_type: string; value: string }>
): number {
  if (!actionValues) return 0
  const purchaseValues = actionValues.filter(
    (a) =>
      a.action_type === "purchase" ||
      a.action_type === "omni_purchase" ||
      a.action_type === "offsite_conversion.fb_pixel_purchase"
  )
  return purchaseValues.reduce((sum, a) => sum + parseFloat(a.value || "0"), 0)
}

export function isVideo(creative: MetaCreativeData): boolean {
  if (creative.video_id) return true
  if (creative.object_story_spec?.video_data?.video_id) return true
  if (creative.asset_feed_spec?.videos?.length) return true
  return false
}

export function extractThumbnail(creative: MetaCreativeData): string | null {
  if (creative.thumbnail_url) return creative.thumbnail_url
  if (creative.image_url) return creative.image_url
  if (creative.object_story_spec?.video_data?.image_url) {
    return creative.object_story_spec.video_data.image_url
  }
  if (creative.asset_feed_spec?.images?.[0]?.url) {
    return creative.asset_feed_spec.images[0].url
  }
  return null
}

export function extractDestinationUrl(creative: MetaCreativeData): string | null {
  return creative.object_story_spec?.link_data?.link ?? null
}

export function extractCtaType(creative: MetaCreativeData): string | null {
  return (
    creative.object_story_spec?.link_data?.call_to_action?.type ??
    creative.object_story_spec?.video_data?.call_to_action?.type ??
    null
  )
}

export type CreativeStatus = "active" | "paused" | "mixed"
export type CreativeType = "image" | "video"

export interface Creative {
  id: string
  name: string
  thumbnail: string
  type: CreativeType
  status: CreativeStatus
  clientName?: string
  metaCreativeId?: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  purchases: number
  cpa: number
  roas: number
  firstSeen: string
  lastSeen: string
  campaigns: string[]
  ads: string[]
}

export interface Client {
  id: string
  name: string
  logo?: string
  status: "active" | "inactive"
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  purchases: number
  cpa: number
  roas: number
  creativesCount: number
  activeCreatives: number
  topPerformer?: string
}

export interface Insight {
  id: string
  type: "warning" | "success" | "info"
  category: "performance" | "budget" | "creative" | "audience"
  title: string
  description: string
  clientName: string
  creativeName?: string
  creativeThumbnail?: string
  creativeType?: CreativeType
  metric?: string
  value?: number
  comparison?: number
  date: string
}

export interface AdAccount {
  id: string
  name: string
  clientId: string
}

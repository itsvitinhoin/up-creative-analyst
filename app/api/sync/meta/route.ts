import { NextResponse } from "next/server"
import { syncFromMeta } from "@/lib/sync"

export const maxDuration = 300 // 5 minutes (Vercel Pro/Enterprise)

export async function POST() {
  if (!process.env.META_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "META_ACCESS_TOKEN is not configured" },
      { status: 503 }
    )
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 }
    )
  }

  try {
    console.log("[sync/meta] Starting Meta sync...")
    const result = await syncFromMeta()
    console.log("[sync/meta] Sync complete:", result)

    return NextResponse.json(result, {
      status: result.success ? 200 : 207, // 207 Multi-Status for partial success
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[sync/meta] Sync failed:", message)
    return NextResponse.json(
      { error: "Sync failed", details: message },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { discoverAccounts } from "@/lib/sync"

export const maxDuration = 60

export async function POST() {
  if (!process.env.META_ACCESS_TOKEN) {
    return NextResponse.json({ error: "META_ACCESS_TOKEN is not configured" }, { status: 503 })
  }

  try {
    const result = await discoverAccounts()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[meta/discover-accounts]", message)
    return NextResponse.json({ error: "Failed to discover accounts", details: message }, { status: 500 })
  }
}

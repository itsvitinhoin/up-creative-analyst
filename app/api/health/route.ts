import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const checks: Record<string, string> = {}

  checks.DATABASE_URL = process.env.DATABASE_URL
    ? `set (${process.env.DATABASE_URL.slice(0, 30)}...)`
    : "MISSING"

  checks.META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
    ? `set (${process.env.META_ACCESS_TOKEN.slice(0, 10)}...)`
    : "MISSING"

  try {
    await db.$queryRaw`SELECT 1`
    checks.database = "connected"
  } catch (err) {
    checks.database = `ERROR: ${err instanceof Error ? err.message : String(err)}`
  }

  return NextResponse.json(checks)
}

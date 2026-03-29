import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { syncAccountById } from "@/lib/sync"

export const maxDuration = 300

export async function POST() {
  const accounts = await db.adAccount.findMany({
    where: { isSelected: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  if (accounts.length === 0) {
    return NextResponse.json({ synced: 0, errors: [] })
  }

  const errors: string[] = []
  let synced = 0

  for (const account of accounts) {
    try {
      await syncAccountById(account.id)
      synced++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[sync-selected] Error on ${account.name}: ${message}`)
      errors.push(`${account.name}: ${message}`)
    }
  }

  return NextResponse.json({ synced, total: accounts.length, errors })
}

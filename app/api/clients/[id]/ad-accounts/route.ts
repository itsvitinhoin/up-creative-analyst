import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { adAccounts as mockAdAccounts } from "@/lib/mock-data"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.DEV_FALLBACK_MOCKS === "true") {
    const { id } = await params
    return NextResponse.json(mockAdAccounts.filter((a) => a.clientId === id))
  }

  try {
    const { id } = await params
    const accounts = await db.adAccount.findMany({
      where: { clientId: id },
      select: {
        id: true,
        name: true,
        clientId: true,
        metaAccountId: true,
        currency: true,
        timezone: true,
        accountStatus: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(
      accounts.map((a) => ({
        id: a.id,
        name: a.name,
        clientId: a.clientId,
        metaAccountId: a.metaAccountId,
        currency: a.currency,
      }))
    )
  } catch (err) {
    console.error("[api/clients/[id]/ad-accounts]", err)
    return NextResponse.json({ error: "Failed to load ad accounts" }, { status: 500 })
  }
}

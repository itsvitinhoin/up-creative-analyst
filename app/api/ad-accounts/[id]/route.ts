import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json() as {
      isSelected?: boolean
      syncEnabled?: boolean
    }

    const excludedAt =
      body.isSelected === false
        ? new Date()
        : body.isSelected === true
        ? null
        : undefined

    const account = await db.adAccount.update({
      where: { id },
      data: {
        ...(body.isSelected !== undefined ? { isSelected: body.isSelected } : {}),
        ...(body.syncEnabled !== undefined ? { syncEnabled: body.syncEnabled } : {}),
        ...(excludedAt !== undefined ? { excludedAt } : {}),
      },
      select: {
        id: true,
        name: true,
        isSelected: true,
        syncEnabled: true,
        excludedAt: true,
        clientId: true,
      },
    })

    return NextResponse.json(account)
  } catch (err) {
    console.error("[api/ad-accounts/[id] PATCH]", err)
    return NextResponse.json({ error: "Failed to update ad account" }, { status: 500 })
  }
}

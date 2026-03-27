import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json() as {
      isVisible?: boolean
      isActive?: boolean
      status?: string
    }

    const client = await db.client.update({
      where: { id },
      data: {
        ...(body.isVisible !== undefined ? { isVisible: body.isVisible } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
      select: { id: true, name: true, isVisible: true, isActive: true, status: true },
    })

    return NextResponse.json(client)
  } catch (err) {
    console.error("[api/clients/[id] PATCH]", err)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

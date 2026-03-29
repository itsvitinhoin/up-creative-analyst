import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fetchVideoSource } from "@/lib/meta-api"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const asset = await db.creativeAsset.findUnique({
      where: { id },
      select: { metaCreativeId: true, assetType: true },
    })

    if (!asset) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (asset.assetType !== "video") {
      return NextResponse.json({ url: null })
    }

    const url = await fetchVideoSource(asset.metaCreativeId)
    return NextResponse.json({ url })
  } catch (err) {
    console.error("[api/creatives/[id]/video-url]", err)
    return NextResponse.json({ url: null })
  }
}

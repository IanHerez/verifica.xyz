import { NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken, extractAccessToken } from "@/lib/privy-verification"
import { signDocument } from "@/lib/documents-storage"

/**
 * API Route para firmar un documento
 * 
 * POST /api/documents/[id]/sign
 * Body: { signerAddress: string }
 */

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const accessToken = extractAccessToken(authHeader)

  if (!accessToken) {
    return null
  }

  const claims = await verifyPrivyToken(accessToken)
  return claims
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await verifyAuth(request)
    if (!claims) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id: documentId } = await params
    const body = await request.json()
    const { signerAddress } = body

    if (!signerAddress) {
      return NextResponse.json({ error: "signerAddress requerido" }, { status: 400 })
    }

    const success = signDocument(documentId, signerAddress)
    if (!success) {
      return NextResponse.json({ error: "Error al firmar documento o documento no encontrado" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Documento firmado exitosamente" })
  } catch (error) {
    console.error("[API] Error firmando documento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


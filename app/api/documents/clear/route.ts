import { NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken, extractAccessToken } from "@/lib/privy-verification"
import { clearAllDocuments } from "@/lib/documents-storage"

/**
 * API Route para limpiar todos los documentos
 * POST /api/documents/clear - Limpia todos los documentos de la cache
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

export async function POST(request: NextRequest) {
  try {
    const claims = await verifyAuth(request)
    if (!claims) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    clearAllDocuments()
    
    return NextResponse.json({ 
      success: true, 
      message: "Todos los documentos han sido eliminados de la cache" 
    })
  } catch (error) {
    console.error("[API] Error limpiando documentos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken, extractAccessToken } from "@/lib/privy-verification"
import { getAllDocuments, saveDocument, signDocument, type DocumentData } from "@/lib/documents-storage"

/**
 * API Route para operaciones específicas de un documento
 * 
 * GET /api/documents/[id] - Obtener documento por ID
 * PATCH /api/documents/[id] - Actualizar documento
 * POST /api/documents/[id]/sign - Firmar documento
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

// GET - Obtener documento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await verifyAuth(request)
    if (!claims) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const allDocs = getAllDocuments()
    const document = allDocs[id]

    if (!document) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("[API] Error obteniendo documento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// PATCH - Actualizar documento
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await verifyAuth(request)
    if (!claims) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const allDocs = getAllDocuments()
    const document = allDocs[id]

    if (!document) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const updatedDocument: DocumentData = {
      ...document,
      ...body,
      id: document.id, // No permitir cambiar el ID
      createdAt: document.createdAt, // No permitir cambiar la fecha de creación
    }

    saveDocument(updatedDocument)

    return NextResponse.json({ document: updatedDocument, success: true })
  } catch (error) {
    console.error("[API] Error actualizando documento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


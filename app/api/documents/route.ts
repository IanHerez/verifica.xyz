import { NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken, extractAccessToken } from "@/lib/privy-verification"
import { getAllDocuments, saveDocument, deleteDocument, type DocumentData } from "@/lib/documents-storage"

/**
 * API Route para gestionar documentos
 * 
 * GET /api/documents - Obtener todos los documentos (filtrados por rol si se especifica)
 * POST /api/documents - Crear nuevo documento
 * DELETE /api/documents?id=... - Eliminar documento
 */

// Helper para verificar autenticación
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const accessToken = extractAccessToken(authHeader)

  if (!accessToken) {
    return null
  }

  const claims = await verifyPrivyToken(accessToken)
  return claims
}

// GET - Obtener documentos
export async function GET(request: NextRequest) {
  try {
    const claims = await verifyAuth(request)
    if (!claims) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get("role") // "alumno" | "maestro" | "rector"
    const memberAddress = searchParams.get("memberAddress")
    const targetRole = searchParams.get("targetRole") // "alumnos" | "maestros"

    const allDocs = getAllDocuments()
    let documents = Object.values(allDocs)

    // Filtrar por rol de destinatario si se especifica
    if (targetRole) {
      documents = documents.filter((doc) => doc.sentTo.role === targetRole)
    }

    // Si es alumno o maestro, filtrar por documentos asignados
    if (role && memberAddress && (role === "alumno" || role === "maestro")) {
      documents = documents.filter((doc) => {
        // Si el documento fue enviado a "todos" del rol
        if (!doc.sentTo.memberAddress && doc.sentTo.role === (role === "alumno" ? "alumnos" : "maestros")) {
          return true
        }
        // Si el documento fue enviado específicamente a este miembro
        return doc.sentTo.memberAddress?.toLowerCase() === memberAddress.toLowerCase()
      })
    }

    // Ordenar por fecha de creación (más reciente primero)
    documents.sort((a, b) => b.createdAt - a.createdAt)

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("[API] Error obteniendo documentos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST - Crear documento
export async function POST(request: NextRequest) {
  try {
    const claims = await verifyAuth(request)
    if (!claims) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      institution,
      issueDate,
      category,
      files,
      sentTo,
      createdBy,
      blockchainTxHash,
      blockchainChainId,
    } = body

    // Validar campos requeridos
    if (!title || !institution || !files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "Campos requeridos: title, institution, files" }, { status: 400 })
    }

    if (!sentTo || !sentTo.role) {
      return NextResponse.json({ error: "Campo requerido: sentTo.role" }, { status: 400 })
    }

    // Crear documento
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const document: DocumentData = {
      id: documentId,
      title,
      description,
      institution,
      issueDate,
      category,
      files: files.map((f: any) => ({
        name: f.name,
        size: f.size,
        hash: f.hash,
        ipfsCid: f.ipfsCid, // CID de IPFS si está disponible
      })),
      createdAt: Date.now(),
      createdBy: createdBy || "",
      sentTo: {
        role: sentTo.role,
        memberAddress: sentTo.memberAddress || undefined,
      },
      status: "pending",
      signedBy: [],
      blockchainTxHash: blockchainTxHash || undefined,
      blockchainChainId: blockchainChainId || undefined,
    }

    // Guardar documento
    saveDocument(document)

    return NextResponse.json({ document, success: true }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creando documento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// DELETE - Eliminar documento
export async function DELETE(request: NextRequest) {
  try {
    const claims = await verifyAuth(request)
    if (!claims) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json({ error: "ID de documento requerido" }, { status: 400 })
    }

    const success = deleteDocument(documentId)
    if (!success) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error eliminando documento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


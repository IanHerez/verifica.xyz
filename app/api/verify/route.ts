import { NextRequest, NextResponse } from "next/server"
import { getAllDocuments } from "@/lib/documents-storage"

/**
 * API Route para verificar documentos públicamente
 * 
 * GET /api/verify?hash=... - Buscar documento por hash
 * 
 * Esta ruta es pública (no requiere autenticación)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const hash = searchParams.get("hash")

    if (!hash) {
      return NextResponse.json({ error: "Hash requerido" }, { status: 400 })
    }

    // Normalizar hash (quitar 0x si existe y convertir a lowercase)
    const normalizedHash = hash.toLowerCase().startsWith("0x") ? hash.slice(2) : hash

    // Buscar en todos los documentos
    const allDocs = getAllDocuments()
    const documents = Object.values(allDocs)

    // Buscar documento por hash en cualquier archivo
    const matchingDocs = documents.filter((doc) => {
      return doc.files.some((file) => {
        if (!file.hash) return false
        const fileHash = file.hash.toLowerCase().startsWith("0x") ? file.hash.slice(2) : file.hash.toLowerCase()
        return fileHash === normalizedHash
      })
    })

    if (matchingDocs.length === 0) {
      return NextResponse.json({
        isVerified: false,
        status: "unverified",
        message: "Documento no encontrado",
      })
    }

    // Retornar el primer documento encontrado (o todos si hay múltiples)
    const document = matchingDocs[0]

    // Determinar estado
    let status: "verified" | "pending" | "unverified" = "unverified"
    if (document.status === "signed") {
      status = "verified"
    } else if (document.status === "pending") {
      status = "pending"
    }

    return NextResponse.json({
      isVerified: status === "verified",
      status,
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        institution: document.institution,
        issueDate: document.issueDate,
        category: document.category,
        createdAt: document.createdAt,
        createdBy: document.createdBy,
        files: document.files.map((f) => ({
          name: f.name,
          size: f.size,
          hash: f.hash,
          ipfsCid: f.ipfsCid,
          ipfsUrl: f.ipfsUrl,
        })),
        status: document.status,
        signedBy: document.signedBy || [],
      },
      // Metadata adicional
      verifiedAt: document.status === "signed" ? document.createdAt : null,
      confidence: status === "verified" ? 99 : status === "pending" ? 50 : 0,
    })
  } catch (error) {
    console.error("[API] Error verificando documento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


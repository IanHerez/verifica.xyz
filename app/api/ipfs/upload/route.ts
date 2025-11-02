import { NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken, extractAccessToken } from "@/lib/privy-verification"

/**
 * API Route para subir archivos a IPFS usando Pinata
 * 
 * POST /api/ipfs/upload
 * Body: FormData con archivo(s)
 * 
 * Requiere variables de entorno:
 * - PINATA_API_KEY
 * - PINATA_SECRET_KEY
 * 
 * Obtén tus keys en: https://app.pinata.cloud/
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

    // Verificar que Pinata está configurado
    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecretKey = process.env.PINATA_SECRET_KEY

    if (!pinataApiKey || !pinataSecretKey) {
      return NextResponse.json(
        { error: "IPFS no configurado. Configura PINATA_API_KEY y PINATA_SECRET_KEY" },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Archivo demasiado grande (máximo 10MB)" }, { status: 400 })
    }

    // Convertir File a Blob para Pinata
    const fileBlob = new Blob([await file.arrayBuffer()])

    // Crear FormData para Pinata
    const pinataData = new FormData()
    pinataData.append("file", fileBlob, file.name)

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
      },
    })
    pinataData.append("pinataMetadata", metadata)

    const options = JSON.stringify({
      cidVersion: 0,
    })
    pinataData.append("pinataOptions", options)

    // Subir a Pinata
    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretKey,
      },
      body: pinataData,
    })

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text()
      console.error("[IPFS] Error de Pinata:", errorText)
      return NextResponse.json(
        { error: "Error subiendo archivo a IPFS" },
        { status: pinataResponse.status }
      )
    }

    const result = await pinataResponse.json()
    const ipfsHash = result.IpfsHash // CID de IPFS
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`

    return NextResponse.json({
      success: true,
      ipfsHash,
      ipfsUrl,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error("[API] Error subiendo archivo a IPFS:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


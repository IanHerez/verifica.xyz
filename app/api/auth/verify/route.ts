import { NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken, extractAccessToken } from "@/lib/privy-verification"

/**
 * API Route para verificar access tokens de Privy
 * 
 * Uso:
 * POST /api/auth/verify
 * Headers: Authorization: Bearer <access-token>
 * 
 * Respuesta:
 * {
 *   "valid": boolean,
 *   "userId"?: string,
 *   "sessionId"?: string,
 *   "error"?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Extraer token del header Authorization
    const authHeader = request.headers.get("authorization")
    const accessToken = extractAccessToken(authHeader)

    if (!accessToken) {
      return NextResponse.json(
        { valid: false, error: "No access token provided" },
        { status: 401 }
      )
    }

    // Verificar el token usando la JWKS de Privy
    const claims = await verifyPrivyToken(accessToken)

    if (!claims) {
      return NextResponse.json(
        { valid: false, error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    // Token válido
    return NextResponse.json({
      valid: true,
      userId: claims.userId,
      sessionId: claims.sessionId,
      appId: claims.appId,
      issuedAt: new Date(claims.issuedAt * 1000).toISOString(),
      expiration: new Date(claims.expiration * 1000).toISOString(),
    })
  } catch (error) {
    console.error("Error verifying token:", error)
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint para verificar tokens (útil para testing)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const accessToken = extractAccessToken(authHeader)

  if (!accessToken) {
    return NextResponse.json(
      { error: "Add 'Authorization: Bearer <token>' header" },
      { status: 400 }
    )
  }

  const claims = await verifyPrivyToken(accessToken)

  if (!claims) {
    return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 401 })
  }

  return NextResponse.json({
    valid: true,
    claims,
  })
}


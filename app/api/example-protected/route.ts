import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "../middleware/auth"

/**
 * Ejemplo de API route protegida usando la JWKS de Privy
 * 
 * Esta ruta requiere autenticación válida de Privy.
 * El token se verifica usando la JWKS URL de Privy.
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth(request)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    message: "Esta es una ruta protegida",
    userId: user.userId,
    sessionId: user.sessionId,
  })
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  return NextResponse.json({
    message: "Datos procesados",
    userId: user.userId,
    data: body,
  })
}


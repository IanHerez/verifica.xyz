import { NextRequest } from "next/server"
import { verifyPrivyToken, extractAccessToken } from "@/lib/privy-verification"

/**
 * Middleware helper para verificar autenticación en API routes
 * 
 * Uso en API routes:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const user = await requireAuth(request)
 *   if (!user) {
 *     return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
 *   }
 *   // user.userId contiene el Privy DID
 * }
 * ```
 */
export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const accessToken = extractAccessToken(authHeader)

  if (!accessToken) {
    return null
  }

  const claims = await verifyPrivyToken(accessToken)
  return claims
}

/**
 * Middleware opcional: verifica auth pero no bloquea si falla
 * Útil para endpoints que pueden funcionar con o sin auth
 */
export async function optionalAuth(request: NextRequest) {
  return await requireAuth(request)
}


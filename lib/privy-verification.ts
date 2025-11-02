/**
 * Utilidades para verificación de Access Tokens de Privy usando JWKS
 * 
 * Los access tokens de Privy son JWTs firmados con ES256.
 * La JWKS (JSON Web Key Set) contiene las claves públicas para verificar estos tokens.
 * 
 * JWKS URL: https://auth.privy.io/api/v1/apps/{appId}/jwks.json
 * Tu JWKS: https://auth.privy.io/api/v1/apps/cmhgocxay01x6jx0cbpia4zcb/jwks.json
 * 
 * Basado en: https://docs.privy.io/authentication/user-authentication/access-tokens
 */

import { jwtVerify, createRemoteJWKSet } from "jose"

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmhgocxay01x6jx0cbpia4zcb"

// JWKS URL de Privy para obtener las claves públicas de verificación
// Esta URL contiene las claves EC (P-256) para verificar tokens ES256
const JWKS_URL = `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`

// Cache de JWKS para evitar requests repetidos
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null

/**
 * Obtiene el JWKS remoto de Privy (con cache)
 * Esto evita hacer requests repetidos a la API de Privy
 */
function getJWKS() {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(JWKS_URL))
  }
  return jwksCache
}

/**
 * Verifica un access token de Privy
 * 
 * @param accessToken - El JWT access token del usuario
 * @returns Claims del token si es válido, null si es inválido
 * 
 * @example
 * ```ts
 * const token = req.headers.authorization?.replace('Bearer ', '')
 * const claims = await verifyPrivyToken(token)
 * if (claims) {
 *   console.log('User ID:', claims.sub) // Privy DID del usuario
 * }
 * ```
 */
export async function verifyPrivyToken(accessToken: string | null | undefined) {
  if (!accessToken) {
    return null
  }

  try {
    const JWKS = getJWKS()

    // Verificar el token usando la JWKS de Privy
    const { payload } = await jwtVerify(accessToken, JWKS, {
      issuer: "privy.io", // Debe ser privy.io
      audience: PRIVY_APP_ID, // Debe ser tu App ID
    })

    return {
      userId: payload.sub as string, // Privy DID del usuario
      sessionId: payload.sid as string,
      appId: payload.aud as string,
      issuedAt: payload.iat as number,
      expiration: payload.exp as number,
      issuer: payload.iss as string,
    }
  } catch (error) {
    console.error("Error verificando token de Privy:", error)
    return null
  }
}

/**
 * Extrae el access token del header Authorization
 * 
 * @param authHeader - El valor del header Authorization (Bearer <token>)
 * @returns El token sin el prefijo "Bearer " o null
 */
export function extractAccessToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) {
    return null
  }

  return authHeader.replace(/^Bearer\s+/i, "") || null
}


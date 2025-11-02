# Integración de JWKS para Verificación de Tokens Privy

## ¿Qué es JWKS?

JWKS (JSON Web Key Set) es un conjunto de claves públicas que se usan para verificar la firma de los JWTs (JSON Web Tokens) emitidos por Privy.

**Tu JWKS URL**: `https://auth.privy.io/api/v1/apps/cmhgocxay01x6jx0cbpia4zcb/jwks.json`

Esta URL contiene las claves públicas EC (P-256) que Privy usa para firmar tus access tokens con el algoritmo ES256.

## ¿Dónde se Usa?

La JWKS URL **NO se agrega manualmente en ningún lugar**. La función `verifyPrivyToken()` en `lib/privy-verification.ts` la construye automáticamente usando tu `NEXT_PUBLIC_PRIVY_APP_ID`:

```typescript
// lib/privy-verification.ts construye automáticamente:
const JWKS_URL = `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`;
```

## Cómo Funciona

### 1. En el Cliente (Frontend)

El cliente obtiene el access token y lo envía al backend:

```typescript
import { usePrivy } from "@privy-io/react-auth";

function MyComponent() {
  const { getAccessToken } = usePrivy();

  const makeRequest = async () => {
    // Obtener token (automáticamente refrescado si es necesario)
    const token = await getAccessToken();

    // Enviar al backend con el token
    const response = await fetch("/api/protected", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: "..." }),
    });
  };
}
```

### 2. En el Servidor (Backend)

El servidor verifica el token usando la JWKS:

```typescript
// app/api/protected/route.ts
import { requireAuth } from "@/app/api/middleware/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Verifica automáticamente usando JWKS
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // user.userId contiene el Privy DID del usuario autenticado
  return NextResponse.json({
    message: "Success",
    userId: user.userId,
  });
}
```

## Flujo Completo

```
1. Usuario se autentica → Privy emite access token (JWT ES256)
   ↓
2. Cliente obtiene token con getAccessToken()
   ↓
3. Cliente envía request con header: Authorization: Bearer <token>
   ↓
4. Servidor recibe request
   ↓
5. verifyPrivyToken() obtiene JWKS de Privy (https://auth.privy.io/api/v1/apps/{appId}/jwks.json)
   ↓
6. Verifica firma del token usando las claves públicas de JWKS
   ↓
7. Verifica claims (issuer, audience, expiration)
   ↓
8. Retorna claims si es válido, null si es inválido
```

## Verificación Manual

Puedes probar la verificación directamente:

```bash
# POST /api/auth/verify
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

O desde el frontend:

```typescript
const token = await getAccessToken();
const response = await fetch("/api/auth/verify", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
// { valid: true, userId: "...", sessionId: "..." }
```

## Estructura de la JWKS

Tu JWKS contiene claves EC (P-256) con este formato:

```json
{
  "keys": [
    {
      "kty": "EC",
      "x": "...",
      "y": "...",
      "crv": "P-256",
      "kid": "...",
      "use": "sig",
      "alg": "ES256"
    }
  ]
}
```

## Cache de JWKS

La librería `jose` cachea automáticamente las claves JWKS para:

- ✅ Evitar requests repetidos a Privy
- ✅ Mejorar rendimiento
- ✅ Reducir latencia en verificación

## Ventajas de Usar JWKS

1. **Automático**: Privy actualiza las claves automáticamente
2. **Seguro**: Solo claves públicas, no secretos
3. **Eficiente**: Cache automático de claves
4. **Escalable**: Funciona sin configurar claves manualmente

## Troubleshooting

### Error: "JWKS URL not found"

- Verifica que `NEXT_PUBLIC_PRIVY_APP_ID` esté configurado correctamente
- Asegúrate de que el App ID sea `cmhgocxay01x6jx0cbpia4zcb`

### Error: "Invalid token"

- El token puede estar expirado (expiran después de 1 hora)
- Usa `getAccessToken()` que refresca automáticamente

### Error: "Token verification failed"

- Verifica que el token sea válido y no esté manipulado
- Asegúrate de que el issuer sea "privy.io" y el audience sea tu App ID

## Referencias

- [Privy Access Tokens](https://docs.privy.io/authentication/user-authentication/access-tokens)
- [JWKS Specification (RFC 7517)](https://tools.ietf.org/html/rfc7517)
- [jose Library Documentation](https://github.com/panva/jose)

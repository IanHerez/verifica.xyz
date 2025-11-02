# Optimización de Access Tokens de Privy

## Problema: Latencia en Verificación

La verificación de Privy puede ser lenta porque:

1. Los access tokens no están pre-cargados
2. Los tokens expiran después de 1 hora y necesitan refresh
3. No hay manejo proactivo de tokens próximos a expirar

## Solución Implementada

Basado en la [documentación oficial de Privy](https://docs.privy.io/authentication/user-authentication/access-tokens), implementamos:

### 1. Pre-carga de Tokens

Los tokens se cargan automáticamente cuando el usuario está autenticado:

```typescript
useEffect(() => {
  if (authenticated && ready) {
    getAccessToken(); // Pre-carga el token
  }
}, [authenticated, ready]);
```

**Beneficio**: Reduce latencia en requests subsecuentes.

### 2. Refresh Automático

`getAccessToken()` de Privy **automáticamente refresca** tokens que:

- Están próximos a expirar
- Han expirado

```typescript
// Privy automáticamente refresca si es necesario
const token = await getAccessToken();
```

**Beneficio**: No necesitas manejar manualmente el refresh.

### 3. Refresh Proactivo

Refrescamos tokens cada 45 minutos (antes de que expiren a la hora):

```typescript
useEffect(() => {
  const refreshInterval = setInterval(() => {
    fetchToken(true); // Refresh cada 45 min
  }, 45 * 60 * 1000);

  return () => clearInterval(refreshInterval);
}, [authenticated, ready]);
```

**Beneficio**: Evita que los tokens expiren durante uso activo.

### 4. Manejo de Errores con Retry

Si un token está inválido o expirado, intentamos refrescarlo con backoff:

```typescript
if (errorMessage.includes("invalid auth token")) {
  // Retry con exponential backoff
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const refreshedToken = await getAccessToken();
}
```

**Beneficio**: Recuperación automática de errores de token.

## Configuración en PrivyProvider

```typescript
sdkOptions: {
  prefetchAccessToken: true, // Pre-carga tokens
  sessionStorage: window.localStorage, // Cache de sesiones
}
```

## Uso del Hook `usePrivyToken`

```typescript
import { usePrivyToken } from "@/hooks/use-privy-token";

function MyComponent() {
  const { token, loading, makeAuthenticatedRequest } = usePrivyToken();

  const handleRequest = async () => {
    // El token ya está pre-cargado y refrescado si es necesario
    const response = await makeAuthenticatedRequest("/api/endpoint", {
      method: "POST",
      body: JSON.stringify({ data: "..." }),
    });
  };
}
```

## Access Token Format

Los tokens de Privy son JWTs con esta estructura:

```typescript
{
  sid: string,     // Session ID
  sub: string,    // User's Privy DID
  iss: "privy.io", // Issuer
  aud: string,    // Your App ID
  iat: number,    // Issued at timestamp
  exp: number     // Expiration (1 hour after issue)
}
```

## HTTP-only Cookies (Opcional, Recomendado para Producción)

Para mejor rendimiento y seguridad, puedes usar cookies en lugar de local storage:

```typescript
// En PrivyProvider config
sessionStorageMode: "cookie";
```

Con cookies, el token se envía automáticamente en requests y no necesitas agregarlo manualmente al header `Authorization`.

## Verificación en Backend usando JWKS

Para verificar tokens en el backend usando la JWKS URL de Privy:

### Método 1: Usando la utilidad `verifyPrivyToken` (Recomendado)

```typescript
import { verifyPrivyToken, extractAccessToken } from "@/lib/privy-verification";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Extraer token del header
  const authHeader = request.headers.get("authorization");
  const accessToken = extractAccessToken(authHeader);

  if (!accessToken) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  // Verificar usando JWKS (automáticamente usa tu JWKS URL)
  const claims = await verifyPrivyToken(accessToken);

  if (!claims) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // claims.userId contiene el Privy DID del usuario
  return NextResponse.json({ userId: claims.userId });
}
```

### Método 2: Usando el middleware helper

```typescript
import { requireAuth } from "@/app/api/middleware/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // user.userId contiene el Privy DID
  return NextResponse.json({ userId: user.userId });
}
```

### JWKS URL

La JWKS URL de tu app es:

```
https://auth.privy.io/api/v1/apps/cmhgocxay01x6jx0cbpia4zcb/jwks.json
```

Esta URL contiene las claves públicas (EC P-256) para verificar los tokens ES256.

**No necesitas configurar esta URL manualmente** - la función `verifyPrivyToken` la usa automáticamente basándose en tu `NEXT_PUBLIC_PRIVY_APP_ID`.

### Cache de JWKS

Las claves JWKS se cachean automáticamente para evitar requests repetidos a la API de Privy, mejorando el rendimiento.

## Mejores Prácticas

1. ✅ **Pre-cargar tokens** cuando el usuario está autenticado
2. ✅ **Usar `getAccessToken()`** que maneja refresh automáticamente
3. ✅ **Refrescar proactivamente** antes de que expiren
4. ✅ **Manejar errores** con retry y backoff
5. ✅ **Usar cookies HTTP-only** en producción para mejor seguridad

## Referencias

- [Privy Access Tokens Documentation](https://docs.privy.io/authentication/user-authentication/access-tokens)
- [Token Verification Guide](https://docs.privy.io/authentication/user-authentication/access-tokens#verifying-the-access-token)

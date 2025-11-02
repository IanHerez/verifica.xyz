# Integración de ENS con Wallets Embebidas de Privy

## Resumen

✅ **Sí, puedes obtener y gestionar ENS con wallets embebidas de Privy**

Cuando un usuario inicia sesión con Privy (email o wallet), Privy **crea automáticamente una wallet embebida** si el usuario no tiene una wallet externa conectada. Esta wallet embebida:

- ✅ Tiene una dirección Ethereum válida
- ✅ Funciona igual que cualquier wallet externa
- ✅ Puede tener ENS configurado
- ✅ Puede interactuar con contratos en mainnet

## Cómo Funciona

### 1. Wallet Embebida Automática

```typescript
// Privy crea automáticamente wallets embebidas cuando:
embeddedWallets: {
  createOnLogin: "users-without-wallets"; // ✅ Configurado en app/providers.tsx
}
```

**Flujo:**

1. Usuario inicia sesión con email → Privy crea wallet embebida automáticamente
2. Usuario inicia sesión con wallet externa → Usa la wallet externa
3. Usuario tiene wallet embebida → Se reutiliza la misma wallet

### 2. Obtención Automática de Wallet y ENS

El hook `useUserWallet` obtiene automáticamente:

```typescript
import { useUserWallet } from "@/hooks/use-user-wallet";

function MyComponent() {
  const {
    walletAddress, // Dirección de wallet (embebida o externa)
    ensName, // ENS si está configurado (null si no)
    loading, // Estado de carga
    hasEmbeddedWallet, // true si es wallet embebida
    refresh, // Función para refrescar
  } = useUserWallet();

  // walletAddress se obtiene automáticamente después del login
  // ensName se busca automáticamente si walletAddress existe
}
```

**Características:**

- ✅ Se carga automáticamente después del login
- ✅ Busca ENS automáticamente usando `lookupENS`
- ✅ Funciona con wallets embebidas y externas
- ✅ Cachea la información para reducir requests

### 3. Configuración de ENS

#### Obtener ENS Existente

Si el usuario ya tiene un ENS configurado para su wallet:

```typescript
const { getMyENS } = useENS();
const ensName = await getMyENS();
// Retorna el ENS si existe, null si no
```

#### Registrar Nuevo ENS

Para registrar un nuevo ENS, el usuario debe:

1. **Visitar ens.domains** y registrar el dominio
2. **Configurar el reverse record** apuntando a su wallet address
3. **Esperar confirmación** en blockchain

**Nota:** El registro de ENS no se puede hacer automáticamente desde la app porque requiere:

- Pagar gas fees en mainnet
- Decidir el nombre del dominio
- Proceso de subasta (para nombres nuevos)

### 4. Mostrar ENS en la UI

El header ya muestra automáticamente ENS si está disponible:

```typescript
// components/header.tsx
const { walletAddress, ensName } = useUserWallet();

// Muestra ENS en lugar de dirección si existe
{
  ensName || formatAddress(walletAddress);
}
```

## Configuración Requerida

### 1. Ethereum Mainnet

ENS **solo funciona en Ethereum mainnet** (chainId: 1). Asegúrate de que tu configuración de Privy incluya mainnet:

```typescript
// app/providers.tsx
embeddedWallets: {
  defaultChain: {
    id: 1, // ✅ Ethereum mainnet
    name: "Ethereum",
    network: "mainnet",
    // ...
  }
}
```

### 2. Wallets Embebidas Habilitadas

```typescript
embeddedWallets: {
  createOnLogin: "users-without-wallets"; // ✅ Ya configurado
}
```

## Casos de Uso

### Caso 1: Usuario nuevo con email

1. Usuario inicia sesión con email
2. Privy crea wallet embebida automáticamente
3. `useUserWallet` obtiene la dirección automáticamente
4. Busca ENS (probablemente null la primera vez)
5. Usuario puede registrar ENS en ens.domains si lo desea

### Caso 2: Usuario con ENS existente

1. Usuario tiene wallet embebida con ENS configurado
2. Al iniciar sesión, `useUserWallet` detecta wallet
3. Busca ENS automáticamente
4. ENS se muestra en header y perfil

### Caso 3: Usuario con wallet externa

1. Usuario conecta MetaMask/Coinbase/etc
2. `useUserWallet` usa la wallet externa
3. Busca ENS de esa wallet
4. Funciona igual que con wallet embebida

## Funcionalidades Implementadas

### ✅ Automático

- Obtención de wallet address después del login
- Búsqueda de ENS automática
- Mostrar ENS en header si está disponible
- Cache de información para mejor rendimiento

### ✅ Manual

- Botón de refresh para actualizar información
- Página de gestión ENS (`/ens`)
- Enlace directo a ens.domains para registro
- Copiar dirección al portapapeles

## Limitaciones

1. **Registro de ENS:** No se puede hacer automáticamente desde la app (requiere ir a ens.domains)
2. **Solo Mainnet:** ENS no funciona en testnets (Sepolia, etc.)
3. **Gas Fees:** Registrar ENS requiere ETH para gas fees
4. **Tiempo:** Reverse lookup puede tardar unos segundos

## Troubleshooting

### "Wallet no disponible"

- Verifica que el usuario esté autenticado
- Espera a que Privy termine de inicializar (`ready === true`)
- Llama a `refresh()` manualmente

### "ENS no encontrado"

- El usuario puede no tener ENS configurado (normal)
- Verifica que estés en mainnet (chainId: 1)
- El reverse record puede no estar configurado en ENS

### "Error al obtener ENS"

- Verifica conexión a Ethereum mainnet
- Asegúrate de que el provider de Privy esté disponible
- Revisa la consola para errores específicos

## Ejemplo de Uso Completo

```typescript
"use client";

import { useUserWallet } from "@/hooks/use-user-wallet";
import { usePrivy } from "@privy-io/react-auth";

function UserProfile() {
  const { authenticated, ready } = usePrivy();
  const { walletAddress, ensName, loading, hasEmbeddedWallet } =
    useUserWallet();

  if (!ready || !authenticated) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h2>Tu Wallet</h2>
      {walletAddress ? (
        <>
          <p>Tipo: {hasEmbeddedWallet ? "Embebida" : "Externa"}</p>
          <p>Dirección: {walletAddress}</p>
          {ensName ? <p>ENS: {ensName}</p> : <p>No tienes ENS configurado</p>}
        </>
      ) : (
        <p>No hay wallet disponible</p>
      )}
    </div>
  );
}
```

## Referencias

- [Privy Embedded Wallets](https://docs.privy.io/guide/react/wallets/embedded)
- [ENS Documentation](https://docs.ens.domains/)
- [ENS App](https://app.ens.domains/)

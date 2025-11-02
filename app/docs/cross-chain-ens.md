# Cross-Chain ENS Resolution

## Resumen

ENS solo existe en **Ethereum Mainnet**, pero ahora puedes resolver ENS desde cualquier red (Arbitrum Sepolia, Scroll Sepolia, etc.) automáticamente.

## Cómo Funciona

El sistema detecta automáticamente en qué red estás y:

1. **Si estás en Ethereum Mainnet**: Usa el provider actual para resolver ENS
2. **Si estás en otra red** (Arbitrum, Scroll, etc.): Usa un provider de Ethereum Mainnet directamente para resolver ENS

## Redes Soportadas

- ✅ Ethereum Mainnet (chainId: 1)
- ✅ Ethereum Sepolia (chainId: 11155111)
- ✅ Arbitrum Sepolia (chainId: 421614)
- ✅ Scroll Sepolia (chainId: 534351)

## Uso Automático

El hook `useENS` ahora funciona automáticamente desde cualquier red:

```typescript
import { useENS } from "@/hooks/use-ens";

function MyComponent() {
  const { resolveENS, lookupENS } = useENS();

  // Esto funciona desde cualquier red
  // Si estás en Arbitrum Sepolia, automáticamente usa mainnet para resolver
  const address = await resolveENS("vitalik.eth");
  const ensName = await lookupENS("0x...");
}
```

## Implementación Técnica

### Provider de Mainnet

Se crea un provider directo a Ethereum Mainnet que se usa cuando estás en otra red:

```typescript
import { resolveENSFromMainnet } from "@/lib/cross-chain-ens";

// Resolver ENS directamente desde mainnet
const address = await resolveENSFromMainnet("vitalik.eth");
```

### Resolución Multichain

La función `resolveENSMultichain` detecta automáticamente la red:

```typescript
import { resolveENSMultichain } from "@/lib/cross-chain-ens";
import { BrowserProvider } from "ethers";

const provider = new BrowserProvider(walletProvider);
// Automáticamente usa mainnet si está en otra red
const address = await resolveENSMultichain("vitalik.eth", provider);
```

## Flujo de Resolución

```
Usuario en Arbitrum Sepolia
    ↓
Intenta resolver ENS con provider actual
    ↓
Detecta que está en Arbitrum (chainId !== 1)
    ↓
Usa provider de Ethereum Mainnet directamente
    ↓
Resuelve ENS exitosamente
```

## Ventajas

1. **Transparente**: Funciona igual desde cualquier red
2. **Automático**: No necesitas cambiar código
3. **Eficiente**: Solo cambia de provider cuando es necesario
4. **Confiable**: Siempre resuelve desde mainnet donde ENS existe

## Ejemplo de Uso

```typescript
"use client";

import { useENS } from "@/hooks/use-ens";
import { usePrivy } from "@privy-io/react-auth";

function ENSComponent() {
  const { authenticated } = usePrivy();
  const { resolveENS, lookupENS, loading } = useENS();

  const handleResolve = async () => {
    // Funciona desde cualquier red configurada
    const address = await resolveENS("mi-nombre.eth");
    console.log("Dirección:", address);
  };

  const handleLookup = async () => {
    // También funciona desde cualquier red
    const ensName = await lookupENS(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f42d1E"
    );
    console.log("ENS:", ensName);
  };

  return (
    <div>
      <button onClick={handleResolve} disabled={loading}>
        Resolver ENS
      </button>
      <button onClick={handleLookup} disabled={loading}>
        Buscar ENS
      </button>
    </div>
  );
}
```

## Configuración de Privy

Las redes ya están configuradas en `app/providers.tsx`:

```typescript
supportedChains: [
  { id: 1, name: "Ethereum", network: "mainnet", ... },
  { id: 11155111, name: "Sepolia", network: "sepolia", ... },
  { id: 421614, name: "Arbitrum Sepolia", ... },
  { id: 534351, name: "Scroll Sepolia", ... },
]
```

## Notas Importantes

1. **ENS Solo en Mainnet**: ENS solo existe en Ethereum Mainnet, no en testnets o L2s
2. **Resolución Cross-Chain**: El sistema resuelve desde mainnet automáticamente
3. **Sin Costo**: La resolución es solo lectura, no requiere transacciones
4. **Cache**: El provider de mainnet se reutiliza para mejor rendimiento

## Referencias

- [Cross-Chain ENS Utils](/lib/cross-chain-ens.ts)
- [Hook useENS](/hooks/use-ens.ts)
- [ENS Documentation](https://docs.ens.domains/)

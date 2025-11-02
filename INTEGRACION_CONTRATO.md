# 🔗 Integración del Contrato VerificaDocuments

## 📋 Resumen

El sistema está preparado para integrar el contrato inteligente `VerificaDocuments` que funcionará en **Arbitrum Sepolia** y **Scroll Sepolia**. El código detecta automáticamente la chain activa y usa el contrato correspondiente.

## 🎯 Archivos Creados

### 1. **PROMPT_CONTRATO_VERIFICA.md**

Prompt completo y detallado para generar el contrato inteligente con todas las especificaciones técnicas, requisitos de seguridad, tests y deployment.

### 2. **lib/contract-config.ts**

Configuración centralizada de chains soportadas y direcciones de contratos:

- Arbitrum Sepolia (chainId: 421614)
- Scroll Sepolia (chainId: 534351)

### 3. **lib/contract-utils.ts**

Utilidades para interactuar con el contrato:

- `getVerificaContract()`: Obtiene instancia del contrato para la chain actual
- `hashToBytes32()`: Convierte hash string a formato bytes32
- `checkSupportedChain()`: Verifica si la chain está soportada

### 4. **hooks/use-verifica-contract.ts**

Hook React para usar el contrato desde componentes:

- Carga automática del contrato según chain activa
- Funciones: `registerDocument()`, `signDocument()`, `verifyDocument()`, `getUserDocuments()`
- Manejo de errores y estados de carga

### 5. **Integración en app/create/page.tsx**

- Registro automático en blockchain al crear documentos
- No bloquea el flujo si falla blockchain (graceful degradation)
- Guarda `blockchainTxHash` y `blockchainChainId` en el documento

## 🚀 Pasos para Completar la Integración

### Paso 1: Crear el Contrato

1. Abre `PROMPT_CONTRATO_VERIFICA.md`
2. Copia el prompt completo
3. Úsalo con tu herramienta preferida (Claude, ChatGPT, etc.) para generar el contrato
4. El contrato debe ser en Solidity ^0.8.20

### Paso 2: Desplegar en Arbitrum Sepolia

```bash
# Con Hardhat
npx hardhat run scripts/deploy.js --network arbitrumSepolia

# Con Foundry
forge script script/Deploy.s.sol:DeployScript --rpc-url arbitrum_sepolia --broadcast
```

**Obtendrás una dirección como:** `0x1234...5678`

### Paso 3: Desplegar en Scroll Sepolia

```bash
# Con Hardhat
npx hardhat run scripts/deploy.js --network scrollSepolia

# Con Foundry
forge script script/Deploy.s.sol:DeployScript --rpc-url scroll_sepolia --broadcast
```

**Obtendrás otra dirección como:** `0xABCD...EF01`

### Paso 4: Configurar Variables de Entorno

Edita tu archivo `.env` (copia de `env.example`):

```env
# Arbitrum Sepolia (Chain ID: 421614)
NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0x1234567890123456789012345678901234567890

# Scroll Sepolia (Chain ID: 534351)
NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT=0xABCDEF0123456789ABCDEF0123456789ABCDEF01
```

### Paso 5: Verificar en Block Explorers

**Arbitrum Sepolia:**

- Ve a https://sepolia.arbiscan.io
- Busca tu dirección de contrato
- Verifica el contrato usando el código fuente

**Scroll Sepolia:**

- Ve a https://sepolia.scrollscan.com
- Busca tu dirección de contrato
- Verifica el contrato usando el código fuente

### Paso 6: Probar la Integración

1. Inicia la app: `npm run dev`
2. Conecta tu wallet (debe estar en Arbitrum Sepolia o Scroll Sepolia)
3. Ve a "Crear Documento" (`/create`)
4. Sube un archivo y completa el formulario
5. Al publicar, deberías ver en consola:
   ```
   [Create] Documento registrado en blockchain: {
     txHash: "0x...",
     chainId: 421614
   }
   ```
6. El documento se guardará con `blockchainTxHash` en la base de datos

## 🔍 Cómo Funciona

### Flujo de Creación de Documento

1. Usuario sube archivo → Se calcula hash SHA-256
2. Archivo se sube a IPFS → Se obtiene CID
3. **Si chain está soportada y contrato configurado:**
   - Se llama a `registerDocument()` en blockchain
   - Se obtiene `txHash` de la transacción
   - Se guarda `blockchainTxHash` y `blockchainChainId` en el documento
4. Documento se guarda en API/Base de datos con toda la metadata

### Detección Automática de Chain

El hook `useVerificaContract` detecta automáticamente:

- ¿Está el usuario en una chain soportada? (421614 o 534351)
- ¿Está configurada la dirección del contrato en `.env`?
- Si ambas son true, carga el contrato y lo hace disponible

### Verificación de Documentos

La página `/verify` puede:

1. Verificar contra la base de datos local (hash/IPFS)
2. **Próximamente:** Verificar también contra blockchain usando `verifyDocument()`

## 📝 Uso en Componentes

```typescript
import { useVerificaContract } from "@/hooks/use-verifica-contract";

function MyComponent() {
  const {
    contract, // Instancia del contrato (o null si no disponible)
    chainId, // Chain ID actual (421614 o 534351)
    chainSupported, // true si está en chain soportada
    loading, // true mientras carga
    error, // Error si algo falló
    registerDocument, // Función para registrar documento
    signDocument, // Función para firmar documento
    verifyDocument, // Función para verificar documento
  } = useVerificaContract();

  // Usar las funciones...
  const handleRegister = async () => {
    try {
      const result = await registerDocument(
        documentHash,
        ipfsCid,
        title,
        institution
      );
      console.log("TX Hash:", result.txHash);
    } catch (err) {
      console.error("Error:", err);
    }
  };
}
```

## ⚠️ Notas Importantes

1. **Graceful Degradation:** Si blockchain falla o no está configurada, el flujo continúa normalmente. Solo no se registra en blockchain.

2. **Variables de Entorno:** Las variables `NEXT_PUBLIC_*` solo están disponibles en el cliente. Asegúrate de reiniciar el servidor después de cambiarlas.

3. **Gas Fees:** El usuario necesitará ETH en la testnet correspondiente para pagar gas:

   - Arbitrum Sepolia: Obtén ETH en https://faucet.quicknode.com/arbitrum/sepolia
   - Scroll Sepolia: Obtén ETH en https://faucet.scroll.io/

4. **Contract ABI:** El ABI está en `lib/contract-utils.ts`. Si cambias funciones del contrato, actualiza el ABI.

## 🐛 Troubleshooting

### "Chain X no soportada"

- Verifica que estás en Arbitrum Sepolia (421614) o Scroll Sepolia (534351)
- Cambia la red en tu wallet

### "No hay dirección de contrato para chain X"

- Verifica que configuraste `NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT` o `NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT` en `.env`
- Reinicia el servidor Next.js después de cambiar `.env`

### "Transaction failed"

- Verifica que tienes ETH suficiente para gas
- Verifica que el contrato fue desplegado correctamente
- Verifica que estás autorizado para crear documentos (si el contrato requiere autorización)

### Contrato no se carga

- Abre DevTools → Console y busca errores
- Verifica que `chainSupported` es `true`
- Verifica que la dirección del contrato es correcta

## 📚 Referencias

- **Prompt del Contrato:** `PROMPT_CONTRATO_VERIFICA.md`
- **Configuración de Chains:** `lib/contract-config.ts`
- **Utilidades:** `lib/contract-utils.ts`
- **Hook React:** `hooks/use-verifica-contract.ts`
- **Ejemplo de Uso:** `app/create/page.tsx` (líneas 174-204)

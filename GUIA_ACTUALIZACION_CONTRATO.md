# 🚀 Guía de Actualización del Contrato VerificaDocuments

## 📋 Resumen de Cambios

El contrato `VerificaDocuments.sol` ha sido actualizado según el flujo de arquitectura descrito en `ARQUITECTURA_ALMACENAMIENTO.md`. Los cambios incluyen:

1. ✅ **Mejoras en documentación** del contrato (comentarios sobre el flujo)
2. ✅ **Validación adicional** de `issuedAt` timestamp
3. ✅ **Integración de firma en blockchain** en el frontend
4. ✅ **Flujo dual de firma** (blockchain + base de datos)

## 🔄 Cambios en el Contrato

### Validaciones Mejoradas

- Se agregó validación para `issuedAt > 0` en `registerDocument()`
- Mejores comentarios explicando el flujo de arquitectura
- Documentación de que los metadata adicionales NO se guardan en blockchain

### Funciones Sin Cambios Importantes

- `signDocument()`: Sin cambios funcionales, solo mejor documentación
- `verifyDocument()`: Sin cambios
- `revokeDocument()`: Sin cambios
- Todas las demás funciones: Sin cambios

## 📦 Cambios en el Frontend

### Integración de Firma en Blockchain

Se actualizaron las siguientes páginas para firmar en blockchain cuando sea posible:

1. **`app/alumno/[id]/page.tsx`**: Firma individual de documento
2. **`app/alumno/page.tsx`**: Firma desde lista de documentos

**Flujo de firma actualizado:**

```typescript
// Paso 1: Firmar en blockchain (opcional, si está registrado)
if (chainSupported && doc.blockchainTxHash && doc.files?.[0]?.hash) {
  const documentHash = hashToBytes32(doc.files[0].hash);
  await signOnBlockchain(documentHash);
}

// Paso 2: Siempre firmar en base de datos (obligatorio)
await signDocAPI(doc.id, walletAddress);
```

## 🎯 ¿Necesitas Redeployar el Contrato?

### ❌ NO necesitas redeployar si:

- Ya tienes el contrato desplegado en Arbitrum Sepolia o Scroll Sepolia
- El contrato actual funciona correctamente
- Los cambios son principalmente de documentación

**Razón:** Los cambios son principalmente en comentarios y una validación adicional menor. El contrato actual debería funcionar igual.

### ✅ SÍ necesitas redeployar si:

- Quieres la nueva validación de `issuedAt > 0`
- Quieres la documentación actualizada en el contrato
- Es la primera vez que despliegas

## 📝 Instrucciones de Deployment (Si es Necesario)

### Paso 1: Preparar el Contrato

1. Abre Remix IDE: https://remix.ethereum.org
2. Crea un nuevo archivo: `VerificaDocuments.sol`
3. Copia el contenido de `contracts/VerificaDocuments.sol`

### Paso 2: Configurar Dependencias

En Remix, necesitas importar OpenZeppelin:

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
```

**Opción A - Usar NPM en Remix:**

1. En Remix, ve a la pestaña "File Explorer"
2. Clic derecho en `contracts` → "New Folder" → crea `node_modules`
3. Instala OpenZeppelin desde la terminal de Remix:
   ```
   cd contracts && npm install @openzeppelin/contracts@^5.0.0
   ```

**Opción B - Usar GitHub en Remix:**

1. En lugar de `@openzeppelin/contracts`, usa:
   ```solidity
   import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/access/Ownable.sol";
   import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/security/ReentrancyGuard.sol";
   ```

### Paso 3: Compilar

1. Ve a la pestaña "Solidity Compiler"
2. Selecciona versión `0.8.20` o superior
3. Clic en "Compile VerificaDocuments.sol"
4. Verifica que no hay errores

### Paso 4: Desplegar

#### Para Arbitrum Sepolia:

1. Conecta MetaMask con Arbitrum Sepolia (Chain ID: 421614)
2. Asegúrate de tener tokens de prueba para gas
3. En Remix, ve a "Deploy & Run Transactions"
4. Selecciona "VerificaDocuments" como contrato
5. **NO pases parámetros** (el constructor no requiere argumentos)
6. Clic en "Deploy"
7. Confirma la transacción en MetaMask
8. **Copia la dirección del contrato desplegado**

#### Para Scroll Sepolia:

1. Repite los pasos anteriores pero conectado a Scroll Sepolia (Chain ID: 534351)
2. **Copia la dirección del contrato desplegado** (diferente a Arbitrum)

### Paso 5: Autorizar Creadores

Después del deployment, necesitas autorizar direcciones que puedan crear documentos:

1. En Remix, después de desplegar, expande el contrato desplegado
2. Busca la función `authorizeCreator`
3. Ingresa la dirección de la wallet que creará documentos
4. Clic en "transact"
5. Confirma en MetaMask

**Nota:** El owner (quien desplegó) ya está autorizado automáticamente.

### Paso 6: Configurar Variables de Entorno

Actualiza tu `.env` con las direcciones del contrato:

```env
# Arbitrum Sepolia
NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0xTU_NUEVA_DIRECCION_AQUI

# Scroll Sepolia
NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT=0xTU_NUEVA_DIRECCION_AQUI
```

### Paso 7: Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C)
# Reinicia
npm run dev
# o
yarn dev
```

## 🔍 Verificar el Deployment

### 1. Verificar en el Explorer

**Arbitrum Sepolia:**

- https://sepolia.arbiscan.io/address/TU_DIRECCION

**Scroll Sepolia:**

- https://sepolia.scrollscan.com/address/TU_DIRECCION

### 2. Verificar desde la App

1. Conecta tu wallet a Arbitrum Sepolia o Scroll Sepolia
2. Ve a "Crear Documento"
3. Intenta crear un documento
4. Verifica que:
   - El archivo se sube a IPFS
   - Se registra en blockchain (deberías ver el `blockchainTxHash`)
   - Se guarda en base de datos con todos los campos

### 3. Probar Firma en Blockchain

1. Como alumno, ve a un documento que tenga `blockchainTxHash`
2. Haz clic en "Firmar"
3. Deberías ver:
   - Toast: "Documento firmado en blockchain"
   - Toast: "Documento firmado exitosamente"
4. Verifica en el explorer que la transacción de firma se ejecutó

## ⚠️ Consideraciones Importantes

### Si Ya Tienes el Contrato Desplegado

**Puedes seguir usando el contrato actual** sin redeployar. Los cambios son menores y no afectan la funcionalidad existente.

### Migración de Documentos Existentes

Si redepliegas un nuevo contrato:

- Los documentos registrados en el contrato anterior NO estarán en el nuevo
- Los documentos en la base de datos seguirán funcionando
- Solo los nuevos documentos se registrarán en el nuevo contrato

**Recomendación:** Si ya tienes documentos importantes registrados en blockchain, mantén el contrato actual.

### Gas Costs

- **Registrar documento:** ~150,000 - 200,000 gas (depende de strings)
- **Firmar documento:** ~60,000 - 100,000 gas
- **Autorizar creador:** ~45,000 gas

## 🐛 Troubleshooting

### Error: "Not authorized"

**Causa:** La wallet no está autorizada como creador.

**Solución:**

1. Usa la función `authorizeCreator` en Remix
2. O haz que el owner (quien desplegó) autorice tu dirección

### Error: "Document already exists"

**Causa:** Estás intentando registrar el mismo hash dos veces.

**Solución:** Normal, cada documento debe tener un hash único. Si quieres registrar el mismo archivo otra vez, debería tener el mismo hash y fallará (es correcto).

### Error: "Invalid issuedAt timestamp"

**Causa (solo en nuevo contrato):** Estás pasando `issuedAt = 0`.

**Solución:** Asegúrate de pasar un timestamp válido (segundos desde Unix epoch).

### Error: "Chain X no soportada"

**Causa:** La chain actual no tiene contrato configurado.

**Solución:**

1. Verifica que estás en Arbitrum Sepolia (421614) o Scroll Sepolia (534351)
2. Verifica que `NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT` o `NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT` estén en `.env`

## ✅ Checklist Post-Deployment

- [ ] Contrato desplegado en Arbitrum Sepolia
- [ ] Contrato desplegado en Scroll Sepolia (opcional)
- [ ] Variables de entorno configuradas en `.env`
- [ ] Servidor reiniciado
- [ ] Wallet conectada a chain correcta
- [ ] Creadores autorizados en el contrato
- [ ] Prueba de creación de documento exitosa
- [ ] Prueba de firma en blockchain exitosa
- [ ] Verificación en explorer exitosa

## 📚 Referencias

- `ARQUITECTURA_ALMACENAMIENTO.md`: Flujo completo de almacenamiento
- `GUIA_DEPLOYMENT.md`: Guía de deployment original
- `contracts/VerificaDocuments.sol`: Código del contrato

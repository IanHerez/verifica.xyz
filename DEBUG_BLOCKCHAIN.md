# 🔍 Debug de Integración Blockchain

## Problema Reportado

Los archivos se suben a Pinata (IPFS) correctamente, pero no hay interacción con blockchain.

## Posibles Causas

### 1. `chainSupported` es `false`

**Síntoma:** El código no intenta registrar en blockchain

**Cómo verificar:**

1. Abre la consola del navegador (F12)
2. Ve a "Crear Documento"
3. Busca el log: `[Create] Estado de blockchain:`
4. Verifica el valor de `chainSupported`

**Solución si es `false`:**

- Verifica que tu wallet esté conectada a Arbitrum Sepolia (Chain ID: 421614)
- Verifica que `NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT` esté configurada en `.env`
- Reinicia el servidor después de cambiar `.env`
- Verifica la consola para errores de `useVerificaContract`

### 2. Error Silencioso en el Try-Catch

**Síntoma:** El código intenta registrar pero falla silenciosamente

**Cómo verificar:**

1. Busca en consola: `[Create] ❌ Error registrando en blockchain:`
2. Revisa el error completo

**Errores comunes:**

#### "Not authorized"

- **Causa:** Tu wallet no está autorizada como creador
- **Solución:** Usa `authorizeCreator` en Remix o Arbiscan para autorizar tu dirección

#### "User rejected"

- **Causa:** Rechazaste la transacción en MetaMask
- **Solución:** Acepta la transacción cuando MetaMask la muestre

#### "Insufficient funds"

- **Causa:** No tienes suficientes tokens para gas
- **Solución:** Obtén tokens de prueba de Arbitrum Sepolia

#### "Invalid hash" o "IPFS CID required"

- **Causa:** El archivo no tiene hash o CID
- **Solución:** Esto no debería pasar - verifica que el archivo se haya procesado correctamente

### 3. El Hook `useVerificaContract` Tiene Error

**Síntoma:** `chainSupported` nunca se vuelve `true`

**Cómo verificar:**

1. Busca en consola: `[useVerificaContract] Estado:`
2. Revisa el valor de `error`

**Errores comunes:**

#### "Chain X no tiene contrato configurado"

- **Causa:** La variable de entorno no está configurada
- **Solución:** Verifica `.env` y reinicia el servidor

#### "Provider no disponible"

- **Causa:** La wallet no está conectada o Privy no puede obtener el provider
- **Solución:** Conecta tu wallet y espera a que Privy esté listo

#### "No se pudo obtener el contrato"

- **Causa:** Error al instanciar el contrato
- **Solución:** Verifica la dirección del contrato en `.env`

### 4. La Wallet No Está Conectada a la Red Correcta

**Síntoma:** `chainId` es diferente a 421614

**Cómo verificar:**

1. En MetaMask, verifica que estés en "Arbitrum Sepolia"
2. Busca en consola el `chainId` que muestra

**Solución:**

- Cambia a Arbitrum Sepolia en MetaMask
- Si no la tienes, agrégala:
  - Network Name: `Arbitrum Sepolia`
  - RPC URL: `https://sepolia-rollup.arbitrum.io/rpc`
  - Chain ID: `421614`
  - Currency Symbol: `ETH`
  - Block Explorer: `https://sepolia.arbiscan.io`

## 🔧 Pasos de Debug

### Paso 1: Verificar Variables de Entorno

Abre tu `.env` y verifica:

```env
NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0xTU_DIRECCION
```

**Importante:**

- ✅ Debe empezar con `0x`
- ✅ No debe tener espacios
- ✅ No debe tener comillas
- ✅ Debe ser la dirección correcta del contrato

### Paso 2: Reiniciar Servidor

```bash
# Detén el servidor (Ctrl+C)
npm run dev
# o
yarn dev
```

### Paso 3: Abrir Consola y Crear Documento

1. Abre http://localhost:3000
2. Abre la consola del navegador (F12)
3. Conecta tu wallet a Arbitrum Sepolia
4. Ve a "Crear Documento"
5. Crea un documento de prueba
6. **Revisa TODOS los logs en consola**

### Paso 4: Buscar Logs Específicos

Busca estos logs en orden:

1. `[useVerificaContract] Estado:` - Estado del hook
2. `[Create] Estado de blockchain:` - Si intentará registrar
3. `[Create] Intentando registrar en blockchain:` - Parámetros que se envían
4. `[Create] ✅ Documento registrado en blockchain:` - Éxito
5. O `[Create] ❌ Error registrando en blockchain:` - Error

### Paso 5: Si Hay Error, Revisar Detalles

El error mostrará:

- `message`: Mensaje del error
- `code`: Código del error
- `reason`: Razón específica (si está disponible)

## 📋 Checklist de Verificación

- [ ] Wallet conectada a Arbitrum Sepolia (421614)
- [ ] Variable `NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT` en `.env`
- [ ] Servidor reiniciado después de cambiar `.env`
- [ ] Wallet autorizada como creador en el contrato
- [ ] Tienes tokens de prueba para gas
- [ ] Consola muestra `chainSupported: true`
- [ ] No hay errores en `useVerificaContract`
- [ ] La transacción aparece en MetaMask cuando intentas crear

## 🎯 Si Todo Falló

1. **Comparte los logs de la consola** cuando intentas crear un documento
2. Verifica que puedas interactuar con el contrato desde Remix:
   - Ve a Remix
   - Conecta con Arbitrum Sepolia
   - Busca tu contrato
   - Prueba `registerDocument` manualmente
3. Si funciona en Remix pero no en la app, el problema es en la configuración del frontend

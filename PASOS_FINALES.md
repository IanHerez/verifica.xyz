# ✅ Pasos Finales - Configuración Completa

## ✅ Lo que ya hiciste

- [x] Contrato desplegado en Arbitrum Sepolia
- [x] Dirección agregada a `.env` (NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT)

## 🔄 Pasos Restantes

### 1. Reiniciar el Servidor (OBLIGATORIO)

Las variables de entorno solo se cargan cuando inicia el servidor:

```bash
# Detén el servidor si está corriendo (Ctrl+C)
# Reinicia
npm run dev
# o
yarn dev
```

### 2. Verificar la Variable en `.env`

Abre tu archivo `.env` y verifica que tenga:

```env
NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0xTU_DIRECCION_AQUI
```

**Importante:**

- ✅ Debe empezar con `0x`
- ✅ No debe tener espacios antes o después
- ✅ No debe tener comillas

### 3. Autorizar tu Wallet como Creador (IMPORTANTE)

Antes de poder crear documentos, necesitas autorizar tu wallet:

#### Opción A: Usar Remix (Más fácil)

1. Abre https://remix.ethereum.org
2. Conecta MetaMask con **Arbitrum Sepolia**
3. En "Deploy & Run Transactions", busca tu contrato desplegado
4. Expande el contrato
5. Busca la función `authorizeCreator`
6. En el campo, ingresa tu dirección de wallet (la que usarás para crear documentos)
7. Click "transact"
8. Confirma en MetaMask
9. Espera la confirmación

#### Opción B: Usar Arbiscan

1. Ve a tu contrato en Arbiscan:
   `https://sepolia.arbiscan.io/address/TU_DIRECCION#writeContract`
2. Conecta tu wallet
3. Busca `authorizeCreator` en la lista de funciones
4. En el campo `_creator`, ingresa tu dirección de wallet
5. Click "Write" y confirma

**Nota:** El owner (quien desplegó) ya está autorizado automáticamente. Si desplegaste con tu wallet, no necesitas autorizarte a ti mismo (solo a otras wallets si las usas).

### 4. Probar que Funciona

1. **Abre la app:** http://localhost:3000
2. **Conecta tu wallet** a Arbitrum Sepolia
3. **Ve a "Crear Documento"** (`/create`)
4. **Intenta crear un documento:**

   - Sube un archivo PDF
   - Completa título, institución, etc.
   - Selecciona destinatario (alumno/maestro)
   - Click "Publicar Documento"

5. **Verifica en la consola (F12):**

Deberías ver mensajes como:

```
[contract-utils] Contrato obtenido para 421614: 0xTU_DIRECCION
[useVerificaContract] Registrando documento: { hash: "0x...", ipfsCid: "Qm...", ... }
[Create] Documento registrado en blockchain: { txHash: "0x...", chainId: 421614 }
```

6. **Verifica el documento creado:**
   - Deberías ver un toast de éxito
   - El documento debería aparecer en "Mis Documentos"
   - Si revisas el documento, debería tener `blockchainTxHash` en los detalles

### 5. Probar Firma en Blockchain

1. **Como alumno**, ve a un documento que tenga `blockchainTxHash`
2. **Haz clic en "Firmar"**
3. **Deberías ver dos toasts:**
   - "Documento firmado en blockchain" (primero)
   - "Documento firmado exitosamente" (segundo)
4. **Verifica en Arbiscan:**
   - Busca la transacción de firma en el explorer
   - Debería aparecer en el historial del contrato

## 🐛 Troubleshooting

### Error: "Chain X no soportada"

- Verifica que estés conectado a Arbitrum Sepolia (Chain ID: 421614)
- Verifica que `NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT` esté en `.env`
- **Reinicia el servidor** después de cambiar `.env`

### Error: "Not authorized"

- Tu wallet no está autorizada como creador
- Usa `authorizeCreator` en Remix o Arbiscan para autorizar tu dirección

### Error: "Contract not found" o el contrato no se carga

- Verifica la dirección del contrato en Arbiscan
- Verifica que el `.env` tenga la dirección correcta (sin espacios, con 0x)
- Reinicia el servidor

### El documento no se registra en blockchain

- Verifica que tu wallet esté autorizada
- Verifica que estés en Arbitrum Sepolia
- Revisa la consola para ver errores específicos

### Los archivos no se suben a IPFS

- Verifica que `PINATA_API_KEY` y `PINATA_SECRET_KEY` estén configurados en `.env`
- Verifica que las keys tengan permisos de "Admin" en Pinata

## ✅ Checklist Final

- [x] Contrato desplegado
- [x] Variable configurada en `.env`
- [ ] Servidor reiniciado
- [ ] Wallet autorizada como creador
- [ ] Prueba de creación de documento exitosa
- [ ] Verificación en consola exitosa
- [ ] Prueba de firma en blockchain exitosa

## 🎉 Siguiente Paso

Una vez que todo funcione, puedes:

1. Desplegar en Scroll Sepolia también (opcional)
2. Autorizar más wallets como creadores si es necesario
3. Comenzar a usar la aplicación normalmente

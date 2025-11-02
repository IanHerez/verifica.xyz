# ⚙️ Configurar Contrato - Arbitrum Sepolia

## ✅ Contrato Desplegado

- **Dirección:** `0x4242C888B4b878fa1FFe28db9aF447DF056b29Ea`
- **Red:** Arbitrum Sepolia (Chain ID: 421614)
- **Block Explorer:** https://sepolia.arbiscan.io/address/0x4242C888B4b878fa1FFe28db9aF447DF056b29Ea

## 📝 Configurar en `.env`

Edita tu archivo `.env` (en la raíz del proyecto) y agrega:

```env
NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0x4242C888B4b878fa1FFe28db9aF447DF056b29Ea
```

## 🚀 Reiniciar el Servidor

Después de actualizar `.env`:

```bash
# Detén el servidor (Ctrl+C si está corriendo)
# Reinicia
npm run dev
# o
yarn dev
```

## ✅ Verificar que Funciona

1. Abre la app en http://localhost:3000
2. Conecta tu wallet a **Arbitrum Sepolia** (Chain ID: 421614)
3. Ve a "Crear Documento"
4. Intenta crear un documento
5. Revisa la consola del navegador (F12)

Deberías ver:

```
[contract-utils] Contrato obtenido para 421614: 0x4242C888B4b878fa1FFe28db9aF447DF056b29Ea
[Create] Documento registrado en blockchain: { txHash: "0x...", chainId: 421614 }
```

## 🔐 Autorizar Creadores (IMPORTANTE)

**Antes de crear documentos**, necesitas autorizar tu wallet como creador.

### Opción 1: Usar Remix

1. Abre Remix: https://remix.ethereum.org
2. Conecta MetaMask con **Arbitrum Sepolia**
3. En "Deploy & Run Transactions", busca el contrato desplegado
4. Expande el contrato
5. Busca la función `authorizeCreator`
6. Ingresa la dirección de tu wallet que creará documentos
7. Click "transact"
8. Confirma en MetaMask

### Opción 2: Usar Arbiscan

1. Ve a: https://sepolia.arbiscan.io/address/0x4242C888B4b878fa1FFe28db9aF447DF056b29Ea#writeContract
2. Conecta tu wallet
3. Busca la función `authorizeCreator`
4. Ingresa la dirección a autorizar
5. Click "Write" y confirma

**Nota:** El owner (quien desplegó) ya está autorizado automáticamente.

## ⏭️ Opcional: Desplegar en Scroll Sepolia

Si quieres usar ambas redes:

1. Sigue `GUIA_ACTUALIZACION_CONTRATO.md` para desplegar en Scroll Sepolia
2. Obtén la dirección del contrato en Scroll Sepolia
3. Actualiza `.env` con ambas direcciones:
   ```env
   NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0x4242C888B4b878fa1FFe28db9aF447DF056b29Ea
   NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT=0xOTRA_DIRECCION_AQUI
   ```
4. Reinicia el servidor

## 🐛 Troubleshooting

### Error: "Chain X no soportada"

- Verifica que estés conectado a Arbitrum Sepolia (Chain ID: 421614)
- Verifica que `NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT` esté en `.env`
- Reinicia el servidor después de cambiar `.env`

### Error: "Not authorized"

- Tu wallet no está autorizada como creador
- Usa `authorizeCreator` en Remix o Arbiscan para autorizar tu dirección

### El contrato no se encuentra

- Verifica la dirección del contrato en Arbiscan
- Verifica que el `.env` tenga la variable correcta (sin espacios)
- Reinicia el servidor después de cambiar `.env`

### Error: "Invalid issuedAt timestamp"

- Esto significa que el frontend está pasando `issuedAt = 0`
- Ya está corregido en `app/create/page.tsx` - verifica que tengas la versión actualizada

## ✅ Checklist

- [x] Contrato desplegado en Arbitrum Sepolia
- [ ] Variable configurada en `.env`
- [ ] Servidor reiniciado
- [ ] Wallet autorizada como creador
- [ ] Prueba de creación de documento exitosa
- [ ] Verificación en consola exitosa

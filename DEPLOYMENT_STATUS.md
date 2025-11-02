# 📝 Estado del Deployment - VerificaDocuments

## ✅ Completado

### Arbitrum Sepolia (Chain ID: 421614)

- ✅ **Dirección del contrato:** Configurada en `.env` (NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT)
- ✅ **Estado:** Deployment exitoso ✅ Configurado en variables de entorno
- 🔍 **Siguiente paso:** Reiniciar servidor y autorizar wallets como creadores

## ⏳ Pendiente

### Scroll Sepolia (Chain ID: 534351)

- ⏳ **Dirección del contrato:** `_________________________` (pendiente)
- ⏳ Estado: Necesita deployment

## 📋 Próximos Pasos

### 1. Deployment en Scroll Sepolia

1. **En MetaMask:**

   - Cambia a "Scroll Sepolia" (Chain ID: 534351)
   - Si no la tienes, agrégala:
     - Network Name: `Scroll Sepolia`
     - RPC URL: `https://sepolia-rpc.scroll.io`
     - Chain ID: `534351`
     - Currency Symbol: `ETH`
     - Block Explorer: `https://sepolia.scrollscan.com`

2. **En Remix:**

   - Ve a "Deploy & Run Transactions"
   - Verifica que muestre: `Injected Provider - MetaMask (534351)`
   - Selecciona el contrato: "VerificaDocuments"
   - Click "Deploy"
   - Confirma en MetaMask
   - Copia la dirección del contrato desplegado

3. **Anotar la dirección:**
   - Scroll Sepolia: `_________________________`

### 2. Configurar Variables de Entorno

Después de tener ambas direcciones, edita tu `.env`:

```env
# Arbitrum Sepolia (Chain ID: 421614)
NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0x170B50F326d0653761a05d6960BD0a8354A87E24

# Scroll Sepolia (Chain ID: 534351)
NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT=0xTU_DIRECCION_SCROLL_AQUI
```

### 3. Reiniciar Servidor

Después de actualizar `.env`:

```bash
# Detén el servidor (Ctrl+C)
# Reinicia
npm run dev
```

### 4. Probar

1. Abre http://localhost:3000
2. Conecta tu wallet (en Arbitrum Sepolia o Scroll Sepolia)
3. Ve a `/create`
4. Intenta crear un documento
5. Revisa la consola del navegador (F12)

Deberías ver:

```
[contract-utils] Contrato obtenido para 421614: 0x170B50F326d0653761a05d6960BD0a8354A87E24
[Create] Documento registrado en blockchain: { txHash: "0x...", chainId: 421614 }
```

## ✅ Checklist Final

- [x] Contrato desplegado en Arbitrum Sepolia
- [ ] Contrato desplegado en Scroll Sepolia
- [ ] Direcciones configuradas en `.env`
- [ ] Servidor Next.js reiniciado
- [ ] Prueba desde frontend exitosa

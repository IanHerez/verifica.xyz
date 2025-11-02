# Guía: Autorizar Creator en VerificaDocuments

## 📋 Resumen

Para que una wallet pueda registrar documentos en el contrato `VerificaDocuments`, primero debe estar autorizada llamando a la función `authorizeCreator(address)`.

**Solo el owner** (quien deployó el contrato) puede autorizar creators.

---

## 🔧 Método 1: Usando Remix (Recomendado)

### Paso 1: Conecta tu Wallet en Remix

1. Ve a [Remix](https://remix.ethereum.org)
2. Asegúrate de que MetaMask esté conectado
3. **Verifica que estés en Arbitrum Sepolia** (Chain ID: 421614)
   - Si no tienes la red, agrega:
     - Network Name: `Arbitrum Sepolia`
     - RPC URL: `https://sepolia-rollup.arbitrum.io/rpc`
     - Chain ID: `421614`
     - Currency Symbol: `ETH`
     - Block Explorer: `https://sepolia.arbiscan.io`

### Paso 2: Obtén el Contrato Deployado

1. En Remix, ve al panel **"Deploy & Run Transactions"**
2. En **"At Address"**, pega la dirección del contrato:
   ```
   0x92774b853732Cd05DAc0dFb4aC215B51a944FF5C
   ```
3. Selecciona **"VerificaDocuments"** del dropdown
4. Click en **"At Address"**

### Paso 3: Autoriza tu Wallet

1. Una vez el contrato se carga, busca la función `authorizeCreator`
2. En el campo `_creator`, pega la dirección de wallet que quieres autorizar:
   ```
   0xTuDireccionAqui
   ```
3. Asegúrate de que **tu wallet conectada en MetaMask sea la que deployó el contrato (owner)**
4. Click en **"transact"**
5. Confirma la transacción en MetaMask
6. Espera la confirmación

### Paso 4: Verifica la Autorización

1. Busca la función `authorizedCreators` (view function, sin gas)
2. Pega la dirección que autorizaste en el campo
3. Click en **"call"**
4. Debería retornar `true`

---

## 🌐 Método 2: Usando el Frontend (Próximamente)

Podríamos agregar una función en el hook `useVerificaContract` para autorizar creators desde el frontend, pero requiere que el owner esté conectado.

---

## ✅ Verificar si una Wallet Está Autorizada

### Desde Remix:

1. Usa la función `authorizedCreators(address)` (view function)
2. Pasa la dirección a verificar
3. Retorna `true` o `false`

### Desde el Código (si agregamos la función):

```typescript
const contract = await getVerificaContract(provider);
const isAuthorized = await contract.authorizedCreators(walletAddress);
```

---

## 🔑 Direcciones del Contrato

### Arbitrum Sepolia:

- **Contrato**: `0x92774b853732Cd05DAc0dFb4aC215B51a944FF5C`
- **Explorer**: https://sepolia.arbiscan.io/address/0x92774b853732Cd05DAc0dFb4aC215B51a944FF5C

### Scroll Sepolia:

- **Contrato**: (Aún no deployado, o usar la dirección correspondiente)

---

## ⚠️ Notas Importantes

1. **Solo el owner puede autorizar**: La wallet que deployó el contrato es el owner por defecto
2. **Gas fees**: Autorizar un creator requiere pagar gas en la red correspondiente
3. **Direcciones válidas**: Solo puedes autorizar direcciones válidas (no `0x0000...`)
4. **Verificar antes de crear documentos**: Si una wallet no está autorizada, verás el error `"Not authorized"` al intentar registrar documentos

---

## 🐛 Troubleshooting

### Error: "Not authorized"

- **Causa**: La wallet no está autorizada en el contrato
- **Solución**: Autoriza la wallet usando `authorizeCreator` desde la wallet owner

### Error: "only owner can call this function"

- **Causa**: Estás intentando autorizar desde una wallet que no es el owner
- **Solución**: Conecta la wallet que deployó el contrato (owner)

### No puedo encontrar el contrato en Remix

- **Causa**: La dirección del contrato podría estar incorrecta o la red incorrecta
- **Solución**: Verifica:
  1. Estás en Arbitrum Sepolia
  2. La dirección del contrato es correcta: `0x92774b853732Cd05DAc0dFb4aC215B51a944FF5C`
  3. El contrato está verificado en Arbiscan

---

## 📝 Ejemplo de Transacción Exitosa

Cuando autorizas un creator, deberías ver:

- Evento emitido: `CreatorAuthorized(address indexed creator)`
- Transacción confirmada en Arbiscan
- `authorizedCreators[address]` retorna `true`

---

## 🔄 Desautorizar un Creator

Si necesitas remover la autorización:

1. En Remix, busca `revokeCreator(address)`
2. Pasa la dirección a desautorizar
3. Confirma la transacción (solo owner puede hacerlo)

---

¿Necesitas autorizar múltiples wallets? Simplemente repite el proceso para cada dirección que quieras autorizar.

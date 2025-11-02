# ✅ Verificación del Nuevo Contrato con Destinatarios

## 📋 Checklist de Configuración

### 1. ✅ Contrato Desplegado

- [ ] Contrato desplegado en Arbitrum Sepolia
- [ ] Dirección del contrato copiada

**Por favor comparte:**

- ¿Cuál es la nueva dirección del contrato?

### 2. Configuración de Variables de Entorno

Verifica que tu `.env` tenga:

```env
NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0xTU_NUEVA_DIRECCION_AQUI
```

### 3. Autorización de Wallets

**IMPORTANTE:** Después de desplegar el nuevo contrato, necesitas autorizar las wallets que crearán documentos:

1. Abre Remix: https://remix.ethereum.org
2. Conecta MetaMask con Arbitrum Sepolia
3. Busca tu contrato desplegado en "Deployed Contracts"
4. Expande el contrato
5. Busca `authorizeCreator`
6. Ingresa tu dirección de wallet que creará documentos
7. Click "transact" y confirma

**Nota:** El owner (quien desplegó) ya está autorizado automáticamente.

### 4. Reiniciar Servidor

```bash
# Detén el servidor (Ctrl+C)
npm run dev
# o
yarn dev
```

### 5. Verificar que Funciona

1. **Abre la app:** http://localhost:3000
2. **Conecta tu wallet** a Arbitrum Sepolia
3. **Ve a "Crear Documento"**
4. **Verifica en consola (F12):**
   ```
   [useVerificaContract] Estado: { chainSupported: true, ... }
   ```
5. **Intenta crear un documento:**

   - Selecciona destinatario (alumno o maestro específico, o "todos")
   - Sube archivo
   - Publica

6. **Verifica en consola:**
   ```
   [Create] Intentando registrar en blockchain: {
     recipients: ["0x...", "0x..."],
     recipientsCount: 2
   }
   [Create] ✅ Documento registrado en blockchain: { txHash: "0x...", ... }
   ```

## 🔍 Pruebas Específicas

### Prueba 1: Crear Documento con Destinatario Específico

1. Crea documento
2. Selecciona un alumno o maestro específico
3. Publica
4. Verifica que se registró en blockchain con ese destinatario

### Prueba 2: Crear Documento para "Todos" del Rol

1. Crea documento
2. Selecciona rol (alumnos o maestros) pero NO selecciones miembro específico
3. Publica
4. Verifica que se registró con TODOS los miembros de ese rol como destinatarios

### Prueba 3: Intentar Firmar como No-Destinatario

1. Como un usuario que NO es destinatario
2. Intenta firmar un documento
3. Debería fallar con error: "Not authorized to sign - not a recipient"

### Prueba 4: Firmar como Destinatario

1. Como un usuario que SÍ es destinatario
2. Intenta firmar el documento
3. Debería funcionar correctamente

### Prueba 5: Consultar Documentos desde Blockchain

```typescript
// En consola del navegador
const { getUserDocuments, getDocumentIpfsCid } = useVerificaContract();
const hashes = await getUserDocuments(walletAddress);
// Debería retornar array de hashes de documentos
```

## 🐛 Troubleshooting

### Error: "Not authorized"

- Tu wallet no está autorizada como creador
- Usa `authorizeCreator` en Remix

### Error: "Too many recipients"

- Estás intentando agregar más de 50 destinatarios
- Reduce el número de destinatarios o crea múltiples documentos

### Error: "At least one recipient required"

- No hay destinatarios seleccionados
- Asegúrate de tener miembros agregados al sistema y seleccionarlos

### Error: "Invalid recipient address"

- Alguna dirección en el array es inválida (address(0))
- Verifica que todos los miembros tengan wallets válidas

## 📝 Información Necesaria

Para ayudarte mejor, necesito:

1. **Nueva dirección del contrato:** `0x...`
2. **¿Ya actualizaste `.env`?** Sí / No
3. **¿Ya autorizaste tu wallet?** Sí / No
4. **¿Reiniciaste el servidor?** Sí / No
5. **¿Qué errores ves si los hay?**

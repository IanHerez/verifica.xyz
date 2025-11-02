# 📦 Arquitectura de Almacenamiento - Verifica

## 🎯 Respuesta Rápida

**Orden de operaciones:**

1. ✅ Subir archivo a IPFS (primero)
2. ✅ Registrar en blockchain (opcional, después de IPFS)
3. ✅ Guardar metadata en base de datos (después de todo)

**Dónde se guarda qué:**

- **IPFS (Pinata):** Solo el archivo físico (PDF, DOC, etc.)
- **Blockchain (Contrato):** Solo datos críticos para verificación (hash, CID, título, institución)
- **Base de Datos (LocalStorage/API):** TODOS los campos (descripción, categoría, destinatarios, etc.)

## 📋 Flujo Actual Detallado

### Paso 1: Subir Archivo a IPFS ⬆️

**Cuándo:** Primero, antes de blockchain

**Qué se sube:**

- El archivo físico (PDF, DOC, DOCX)
- Solo el archivo binario

**Resultado:**

- `ipfsHash` (CID de IPFS) - ejemplo: `QmHash123...`
- `ipfsUrl` (URL del gateway) - ejemplo: `https://gateway.pinata.cloud/ipfs/QmHash123...`

**Código:**

```typescript
// app/create/page.tsx línea 157
const { ipfsHash, ipfsUrl } = await uploadToIPFS(fileData.file, accessToken);
```

### Paso 2: Registrar en Blockchain ⛓️ (Opcional)

**Cuándo:** Después de IPFS, solo si el contrato está configurado

**Qué se guarda en blockchain:**

```solidity
// contracts/VerificaDocuments.sol
struct Document {
    bytes32 documentHash;    // Hash SHA-256 del archivo
    string ipfsCid;          // CID de IPFS (del paso 1)
    address creator;          // Wallet del creador
    string title;             // Título del documento
    string institution;       // Institución emisora
    uint256 createdAt;       // Timestamp de creación
    uint256 issuedAt;        // Timestamp de emisión
    bool verified;            // Estado de verificación
    bool revoked;            // Si fue revocado
    address[] signers;       // Direcciones que firmaron
}
```

**⚠️ IMPORTANTE:** El contrato NO guarda:

- ❌ `description` (descripción)
- ❌ `category` (categoría)
- ❌ `sentTo` (destinatarios - alumnos/maestros)
- ❌ `status` completo (solo verified/revoked)
- ❌ Metadata adicional

**Por qué no se guardan:**

- 💰 **Costo de gas:** Guardar strings en blockchain es MUY caro
- 🎯 **Propósito del contrato:** Solo verificar autenticidad (hash + CID)
- 🔄 **Flexibilidad:** Los metadata pueden cambiar sin afectar la verificación

**Código:**

```typescript
// app/create/page.tsx línea 181
const result = await registerDocumentOnChain(
  firstFile.hash, // Hash del archivo
  firstFile.ipfsCid || "", // CID de IPFS
  formData.title, // Solo título
  formData.institution // Solo institución
);
```

### Paso 3: Guardar en Base de Datos 💾

**Cuándo:** Después de IPFS y blockchain (si aplica)

**Qué se guarda:**

```typescript
// lib/documents-storage.ts
interface DocumentData {
  id: string;
  title: string;
  description?: string; // ✅ Aquí (NO en blockchain)
  institution: string;
  issueDate?: string;
  category?: string; // ✅ Aquí (NO en blockchain)
  files: Array<{
    name: string;
    size: number;
    hash?: string;
    ipfsCid?: string; // ✅ Referencia al CID de IPFS
    ipfsUrl?: string; // ✅ URL del archivo en IPFS
  }>;
  createdAt: number;
  createdBy: string;
  sentTo: {
    // ✅ Aquí (NO en blockchain)
    role: "alumnos" | "maestros";
    memberAddress?: string;
  };
  status: "pending" | "signed" | "rejected";
  signedBy?: string[]; // ✅ Aquí (NO en blockchain)
  blockchainTxHash?: string; // ✅ Referencia a la transacción
  blockchainChainId?: number; // ✅ Chain donde se registró
}
```

**Esto se guarda en:**

- `localStorage` (actualmente)
- Futuro: Base de datos SQL/NoSQL
- Accesible vía API `/api/documents`

## 🔄 Flujo Completo Visualizado

```
Usuario crea documento
    ↓
1. Calcular hash SHA-256 del archivo
    ↓
2. Subir archivo a IPFS (Pinata)
    ├─ Archivo físico → IPFS
    └─ Obtener: ipfsHash, ipfsUrl
    ↓
3. (Opcional) Registrar en blockchain
    ├─ documentHash (hash calculado)
    ├─ ipfsCid (de IPFS)
    ├─ title
    ├─ institution
    └─ Obtener: blockchainTxHash
    ↓
4. Guardar TODO en base de datos
    ├─ title, description, category
    ├─ sentTo (destinatarios)
    ├─ status, signedBy
    ├─ ipfsCid, ipfsUrl (referencias)
    └─ blockchainTxHash (referencia opcional)
```

## 💡 ¿Por Qué Este Diseño?

### 1. **IPFS primero:**

- Necesitas el CID para guardarlo en blockchain
- El archivo es pesado, no va en blockchain
- IPFS es descentralizado y permanente

### 2. **Blockchain solo lo esencial:**

- El hash garantiza que el archivo no cambió
- El CID permite acceder al archivo
- Título e institución para identificación básica
- Minimiza costos de gas

### 3. **Base de datos para todo lo demás:**

- Descripción, categoría (no críticos para verificación)
- Destinatarios (necesarios para la app, pero no para verificación)
- Estado de firma (puede cambiar, no tiene sentido en blockchain hasta que se firme)
- Más económico y flexible

## 📊 Comparación: Qué se guarda dónde

| Campo                      | IPFS          | Blockchain            | Base de Datos                |
| -------------------------- | ------------- | --------------------- | ---------------------------- |
| **Archivo físico (PDF)**   | ✅            | ❌                    | ❌                           |
| **Hash SHA-256**           | ❌            | ✅                    | ✅                           |
| **IPFS CID**               | ✅ (generado) | ✅                    | ✅                           |
| **Título**                 | ❌            | ✅                    | ✅                           |
| **Institución**            | ❌            | ✅                    | ✅                           |
| **Descripción**            | ❌            | ❌                    | ✅                           |
| **Categoría**              | ❌            | ❌                    | ✅                           |
| **Destinatarios (sentTo)** | ❌            | ❌                    | ✅                           |
| **Estado (status)**        | ❌            | ✅ (verified/revoked) | ✅ (pending/signed/rejected) |
| **Firmantes (signedBy)**   | ❌            | ✅ (cuando firman)    | ✅                           |
| **Fecha creación**         | ❌            | ✅                    | ✅                           |

## 🎯 Casos de Uso

### Verificación de Autenticidad

1. Usuario tiene el hash del documento
2. Busca en blockchain por hash
3. Obtiene: título, institución, CID de IPFS
4. Verifica que el CID coincida con el archivo que tiene

### Consulta de Documentos

1. Usuario (alumno/maestro/rector) entra a "Mis Documentos"
2. La app consulta la base de datos
3. Filtra por `sentTo.role` y `sentTo.memberAddress`
4. Muestra todos los campos (descripción, categoría, etc.)
5. Si tiene `ipfsUrl`, puede descargar el archivo

### Firma de Documentos

1. Usuario firma desde la app
2. Se actualiza `signedBy` en base de datos
3. (Opcional) Se puede llamar a `signDocument()` en blockchain
4. El blockchain guarda quién firmó y cuándo

## ⚠️ Consideraciones Importantes

### 1. **Blockchain es opcional pero recomendado:**

- Si falla el registro en blockchain, el documento se guarda igual en base de datos
- La verificación pública requiere blockchain
- El archivo siempre está en IPFS (descentralizado)

### 2. **Filtrado por destinatarios:**

- Se hace completamente en base de datos
- El contrato NO sabe quién es destinatario
- La app filtra usando `sentTo.role` y `sentTo.memberAddress`

### 3. **Firmas:**

- Actualmente: Solo en base de datos (`signedBy[]`)
- Futuro: También en blockchain (`signDocument()`)
- Blockchain da más garantía de inmutabilidad

## 🚀 Mejoras Futuras Posibles

1. **Guardar destinatarios en blockchain:**

   - Costoso pero más descentralizado
   - Requiere modificar el contrato

2. **Guardar metadata completa en IPFS:**

   - Crear JSON con todos los campos
   - Subir JSON a IPFS
   - Guardar solo CID del JSON en blockchain

3. **Firma dual (base de datos + blockchain):**
   - Actualizar ambos cuando se firma
   - Más robusto pero más costoso

## 📝 Resumen

- ✅ **IPFS:** Archivo físico (primero)
- ✅ **Blockchain:** Hash + CID + datos básicos (segundo, opcional)
- ✅ **Base de Datos:** TODO (metadata completa, tercero)

**El orden es correcto** - necesitas el CID de IPFS antes de registrarlo en blockchain.

**Los destinatarios y metadata** se guardan solo en base de datos porque:

- No son críticos para verificación de autenticidad
- Son muy caros de guardar en blockchain
- Necesitan flexibilidad (pueden cambiar)

# ✅ Cambios Implementados - Destinatarios en Blockchain

## 📋 Resumen

Se ha actualizado el sistema para guardar destinatarios en blockchain y restringir las firmas solo a ellos, permitiendo consulta descentralizada de documentos.

## 🔄 Cambios Realizados

### 1. ✅ Contrato (`contracts/VerificaDocuments.sol`)

#### Estructura Document actualizada:

```solidity
struct Document {
    bytes32 documentHash;
    string ipfsCid;
    address creator;
    string title;
    string institution;
    address[] recipients;  // ← NUEVO: Array de destinatarios
    uint256 createdAt;
    uint256 issuedAt;
    bool verified;
    bool revoked;
    address[] signers;
}
```

#### Nuevos Mappings:

- `mapping(bytes32 => mapping(address => bool)) public isRecipient` - Verificación rápida de destinatarios
- `uint256 public constant MAX_RECIPIENTS = 50` - Límite máximo de destinatarios

#### Función `registerDocument` actualizada:

- Ahora acepta `address[] memory _recipients`
- Valida que haya al menos un destinatario
- Valida que no haya direcciones duplicadas o inválidas
- Indexa destinatarios en `isRecipient` para búsqueda rápida
- Agrega destinatarios a `userDocuments` para consulta

#### Función `signDocument` actualizada:

- Ahora valida que el firmante sea destinatario
- Error: "Not authorized to sign - not a recipient" si no es destinatario

#### Nuevas Funciones:

- `getDocumentIpfsCid(bytes32)` - Obtiene el CID de IPFS para recuperar archivo
- `canSignDocument(bytes32, address)` - Verifica si un usuario puede firmar
- `getDocumentRecipients(bytes32)` - Obtiene todos los destinatarios de un documento

### 2. ✅ Frontend - Hook (`hooks/use-verifica-contract.ts`)

#### `registerDocument` actualizado:

- Ahora acepta `recipients: string[]`
- Valida y limpia direcciones
- Pasa destinatarios al contrato

#### Nuevas Funciones:

- `getDocumentIpfsCid(documentHash)` - Obtiene CID desde blockchain
- `canSignDocument(documentHash, signerAddress)` - Verifica si puede firmar
- `getDocumentRecipients(documentHash)` - Obtiene destinatarios

### 3. ✅ Frontend - Crear Documento (`app/create/page.tsx`)

#### Construcción de Destinatarios:

```typescript
// Si hay destinatario específico
if (formData.targetMember) {
  recipients = [formData.targetMember];
} else {
  // Si es "todos" del rol
  if (formData.targetRole === "alumnos") {
    recipients = availableAlumnos.map((a) => a.walletAddress);
  } else if (formData.targetRole === "maestros") {
    recipients = availableMaestros.map((m) => m.walletAddress);
  }
}

// Pasar al contrato
await registerDocumentOnChain(
  hash,
  ipfsCid,
  title,
  institution,
  recipients, // ← NUEVO
  issuedAt
);
```

### 4. ✅ Utilidades de Contrato (`lib/contract-utils.ts`)

#### ABI actualizado:

- `registerDocument` ahora incluye `address[] memory _recipients`
- Nuevas funciones agregadas al ABI
- Event `DocumentRegistered` actualizado con `recipients`

## 🎯 Funcionalidades Nuevas

### 1. Registro con Destinatarios

**Antes:**

- Cualquiera podía firmar cualquier documento

**Ahora:**

- Solo destinatarios registrados pueden firmar
- El contrato valida automáticamente

### 2. Consulta Descentralizada

**Nuevas capacidades:**

- `getUserDocuments(address)` - Obtiene documentos de un usuario desde blockchain
- `getDocumentIpfsCid(hash)` - Obtiene CID para descargar archivo desde IPFS
- `getDocumentRecipients(hash)` - Ver quién es destinatario de qué

### 3. Validación de Firmas

**Antes:**

- No había validación de quién podía firmar

**Ahora:**

- `canSignDocument(hash, address)` verifica antes de firmar
- El contrato rechaza firmas de no-destinatarios

## 📝 Ejemplo de Uso

### Como Destinatario - Consultar Mis Documentos

```typescript
const { getUserDocuments, getDocumentIpfsCid } = useVerificaContract();
const { walletAddress } = useUserWallet();

// Obtener mis documentos desde blockchain
const documentHashes = await getUserDocuments(walletAddress);

// Para cada documento, obtener el CID y descargar
for (const hash of documentHashes) {
  const cid = await getDocumentIpfsCid(hash);
  const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
  // Descargar archivo usando esta URL
}
```

### Verificar si Puedo Firmar

```typescript
const { canSignDocument } = useVerificaContract();
const canSign = await canSignDocument(documentHash, walletAddress);

if (canSign) {
  // Puedo firmar
} else {
  // No soy destinatario
}
```

## ⚠️ IMPORTANTE: Deployment Requerido

**Este es un cambio BREAKING** - el contrato anterior NO es compatible.

### Acciones Requeridas:

1. **Compilar el nuevo contrato** en Remix
2. **Desplegar en Arbitrum Sepolia** (y Scroll Sepolia si lo usas)
3. **Actualizar `.env`** con la nueva dirección del contrato
4. **Autorizar wallets** como creadores en el nuevo contrato
5. **Reiniciar el servidor**

### Migración de Documentos:

- Los documentos registrados en el contrato anterior NO estarán en el nuevo
- Los documentos en la base de datos seguirán funcionando
- Solo los nuevos documentos se registrarán en el nuevo contrato

## 🔄 Flujo Actualizado Completo

```
1. Usuario crea documento
   ↓
2. Subir archivo a IPFS → Obtener CID
   ↓
3. Construir array de destinatarios:
   - Si es específico: [address]
   - Si es "todos": [address1, address2, ...]
   ↓
4. Registrar en blockchain:
   registerDocument(hash, cid, title, institution, recipients[], issuedAt)
   ↓
5. Guardar metadata en BD (description, category, etc.)
   ↓
6. Destinatarios pueden:
   - Consultar documentos desde blockchain
   - Obtener CID desde blockchain
   - Descargar archivo desde IPFS usando CID
   - Firmar documento (solo si son destinatarios)
```

## ✅ Checklist de Implementación

- [x] Contrato modificado con destinatarios
- [x] Validación de firmas por destinatario
- [x] Funciones de consulta agregadas
- [x] Hook actualizado con nuevas funciones
- [x] Frontend actualizado para pasar destinatarios
- [x] ABI actualizado
- [ ] **Contrato compilado y desplegado** (ACCION REQUERIDA)
- [ ] **Variables de entorno actualizadas** (ACCION REQUERIDA)
- [ ] **Wallets autorizadas en nuevo contrato** (ACCION REQUERIDA)

## 📚 Archivos Modificados

- ✅ `contracts/VerificaDocuments.sol` - Contrato principal
- ✅ `hooks/use-verifica-contract.ts` - Hook de contrato
- ✅ `app/create/page.tsx` - Página de creación
- ✅ `lib/contract-utils.ts` - ABI y utilidades

## 🎉 Próximos Pasos

1. **Desplegar el nuevo contrato** (sigue `GUIA_ACTUALIZACION_CONTRATO.md`)
2. **Probar creación** con destinatarios
3. **Probar consulta** desde blockchain
4. **Probar firma** (solo destinatarios deberían poder firmar)

# 📋 Prompt Completo para Contrato Inteligente Verifica

## 🎯 Objetivo

Crear un contrato inteligente en Solidity que permita verificar y registrar documentos en blockchain. El contrato debe funcionar en **Arbitrum Sepolia** (chainId: 421614) y **Scroll Sepolia** (chainId: 534351), detectando automáticamente la red en la que se despliega.

## 📝 Especificaciones Técnicas

### Stack Tecnológico

- **Lenguaje**: Solidity ^0.8.20
- **Framework**: Hardhat o Foundry (recomendado Foundry para gas optimization)
- **Redes**: Arbitrum Sepolia (421614) y Scroll Sepolia (534351)
- **Compilador**: Solidity 0.8.20 o superior
- **Optimización**: Activada (200 runs)

### Requisitos del Contrato

#### 1. Estructura de Datos

```solidity
struct Document {
    bytes32 documentHash;      // Hash SHA-256 del documento
    string ipfsCid;            // CID de IPFS del archivo
    address creator;            // Dirección del creador
    string title;               // Título del documento
    string institution;         // Institución emisora
    uint256 createdAt;         // Timestamp de creación
    uint256 issuedAt;          // Timestamp de emisión (puede ser diferente)
    bool verified;              // Estado de verificación
    bool revoked;              // Si fue revocado
    address[] signers;         // Array de direcciones que firmaron
}

struct DocumentSigner {
    address signer;            // Dirección del firmante
    uint256 signedAt;          // Timestamp de firma
}
```

#### 2. Variables de Estado

```solidity
mapping(bytes32 => Document) public documents;  // Hash => Document
mapping(bytes32 => DocumentSigner[]) public documentSigners;  // Hash => Signers
mapping(address => bytes32[]) public userDocuments;  // Usuario => Array de hashes
mapping(address => bool) public authorizedCreators;  // Direcciones autorizadas para crear

address public owner;  // Owner del contrato
uint256 public documentCount;  // Contador total de documentos
```

#### 3. Funciones Requeridas

##### 3.1. Registro de Documentos

```solidity
/**
 * Registra un nuevo documento en blockchain
 * @param _documentHash Hash SHA-256 del documento (bytes32)
 * @param _ipfsCid CID de IPFS del archivo (string)
 * @param _title Título del documento (string)
 * @param _institution Institución emisora (string)
 * @param _issuedAt Timestamp de emisión (uint256) - usar block.timestamp si es actual
 * @return bool true si se registró exitosamente
 *
 * Requisitos:
 * - Solo creadores autorizados pueden registrar (o público según tu preferencia)
 * - El hash no debe estar ya registrado
 * - Validar que _documentHash no sea bytes32(0)
 * - Emitir evento DocumentRegistered
 */
function registerDocument(
    bytes32 _documentHash,
    string memory _ipfsCid,
    string memory _title,
    string memory _institution,
    uint256 _issuedAt
) public returns (bool);
```

##### 3.2. Firma de Documentos

```solidity
/**
 * Firma un documento existente
 * @param _documentHash Hash del documento a firmar
 * @return bool true si se firmó exitosamente
 *
 * Requisitos:
 * - El documento debe existir (no revocado)
 * - El firmante no debe haber firmado ya
 * - Emitir evento DocumentSigned
 */
function signDocument(bytes32 _documentHash) public returns (bool);
```

##### 3.3. Verificación de Documentos (Pública - View)

```solidity
/**
 * Verifica si un documento existe y está verificado
 * @param _documentHash Hash del documento a verificar
 * @return bool true si el documento existe y está verificado
 * @return Document struct completa del documento
 */
function verifyDocument(bytes32 _documentHash)
    public
    view
    returns (bool, Document memory);
```

##### 3.4. Revocación de Documentos

```solidity
/**
 * Revoca un documento (solo owner o creador)
 * @param _documentHash Hash del documento a revocar
 * @return bool true si se revocó exitosamente
 *
 * Requisitos:
 * - Solo owner o creador puede revocar
 * - Emitir evento DocumentRevoked
 */
function revokeDocument(bytes32 _documentHash) public returns (bool);
```

##### 3.5. Gestión de Creadores Autorizados

```solidity
/**
 * Autoriza una dirección para crear documentos (solo owner)
 */
function authorizeCreator(address _creator) public onlyOwner;

/**
 * Desautoriza una dirección (solo owner)
 */
function revokeCreator(address _creator) public onlyOwner;
```

##### 3.6. Funciones de Consulta

```solidity
/**
 * Obtiene todos los documentos de un usuario
 */
function getUserDocuments(address _user)
    public
    view
    returns (bytes32[] memory);

/**
 * Obtiene todos los firmantes de un documento
 */
function getDocumentSigners(bytes32 _documentHash)
    public
    view
    returns (DocumentSigner[] memory);

/**
 * Obtiene el total de documentos registrados
 */
function getTotalDocuments() public view returns (uint256);
```

#### 4. Eventos Requeridos

```solidity
event DocumentRegistered(
    bytes32 indexed documentHash,
    address indexed creator,
    string title,
    string institution,
    uint256 createdAt
);

event DocumentSigned(
    bytes32 indexed documentHash,
    address indexed signer,
    uint256 signedAt
);

event DocumentRevoked(
    bytes32 indexed documentHash,
    address indexed revokedBy,
    uint256 revokedAt
);

event CreatorAuthorized(address indexed creator);
event CreatorRevoked(address indexed creator);
```

#### 5. Seguridad y Optimización

**Requisitos de Seguridad:**

- ✅ Usar `require()` para validaciones críticas
- ✅ Prevenir reentrancy con `nonReentrant` modifier de OpenZeppelin
- ✅ Validar que las direcciones no sean address(0)
- ✅ Validar que los strings no estén vacíos
- ✅ Prevenir overflow/underflow (Solidity 0.8+ ya lo hace)
- ✅ Usar `bytes32` para hashes (más gas-efficient que string)
- ✅ Emitir eventos para todas las operaciones importantes

**Optimizaciones de Gas:**

- Usar `bytes32` para hashes en lugar de `string`
- Agrupar variables en structs cuando sea posible
- Usar `calldata` para parámetros de solo lectura
- Evitar bucles largos (especialmente en `getUserDocuments` si hay muchos)
- Considerar paginación para funciones de consulta

#### 6. Modifiers Requeridos

```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Only owner");
    _;
}

modifier onlyAuthorized() {
    require(
        authorizedCreators[msg.sender] || msg.sender == owner,
        "Not authorized"
    );
    _;
}

modifier documentExists(bytes32 _documentHash) {
    require(
        documents[_documentHash].creator != address(0),
        "Document does not exist"
    );
    _;
}

modifier notRevoked(bytes32 _documentHash) {
    require(
        !documents[_documentHash].revoked,
        "Document is revoked"
    );
    _;
}
```

## 📦 Dependencias

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
```

O si usas Foundry:

```solidity
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
```

## 🔧 Configuración de Deployment

### Hardhat Config Example

```javascript
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    scrollSepolia: {
      url: "https://sepolia-rpc.scroll.io",
      chainId: 534351,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
```

### Foundry Config (foundry.toml)

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
arbitrum_sepolia = "https://sepolia-rollup.arbitrum.io/rpc"
scroll_sepolia = "https://sepolia-rpc.scroll.io"

[etherscan]
arbitrum_sepolia = { api_key = "${ARBISCAN_API_KEY}" }
scroll_sepolia = { api_key = "${SCROLLSCAN_API_KEY}" }
```

## 🚀 Scripts de Deployment

### Script Hardhat (deploy.js)

```javascript
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const VerificaDocuments = await ethers.getContractFactory(
    "VerificaDocuments"
  );
  const contract = await VerificaDocuments.deploy();

  await contract.deployed();
  console.log("Contract deployed to:", contract.address);

  // Verificar en block explorer
  await hre.run("verify:verify", {
    address: contract.address,
    constructorArguments: [],
  });
}
```

### Script Foundry (script/Deploy.s.sol)

```solidity
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {VerificaDocuments} from "../src/VerificaDocuments.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        VerificaDocuments verifica = new VerificaDocuments();

        console.log("Contract deployed to:", address(verifica));

        vm.stopBroadcast();
    }
}
```

## 📋 Checklist de Implementación

- [ ] Contrato hereda de `Ownable` y `ReentrancyGuard`
- [ ] Todas las funciones tienen los modifiers correctos
- [ ] Validaciones de seguridad implementadas
- [ ] Eventos emitidos para todas las operaciones
- [ ] Funciones view para consultas públicas
- [ ] Tests unitarios escritos
- [ ] Deployment a Arbitrum Sepolia
- [ ] Deployment a Scroll Sepolia
- [ ] Verificación en block explorers
- [ ] Documentación de funciones

## 🧪 Tests Requeridos

1. **Test de Registro:**

   - Registrar documento exitosamente
   - Fallar si hash ya existe
   - Fallar si no está autorizado

2. **Test de Firma:**

   - Firmar documento exitosamente
   - Fallar si documento no existe
   - Fallar si ya fue firmado por el mismo usuario

3. **Test de Verificación:**

   - Verificar documento existente
   - Retornar false para documento inexistente

4. **Test de Revocación:**

   - Revocar documento como owner
   - Revocar documento como creador
   - Fallar si no tiene permisos

5. **Test de Autorización:**
   - Autorizar creador
   - Desautorizar creador

## 💰 Estimación de Gas

Objetivo de optimización:

- `registerDocument`: < 150,000 gas
- `signDocument`: < 80,000 gas
- `verifyDocument`: 0 gas (view function)
- `revokeDocument`: < 50,000 gas

## 📝 Ejemplo de Uso

```solidity
// 1. Desplegar contrato
VerificaDocuments verifica = new VerificaDocuments();

// 2. Autorizar creador (como owner)
verifica.authorizeCreator(creatorAddress);

// 3. Registrar documento (como creador autorizado)
bytes32 hash = keccak256("document content");
verifica.registerDocument(
    hash,
    "QmHash...", // IPFS CID
    "Certificado de Graduación",
    "Universidad Nacional",
    block.timestamp
);

// 4. Firmar documento (cualquier usuario)
verifica.signDocument(hash);

// 5. Verificar documento (público)
(bool exists, Document memory doc) = verifica.verifyDocument(hash);
```

## 🌐 Compatibilidad Multi-Chain

**IMPORTANTE:** El contrato debe ser idéntico en ambas chains. La diferencia solo está en:

- La dirección del contrato desplegado (diferente por chain)
- El block explorer para verificar transacciones
- Los parámetros de gas (aunque Arbitrum y Scroll suelen tener gas similar)

**No usar:**

- Direcciones hardcodeadas
- ChainId específico en el contrato
- Lógica condicional basada en `block.chainid` (a menos que sea necesario)

## 🔐 Mejores Prácticas Adicionales

1. **Constructor:**

   ```solidity
   constructor() {
       owner = msg.sender;
       authorizedCreators[msg.sender] = true; // Owner puede crear
   }
   ```

2. **Validaciones:**

   ```solidity
   require(_documentHash != bytes32(0), "Invalid hash");
   require(bytes(_title).length > 0, "Title required");
   require(bytes(_ipfsCid).length > 0, "IPFS CID required");
   ```

3. **Prevenir duplicados:**

   ```solidity
   require(documents[_documentHash].creator == address(0), "Document exists");
   ```

4. **Manejo de arrays:**
   - Usar `push()` para agregar elementos
   - Considerar límites si hay riesgo de arrays muy largos

## 📚 Documentación NatSpec

Todas las funciones deben tener documentación NatSpec:

```solidity
/// @notice Registra un nuevo documento en blockchain
/// @dev El hash debe ser único y el creador debe estar autorizado
/// @param _documentHash Hash SHA-256 del documento
/// @param _ipfsCid CID de IPFS del archivo
/// @param _title Título del documento
/// @param _institution Institución emisora
/// @param _issuedAt Timestamp de emisión
/// @return true si se registró exitosamente
/// @custom:security Esta función está protegida por ReentrancyGuard
```

## ✅ Criterios de Aceptación

El contrato debe:

1. ✅ Compilar sin warnings
2. ✅ Pasar todos los tests unitarios
3. ✅ Desplegarse exitosamente en Arbitrum Sepolia
4. ✅ Desplegarse exitosamente en Scroll Sepolia
5. ✅ Verificarse en ambos block explorers
6. ✅ Tener documentación NatSpec completa
7. ✅ Cumplir con estándares de seguridad
8. ✅ Optimizado para gas efficiency

---

**Procedimiento:**

1. Copia este prompt completo
2. Úsalo con tu herramienta preferida (Claude, ChatGPT, GitHub Copilot, etc.)
3. Solicita que cree el contrato siguiendo estas especificaciones
4. Revisa y ajusta según necesidades específicas
5. Despliega en ambas testnets
6. Integra en el frontend usando las utilidades que crearemos

# 🚀 Guía de Deployment - VerificaDocuments

## 📋 Resumen

Necesitas desplegar el contrato **DOS veces** (una por cada chain). El contrato es idéntico, pero cada deployment tendrá una dirección diferente.

## ✅ Verificación Pre-Deployment

El contrato está listo para desplegarse:

- ✅ No usa `block.chainid` (no tiene lógica específica de chain)
- ✅ No tiene direcciones hardcodeadas
- ✅ Compatible con EVM (funciona en cualquier chain compatible)
- ✅ Constructor correcto (`Ownable(msg.sender)`)

## 🔧 Opción 1: Deployment con Hardhat

### 1. Instalar Dependencias

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### 2. Crear `hardhat.config.js`

```javascript
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
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
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
      scrollSepolia: process.env.SCROLLSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "scrollSepolia",
        chainId: 534351,
        urls: {
          apiURL: "https://api-sepolia.scrollscan.com/api",
          browserURL: "https://sepolia.scrollscan.com",
        },
      },
    ],
  },
};
```

### 3. Crear Script de Deployment (`scripts/deploy.js`)

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    (await hre.ethers.provider.getBalance(deployer.address)).toString()
  );

  const VerificaDocuments = await hre.ethers.getContractFactory(
    "VerificaDocuments"
  );
  const contract = await VerificaDocuments.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("✅ Contract deployed to:", address);
  console.log("📍 Network:", hre.network.name);
  console.log(
    "🔗 Chain ID:",
    (await hre.ethers.provider.getNetwork()).chainId.toString()
  );

  // Verificar en block explorer (opcional, requiere API keys)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting 30 seconds before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on block explorer");
    } catch (error) {
      console.log(
        "⚠️ Verification failed (this is OK if already verified):",
        error.message
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 4. Configurar Variables de Entorno

Crea `.env` en la raíz del proyecto:

```env
PRIVATE_KEY=tu_private_key_aqui_sin_0x
ARBISCAN_API_KEY=tu_api_key_de_arbiscan
SCROLLSCAN_API_KEY=tu_api_key_de_scrollscan
```

### 5. Deployment

```bash
# Desplegar en Arbitrum Sepolia
npx hardhat run scripts/deploy.js --network arbitrumSepolia

# Desplegar en Scroll Sepolia
npx hardhat run scripts/deploy.js --network scrollSepolia
```

**Ejemplo de salida:**

```
Deploying with account: 0x1234...
Account balance: 1000000000000000000
✅ Contract deployed to: 0xABCDEF1234567890ABCDEF1234567890ABCDEF12
📍 Network: arbitrumSepolia
🔗 Chain ID: 421614
```

## 🔧 Opción 2: Deployment con Foundry

### 1. Instalar Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Inicializar Proyecto Foundry

```bash
forge init --force
```

### 3. Configurar `foundry.toml`

```toml
[profile.default]
src = "contracts"
out = "out"
libs = ["node_modules"]
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

### 4. Instalar Dependencias

```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### 5. Crear Script (`script/Deploy.s.sol`)

```solidity
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {VerificaDocuments} from "../contracts/VerificaDocuments.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        VerificaDocuments verifica = new VerificaDocuments();

        console.log("Contract deployed to:", address(verifica));
        console.log("Deployer:", msg.sender);
        console.log("Chain ID:", block.chainid);

        vm.stopBroadcast();
    }
}
```

### 6. Deployment

```bash
# Desplegar en Arbitrum Sepolia
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url arbitrum_sepolia \
  --broadcast \
  --verify \
  -vvvv

# Desplegar en Scroll Sepolia
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url scroll_sepolia \
  --broadcast \
  --verify \
  -vvvv
```

## 🔧 Opción 3: Deployment con Remix (Más Fácil) ⭐ RECOMENDADO

### 📋 Requisitos Previos

- MetaMask instalado en tu navegador
- ETH en ambas testnets (obtén de los faucets)
- Acceso a https://remix.ethereum.org

### Paso 1: Configurar Remix

1. **Abrir Remix IDE**

   - Ve a https://remix.ethereum.org
   - Espera a que cargue completamente

2. **Crear carpeta de contratos** (opcional pero recomendado)

   - Click en el ícono de carpeta (📁) en el panel izquierdo
   - Click derecho → "New Folder"
   - Nombra la carpeta `contracts`

3. **Crear archivo del contrato**

   - Click derecho en la carpeta `contracts` (o en la raíz si no creaste carpeta)
   - Click "New File"
   - Nombre el archivo: `VerificaDocuments.sol`
   - Abre el archivo creado

4. **Pegar código del contrato**

   - Copia TODO el contenido de `contracts/VerificaDocuments.sol` de tu proyecto
   - Pégalo en el editor de Remix
   - Guarda (Ctrl+S / Cmd+S)

   ⚠️ **IMPORTANTE:** El contrato usa OpenZeppelin, pero Remix puede auto-resolver las dependencias si tienes acceso a internet.

### Paso 2: Compilar el Contrato

1. **Ir a la pestaña "Solidity Compiler"**

   - Click en el ícono del compilador (⚙️) en el panel izquierdo
   - O usa el atajo: `Ctrl+Shift+P` → busca "Compiler"

2. **Configurar el compilador**

   - **Compiler version:** Selecciona `0.8.20` o superior (debe coincidir con `pragma solidity ^0.8.20;`)
   - **Language:** Solidity
   - **EVM Version:** default (o "paris" si está disponible)

3. **Compilar**

   - Click en el botón "Compile VerificaDocuments.sol"
   - O presiona `Ctrl+S` para compilar automáticamente
   - Espera a que termine (verás un ✅ verde si fue exitoso)

4. **Verificar la compilación**
   - Deberías ver un ✅ verde en el panel del compilador
   - Si hay errores, revísalos en la pestaña de errores
   - Los errores más comunes son por falta de OpenZeppelin (Remix debería resolverlo automáticamente)

### Paso 3: Configurar MetaMask para Arbitrum Sepolia

Antes de desplegar, asegúrate de tener Arbitrum Sepolia configurada en MetaMask:

1. **Abrir MetaMask**

   - Click en el ícono de MetaMask
   - Click en el dropdown de redes (arriba, muestra "Ethereum Mainnet" u otra red)

2. **Agregar Arbitrum Sepolia** (si no la tienes)

   - Click "Add Network" o "Add a network manually"
   - Llena los campos:
     - **Network Name:** `Arbitrum Sepolia`
     - **RPC URL:** `https://sepolia-rollup.arbitrum.io/rpc`
     - **Chain ID:** `421614`
     - **Currency Symbol:** `ETH`
     - **Block Explorer URL:** `https://sepolia.arbiscan.io`
   - Click "Save"

3. **Cambiar a Arbitrum Sepolia**

   - Selecciona "Arbitrum Sepolia" en el dropdown de redes
   - Verifica que aparezca "Arbitrum Sepolia" en la parte superior de MetaMask

4. **Verificar balance**
   - Deberías tener ETH en Arbitrum Sepolia
   - Si no tienes, obtén de: https://faucet.quicknode.com/arbitrum/sepolia
   - Necesitas al menos 0.01 ETH para deployment y transacciones

### Paso 4: Deployment en Arbitrum Sepolia

1. **Ir a la pestaña "Deploy & Run Transactions"**

   - Click en el ícono de deployment (⬇️) en el panel izquierdo
   - O usa el atajo: Click en "Deploy & Run Transactions" en el panel de plugins

2. **Conectar MetaMask**

   - En la sección "Environment", selecciona **"Injected Provider - MetaMask"**
   - Si aparece un popup de MetaMask, click "Next" → "Connect"
   - **⚠️ CRÍTICO:** Verifica que en Remix aparezca: `Injected Provider - MetaMask (421614)` o similar
   - **Chain ID debe ser exactamente 421614** (Arbitrum Sepolia)
   - ❌ **NO uses Ethereum Sepolia (11155111)** - el frontend no funcionará
   - Si ves Chain ID 11155111 u otra chain, cambia MetaMask a Arbitrum Sepolia ANTES de desplegar

3. **Seleccionar el contrato**

   - En la sección "Contract", selecciona **"VerificaDocuments - contracts/VerificaDocuments.sol"**
   - Deberías ver que el contrato está listo para desplegar

4. **Desplegar**

   - **NO cambies ningún parámetro** en "Deploy" (el constructor no necesita parámetros)
   - Click en el botón **"Deploy"** (botón naranja)
   - MetaMask se abrirá automáticamente

5. **Confirmar en MetaMask**

   - Revisa la transacción en MetaMask
   - Verifica que:
     - **Network:** Arbitrum Sepolia
     - **Gas:** Alrededor de 2-3 millones de gas (normal para contratos con OpenZeppelin)
   - Click **"Confirm"** o **"Approve"**

6. **Esperar confirmación**

   - Espera a que la transacción se confirme (10-30 segundos en Arbitrum)
   - Verás en Remix: `creation of VerificaDocuments pending...`
   - Luego verás: `[block:xxxxx] transactionHash: 0x...` en verde

7. **Copiar la dirección del contrato**

   - En Remix, debajo del botón "Deploy", verás una sección expandida llamada **"Deployed Contracts"**
   - Verás `VERIFICADOCUMENTS AT 0x...` (donde `0x...` es la dirección)
   - **Copia esta dirección completa** - la necesitarás para `.env`
   - Ejemplo: `0x1234567890123456789012345678901234567890`

8. **Verificar en Arbiscan**
   - Abre https://sepolia.arbiscan.io
   - Pega la dirección del contrato en la búsqueda
   - Deberías ver el contrato con todas sus funciones

**✅ Anota esta dirección:** `0x170B50F326d0653761a05d6960BD0a8354A87E24` (Arbitrum Sepolia)

**📝 Nota:** Si ya desplegaste en Arbitrum Sepolia, tu dirección debería ser diferente pero válida. Verifica que el Chain ID sea 421614.

### Paso 5: Configurar MetaMask para Scroll Sepolia

1. **Agregar Scroll Sepolia a MetaMask** (si no la tienes)

   - Click en el dropdown de redes en MetaMask
   - Click "Add Network" o "Add a network manually"
   - Llena los campos:
     - **Network Name:** `Scroll Sepolia`
     - **RPC URL:** `https://sepolia-rpc.scroll.io`
     - **Chain ID:** `534351`
     - **Currency Symbol:** `ETH`
     - **Block Explorer URL:** `https://sepolia.scrollscan.com`
   - Click "Save"

2. **Cambiar a Scroll Sepolia**

   - Selecciona "Scroll Sepolia" en MetaMask
   - Verifica que el Chain ID sea `534351`

3. **Verificar balance**
   - Deberías tener ETH en Scroll Sepolia
   - Si no tienes, obtén de: https://faucet.scroll.io/
   - Necesitas al menos 0.01 ETH

### Paso 6: Deployment en Scroll Sepolia

1. **En Remix, cambiar la red**

   - Ve a la pestaña "Deploy & Run Transactions"
   - En "Environment", debería seguir mostrando "Injected Provider - MetaMask"
   - **Pero ahora debería mostrar Chain ID: 534351** (Scroll Sepolia)
   - Si no cambia, refresca Remix o reconecta MetaMask

2. **Verificar que estás en Scroll Sepolia**

   - En Remix, verifica que aparezca: `Injected Provider - MetaMask (534351)` o similar
   - **Chain ID debe ser exactamente 534351** (Scroll Sepolia)
   - ❌ **NO uses Ethereum Sepolia (11155111)** - el frontend no funcionará
   - Si sigue mostrando Arbitrum Sepolia u otra chain, asegúrate de que MetaMask esté en Scroll Sepolia

3. **Desplegar nuevamente**

   - El contrato sigue seleccionado: **"VerificaDocuments - contracts/VerificaDocuments.sol"**
   - Click en **"Deploy"** otra vez
   - MetaMask se abrirá para Scroll Sepolia

4. **Confirmar en MetaMask**

   - Verifica que dice "Scroll Sepolia" en la transacción
   - Click **"Confirm"**

5. **Esperar confirmación**

   - Espera la confirmación (puede tardar más que Arbitrum)
   - Verás la transacción exitosa en Remix

6. **Copiar la dirección del contrato**
   - En "Deployed Contracts", verás otra instancia: `VERIFICADOCUMENTS AT 0x...` (dirección diferente)
   - **Copia esta nueva dirección**
   - Esta es la dirección del contrato en Scroll Sepolia

**✅ Anota esta dirección:** `_________________________` (Scroll Sepolia)

### Paso 7: Configurar Variables de Entorno

1. **Abrir tu proyecto** (el frontend de Next.js)

2. **Editar `.env`**

   - Abre o crea el archivo `.env` en la raíz del proyecto
   - Agrega las direcciones que copiaste:

   ```env
   # Arbitrum Sepolia (Chain ID: 421614)
   NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0xTU_DIRECCION_ARBITRUM_AQUI

   # Scroll Sepolia (Chain ID: 534351)
   NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT=0xTU_DIRECCION_SCROLL_AQUI
   ```

3. **Reemplazar con tus direcciones**

   - Reemplaza `0xTU_DIRECCION_ARBITRUM_AQUI` con la dirección de Arbitrum Sepolia
   - Reemplaza `0xTU_DIRECCION_SCROLL_AQUI` con la dirección de Scroll Sepolia

   Ejemplo:

   ```env
   NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0x1234567890123456789012345678901234567890
   NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT=0xABCDEF0123456789ABCDEF0123456789ABCDEF01
   ```

4. **Guardar y reiniciar**
   - Guarda el archivo `.env`
   - **IMPORTANTE:** Reinicia el servidor de Next.js:
     - Detén el servidor (Ctrl+C)
     - Inicia de nuevo: `npm run dev`

### Paso 8: Autorizar Creadores (Opcional)

Si quieres que otros usuarios (además del owner) puedan crear documentos:

**En Remix:**

1. **En la sección "Deployed Contracts"**, expande el contrato desplegado
2. Verás todas las funciones disponibles
3. **Para Arbitrum Sepolia:**
   - Busca la función `authorizeCreator`
   - En el campo de input, pega la dirección del usuario a autorizar (sin comillas)
   - Click "transact" o "write"
   - Confirma en MetaMask
4. **Para Scroll Sepolia:**
   - Repite el mismo proceso con el contrato desplegado en Scroll Sepolia

**Nota:** El owner (quien desplegó) ya está autorizado automáticamente por el constructor.

### ✅ Verificación Final

1. **Probar en el frontend**

   - Inicia el servidor: `npm run dev`
   - Abre http://localhost:3000
   - Conecta tu wallet (en Arbitrum Sepolia o Scroll Sepolia)
   - Ve a `/create`
   - Intenta crear un documento
   - Revisa la consola del navegador (F12) - deberías ver:
     ```
     [contract-utils] Contrato obtenido para 421614: 0x...
     [Create] Documento registrado en blockchain: { txHash: "0x...", chainId: 421614 }
     ```

2. **Verificar en Block Explorers**
   - **Arbitrum Sepolia:** https://sepolia.arbiscan.io → busca tu dirección
   - **Scroll Sepolia:** https://sepolia.scrollscan.com → busca tu dirección

## 📝 Después del Deployment

### 1. Anotar Direcciones

Después de cada deployment, anota:

- **Arbitrum Sepolia:** `0x...` (dirección del contrato)
- **Scroll Sepolia:** `0x...` (dirección del contrato)

### 2. Configurar `.env` en el Frontend

Edita tu `.env` (o crea uno si no existe):

```env
# Arbitrum Sepolia (Chain ID: 421614)
NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0xTU_DIRECCION_ARBITRUM_AQUI

# Scroll Sepolia (Chain ID: 534351)
NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT=0xTU_DIRECCION_SCROLL_AQUI
```

### 3. Autorizar Creadores (Opcional)

Si quieres que otros usuarios puedan crear documentos, llama a `authorizeCreator()` en cada contrato:

**En Arbitrum Sepolia:**

```javascript
// Usando ethers.js o desde Remix
await contract.authorizeCreator("0xDIRECCION_DEL_CREADOR");
```

**En Scroll Sepolia:**

```javascript
// Lo mismo en la otra chain
await contract.authorizeCreator("0xDIRECCION_DEL_CREADOR");
```

O puedes dejar solo el owner como autorizado (ya está autorizado por defecto en el constructor).

### 4. Verificar en Block Explorers

**Arbitrum Sepolia:**

- Ve a https://sepolia.arbiscan.io
- Busca tu dirección de contrato
- Verifica el código fuente (opcional pero recomendado)

**Scroll Sepolia:**

- Ve a https://sepolia.scrollscan.com
- Busca tu dirección de contrato
- Verifica el código fuente (opcional pero recomendado)

## ✅ Checklist de Deployment

- [ ] Contrato compilado sin errores
- [ ] ETH suficiente en wallet para gas (en ambas testnets)
- [ ] Deployment en Arbitrum Sepolia completado
- [ ] Dirección de Arbitrum Sepolia copiada
- [ ] Deployment en Scroll Sepolia completado
- [ ] Dirección de Scroll Sepolia copiada
- [ ] Variables de entorno configuradas en `.env`
- [ ] Servidor Next.js reiniciado después de cambiar `.env`
- [ ] Probar conexión desde el frontend

## 🧪 Prueba Rápida

1. Inicia el frontend: `npm run dev`
2. Conecta tu wallet (en Arbitrum Sepolia o Scroll Sepolia)
3. Ve a `/create`
4. Intenta crear un documento
5. Revisa la consola del navegador - deberías ver:
   ```
   [contract-utils] Contrato obtenido para 421614: 0x...
   [Create] Documento registrado en blockchain: { txHash: "0x...", chainId: 421614 }
   ```

## ⚠️ Notas Importantes

1. **Cada chain es independiente:** Los documentos registrados en Arbitrum Sepolia NO aparecen en Scroll Sepolia y viceversa.

2. **Gas fees:** Necesitas ETH en cada testnet:

   - Arbitrum Sepolia: Faucet en https://faucet.quicknode.com/arbitrum/sepolia
   - Scroll Sepolia: Faucet en https://faucet.scroll.io/

3. **Owner inicial:** El address que despliega el contrato se convierte en owner y creador autorizado automáticamente.

4. **Mismo código, diferentes direcciones:** El bytecode es idéntico, pero las direcciones serán diferentes porque cada deployment es independiente.

## 🐛 Troubleshooting

### "Contract not found"

- Verifica que configuraste las direcciones en `.env`
- Reinicia el servidor Next.js
- Verifica que estás en la chain correcta en tu wallet

### "Insufficient funds"

- Obtén ETH de los faucets
- Verifica que tienes suficiente para gas fees

### "Transaction failed"

- Verifica que estás autorizado (owner o autorizado con `authorizeCreator`)
- Verifica que el hash del documento no existe ya

/**
 * Cross-Chain ENS Resolution con soporte CCIP-Read
 * 
 * ENS solo existe en Ethereum Mainnet/Sepolia, pero podemos resolverlo desde L2s
 * (Arbitrum, Scroll) usando CCIP-Read (EIP-3668) o fallback a provider directo.
 * 
 * CCIP-Read permite que resolvers en L2 consulten datos off-chain desde Ethereum.
 * Si no está disponible, usamos un provider directo a Ethereum Mainnet/Sepolia.
 */

import { JsonRpcProvider, BrowserProvider } from "ethers"

// Provider de Ethereum Mainnet para resolver ENS (independiente de la red actual)
const MAINNET_RPC_URLS = [
  "https://eth.llamarpc.com",
  "https://eth-mainnet.g.alchemy.com/v2/demo",
  "https://ethereum.publicnode.com",
]

// Provider de Ethereum Sepolia para ENS en testnet
const SEPOLIA_RPC_URLS = [
  "https://rpc.sepolia.org",
  "https://sepolia.infura.io/v3/",
  "https://sepolia.gateway.tenderly.co",
]

let mainnetProvider: JsonRpcProvider | null = null
let sepoliaProvider: JsonRpcProvider | null = null

/**
 * Obtiene un provider de Ethereum Mainnet para resolver ENS
 */
function getMainnetProvider(): JsonRpcProvider {
  if (!mainnetProvider) {
    console.log(`[ENS] 📡 Creando provider de Ethereum Mainnet...`)
    mainnetProvider = new JsonRpcProvider(MAINNET_RPC_URLS[0])
  }
  return mainnetProvider
}

/**
 * Obtiene un provider de Ethereum Sepolia para resolver ENS en testnet
 */
function getSepoliaProvider(): JsonRpcProvider {
  if (!sepoliaProvider) {
    console.log(`[ENS] 📡 Creando provider de Ethereum Sepolia...`)
    sepoliaProvider = new JsonRpcProvider(SEPOLIA_RPC_URLS[0])
  }
  return sepoliaProvider
}

/**
 * Resuelve ENS a dirección usando Ethereum Mainnet (desde cualquier red)
 * 
 * @param ensName - Nombre ENS (ej: "vitalik.eth")
 * @returns Dirección Ethereum o null
 * 
 * @example
 * ```ts
 * // Funciona desde cualquier red (Arbitrum, Scroll, etc.)
 * const address = await resolveENSFromMainnet("vitalik.eth")
 * ```
 */
export async function resolveENSFromMainnet(ensName: string): Promise<string | null> {
  try {
    console.log(`[ENS] 📡 Resolviendo ENS desde Ethereum Mainnet: ${ensName}`)
    const provider = getMainnetProvider()
    const address = await provider.resolveName(ensName.toLowerCase())
    
    if (address) {
      console.log(`[ENS] ✅ ENS resuelto desde Mainnet: ${ensName} → ${address}`)
    } else {
      console.log(`[ENS] ⚠️ ENS no encontrado en Mainnet: ${ensName}`)
    }
    
    return address
  } catch (error) {
    console.error(`[ENS] ❌ Error resolviendo ENS ${ensName} desde mainnet:`, error)
    return null
  }
}

/**
 * Resuelve ENS desde Ethereum Sepolia (para testnet)
 */
export async function resolveENSFromSepolia(ensName: string): Promise<string | null> {
  try {
    console.log(`[ENS] 📡 Resolviendo ENS desde Ethereum Sepolia: ${ensName}`)
    const provider = getSepoliaProvider()
    const address = await provider.resolveName(ensName.toLowerCase())
    
    if (address) {
      console.log(`[ENS] ✅ ENS resuelto desde Sepolia: ${ensName} → ${address}`)
    } else {
      console.log(`[ENS] ⚠️ ENS no encontrado en Sepolia: ${ensName}`)
    }
    
    return address
  } catch (error) {
    console.error(`[ENS] ❌ Error resolviendo ENS ${ensName} desde sepolia:`, error)
    return null
  }
}

/**
 * Lookup inverso: obtiene ENS de una dirección usando Ethereum Mainnet
 * 
 * @param address - Dirección Ethereum
 * @returns Nombre ENS o null
 * 
 * @example
 * ```ts
 * const ensName = await lookupENSFromMainnet("0x...")
 * ```
 */
export async function lookupENSFromMainnet(address: string): Promise<string | null> {
  try {
    console.log(`[ENS] 📡 Buscando ENS desde Ethereum Mainnet para: ${address}`)
    const provider = getMainnetProvider()
    const ensName = await provider.lookupAddress(address)
    
    if (ensName) {
      console.log(`[ENS] ✅ ENS encontrado desde Mainnet: ${address} → ${ensName}`)
    } else {
      console.log(`[ENS] ⚠️ No hay ENS configurado en Mainnet para: ${address}`)
    }
    
    return ensName
  } catch (error) {
    console.error(`[ENS] ❌ Error buscando ENS para ${address} desde mainnet:`, error)
    return null
  }
}

/**
 * Lookup ENS desde Ethereum Sepolia (para testnet)
 */
export async function lookupENSFromSepolia(address: string): Promise<string | null> {
  try {
    console.log(`[ENS] 📡 Buscando ENS desde Ethereum Sepolia para: ${address}`)
    const provider = getSepoliaProvider()
    const ensName = await provider.lookupAddress(address)
    
    if (ensName) {
      console.log(`[ENS] ✅ ENS encontrado desde Sepolia: ${address} → ${ensName}`)
    } else {
      console.log(`[ENS] ⚠️ No hay ENS configurado en Sepolia para: ${address}`)
    }
    
    return ensName
  } catch (error) {
    console.error(`[ENS] ❌ Error buscando ENS para ${address} desde sepolia:`, error)
    return null
  }
}

/**
 * Resuelve ENS usando el provider actual si está en mainnet,
 * o usa mainnet provider si está en otra red
 * 
 * @param ensName - Nombre ENS
 * @param currentProvider - Provider actual (puede ser de cualquier red)
 * @returns Dirección Ethereum o null
 */
export async function resolveENSMultichain(
  ensName: string,
  currentProvider?: BrowserProvider | JsonRpcProvider | null
): Promise<string | null> {
  try {
    console.log(`[ENS] 🚀 Iniciando resolución multichain de: ${ensName}`)
    
    // Si hay un provider actual, intentar usarlo primero (puede soportar CCIP-Read)
    if (currentProvider) {
      try {
        const network = await currentProvider.getNetwork()
        const chainId = Number(network.chainId)
        const networkName = network.name || `Chain ${chainId}`
        
        console.log(`[ENS] 📍 Detectada red: ${networkName} (chainId: ${chainId})`)
        
        // Si estamos en mainnet (chainId: 1), usar el provider actual
        if (network.chainId === BigInt(1)) {
          console.log(`[ENS] ✅ Estamos en Ethereum Mainnet, resolviendo directamente: ${ensName}`)
          const address = await currentProvider.resolveName(ensName.toLowerCase())
          
          if (address) {
            console.log(`[ENS] ✅ ENS resuelto desde Mainnet: ${ensName} → ${address}`)
          } else {
            console.log(`[ENS] ⚠️ ENS no encontrado en Mainnet: ${ensName}`)
          }
          
          return address
        }
        
        // Si estamos en Sepolia (chainId: 11155111), usar provider actual
        if (network.chainId === BigInt(11155111)) {
          console.log(`[ENS] ✅ Estamos en Ethereum Sepolia, resolviendo directamente: ${ensName}`)
          const address = await currentProvider.resolveName(ensName.toLowerCase())
          
          if (address) {
            console.log(`[ENS] ✅ ENS resuelto desde Sepolia: ${ensName} → ${address}`)
          } else {
            console.log(`[ENS] ⚠️ ENS no encontrado en Sepolia: ${ensName}`)
          }
          
          return address
        }
        
        // Si estamos en L2 (Arbitrum, Scroll, etc.), intentar resolver con CCIP-Read
        // ethers.js automáticamente usa CCIP-Read si el resolver lo soporta
        console.log(`[ENS] 🔄 Intentando resolver desde ${networkName} usando CCIP-Read (EIP-3668)...`)
        console.log(`[ENS] 💡 Si el resolver soporta CCIP-Read, consultará Ethereum automáticamente`)
        
        try {
          const address = await currentProvider.resolveName(ensName.toLowerCase())
          
          if (address) {
            console.log(`[ENS] ✅ ENS resuelto vía CCIP-Read desde ${networkName}: ${ensName} → ${address}`)
            return address
          } else {
            console.log(`[ENS] ⚠️ ENS no encontrado vía CCIP-Read en ${networkName}: ${ensName}`)
          }
        } catch (ccipError: any) {
          // CCIP-Read puede fallar si el resolver no lo soporta
          const errorMsg = ccipError?.message || String(ccipError)
          console.warn(`[ENS] ⚠️ CCIP-Read falló o no está disponible:`, errorMsg)
          console.log(`[ENS] 🔄 Usando fallback: provider de Ethereum Sepolia para resolver: ${ensName}`)
        }
        
        // Fallback: usar provider de Sepolia (donde están tus ENS en testnet)
        console.log(`[ENS] 🔄 Fallback: usando provider de Ethereum Sepolia para resolver: ${ensName}`)
        const sepoliaProvider = getSepoliaProvider()
        const address = await sepoliaProvider.resolveName(ensName.toLowerCase())
        
        if (address) {
          console.log(`[ENS] ✅ ENS resuelto desde Sepolia (fallback): ${ensName} → ${address}`)
        } else {
          console.log(`[ENS] ⚠️ ENS no encontrado en Sepolia: ${ensName}`)
        }
        
        return address
        
      } catch (error) {
        console.warn(`[ENS] ⚠️ Error obteniendo red del provider actual:`, error)
        console.log(`[ENS] 🔄 Usando fallback: provider de Ethereum Sepolia`)
      }
    } else {
      console.log(`[ENS] ℹ️ No hay provider actual disponible, usando Sepolia directamente`)
    }

    // Si estamos en otra red o no hay provider, usar Sepolia directamente (donde están tus ENS)
    return await resolveENSFromSepolia(ensName)
  } catch (error) {
    console.error(`[ENS] ❌ Error resolviendo ENS multichain ${ensName}:`, error)
    return null
  }
}

/**
 * Lookup inverso multichain
 */
export async function lookupENSMultichain(
  address: string,
  currentProvider?: BrowserProvider | JsonRpcProvider | null
): Promise<string | null> {
  try {
    console.log(`[ENS] 🚀 Iniciando lookup multichain para: ${address}`)
    
    // Si hay un provider actual, intentar usarlo primero (puede soportar CCIP-Read)
    if (currentProvider) {
      try {
        const network = await currentProvider.getNetwork()
        const chainId = Number(network.chainId)
        const networkName = network.name || `Chain ${chainId}`
        
        console.log(`[ENS] 📍 Detectada red: ${networkName} (chainId: ${chainId})`)
        
        // Si estamos en mainnet (chainId: 1), usar el provider actual
        if (network.chainId === BigInt(1)) {
          console.log(`[ENS] ✅ Estamos en Ethereum Mainnet, buscando ENS directamente para: ${address}`)
          const ensName = await currentProvider.lookupAddress(address)
          
          if (ensName) {
            console.log(`[ENS] ✅ ENS encontrado desde Mainnet: ${address} → ${ensName}`)
          } else {
            console.log(`[ENS] ⚠️ No hay ENS configurado en Mainnet para: ${address}`)
          }
          
          return ensName
        }
        
        // Si estamos en Sepolia (chainId: 11155111), usar provider actual
        if (network.chainId === BigInt(11155111)) {
          console.log(`[ENS] ✅ Estamos en Ethereum Sepolia, buscando ENS directamente para: ${address}`)
          const ensName = await currentProvider.lookupAddress(address)
          
          if (ensName) {
            console.log(`[ENS] ✅ ENS encontrado desde Sepolia: ${address} → ${ensName}`)
          } else {
            console.log(`[ENS] ⚠️ No hay ENS configurado en Sepolia para: ${address}`)
          }
          
          return ensName
        }
        
        // Si estamos en L2 (Arbitrum, Scroll, etc.), intentar lookup con CCIP-Read
        console.log(`[ENS] 🔄 Intentando lookup desde ${networkName} usando CCIP-Read (EIP-3668)...`)
        console.log(`[ENS] 💡 Si el resolver soporta CCIP-Read, consultará Ethereum automáticamente`)
        
        try {
          const ensName = await currentProvider.lookupAddress(address)
          
          if (ensName) {
            console.log(`[ENS] ✅ ENS encontrado vía CCIP-Read desde ${networkName}: ${address} → ${ensName}`)
            return ensName
          } else {
            console.log(`[ENS] ⚠️ No hay ENS configurado vía CCIP-Read para: ${address}`)
          }
        } catch (ccipError: any) {
          // CCIP-Read puede fallar si el resolver no lo soporta
          const errorMsg = ccipError?.message || String(ccipError)
          console.warn(`[ENS] ⚠️ CCIP-Read falló o no está disponible:`, errorMsg)
          console.log(`[ENS] 🔄 Usando fallback: provider de Ethereum Sepolia para buscar ENS de: ${address}`)
        }
        
        // Fallback: usar provider de Sepolia (donde están tus ENS en testnet)
        console.log(`[ENS] 🔄 Fallback: usando provider de Ethereum Sepolia para buscar ENS de: ${address}`)
        const sepoliaProvider = getSepoliaProvider()
        const ensName = await sepoliaProvider.lookupAddress(address)
        
        if (ensName) {
          console.log(`[ENS] ✅ ENS encontrado desde Sepolia (fallback): ${address} → ${ensName}`)
        } else {
          console.log(`[ENS] ⚠️ No hay ENS configurado en Sepolia para: ${address}`)
        }
        
        return ensName
        
      } catch (error) {
        console.warn(`[ENS] ⚠️ Error obteniendo red del provider actual:`, error)
        console.log(`[ENS] 🔄 Usando fallback: provider de Ethereum Sepolia`)
      }
    } else {
      console.log(`[ENS] ℹ️ No hay provider actual disponible, usando Sepolia directamente`)
    }

    // Si estamos en otra red o no hay provider, usar Sepolia directamente (donde están tus ENS)
    return await lookupENSFromSepolia(address)
  } catch (error) {
    console.error(`[ENS] ❌ Error buscando ENS multichain para ${address}:`, error)
    return null
  }
}


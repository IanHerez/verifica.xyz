/**
 * Configuración de contratos inteligentes por chain
 * 
 * Define las direcciones de los contratos según la red (Arbitrum Sepolia, Scroll Sepolia)
 */

export interface ChainConfig {
  chainId: number
  name: string
  rpcUrl: string
  blockExplorer: string
  contractAddress?: string
}

/**
 * Configuraciones de chains soportadas
 */
export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  // Arbitrum Sepolia
  421614: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    contractAddress:
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT
        : undefined,
  },
  // Scroll Sepolia
  534351: {
    chainId: 534351,
    name: "Scroll Sepolia",
    rpcUrl: "https://sepolia-rpc.scroll.io",
    blockExplorer: "https://sepolia.scrollscan.com",
    contractAddress:
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT
        : undefined,
  },
}

/**
 * Obtiene la configuración de una chain por su chainId
 */
export function getChainConfig(chainId: number): ChainConfig | null {
  return SUPPORTED_CHAINS[chainId] || null
}

/**
 * Obtiene la dirección del contrato para una chain específica
 */
export function getContractAddress(chainId: number): string | null {
  const config = getChainConfig(chainId)
  return config?.contractAddress || null
}

/**
 * Verifica si una chain está soportada
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in SUPPORTED_CHAINS
}

/**
 * Obtiene todas las chains soportadas
 */
export function getSupportedChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS)
}


/**
 * Format Ethereum address for display
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Convert Wei to ETH
 */
export function weiToEth(wei: string): string {
  const eth = BigInt(wei) / BigInt(10 ** 18)
  return eth.toString()
}

/**
 * Convert ETH to Wei
 */
export function ethToWei(eth: number): string {
  return (BigInt(eth) * BigInt(10 ** 18)).toString()
}

/**
 * Validate ENS name
 */
export function isValidENS(name: string): boolean {
  return /^[a-z0-9-]+\.eth$/.test(name.toLowerCase())
}

/**
 * Hash document for blockchain verification
 */
export async function hashDocument(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return `0x${hashHex}`
}

/**
 * ENS Utilities - Requiere ethers.js y provider de Privy
 * 
 * Para usar estas funciones, primero obtén el provider de Privy:
 * 
 * ```ts
 * import { usePrivy } from '@privy-io/react-auth'
 * import { BrowserProvider } from 'ethers'
 * 
 * const { getEthereumProvider } = usePrivy()
 * const provider = new BrowserProvider(await getEthereumProvider())
 * ```
 */

/**
 * Resolve ENS name to Ethereum address
 * @param ensName - ENS name (e.g., "vitalik.eth")
 * @param provider - Ethers.js provider (from Privy)
 * @returns Ethereum address or null if not found
 */
export async function resolveENS(
  ensName: string,
  provider: { resolveName: (name: string) => Promise<string | null> }
): Promise<string | null> {
  if (!isValidENS(ensName)) {
    throw new Error(`Invalid ENS name: ${ensName}`)
  }

  try {
    const address = await provider.resolveName(ensName.toLowerCase())
    return address
  } catch (error) {
    console.error(`Error resolving ENS name ${ensName}:`, error)
    return null
  }
}

/**
 * Reverse lookup: Get ENS name from Ethereum address
 * @param address - Ethereum address
 * @param provider - Ethers.js provider (from Privy)
 * @returns ENS name or null if not set
 */
export async function lookupENS(
  address: string,
  provider: { lookupAddress: (address: string) => Promise<string | null> }
): Promise<string | null> {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`)
  }

  try {
    const ensName = await provider.lookupAddress(address)
    return ensName
  } catch (error) {
    console.error(`Error looking up ENS for address ${address}:`, error)
    return null
  }
}

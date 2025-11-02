"use client"

import { useState, useCallback } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { BrowserProvider } from "ethers"
import { resolveENS as resolveENSName, lookupENS as lookupENSName, isValidENS } from "@/lib/web3-utils"
import {
  resolveENSFromMainnet,
  resolveENSFromSepolia,
  lookupENSFromMainnet,
  lookupENSFromSepolia,
  resolveENSMultichain,
  lookupENSMultichain,
} from "@/lib/cross-chain-ens"

/**
 * Hook personalizado para interactuar con ENS usando Privy
 * 
 * Requiere:
 * - Usuario autenticado con Privy
 * - Wallet conectada o embedded wallet activa
 * - Ethereum mainnet (ENS solo funciona en mainnet)
 */
export function useENS() {
  const { authenticated, getEthereumProvider } = usePrivy()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Resuelve un nombre ENS a una dirección Ethereum
   */
  const resolveENS = useCallback(
    async (ensName: string): Promise<string | null> => {
      if (!authenticated) {
        setError("Usuario no autenticado")
        return null
      }

      if (!isValidENS(ensName)) {
        setError(`Nombre ENS inválido: ${ensName}`)
        return null
      }

      setLoading(true)
      setError(null)

      try {
        // Intentar resolver usando provider actual (si está en mainnet)
        // Si está en otra red, usar provider de mainnet directamente
        const provider = await getEthereumProvider()
        let address: string | null = null

        if (provider) {
          const ethersProvider = new BrowserProvider(provider)
          // Resolver multichain (automáticamente usa mainnet si está en otra red)
          address = await resolveENSMultichain(ensName, ethersProvider)
        } else {
          // Si no hay provider, usar Sepolia directamente (donde están tus ENS en testnet)
          console.log(`[useENS] ⚠️ No hay provider disponible, usando Sepolia para resolver ${ensName}`)
          address = await resolveENSFromSepolia(ensName)
        }

        setLoading(false)
        return address
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al resolver ENS"
        setError(errorMessage)
        setLoading(false)
        return null
      }
    },
    [authenticated, getEthereumProvider]
  )

  /**
   * Busca el nombre ENS asociado a una dirección Ethereum (reverse lookup)
   */
  const lookupENS = useCallback(
    async (address: string): Promise<string | null> => {
      if (!authenticated) {
        setError("Usuario no autenticado")
        return null
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        setError(`Dirección Ethereum inválida: ${address}`)
        return null
      }

      setLoading(true)
      setError(null)

      try {
        // Intentar lookup usando provider actual (si está en mainnet)
        // Si está en otra red, usar provider de mainnet directamente
        const provider = await getEthereumProvider()
        let ensName: string | null = null

        if (provider) {
          const ethersProvider = new BrowserProvider(provider)
          // Lookup multichain (automáticamente usa mainnet si está en otra red)
          ensName = await lookupENSMultichain(address, ethersProvider)
        } else {
          // Si no hay provider, usar Sepolia directamente (donde están tus ENS en testnet)
          console.log(`[useENS] ⚠️ No hay provider disponible, usando Sepolia para lookup de ${address}`)
          ensName = await lookupENSFromSepolia(address)
        }

        setLoading(false)
        return ensName
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al buscar ENS"
        setError(errorMessage)
        setLoading(false)
        return null
      }
    },
    [authenticated, getEthereumProvider]
  )

  /**
   * Obtiene el nombre ENS del usuario actual (si tiene wallet conectada)
   */
  const getMyENS = useCallback(async (): Promise<string | null> => {
    if (!authenticated) {
      setError("Usuario no autenticado")
      return null
    }

    try {
      console.log(`[useENS] Obteniendo ENS del usuario actual...`)
      const provider = await getEthereumProvider()
      if (!provider) {
        throw new Error("Provider de Ethereum no disponible")
      }

      // Obtener la dirección del wallet conectado
      const ethersProvider = new BrowserProvider(provider)
      const signer = await ethersProvider.getSigner()
      const address = await signer.getAddress()
      
      console.log(`[useENS] Dirección del usuario: ${address}`)

      // Buscar ENS para esa dirección
      const ensName = await lookupENS(address)
      
      if (ensName) {
        console.log(`[useENS] ✅ ENS del usuario encontrado: ${address} → ${ensName}`)
      } else {
        console.log(`[useENS] ⚠️ El usuario no tiene ENS configurado: ${address}`)
      }
      
      return ensName
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al obtener ENS del usuario"
      console.error(`[useENS] ❌ Error obteniendo ENS del usuario:`, err)
      setError(errorMessage)
      return null
    }
  }, [authenticated, getEthereumProvider, lookupENS])

  return {
    resolveENS,
    lookupENS,
    getMyENS,
    loading,
    error,
  }
}


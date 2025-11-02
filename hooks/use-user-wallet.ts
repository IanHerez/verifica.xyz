"use client"

import { useState, useEffect, useCallback } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { BrowserProvider } from "ethers"
import { useENS } from "./use-ens"

/**
 * Hook que obtiene automáticamente la wallet y ENS del usuario después del login
 * 
 * Funciona con:
 * - Wallets embebidas de Privy (creadas automáticamente)
 * - Wallets externas conectadas (MetaMask, Coinbase, etc.)
 * 
 * Características:
 * - Obtiene automáticamente la dirección después del login
 * - Busca ENS automáticamente si está disponible
 * - Cachea la información para reducir requests
 */
export function useUserWallet() {
  const { authenticated, ready, user, getEthereumProvider } = usePrivy()
  const { getMyENS, lookupENS, loading: ensLoading } = useENS()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [ensName, setEnsName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Obtiene la dirección de wallet del usuario
   * Prioriza wallet externa conectada sobre wallet embebida
   */
  const fetchWalletAddress = useCallback(async () => {
    if (!authenticated || !ready) {
      return null
    }

    try {
      // PRIMERO: Intentar obtener del provider (wallet externa conectada - MetaMask, Coinbase, etc.)
      // Esta es la wallet activa que el usuario realmente está usando
      try {
        const provider = await getEthereumProvider()
        if (provider) {
          const ethersProvider = new BrowserProvider(provider)
          const signer = await ethersProvider.getSigner()
          const address = await signer.getAddress()
          
          if (address) {
            return address
          }
        }
      } catch (providerError) {
        // Si falla el provider, continuar al fallback
      }

      // FALLBACK: Si no hay wallet externa, usar wallet embebida de Privy
      if (user?.wallet?.address) {
        return user.wallet.address
      }

      // Si no hay ninguna wallet disponible
      return null
    } catch (err) {
      console.error("[useUserWallet] Error obteniendo wallet address:", err)
      return null
    }
  }, [authenticated, ready, user, getEthereumProvider])

  /**
   * Obtiene el ENS del usuario basado en su wallet address
   */
  const fetchENS = useCallback(
    async (address: string) => {
      if (!address) return null

      try {
        // Intentar lookup directo del ENS
        const ens = await lookupENS(address)
        return ens
      } catch (err) {
        console.error("Error obteniendo ENS:", err)
        return null
      }
    },
    [lookupENS]
  )

  /**
   * Carga automáticamente wallet y ENS cuando el usuario se autentica
   * Se actualiza cuando cambia la autenticación o el usuario
   */
  useEffect(() => {
    if (!authenticated || !ready) {
      setWalletAddress(null)
      setEnsName(null)
      return
    }

    const loadWalletInfo = async () => {
      setLoading(true)
      setError(null)

      try {
        // Obtener dirección de wallet (prioriza wallet externa)
        const address = await fetchWalletAddress()

        if (address) {
          // Solo actualizar si la dirección cambió
          setWalletAddress((prev) => {
            if (prev?.toLowerCase() !== address.toLowerCase()) {
              return address
            }
            return prev
          })

          // Intentar obtener ENS (puede ser null si no tiene)
          // Hacer esto en background para no bloquear la UI
          fetchENS(address).then((ens) => {
            if (ens) {
              setEnsName(ens)
            } else {
              setEnsName(null)
            }
          })
        } else {
          setWalletAddress(null)
          setEnsName(null)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error cargando wallet"
        setError(errorMessage)
        console.error("[useUserWallet] Error:", err)
      } finally {
        setLoading(false)
      }
    }

    // Pequeño delay para asegurar que Privy está completamente inicializado
    // También escuchar cambios en user para detectar cambios de wallet
    const timer = setTimeout(loadWalletInfo, 300)
    return () => clearTimeout(timer)
  }, [authenticated, ready, user?.id, fetchWalletAddress, fetchENS])

  /**
   * Forzar refresh de wallet y ENS
   */
  const refresh = useCallback(async () => {
    const address = await fetchWalletAddress()
    if (address) {
      setWalletAddress(address)
      const ens = await fetchENS(address)
      setEnsName(ens)
    }
  }, [fetchWalletAddress, fetchENS])

  /**
   * Verifica si el usuario tiene una wallet embebida
   */
  const hasEmbeddedWallet = useCallback(() => {
    // Privy crea wallets embebidas cuando el usuario se autentica sin wallet externa
    // Puedes verificar si tiene wallet embebida revisando user.wallet
    return !!(user?.wallet?.walletClientType === "privy")
  }, [user])

  return {
    walletAddress,
    ensName,
    loading: loading || ensLoading,
    error,
    refresh,
    hasEmbeddedWallet: hasEmbeddedWallet(),
    isAuthenticated: authenticated && ready,
  }
}


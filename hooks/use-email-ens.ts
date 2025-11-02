"use client"

import { useState, useEffect, useCallback } from "react"
import { usePrivy } from "@privy-io/react-auth"
import {
  getENSByEmail,
  setENSForEmail,
  removeENSForEmail,
  isENSAlreadyAssociated,
  type EmailENSMapping,
} from "@/lib/email-ens-storage"
import { useENS } from "./use-ens"
import { useUserWallet } from "./use-user-wallet"
import { isValidENS } from "@/lib/web3-utils"

/**
 * Hook para gestionar ENS asociado a email
 * 
 * Prioridad:
 * 1. ENS asociado al email del usuario (nueva funcionalidad)
 * 2. ENS de la wallet (fallback si no hay asociación por email)
 */
export function useEmailENS() {
  const { authenticated, ready, user } = usePrivy()
  const { walletAddress } = useUserWallet()
  const { resolveENS, lookupENS } = useENS()
  const [emailENS, setEmailENS] = useState<string | null>(null)
  const [walletENS, setWalletENS] = useState<string | null>(null)
  const [finalENS, setFinalENS] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obtener email del usuario
  const userEmail = user?.email?.address || null

  /**
   * Carga el ENS asociado al email del usuario
   */
  const loadEmailENS = useCallback(() => {
    if (!userEmail) {
      setEmailENS(null)
      return
    }

    const ens = getENSByEmail(userEmail)
    setEmailENS(ens)
  }, [userEmail])

  /**
   * Carga el ENS de la wallet (fallback)
   */
  const loadWalletENS = useCallback(async () => {
    if (!walletAddress) {
      setWalletENS(null)
      return
    }

    try {
      const ens = await lookupENS(walletAddress)
      setWalletENS(ens)
    } catch (err) {
      setWalletENS(null)
    }
  }, [walletAddress, lookupENS])

  /**
   * Determina el ENS final (prioriza email, luego wallet)
   */
  useEffect(() => {
    const ens = emailENS || walletENS
    setFinalENS(ens)
  }, [emailENS, walletENS])

  /**
   * Cargar ENS cuando el usuario está autenticado
   */
  useEffect(() => {
    if (authenticated && ready && userEmail) {
      loadEmailENS()
      loadWalletENS()
    }
  }, [authenticated, ready, userEmail, loadEmailENS, loadWalletENS])

  /**
   * Asocia un ENS al email del usuario
   */
  const associateENS = useCallback(
    async (ensName: string): Promise<boolean> => {
      if (!userEmail) {
        setError("No hay email de usuario disponible")
        return false
      }

      if (!isValidENS(ensName)) {
        setError("Nombre ENS inválido")
        return false
      }

      // Verificar que el ENS no esté asociado a otro email
      if (isENSAlreadyAssociated(ensName, userEmail)) {
        setError("Este ENS ya está asociado a otro email")
        return false
      }

      // Verificar que el ENS existe en blockchain
      setLoading(true)
      setError(null)

      try {
        const resolvedAddress = await resolveENS(ensName)
        if (!resolvedAddress) {
          setError("El ENS no existe o no se pudo resolver")
          setLoading(false)
          return false
        }

        // Guardar asociación email → ENS
        setENSForEmail(userEmail, ensName, walletAddress || undefined)
        setEmailENS(ensName)
        setFinalENS(ensName)
        setLoading(false)
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error asociando ENS"
        setError(errorMessage)
        setLoading(false)
        return false
      }
    },
    [userEmail, walletAddress, resolveENS]
  )

  /**
   * Elimina la asociación ENS del email
   */
  const removeAssociation = useCallback(() => {
    if (!userEmail) return

    removeENSForEmail(userEmail)
    setEmailENS(null)
    setFinalENS(walletENS) // Volver al ENS de wallet si existe
  }, [userEmail, walletENS])

  /**
   * Verifica si un ENS está disponible para asociar
   */
  const checkENSAvailability = useCallback(
    async (ensName: string): Promise<{ available: boolean; reason?: string }> => {
      if (!isValidENS(ensName)) {
        return { available: false, reason: "Nombre ENS inválido" }
      }

      // Verificar si ya está asociado a otro email
      if (isENSAlreadyAssociated(ensName, userEmail || "")) {
        return { available: false, reason: "ENS ya está asociado a otro email" }
      }

      // Verificar que existe en blockchain
      try {
        const resolvedAddress = await resolveENS(ensName)
        if (!resolvedAddress) {
          return { available: false, reason: "ENS no existe en blockchain" }
        }
        return { available: true }
      } catch (err) {
        return { available: false, reason: "Error verificando ENS" }
      }
    },
    [userEmail, resolveENS]
  )

  /**
   * Refresca la información de ENS
   */
  const refresh = useCallback(async () => {
    loadEmailENS()
    await loadWalletENS()
  }, [loadEmailENS, loadWalletENS])

  return {
    // ENS final (prioriza email, luego wallet)
    ensName: finalENS,
    // ENS específico del email
    emailENS,
    // ENS de la wallet (fallback)
    walletENS,
    // Estado
    loading,
    error,
    // Funciones
    associateENS,
    removeAssociation,
    checkENSAvailability,
    refresh,
    // Info
    userEmail,
    hasEmailAssociation: !!emailENS,
  }
}

